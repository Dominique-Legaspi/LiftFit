import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

export default function CartScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>

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
