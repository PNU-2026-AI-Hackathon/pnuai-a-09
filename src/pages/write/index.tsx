import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';

export default function WritePage() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <ThemedButton label="취소" variant="ghost" />
        <View style={styles.topBarRight}>
          <ThemedButton label="저장" variant="light" />
          <ThemedButton label="등록" variant="dark" />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 10,
  },
});
