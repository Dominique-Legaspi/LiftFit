import LoginTextField from '@/components/ui/LoginTextField'
import { Colors } from '@/constants/Colors'
import { Fonts } from '@/constants/Fonts'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import Loading from '@/components/ui/Loading'

export default function ResetPasswordScreen() {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState<boolean>(false);

    const [linkValid, setLinkValid] = useState(false)


    useEffect(() => {
        // Listen for the PASSWORD_RECOVERY event
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setLinkValid(true)
            }
            setLoading(false)
        })
        // Clean up listener on unmount
        return () => listener.subscription?.unsubscribe()
    }, [])

    const handleSubmit = async () => {
        if (!password || !confirmPassword) {
            return Alert.alert("All fields required.");
        }

        if (!password !== !confirmPassword) {
            return Alert.alert("Passwords do not match");
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.updateUser({ password: password });

            if (error) {
                console.error("Error resetting password:", error);
                return;
            }

            Alert.alert(
                'Success',
                'Your password has been updated.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );

        } catch (err) {
            console.error("Error resetting password");
        } finally {
            setLoading(false);
        }
    }

    // loading spinner
    if (loading) {
        return <Loading />
    }

    if (!linkValid) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>
                    That password-reset link is invalid or expired.
                </Text>
            </SafeAreaView>
        )
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
                        value={password}
                        onChangeText={setPassword}
                        title="New password"
                        placeholder="Enter new password"
                        icon="lock-closed-outline"
                        inputType="password"
                    />
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
                        onPress={handleSubmit}
                        style={styles.buttonBox}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : (
                                <Text style={styles.buttonText}>
                                    Reset Password
                                </Text>
                            )
                        }
                    </Pressable>

                    <Pressable
                        onPress={() => router.replace('/auth/login')}
                        style={styles.textContainer}
                    >
                        <Text style={[styles.textStyle, { color: Colors.light.gray }]}>
                            Return to <Text style={{ color: Colors.light.blue }}>Login</Text>
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
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

    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    textStyle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },

    errorText: {
        color: '#ff0000',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

})