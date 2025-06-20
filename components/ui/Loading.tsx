import { Colors } from "@/constants/Colors";
import React from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";

export const Loading = () => {
    return (
        <SafeAreaView style={styles.center}>
            <ActivityIndicator size="large" color={Colors.light.blue} />
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
});

export default Loading;