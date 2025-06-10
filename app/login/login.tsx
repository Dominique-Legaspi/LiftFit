import LoginTextField from '@/components/ui/LoginTextField'
import { Colors } from '@/constants/Colors'
import { Fonts } from '@/constants/Fonts'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.viewContainer}>
                {/* logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>
                        LiftFit
                    </Text>
                    <Text style={styles.blurb}>
                        Wear stylish, breathable activewear.
                    </Text>
                </View>
                

                {/* input fields */}
                <View style={styles.textFieldsContainer}>
                    <LoginTextField
                        value={email}
                        onChangeText={setEmail}
                        title="Email"
                        placeholder="Enter email address"
                        icon="mail-outline"
                        inputType="email"
                    />
                    <LoginTextField
                        value={password}
                        onChangeText={setPassword}
                        title="Password"
                        placeholder="Enter password"
                        icon="lock-closed-outline"
                        inputType="password"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={styles.buttonBox}
                    >
                        <Text style={styles.buttonText}>
                            Login
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => router.replace('/login/signup')}
                        style={styles.existingAccountContainer}
                    >
                        <Text style={styles.existingAccountText}>
                            Don't have an account? <Text style={{ color: Colors.light.blue }}>Sign up</Text>
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    viewContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // logo
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 80,
    },
    logoText: {
        fontSize: 60,
        fontFamily: Fonts.black,
        color: Colors.light.blue,
    },
    blurb: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.blue,
    },

    // text fields
    textFieldsContainer: {
        width: '100%',
        marginVertical: 10,
    },

    // button
    buttonContainer: {
        width: '100%',
        marginVertical: 50,
    },
    buttonBox: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: Colors.light.blue,
        borderRadius: 3,
    },
    buttonText: {
        fontSize: 20,
        fontFamily: Fonts.semiBold,
        color: '#fff',
    },

    existingAccountContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    existingAccountText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },

})