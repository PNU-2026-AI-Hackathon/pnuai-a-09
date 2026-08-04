import { supabase } from "@/src/lib/supabase";

/**
 * 칭찬고래 AI 서버(whale-AI) 클라이언트.
 *
 * Supabase 가 아니라 별도 FastAPI 서버를 호출한다. user_id 는 보내지 않는다 —
 * 서버가 Authorization 헤더의 토큰에서 직접 꺼내 쓰기 때문이다.
 *
 * 흐름
 *   [AI 버튼]     원문 스냅샷(draftOriginal) + draftId 고정
 *   fetchWhaleMessage()   ← 몇 번을 호출하든 서버는 DB 에 쓰지 않는다
 *   [적용하기]
 *   saveWhaleMemory()     ← 여기서만 저장. 화면의 고친 텍스트가 아니라 원문을 보낸다
 */

const AI_API_URL = process.env.EXPO_PUBLIC_AI_API_URL;

// 한마디 생성은 임베딩 + GPT 호출이라 수 초가 걸린다. 응답이 영영 안 오는 경우에
// 시트가 로딩 상태로 멈춰 있지 않도록 상한을 둔다.
const REQUEST_TIMEOUT_MS = 30_000;

export type WhaleMessageParams = {
  /** AI 버튼을 누른 시점의 일기 원문 */
  diary: string;
  /** 초안 식별자. 같은 초안에서 재생성할 때는 같은 값을 유지한다 */
  draftId: string;
  /** "다른 한마디"를 누른 횟수 */
  retryCount?: number;
};

export type RejectedMessage = {
  /** 이 시도에서 나왔다가 "다른 한마디"로 거절된 한마디 */
  whaleMessage: string;
  retryCount: number;
};

export type SaveMemoryParams = {
  /** AI 버튼을 누른 시점의 원문. 유저가 고친 버전이 아니다 */
  originalText: string;
  draftId: string;
  /** "적용하기" 시점에 화면에 떠 있던 고래 한마디 */
  whaleMessage: string;
  /** "다른 한마디"를 누른 횟수 */
  retryCount: number;
  /** 같은 draft 안에서 whaleMessage 이전에 나왔다가 거절된 제안들 */
  rejectedMessages: RejectedMessage[];
};

export type FinalizeMemoryParams = {
  /** saveWhaleMemory 때 쓴 것과 같은 draftId */
  draftId: string;
  /** 실제로 "등록"된 최종 텍스트 */
  editedText: string;
};

/**
 * 초안 식별자를 만든다.
 *
 * 서버는 이 값으로 중복 저장을 막는다(같은 draftId 로 두 번 저장하면 두 번째는 무시).
 * 보안 토큰이 아니라 중복 판별용 키라서 암호학적 난수가 필요 없다. expo-crypto 는
 * 네이티브 모듈이라 추가하면 앱을 다시 빌드해야 하므로 쓰지 않는다.
 */
export function createDraftId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getAccessToken(): Promise<string> {
  // getSession 은 만료가 임박하면 토큰을 알아서 갱신해 준다.
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("로그인이 필요합니다.");
  }

  return data.session.access_token;
}

/**
 * 서버가 내려준 Server-Timing 헤더를 구간별 ms 로 푼다.
 *
 * 예: "total;dur=11500, auth;dur=120, handler;dur=11000"
 *
 * 클라에서 재는 fetch 시간에는 네트워크와 서버 처리가 섞여 있어서 어느 쪽이
 * 느린지 알 수 없다. 서버가 자기 처리 시간을 알려주면 나머지가 곧 네트워크다.
 */
function parseServerTiming(header: string | null): Record<string, number> {
  if (!header) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const entry of header.split(",")) {
    const [rawName, ...params] = entry.trim().split(";");
    const name = rawName?.trim();
    if (!name) {
      continue;
    }
    for (const param of params) {
      const matched = param.trim().match(/^dur=(-?[\d.]+)$/);
      if (matched) {
        result[name] = Number(matched[1]);
        break;
      }
    }
  }
  return result;
}

async function requestAI<T>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  if (!AI_API_URL) {
    throw new Error("EXPO_PUBLIC_AI_API_URL 환경 변수를 확인해주세요.");
  }

  const tokenStart = Date.now();
  const token = await getAccessToken();
  const tokenElapsed = Date.now() - tokenStart;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const fetchStart = Date.now();
  let response: Response;
  try {
    response = await fetch(`${AI_API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const fetchElapsed = Date.now() - fetchStart;
    console.log(
      `[ai] ${method} ${path} 토큰 ${tokenElapsed}ms + 요청 실패까지 ${fetchElapsed}ms`,
    );
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error("네트워크 연결을 확인해 주세요.");
  } finally {
    clearTimeout(timer);
  }
  const fetchElapsed = Date.now() - fetchStart;
  const timing = parseServerTiming(response.headers.get("Server-Timing"));
  const breakdown =
    timing.total === undefined
      ? " (Server-Timing 없음 — 구버전 서버)"
      : ` → 서버 ${Math.round(timing.total)}ms` +
        ` (인증 ${timing.auth === undefined ? "-" : `${Math.round(timing.auth)}ms`},` +
        ` 핸들러 ${timing.handler === undefined ? "-" : `${Math.round(timing.handler)}ms`})` +
        ` + 네트워크 ${Math.round(fetchElapsed - timing.total)}ms`;
  console.log(
    `[ai] ${method} ${path} 토큰 ${tokenElapsed}ms + 요청(네트워크+서버) ${fetchElapsed}ms = 총 ${tokenElapsed + fetchElapsed}ms${breakdown}`,
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("로그인이 필요합니다.");
    }
    throw new Error("고래가 잠시 쉬고 있어요. 잠시 후 다시 시도해 주세요.");
  }

  return (await response.json()) as T;
}

/** 일기 원문으로 고래 한마디를 받아온다. 서버는 DB 에 쓰지 않는다. */
export async function fetchWhaleMessage({
  diary,
  draftId,
  retryCount = 0,
}: WhaleMessageParams): Promise<string> {
  const trimmed = diary.trim();
  if (!trimmed) {
    throw new Error("일기를 먼저 작성해 주세요.");
  }

  const data = await requestAI<{ whale: string }>("/ai/whale-message", {
    diary: trimmed,
    draft_id: draftId,
    retry_count: retryCount,
  });

  return data.whale;
}

/**
 * 일기 원문을 장기기억에 저장한다. "적용하기"를 누른 시점에만 호출한다.
 *
 * 고친 버전이 아니라 원문을 보내는 이유: 고래의 한마디를 듣고 다듬은 글은 이미
 * 긍정적으로 재구성돼 있어서, 나중에 비슷한 감정을 찾을 때 원래 감정과 멀어진다.
 */
export async function saveWhaleMemory({
  originalText,
  draftId,
  whaleMessage,
  retryCount,
  rejectedMessages,
}: SaveMemoryParams): Promise<void> {
  const trimmed = originalText.trim();
  if (!trimmed) {
    return;
  }

  await requestAI<{ ok: boolean }>("/ai/memory", {
    original_text: trimmed,
    draft_id: draftId,
    whale_message: whaleMessage,
    retry_count: retryCount,
    rejected_messages: rejectedMessages.map((m) => ({
      whale_message: m.whaleMessage,
      retry_count: m.retryCount,
    })),
  });
}

/**
 * "적용하기" 이후 실제로 등록된 최종 텍스트를 같은 draftId 행에 채워 넣는다.
 *
 * "등록"을 눌러 게시글 저장이 성공한 직후에만 호출한다. 적용만 하고 등록을
 * 안 했다면 이 함수는 호출되지 않고, 서버의 edited_text는 계속 NULL로 남는다.
 */
export async function finalizeWhaleMemory({
  draftId,
  editedText,
}: FinalizeMemoryParams): Promise<void> {
  const trimmed = editedText.trim();
  if (!trimmed) {
    return;
  }

  await requestAI<{ ok: boolean }>(
    "/ai/memory",
    {
      draft_id: draftId,
      edited_text: trimmed,
    },
    "PATCH",
  );
}
