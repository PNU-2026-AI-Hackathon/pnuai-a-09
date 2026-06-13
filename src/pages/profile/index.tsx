import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { PencilIcon } from '@/components/icons/pencil-icon';
import { SmallWhaleIcon } from '@/components/icons/small-whale-icon';
import { darkGray, FontFamily, gray, primary, white } from '@/constants/theme';
import { mockUsers } from '@/src/mocks/users';

const whaleImage = require('../../../assets/icons/whale1.png');
const friendsCheerImage = require('../../../assets/icons/friends_cheer.png');
const currentUser = mockUsers.find((user) => user.id === 'user-sohee') ?? mockUsers[0];
const NEXT_LEVEL_DAYS = 31;

function getInstalledDays(installedAt: string) {
  const installedDate = new Date(installedAt);
  const today = new Date();
  const diffTime = today.getTime() - installedDate.getTime();

  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

function ProgressGauge({ days }: { days: number }) {
  const progress = Math.min(days / NEXT_LEVEL_DAYS, 1);
  const endAngle = -180 + 180 * progress;
  const radius = 42;
  const centerX = 58;
  const centerY = 58;
  const start = polarToCartesian(centerX, centerY, radius, -180);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = progress > 0.5 ? 1 : 0;
  const activePath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={116} height={72} viewBox="0 0 116 72">
        <Path d="M 16 58 A 42 42 0 0 1 100 58" stroke="#E8ECEE" strokeWidth={6} strokeLinecap="round" fill="none" />
        <Path d={activePath} stroke={primary} strokeWidth={6} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={styles.gaugeTextWrap}>
        <Text style={styles.gaugeValue}>{days}</Text>
        <Text style={styles.gaugeUnit}>일</Text>
      </View>
      <Text style={styles.gaugeHint}>다음 친밀도까지 {Math.max(NEXT_LEVEL_DAYS - days, 0)}일 남았어요!</Text>
    </View>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function StatCard({
  icon,
  title,
  value,
  unit,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  unit: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTitleRow}>
        {icon}
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.statValueRow}>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function ProfilePage() {
  const installedDays = getInstalledDays(currentUser.installed_at);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never">
        <View style={styles.hero}>
          <View style={styles.topIcons}>
            <Ionicons name="notifications-outline" size={24} color={darkGray} />
            <Ionicons name="settings-outline" size={24} color={darkGray} />
          </View>

          <View style={styles.profileTopRow}>
            <View style={styles.profileImageWrap}>
              <Image source={currentUser.profile_image} style={styles.profileImage} contentFit="cover" />
            </View>

            <View style={styles.profileDescriptionWrap}>
              <View style={styles.descriptionBubble}>
                <Text style={styles.descriptionText}>{currentUser.description}</Text>
              </View>
              <Text style={styles.editText}>Edit</Text>
            </View>
          </View>

          <View style={styles.profileStatsRow}>
            <View style={styles.profileNameBlock}>
              <Text style={styles.name}>{currentUser.name}</Text>
              <Text style={styles.tag}>@{currentUser.tag}</Text>
            </View>
            <View style={styles.followItem}>
              <Text style={styles.followValue}>{currentUser.friends_count}</Text>
              <Text style={styles.followLabel}>Follower</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followValue}>{currentUser.friends_count}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.streakSection}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.mainStreakCard}>
            <View style={styles.cardTitleRow}>
              <SmallWhaleIcon size={14} color={darkGray} />
              <Text style={styles.mainCardTitle}>고래와 함께한지</Text>
            </View>
            <View style={styles.mainStreakBody}>
              <View style={styles.whaleLevel}>
                <Image source={whaleImage} style={styles.whaleImage} contentFit="contain" />
                <Text style={styles.levelText}>친밀도</Text>
                <Text style={styles.levelValue}>{currentUser.intimacy_level}단계</Text>
              </View>
              <ProgressGauge days={installedDays} />
            </View>
          </View>

          <View style={styles.statGrid}>
            <StatCard
              icon={<PencilIcon size={14} color={darkGray} />}
              title="작성한 일기 수"
              value={currentUser.post_count}
              unit="개"
            />
            <StatCard
              icon={<Image source={friendsCheerImage} style={styles.friendsCheerIcon} contentFit="contain" />}
              title="친구 응원 수"
              value={currentUser.like_count}
              unit="번"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#B9ECFB',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F7',
  },
  content: {
    paddingBottom: 112,
  },
  hero: {
    minHeight: 352,
    backgroundColor: '#B9ECFB',
    paddingHorizontal: 36,
    paddingTop: 22,
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  profileTopRow: {
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  profileImageWrap: {
    width: 88,
    alignItems: 'center',
  },
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  name: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  tag: {
    marginTop: 3,
    color: gray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  profileDescriptionWrap: {
    flex: 1,
    paddingTop: 8,
  },
  descriptionBubble: {
    minHeight: 70,
    borderRadius: 6,
    backgroundColor: white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#3C4446',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 11,
    lineHeight: 18,
  },
  editText: {
    marginTop: 8,
    alignSelf: 'flex-end',
    color: '#7D8A8E',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 11,
  },
  profileStatsRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileNameBlock: {
    width: 88,
    alignItems: 'center',
  },
  followItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  followValue: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  followLabel: {
    marginTop: 5,
    color: '#778489',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 11,
  },
  followDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#9BD7E8',
  },
  streakSection: {
    marginTop: -62,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: '#F4F6F7',
    paddingTop: 40,
    paddingHorizontal: 30,
  },
  sectionTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardBold,
    fontSize: 22,
    lineHeight: 28,
  },
  mainStreakCard: {
    marginTop: 34,
    minHeight: 186,
    borderRadius: 10,
    backgroundColor: white,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#3C4446',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainCardTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  mainStreakBody: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whaleLevel: {
    width: 124,
    alignItems: 'center',
  },
  whaleImage: {
    width: 86,
    height: 62,
  },
  levelText: {
    marginTop: 10,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
  },
  levelValue: {
    marginTop: 2,
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 11,
  },
  gaugeWrap: {
    width: 150,
    alignItems: 'center',
  },
  gaugeTextWrap: {
    position: 'absolute',
    top: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gaugeValue: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 38,
    lineHeight: 42,
  },
  gaugeUnit: {
    marginBottom: 6,
    marginLeft: 4,
    color: darkGray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 13,
  },
  gaugeHint: {
    marginTop: -2,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 9,
  },
  statGrid: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 22,
  },
  statCard: {
    flex: 1,
    minHeight: 166,
    borderRadius: 10,
    backgroundColor: white,
    paddingTop: 20,
    paddingHorizontal: 18,
    shadowColor: '#3C4446',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  friendsCheerIcon: {
    width: 14,
    height: 14,
  },
  statValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 40,
    lineHeight: 46,
  },
  statUnit: {
    marginLeft: 6,
    marginTop: 16,
    color: darkGray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 13,
  },
});
