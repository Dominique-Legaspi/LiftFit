import LoginTextField from '@/components/ui/LoginTextField'
import { Colors } from '@/constants/Colors'
import { Fonts } from '@/constants/Fonts'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            return Alert.alert("Email field required");
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());

            if (error) {
                console.error("Error sending email for password reset:", error);
                return;
            }

            // route to login screen
            Alert.alert(
                'Email sent',
                'If that email is registered, you will receive password reset instructions shortly.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            )
        } catch (err) {
            console.error("Error sending password reset:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.blue} />
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
                        value={email}
                        onChangeText={setEmail}
                        title="Email"
                        placeholder="Enter email address"
                        icon="mail-outline"
                        inputType="email"
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
                                    Submit
                                </Text>
                            )
                        }
                    </Pressable>

                    <Pressable
                        onPress={() => router.replace('/auth/login')}
                        style={styles.textContainer}
                    >
                        <Text style={[styles.textStyle, { color: Colors.light.gray }]}>
                            Remembered your password? <Text style={{ color: Colors.light.blue }}>Login</Text>
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

})