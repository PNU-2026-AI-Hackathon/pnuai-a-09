import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {FontFamily, gray} from "@/constants/theme";

export default function RootIndex() {
  const { width } = useWindowDimensions();
  const backgroundHeight = width * (1024 / 780);

  const handleStart = () => {
    router.replace('/home');
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
            onPress={handleStart}
          />
          <SocialLoginButton
            label="Apple로 시작하기"
            icon={require('@/assets/icons/apple.png')}
            style={styles.appleButton}
            textStyle={styles.appleText}
            iconStyle={styles.appleIcon}
            onPress={handleStart}
          />
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
};

function SocialLoginButton({
  label,
  icon,
  style,
  textStyle,
  iconStyle,
  onPress,
}: SocialLoginButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.loginButton, style, pressed && styles.pressed]}>
      <Image source={icon} style={[styles.loginIcon, iconStyle]} resizeMode="contain" />
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
});
