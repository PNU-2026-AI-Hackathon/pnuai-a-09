import { 
  StyleSheet, 
  View, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';
import { 
  white, 
  lightGray, 
  gray, 
  darkGray, 
  primary,
  FontSize, 
  FontFamily 
} from '@/constants/theme';

import UploadIcon from '@/components/icons/upload-icon';
import UnorderedListIcon from '@/components/icons/unordered-list-icon';
import AIIcon from '@/components/icons/ai-icon';
import UnlockIcon from '@/components/icons/unlock-icon';

export default function WritePage() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        {/* Topbar */}
        <View style={styles.topBar}>
          <ThemedButton label="취소" variant="ghost" />
          <View style={styles.topBarRight}>
            <ThemedButton label="저장" variant="light" />
            <ThemedButton label="등록" variant="dark" />
          </View>
        </View>

        {/* Divider 1 */}
        <View style={styles.divider} />

        {/* Input 영역 */}
        <TextInput
          style={styles.input}
          placeholder="내용을 입력하세요. (최대 400자)"
          placeholderTextColor={gray}
          multiline
          maxLength={400}
          textAlignVertical="top"
        />

        {/* Divider 2 */}
        <View style={styles.divider} />

        {/* Bottombar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <UploadIcon width={20} height={20} fill={primary} />
            <UnorderedListIcon width={20} height={20} fill={primary} />
            <AIIcon width={34} height={20} fill={primary} />
          </View>
          <UnlockIcon width={20} height={20} fill={gray} />
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: white,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: lightGray,
    marginVertical: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.pretendardRegular,
    color: darkGray,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  
  
});