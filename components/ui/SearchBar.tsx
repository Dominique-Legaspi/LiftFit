import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextStyle, ViewStyle } from 'react-native';

type SearchBarProps = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
}

export default function SearchBar({
    value,
    onChangeText,
    placeholder = 'Looking for Something',
    containerStyle,
    inputStyle,
}: SearchBarProps) {

    const [isActive, setIsActive] = useState<boolean>(false);

    const activeColor = Colors.light.blue;
    const inactiveColor = Colors.light.gray;
    const currentColor = isActive ? activeColor : inactiveColor;

    return (
        <Pressable
            style={[
                styles.searchBarContainer, {
                    borderColor: currentColor
                },
                containerStyle
            ]}
        >
            <Ionicons
                name="search-outline"
                size={20}
                style={{ color: currentColor, marginRight: 8 }}
            />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsActive(true)}
                onBlur={() => setIsActive(false)}
                placeholder={placeholder}
                style={[
                    styles.searchBarInput,
                    {
                        fontStyle: !value ? 'italic' : 'normal',
                        color: currentColor
                    },
                    inputStyle,
                ]}
            />
        </Pressable>

    )
}

const styles = StyleSheet.create({
    searchBarContainer: {
        marginHorizontal: 20,
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 3,
        ...(Platform.OS === 'web' ? { width: 500, padding: 5 } : { flex: 1, marginVertical: 10, padding: 10 }),
    },
    searchBarInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: Colors.light.blue,
        outlineWidth: 0,
    },
});