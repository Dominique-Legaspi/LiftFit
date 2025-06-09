import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { InputModeOptions, Pressable, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";

export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'phone' | 'url';

type LoginProps = {
    value: string;
    onChangeText: (text: string) => void;
    inputType?: TextFieldType;
    title: string;
    placeholder?: string;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle,
};

export default function LoginTextField({
    value,
    onChangeText,
    inputType = 'email',
    title = 'Email',
    placeholder = 'Enter email address',
    icon = 'mail-outline',
    containerStyle,
    inputStyle,
    ...rest
}: LoginProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const typeProps: Partial<TextInputProps> = {};
    switch (inputType) {
        case 'email':
            typeProps.keyboardType = 'email-address';
            typeProps.textContentType = 'emailAddress';
            break;
        case 'password':
            typeProps.secureTextEntry = showPassword;
            typeProps.textContentType = 'password';
            break;
        case 'number':
            typeProps.keyboardType = 'number-pad';
            break;
        case 'phone':
            typeProps.keyboardType = 'phone-pad';
            break;
        case 'url':
            typeProps.keyboardType = 'url';
            break;
        default:
            break;
    };

    return (
        <View style={styles.textInputContainer}>
            <Pressable
                style={[styles.textInputBox, containerStyle]}
            >
                <Ionicons name={icon} size={28} style={styles.textInputIcon} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={[styles.textInput, inputStyle]}
                    placeholder={placeholder}
                    autoCapitalize="none"
                    {...typeProps}
                    {...rest}
                />
                {inputType === 'password' && (
                    !showPassword ? (
                        <Pressable
                            onPress={() => setShowPassword(true)}
                        >
                            <Ionicons name="eye" size={28} style={styles.showHideIcon} />
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={() => setShowPassword(false)}
                        >
                            <Ionicons name="eye-off" size={28} style={styles.showHideIcon} />
                        </Pressable>
                    )
                )}
            </Pressable>
            <Text style={styles.textInputDesc}>{title}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    textInputContainer: {
        marginHorizontal: 20,
        marginVertical: 5,
    },
    textInputBox: {
        padding: 12,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.blue,
    },
    textInputIcon: {
        marginLeft: 4,
        marginRight: 10,
        color: Colors.light.blue,
    },
    showHideIcon: {
        marginRight: 4,
        marginLeft: 10,
        color: Colors.light.blue,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.blue,
        outlineWidth: 0,
    },
    textInputDesc: {
        marginTop: 4,
        marginLeft: 12,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
})