import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { background, darkGray, FontFamily, primary, white } from '@/constants/theme';
import type { GroupFriend } from '@/src/mocks/group';
import { mockGroupFriends } from '@/src/mocks/group';

const groupBackground = require('../../../assets/icons/group_background.png');
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

function FloatingWhale() {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [motion]);

  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const rotate = motion.interpolate({
    inputRange: [0, 1],
    outputRange: ['2deg', '7deg'],
  });
  const translateX = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <Animated.View
      style={[
        styles.characterWhaleMotion,
        {
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}>
      <Image
        source={whaleCharacter}
        style={styles.characterImage}
        contentFit="contain"
      />
    </Animated.View>
  );
}

export default function GroupPage() {
  const [selectedFriend, setSelectedFriend] = useState<GroupFriend | null>(null);

  return (
    <View style={styles.screen}>
      <Image
        source={groupBackground}
        style={styles.backgroundImage}
        contentFit="cover"
      />
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
              <FloatingWhale />
            </View>
            <Text style={styles.characterName}>{friend.name}</Text>
            <Text style={styles.characterTag}>@{friend.tag}</Text>
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
                  <View style={styles.profileImageFrame}>
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
                  <Text style={styles.profileTag} numberOfLines={1}>
                    @{selectedFriend.tag}
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
  backgroundImage: {
    position: 'absolute',
    top: 10,
    right: 0,
    bottom: -10,
    left: 0,
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
    width: 90,
    height: 60,
  },
  characterGradation: {
    position: 'absolute',
    width: 75,
    height: 68,
  },
  characterWhaleMotion: {
    position: 'absolute',
    top: 12,
    width: 74,
    height: 50,
    transformOrigin: '80% 50%',
  },
  characterImage: {
    width: 74,
    height: 50,
  },
  characterName: {
    marginTop: 8,
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  characterTag: {
    color: '#9EA2A3',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    lineHeight: 14,
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
  profileImageFrame: {
    width: 97,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 97,
    height: 64,
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
  profileTag: {
    marginTop: 2,
    color: '#9EA2A3',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 11,
    lineHeight: 14,
  },
  profileDescription: {
    marginTop: 10,
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
