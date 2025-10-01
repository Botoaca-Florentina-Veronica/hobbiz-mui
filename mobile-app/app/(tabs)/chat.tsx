import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
export default function ChatScreen() {
  return (
    <ThemedView style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <ThemedText>Chat</ThemedText>
    </ThemedView>
  );
}
