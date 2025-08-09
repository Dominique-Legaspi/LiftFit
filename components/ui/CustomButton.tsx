import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

type ButtonProps = {
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    iconSize?: number;
    iconColor?: string;
    text: string;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    onPress: () => void;
    disabled?: boolean;
}

const CustomButton = memo(({
    icon,
    iconSize = 24,
    iconColor = '#fff',
    text,
    containerStyle,
    textStyle,
    onPress,
    disabled = false,
}: ButtonProps) => (
    <Pressable
        style={[
            styles.buttonContainer,
            disabled && styles.disabled,
            containerStyle
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        {icon && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.icon} />
        )}
        <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </Pressable>
))

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        borderRadius: 3,
        backgroundColor: Colors.light.blue,
        marginVertical: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontFamily: Fonts.semiBold,
    },
    icon: {
        marginRight: 8,
    },

    disabled: {
        backgroundColor: Colors.light.gray,
    }
})

export default CustomButton;