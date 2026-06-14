import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { login } from '@react-native-seoul/kakao-login';
import { SafeAreaView } from 'react-native-safe-area-context';
import {FontFamily, gray} from "@/constants/theme";
import { supabase } from '@/src/lib/supabase';
import {
  confirmAuthenticatedUser,
  getPostLoginRoute,
  signInAsTestUser,
  type PostLoginRoute,
} from '@/src/services/onboarding';

type KakaoLoginToken = {
  idToken?: string;
  id_token?: string;
};

export default function RootIndex() {
  const { width } = useWindowDimensions();
  const backgroundHeight = width * (1024 / 780);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const navigateAfterLogin = (route: PostLoginRoute) => {
    if (route.destination === 'home') {
      router.replace('/home');
      return;
    }

    router.replace({
      pathname: '/onboarding/terms',
      params: route.params,
    });
  };

  const handleKakaoLogin = async () => {
    if (isAuthLoading) {
      return;
    }

    setIsAuthLoading(true);
    setLoginError(null);

    try {
      const kakaoToken = (await login()) as KakaoLoginToken;
      const idToken = kakaoToken.idToken ?? kakaoToken.id_token;

      if (!idToken) {
        throw new Error('카카오 로그인 결과에서 id_token을 찾을 수 없습니다.');
      }

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'kakao',
        token: idToken,
      });

      if (signInError) {
        throw signInError;
      }

      const user = await confirmAuthenticatedUser();
      const route = await getPostLoginRoute(user);
      navigateAfterLogin(route);
    } catch (error) {
      const message = error instanceof Error ? error.message : '카카오 로그인 중 문제가 발생했습니다.';
      setLoginError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isAuthLoading) {
      return;
    }

    setIsAuthLoading(true);
    setLoginError(null);

    try {
      const user = await signInAsTestUser();
      const route = await getPostLoginRoute(user);
      navigateAfterLogin(route);
    } catch (error) {
      const message = error instanceof Error ? error.message : '테스트 유저 로그인 중 문제가 발생했습니다.';
      setLoginError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/icons/login_background.png')}
        style={[styles.backgroundImage, { width, height: backgroundHeight }]}
        resizeMode="stretch"
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Text style={styles.title}>칭찬고래</Text>
          <Text style={styles.subtitle}>{'오늘도 수고한 서로에게\n건네는 칭찬 한마디'}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <SocialLoginButton
            label="카카오톡으로 시작하기"
            icon={require('@/assets/icons/kakao.png')}
            style={styles.kakaoButton}
            textStyle={styles.kakaoText}
            iconStyle={styles.kakaoIcon}
            onPress={handleKakaoLogin}
            loading={isAuthLoading}
            disabled={isAuthLoading}
          />
          <SocialLoginButton
            label="Apple로 시작하기"
            icon={require('@/assets/icons/apple.png')}
            style={styles.appleButton}
            textStyle={styles.appleText}
            iconStyle={styles.appleIcon}
            onPress={handleAppleLogin}
            loading={isAuthLoading}
            loadingIndicatorColor="#FFFFFF"
            disabled={isAuthLoading}
          />
          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

type SocialLoginButtonProps = {
  label: string;
  icon: ImageSourcePropType;
  style: ViewStyle;
  textStyle: TextStyle;
  iconStyle: ImageStyle;
  onPress: () => void;
  loading?: boolean;
  loadingIndicatorColor?: string;
  disabled?: boolean;
};

function SocialLoginButton({
  label,
  icon,
  style,
  textStyle,
  iconStyle,
  onPress,
  loading = false,
  loadingIndicatorColor = '#000000',
  disabled = false,
}: SocialLoginButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.loginButton, style, disabled && styles.disabled, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={loadingIndicatorColor} size="small" style={styles.loginIcon} />
      ) : (
        <Image source={icon} style={[styles.loginIcon, iconStyle]} resizeMode="contain" />
      )}
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  hero: {
    marginTop: 150,
    alignItems: 'center',
  },
  title: {
    color: '#7ED4FF',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 10,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  buttonGroup: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 52,
  },
  loginButton: {
    width: '100%',
    maxWidth: 272,
    height: 44,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  kakaoButton: {
    backgroundColor: '#FFEE00',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
  loginIcon: {
    marginRight: 10
  },
  kakaoIcon: {
    width: 20,
    height: 20,
  },
  appleIcon: {
    width: 20,
    height: 20,
  },
  buttonText: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  kakaoText: {
    color: '#000000',
  },
  appleText: {
    color: '#FFFFFF',
  },
  errorText: {
    maxWidth: 272,
    marginTop: 4,
    color: '#D04444',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
