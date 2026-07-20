import { Stack, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home/home-header';
import { background } from '@/constants/theme';
import { FriendsProvider } from '@/src/contexts/friends';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const leaf = segments[segments.length - 1];
  const shouldShowHeader =
    leaf !== 'notifications' && leaf !== 'friend' && leaf !== 'friend-list';
  const topPadding = shouldShowHeader ? insets.top : 0;

  return (
    <FriendsProvider>
      <View style={[styles.root, { paddingTop: topPadding }]}>
        {shouldShowHeader ? <HomeHeader /> : null}
        <View style={styles.stackWrap}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </FriendsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: background,
  },
  stackWrap: {
    flex: 1,
  },
});
