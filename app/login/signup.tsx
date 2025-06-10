import LoginTextField from '@/components/ui/LoginTextField'
import { Colors } from '@/constants/Colors'
import { Fonts } from '@/constants/Fonts'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function SignUpScreen() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // show descriptive info when text field is focused
    const [isUsernameFocused, setIsUsernameFocused] = useState<boolean>(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const handleSignUp = async () => {
        // all fields non-empty
        if (!username || !email || !password || !confirmPassword) {
            return Alert.alert('All fields required.');
        }

        // validate username requirements
        const usernameRegex = /^[a-zA-Z0-9_]+$/
        if (!usernameRegex.test(cleanUsername)) {
            return Alert.alert('Username may only contain letters, numbers, and underscores.')
        }
        if (cleanUsername.length < 3 || cleanUsername.length > 20) {
            return Alert.alert('Username must be between 3 and 20 characters.')
        }

        // validate email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(cleanEmail.trim())) {
            return Alert.alert('Please enter a valid email address.')
        }

        // validate password requirements
        const pwdMinLength = 8
        if (password.length < pwdMinLength) {
            return Alert.alert(`Password must be at least ${pwdMinLength} characters.`)
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return Alert.alert('Password must include at least one uppercase letter and one number.')
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return Alert.alert('Password must include at least one special character (e.g. !@#$%^&*).')
        }

        // password and confirm password must match
        if (password !== confirmPassword) {
            return Alert.alert('Passwords do not match.')
        }

        setLoading(true);
        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
                {
                    email: cleanEmail,
                    password,
                    options: { data: { username: cleanUsername }, }
                }
            );

            if (signUpError) {
                Alert.alert('Error creating account:', signUpError.message);
            }

            if (!signUpData || !signUpData.user) {
                console.error("Sign-up succeeded but no user was returned");
                return;
            }

            const userId = signUpData.user.id;

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    username: cleanUsername,
                    email: cleanEmail,
                });

            if (profileError) {
                console.error("Error creating profile row:", profileError);
                return;
            }

            Alert.alert(
                'Check your email',
                'A confirmation link has been sent. Please verify and then log in.',
                [{ text: 'OK', onPress: () => router.replace('/login/login') }]
            );

        } catch (err: any) {
            Alert.alert('Error signing up:', err.message)
        } finally {
            setLoading(false);
        }
    }

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
                        value={username}
                        onChangeText={setUsername}
                        title="Username"
                        placeholder="Enter username"
                        icon="person-outline"
                        inputType="text"
                        onFocus={() => setIsUsernameFocused(true)}
                        onBlur={() => setIsUsernameFocused(false)}
                    />
                    {isUsernameFocused && (
                        <Text style={styles.helperText}>
                            Your username must be between 3 to 20 characters, and only contain letters, numbers, and underscores.
                        </Text>
                    )}
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
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                    />
                    {isPasswordFocused && (
                        <Text style={styles.helperText}>
                            Your password must be at least 8 characters, include an uppercase letter, a number, and a special character.
                        </Text>
                    )}
                    <LoginTextField
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        title="Confirm password"
                        placeholder="Confirm password"
                        icon="lock-closed-outline"
                        inputType="password"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={[styles.buttonBox, loading && { backgroundColor: Colors.light.gray, opacity: 0.6 }]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : (
                                <Text style={styles.buttonText}>
                                    Sign up
                                </Text>
                            )
                        }
                    </Pressable>
                </View>
                <Pressable
                    onPress={() => router.replace('/login/login')}
                    style={styles.existingAccountContainer}
                >
                    <Text style={styles.existingAccountText}>
                        Already have an account? <Text style={{ color: Colors.light.blue }}>Login</Text>
                    </Text>
                </Pressable>
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
        marginVertical: 40,
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
    helperText: {
        marginHorizontal: 30,
        fontSize: 12,
        color: Colors.light.gray,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },

    // button
    buttonContainer: {
        width: '100%',
        marginTop: 50,
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
        marginTop: 30,
    },
    existingAccountText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },

})