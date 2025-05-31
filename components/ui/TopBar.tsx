import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import SearchBar from './SearchBar';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';

type TopBarProps = {
    title?: string;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    value: string;
    onChangeText: (text: string) => void;
    /** If you want to tweak the search container on either platform */
    searchContainerStyle?: ViewStyle;
};

export default function TopBar({ title = 'LIFTFIT', icon, value, onChangeText }: TopBarProps) {
    return (
        <>
            <View style={styles.topBar}>
                <View style={styles.topBarTitleContainer}>
                    {icon && <Ionicons name={icon} size={24} style={styles.topBarTitleIcon}/>}
                    <Text style={styles.topBarTitle}>
                        {title}
                    </Text>
                </View>

                {/* search bar - web */}
                {Platform.OS === 'web' && (
                    <SearchBar value={value} onChangeText={onChangeText} />
                )}

                {/* top bar notifications + cart */}
                <View style={styles.topBarButtonsContainer}>
                    <Pressable style={styles.topBarButtons}>
                        <Ionicons name="notifications-outline" size={28} />
                    </Pressable>
                    <Pressable style={styles.topBarButtons}>
                        <Ionicons name="cart-outline" size={28} />
                    </Pressable>
                </View>
            </View>

            {/* search bar - mobile */}
            {Platform.OS !== 'web' && (
                <SearchBar value={value} onChangeText={onChangeText} />
            )}
        </>
    )
}

const styles = StyleSheet.create({
    topBar: {
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topBarTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarTitleIcon: {
        marginRight: 8,
        color: Colors.light.blue,
    },
    topBarTitle: {
        fontSize: 28,
        fontFamily: Fonts.semiBold,
        letterSpacing: 1,
        color: Colors.light.blue,
    },
    topBarButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topBarButtons: {
        marginHorizontal: 5,
    },
})