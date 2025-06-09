import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>
        <Pressable onPress={() => router.push('/login/login')}>
          <Ionicons name="log-in-outline" size={32} />
        </Pressable>
        <Pressable onPress={() => router.push('/login/signup')}>
          <Ionicons name="person-add" size={32} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20, 
  },
});
