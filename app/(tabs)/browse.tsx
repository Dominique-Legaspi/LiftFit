import TopBar from '@/components/ui/TopBar';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>
        <TopBar title="BROWSE" icon="search-outline" value={searchQuery} onChangeText={setSearchQuery} />

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
  },
});
