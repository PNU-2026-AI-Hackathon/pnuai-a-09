import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home/home-header';
import { background } from '@/constants/theme';
import { GroupSelectionProvider } from '@/src/contexts/group-selection';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();

  return (
    <GroupSelectionProvider>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <HomeHeader />
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
