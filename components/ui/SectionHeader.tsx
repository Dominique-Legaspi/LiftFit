import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router';
import React from 'react'
import { Text, TextStyle, View, ViewStyle, Pressable, StyleSheet } from 'react-native';

type SectionHeaderProps = {
    title: string;
    linkText?: string;
    link?: () => void;
    containerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    linkTextStyle?: TextStyle;
}

export function SectionHeader({ title, linkText, link, containerStyle, titleStyle, linkTextStyle }: SectionHeaderProps) {
    const handlePress = () => {
        if (link) {
            link();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, titleStyle]}>
                {title}
            </Text>
            {linkText && link && (
                <Pressable
                    onPress={handlePress}
                    style={[styles.linkContainer, containerStyle]}>
                    <Text style={[styles.linkText, linkTextStyle]}>
                        {linkText}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} />
                </Pressable>

            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 5,
        marginHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.semiBold,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkText: {
        fontSize: 16,
        fontFamily: Fonts.light,
    }
})

export default SectionHeader;