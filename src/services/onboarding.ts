import type { User } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';

type ProfileOnboardingRow = {
  id: string;
  name: string | null;
  tag: string | null;
  onboarding_completed_at: string | null;
};

type TermsAgreementRow = {
  user_id: string;
  service_terms_agreed: boolean;
  privacy_policy_agreed: boolean;
};

export type AuthUserMetadata = {
  nickname: string;
  profileImage: string;
  email: string;
};

export type OnboardingStatus = {
  isComplete: boolean;
  hasProfile: boolean;
  hasTermsAgreement: boolean;
};

export type PostLoginDestination = 'home' | 'onboarding';

export type PostLoginRoute =
  | { destination: 'home' }
  | {
      destination: 'onboarding';
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
      .select('id, name, tag, onboarding_completed_at')
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
  };
}

export async function resolvePostLoginDestination(userId: string): Promise<PostLoginDestination> {
  const status = await getOnboardingStatus(userId);
  return status.isComplete ? 'home' : 'onboarding';
}

export async function getPostLoginRoute(user: User): Promise<PostLoginRoute> {
  const { nickname, profileImage } = getAuthUserMetadata(user);
  const destination = await resolvePostLoginDestination(user.id);

  if (destination === 'home') {
    return { destination: 'home' };
  }

  return {
    destination: 'onboarding',
    params: {
      nickname,
      profileImage,
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
