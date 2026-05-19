import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { background, darkGray, FontFamily, primary, white } from '@/constants/theme';
import type { GroupFriend } from '@/src/mocks/group';
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

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5L19 19M19 5L5 19" stroke={darkGray} strokeWidth={1.5} strokeLinecap="round" />
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
  const [selectedFriend, setSelectedFriend] = useState<GroupFriend | null>(null);
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
          <Pressable
            key={friend.name}
            accessibilityRole="button"
            accessibilityLabel={`${friend.name} 프로필 보기`}
            onPress={() => setSelectedFriend(friend)}
            style={({ pressed }) => [styles.memberItem, pressed && styles.memberItemPressed]}>
            <View style={styles.characterStack}>
              <Image source={whaleGradation} style={styles.characterGradation} contentFit="contain" />
              <Image source={whaleCharacter} style={styles.characterImage} contentFit="contain" />
            </View>
            <Text style={styles.characterName}>{friend.name}</Text>
          </Pressable>
        ))}
      </View>
      <Modal
        visible={selectedFriend !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFriend(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 닫기"
              onPress={() => setSelectedFriend(null)}
              hitSlop={8}
              style={styles.closeButton}>
              <CloseIcon />
            </Pressable>
            {selectedFriend ? (
              <View style={styles.profileContent}>
                <View style={styles.profileLeft}>
                  <View style={styles.profileImageStack}>
                    <Image source={whaleGradation} style={styles.profileGradation} contentFit="contain" />
                    <Image source={whaleCharacter} style={styles.profileImage} contentFit="contain" />
                  </View>
                  <Pressable accessibilityRole="button" onPress={noop} style={styles.visitButton}>
                    <Text style={styles.visitButtonText}>방문하기</Text>
                  </Pressable>
                </View>

                <View style={styles.profileRight}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {selectedFriend.name}
                  </Text>
                  <Text style={styles.profileDescription} numberOfLines={3}>
                    {selectedFriend.description}
                  </Text>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedFriend.friends_count}</Text>
                      <Text style={styles.statLabel}>Friends</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedFriend.like_count}</Text>
                      <Text style={styles.statLabel}>Like</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedFriend.post_count}</Text>
                      <Text style={styles.statLabel}>Post</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
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
  memberItemPressed: {
    opacity: 0.78,
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
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
  },
  profileCard: {
    width: '100%',
    maxWidth: 379,
    minHeight: 245,
    borderRadius: 8,
    backgroundColor: white,
    paddingTop: 42,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 15,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flexDirection: 'row',
    gap: 18,
  },
  profileLeft: {
    width: 116,
    alignItems: 'center',
    paddingTop: 12,
  },
  profileImageStack: {
    width: 116,
    height: 92,
  },
  profileGradation: {
    position: 'absolute',
    right: -12,
    bottom: -5,
    width: 116,
    height: 96,
  },
  profileImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 110,
    height: 97,
  },
  visitButton: {
    marginTop: 18,
    width: 68,
    height: 30,
    borderRadius: 4,
    backgroundColor: primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitButtonText: {
    color: white,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 15,
  },
  profileRight: {
    flex: 1,
    paddingTop: 18,
  },
  profileName: {
    color: '#000000',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  profileDescription: {
    marginTop: 14,
    color: '#777777',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingRight: 6,
  },
  statItem: {
    minWidth: 42,
    alignItems: 'center',
  },
  statValue: {
    color: '#3C4446',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  statLabel: {
    marginTop: 6,
    color: '#9EA2A3',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    lineHeight: 12,
  },
});
