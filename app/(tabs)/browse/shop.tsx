import TopBar from '@/components/ui/TopBar';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

export default function ShopScreen() {
    const [searchQuery, setSearchQuery] = useState<string>('');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollViewContainer}>
                <TopBar title="shop" icon="shirt-outline" hasBackButton={true} value={searchQuery} onChangeText={setSearchQuery} />
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
