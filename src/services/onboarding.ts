import type { User } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';

type ProfileOnboardingRow = {
  id: string;
  name: string | null;
  tag: string | null;
  profile_image_url: string | null;
  onboarding_completed_at: string | null;
};

type TermsAgreementRow = {
  user_id: string;
  service_terms_agreed: boolean;
  privacy_policy_agreed: boolean;
};

export type TermsAgreementInput = {
  service: boolean;
  privacy: boolean;
  marketing: boolean;
  aiTraining: boolean;
};

export type OnboardingProfileInput = {
  name: string;
  tag: string;
  description: string;
  profileImageUrl?: string;
  email?: string;
};

export function normalizeTag(value: string) {
  return value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function mapOnboardingError(error: { code?: string; message?: string }) {
  if (error.code === '23505') {
    if (error.message?.includes('profiles_name_unique')) {
      return new Error('이미 사용 중인 닉네임입니다.');
    }

    if (error.message?.includes('profiles_tag_unique')) {
      return new Error('이미 사용 중인 아이디입니다.');
    }

    return new Error('중복된 값이 있습니다.');
  }

  if (error.code === '23514') {
    return new Error('입력값 형식이 올바르지 않습니다.');
  }

  return new Error(error.message ?? '요청 처리 중 문제가 발생했습니다.');
}

async function isProfileFieldTaken(
  field: 'name' | 'tag',
  value: string,
  excludeUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq(field, value)
    .neq('id', excludeUserId)
    .maybeSingle();

  if (error) {
    throw mapOnboardingError(error);
  }

  return Boolean(data);
}

async function upsertProfileStub(
  userId: string,
  seed: {
    email?: string;
    name?: string;
    profileImageUrl?: string;
  },
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: seed.email?.trim() || null,
      name: seed.name?.trim() || null,
      profile_image_url: seed.profileImageUrl?.trim() || null,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw mapOnboardingError(error);
  }
}

export async function saveUserTermsAgreement(
  userId: string,
  terms: TermsAgreementInput,
  profileSeed: {
    email?: string;
    name?: string;
    profileImageUrl?: string;
  },
): Promise<void> {
  if (!terms.service || !terms.privacy) {
    throw new Error('필수 약관에 동의해 주세요.');
  }

  await upsertProfileStub(userId, profileSeed);

  const { error } = await supabase.from('user_terms_agreements').upsert(
    {
      user_id: userId,
      service_terms_agreed: terms.service,
      privacy_policy_agreed: terms.privacy,
      marketing_agreed: terms.marketing,
      ai_training_agreed: terms.aiTraining,
      agreed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw mapOnboardingError(error);
  }
}

export async function completeOnboardingProfile(
  userId: string,
  values: OnboardingProfileInput,
): Promise<void> {
  const name = values.name.trim();
  const tag = normalizeTag(values.tag);
  const description = values.description.trim();

  if (!name) {
    throw new Error('닉네임을 입력해 주세요.');
  }

  if (!tag) {
    throw new Error('아이디를 입력해 주세요.');
  }

  const [isNameTaken, isTagTaken] = await Promise.all([
    isProfileFieldTaken('name', name, userId),
    isProfileFieldTaken('tag', tag, userId),
  ]);

  if (isNameTaken) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  if (isTagTaken) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      email: values.email?.trim() || null,
      name,
      tag,
      description,
      profile_image_url: values.profileImageUrl?.trim() || null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw mapOnboardingError(error);
  }
}

export type AuthUserMetadata = {
  nickname: string;
  profileImage: string;
  email: string;
};

export type OnboardingStatus = {
  isComplete: boolean;
  hasProfile: boolean;
  hasTermsAgreement: boolean;
  profileName: string | null;
  profileImageUrl: string | null;
};

export type PostLoginDestination = 'home' | 'onboarding';

export type OnboardingStep = 'terms' | 'profile';

export type PostLoginRoute =
  | { destination: 'home' }
  | {
      destination: 'onboarding';
      step: OnboardingStep;
      params: {
        nickname: string;
        profileImage: string;
      };
    };

export function getAuthUserMetadata(user: User): AuthUserMetadata {
  return {
    nickname:
      (user.user_metadata?.profile_nickname as string | undefined) ??
      (user.user_metadata?.nickname as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      '',
    profileImage:
      (user.user_metadata?.profile_image as string | undefined) ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      '',
    email:
      user.email ??
      (user.user_metadata?.account_email as string | undefined) ??
      (user.user_metadata?.email as string | undefined) ??
      '',
  };
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [profileResult, termsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, tag, profile_image_url, onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle<ProfileOnboardingRow>(),
    supabase
      .from('user_terms_agreements')
      .select('user_id, service_terms_agreed, privacy_policy_agreed')
      .eq('user_id', userId)
      .maybeSingle<TermsAgreementRow>(),
  ]);

  if (profileResult.error) {
    console.warn('[onboarding] Failed to load profile status', profileResult.error);
  }

  if (termsResult.error) {
    console.warn('[onboarding] Failed to load terms status', termsResult.error);
  }

  const profile = profileResult.data;
  const terms = termsResult.data;
  const hasProfile = Boolean(profile);
  const hasTermsAgreement = Boolean(terms?.service_terms_agreed && terms?.privacy_policy_agreed);
  const isComplete = Boolean(
    profile?.onboarding_completed_at &&
      profile.name?.trim() &&
      profile.tag?.trim() &&
      hasTermsAgreement,
  );

  return {
    isComplete,
    hasProfile,
    hasTermsAgreement,
    profileName: profile?.name?.trim() || null,
    profileImageUrl: profile?.profile_image_url?.trim() || null,
  };
}

export async function resolvePostLoginDestination(userId: string): Promise<PostLoginDestination> {
  const status = await getOnboardingStatus(userId);
  return status.isComplete ? 'home' : 'onboarding';
}

export async function getPostLoginRoute(user: User): Promise<PostLoginRoute> {
  const metadata = getAuthUserMetadata(user);
  const status = await getOnboardingStatus(user.id);

  if (status.isComplete) {
    return { destination: 'home' };
  }

  if (status.hasTermsAgreement) {
    return {
      destination: 'onboarding',
      step: 'profile',
      params: {
        nickname: status.profileName ?? metadata.nickname,
        profileImage: status.profileImageUrl ?? metadata.profileImage,
      },
    };
  }

  return {
    destination: 'onboarding',
    step: 'terms',
    params: {
      nickname: metadata.nickname,
      profileImage: metadata.profileImage,
    },
  };
}

export async function confirmAuthenticatedUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw error ?? new Error('로그인 세션을 확인할 수 없습니다.');
  }

  return user;
}

export async function signInAsTestUser(): Promise<User> {
  const email = process.env.EXPO_PUBLIC_TEST_USER_EMAIL;
  const password = process.env.EXPO_PUBLIC_TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('테스트 유저 로그인 정보가 .env에 설정되지 않았습니다.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw signInError;
  }

  return confirmAuthenticatedUser();
}
