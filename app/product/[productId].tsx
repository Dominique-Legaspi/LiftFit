import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/app/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Fonts } from '@/constants/Fonts';

export const options = {
    headerShown: false,
};

type Product = {
    id: string;
    created_at: string;
    name: string;
    description: string;
    price: number;
    discount?: number;
    category_id?: number;
    type_id?: number;
    style_id?: string;
    gender?: string;
    image_urls: string[];
    product_styles: { name: string };
    product_types: { name: string };
    product_categories: { name: string };
};

export default function ProductScreen() {
    const { productId } = useLocalSearchParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);

    const [loading, setLoading] = useState<boolean>(false);

    async function fetchProduct() {
        if (!productId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('products')
            .select(`*,
                product_styles(name),
                product_types(name),
                product_categories(name)`)
            .eq('id', productId)
            .maybeSingle();

        if (error) throw error;

        setProduct(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const firstUrl = product?.image_urls && product?.image_urls.length > 0
        ? product?.image_urls[0]
        : null;

    // loading spinner
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.blue} />
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollViewContainer}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButtonContainer}
                >
                    <Ionicons name="chevron-back" style={styles.backButton} size={24} />
                </Pressable>
                <View style={styles.imageContainer}>
                    {firstUrl ? (
                        <Image source={{ uri: firstUrl }} style={styles.image} resizeMode='cover' />
                    ) : (
                        <Ionicons name="image-outline" size={60} color={Colors.light.gray} />
                    )}
                </View>

                <View style={styles.productInfoContainer}>
                    <View style={styles.productNameContainer}>
                        <Text style={styles.productName}>
                            {product?.name}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContainer: {
        paddingVertical: 10,
        marginBottom: 60,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // back button
    backButtonContainer: {
        zIndex: 999,
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        padding: 8,
        top: 14,
        left: 14,
        borderRadius: 50,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 2, height: 2 },
        elevation: 2,
    },
    backButton: {
        color: Colors.light.blue,
    },

    // image
    imageContainer: {
        flex: 1,
        height: 600,
        overflow: 'hidden',
        backgroundColor: Colors.light.lightgray,
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        ...StyleSheet.absoluteFillObject,
    },

    // product info container
    productInfoContainer: {
        flex: 1,
        marginHorizontal: 20,
    },
    productNameContainer: {
        padding: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray,
    },
    productName: {
        fontSize: 20,
        fontFamily: Fonts.semiBold,
    },
})

