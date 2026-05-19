import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { background, darkGray, FontFamily, primary, white } from '@/constants/theme';
import { mockGroupFriends } from '@/src/mocks/group';

const whaleBackground = require('../../../assets/video/whale_background.mp4');
const whaleCharacter = require('../../../assets/icons/whale1.png');
const whaleGradation = require('../../../assets/icons/gradation.png');
const noop = () => undefined;

function PlusIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path d="M5.75 0.75L5.75 10.75M10.75 5.75L0.75 5.75" stroke={primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function VideoLightOverlay() {
  return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* 1층 & 2층: 전체를 부드럽게 감싸는 화이트 워시와 청량한 파란색 틴트 */}
        <View style={styles.lightWash} />
        <View style={styles.blueTint} />

        {/* 3층: 상단면을 자연스럽게 빡세게 가려주는 그라데이션 */}
        <Svg style={styles.topGradient} width="100%" height="100%" viewBox="0 0 375 360" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="topWhiteFade" x1="187.5" y1="0" x2="187.5" y2="120" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={background} stopOpacity="1" />
              <Stop offset="0.15" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="375" height="360" fill="url(#topWhiteFade)" />
        </Svg>
      </View>
  );
}

export default function GroupPage() {
  const player = useVideoPlayer(whaleBackground, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <VideoLightOverlay />
      <View style={styles.memberList}>
        {mockGroupFriends.map((friend) => (
          <View key={friend.name} style={styles.memberItem}>
            <View style={styles.characterStack}>
              <Image source={whaleGradation} style={styles.characterGradation} contentFit="contain" />
              <Image source={whaleCharacter} style={styles.characterImage} contentFit="contain" />
            </View>
            <Text style={styles.characterName}>{friend.name}</Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="친구초대"
        onPress={noop}
        style={({ pressed }) => [styles.inviteButton, pressed && styles.inviteButtonPressed]}>
        <Text style={styles.inviteText}>친구초대</Text>
        <View style={styles.inviteIcon}>
          <PlusIcon />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: background,
  },
  blueTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00A2FF',
    opacity: 0.45,
  },
  lightWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: white,
    opacity: 0.55,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  memberList: {
    position: 'absolute',
    top: 174,
    left: 18,
    right: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  memberItem: {
    width: 123,
    alignItems: 'center',
  },
  characterStack: {
    width: 123,
    height: 96,
  },
  characterGradation: {
    position: 'absolute',
    right: -16,
    bottom: -4,
    width: 123,
    height: 100,
  },
  characterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 123,
    height: 96,
  },
  characterName: {
    marginTop: 8,
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  inviteButton: {
    position: 'absolute',
    right: 28,
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  inviteButtonPressed: {
    opacity: 0.7,
  },
  inviteText: {
    color: white,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  inviteIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
