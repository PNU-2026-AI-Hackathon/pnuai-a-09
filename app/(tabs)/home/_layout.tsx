import { Slot, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home/home-header';
import { background } from '@/constants/theme';
import { GroupSelectionProvider } from '@/src/contexts/group-selection';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const leaf = segments[segments.length - 1];
  const shouldShowHeader = leaf !== 'notifications';

  return (
    <GroupSelectionProvider>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {shouldShowHeader ? <HomeHeader /> : null}
        <View style={styles.stackWrap}>
          <Slot />
        </View>
      </View>
    </GroupSelectionProvider>
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
