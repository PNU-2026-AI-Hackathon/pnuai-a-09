import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { PencilIcon } from '@/components/icons/pencil-icon';
import { SmallWhaleIcon } from '@/components/icons/small-whale-icon';
import {background, darkGray, FontFamily, gray, lightGray, primary, white} from '@/constants/theme';
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
  const radius = 50;
  const centerX = 70;
  const centerY = 54;
  const inactivePath = createArcPath(centerX, centerY, radius, -180, 0);
  const activePath = createArcPath(centerX, centerY, radius, -180, endAngle);

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={180} height={130} viewBox="0 0 145 92">
        <Path d={inactivePath} stroke="#E8ECEE" strokeWidth={5} strokeLinecap="round" fill="none" />
        <Path d={activePath} stroke={primary} strokeWidth={5} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={styles.gaugeTextWrap}>
        <Text style={styles.gaugeValue}>{days}</Text>
        <Text style={styles.gaugeUnit}>일</Text>
      </View>
      <Text style={styles.gaugeHint}>다음 친밀도까지 {Math.max(NEXT_LEVEL_DAYS - days, 0)}일 남았어요!</Text>
    </View>
  );
}

function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
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
            <View style={styles.iconHit}>
              <Ionicons name="notifications-outline" size={22} color={darkGray} />
            </View>
            <View style={styles.iconHit}>
              <Ionicons name="settings-outline" size={22} color={darkGray} />
            </View>
          </View>

          <View style={styles.heroContent}>
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
        </View>

        <View style={styles.streakSection}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.mainStreakCard}>
            <View style={styles.cardTitleRow}>
              <SmallWhaleIcon size={16} color={darkGray} />
              <Text style={styles.mainCardTitle}>고래와 함께한지</Text>
            </View>
            <View style={styles.mainStreakBody}>
              <View style={styles.whaleLevel}>
                <Image source={whaleImage} style={styles.whaleImage} contentFit="contain" />
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}} >
                  <Text style={styles.levelText}>친밀도</Text>
                  <Text style={styles.levelValue}>{currentUser.intimacy_level}단계</Text>
                </View>
              </View>
              <ProgressGauge days={installedDays} />
            </View>
          </View>

          <View style={styles.statGrid}>
            <StatCard
              icon={<PencilIcon size={13} color={darkGray} />}
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
    backgroundColor: '#AFE7FF',
  },
  screen: {
    flex: 1,
    backgroundColor: background,
  },
  content: {
    paddingBottom: 80,
  },
  hero: {
    minHeight: 352,
    backgroundColor: '#AFE7FF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  iconHit: {
    padding: 4,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 34,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageWrap: {
    width: 88,
    alignItems: 'center',
  },
  profileImage: {
    width: 78,
    height: 78,
    borderRadius: 37,
  },
  name: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 16,
  },
  tag: {
    marginTop: 3,
    left: 4,
    color: '#777777',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 11,
    lineHeight: 12,
  },
  profileDescriptionWrap: {
    flex: 1,
    paddingTop: 8,
  },
  descriptionBubble: {
    minHeight: 60,
    borderRadius: 5,
    backgroundColor: white,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: lightGray,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 11,
    lineHeight: 16,
  },
  editText: {
    marginTop: 8,
    alignSelf: 'flex-end',
    color: '#777777',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 11,
  },
  profileStatsRow: {
    marginTop: 10,
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
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 16,
    lineHeight: 18,
  },
  followLabel: {
    marginTop: 5,
    color: '#777777',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
  },
  followDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: gray,
  },
  streakSection: {
    marginTop: -100,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: background,
    paddingTop: 30,
    paddingHorizontal: 30,
  },
  sectionTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardBold,
    fontSize: 20,
    lineHeight: 24,
  },
  mainStreakCard: {
    marginTop: 30,
    borderRadius: 10,
    backgroundColor: white,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
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
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whaleLevel: {
    width: 124,
    alignItems: 'center',
  },
  whaleImage: {
    marginTop: 10,
    width: 86,
    height: 56,
  },
  levelText: {
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
  },
  levelValue: {
    marginLeft: 4,
    color: darkGray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 11,
  },
  gaugeWrap: {
    width: 164,
    alignItems: 'center',
  },
  gaugeTextWrap: {
    position: 'absolute',
    top: 30,
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
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
  },
  gaugeHint: {
    marginTop: -60,
    color: '#777777',
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
    borderRadius: 10,
    backgroundColor: white,
    paddingTop: 16,
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
    paddingVertical: 40
  },
  statNumber: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 36,
    lineHeight: 46,
  },
  statUnit: {
    marginLeft: 4,
    marginTop: 16,
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
  },
});
