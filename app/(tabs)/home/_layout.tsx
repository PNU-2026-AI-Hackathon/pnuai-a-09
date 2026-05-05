import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home/home-header';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <HomeHeader />
      <View style={styles.stackWrap}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stackWrap: {
    flex: 1,
  },
});
