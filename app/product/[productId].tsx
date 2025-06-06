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

type ProductColor = {
    id: string;
    product_id: string;
    color: string;
    hex: string;
}

type ProductStock = {
    id: string;
    product_color_id: string;
    size: string;
    stock: number;
}

export default function ProductScreen() {
    const { productId } = useLocalSearchParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);

    const [productColors, setProductColors] = useState<ProductColor[]>([]);
    const [productStocks, setProductStocks] = useState<ProductStock[]>([]);

    const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
    const [selectedSize, setSelectedSize] = useState<ProductStock | null>(null);

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

    async function fetchProductStock() {
        if (!productId) return;
        setLoading(true);

        // fetch color for each product
        const { data: colorsData, error: colorsError } = await supabase
            .from('product_colors')
            .select('*')
            .eq('product_id', productId);

        if (colorsError) throw colorsError;

        setProductColors(colorsData);

        // fetch size and stock for each color
        const colorIds = colorsData.map((c) => c.id);
        const { data: stocksData, error: stocksError } = await supabase
            .from('product_stocks')
            .select('*')
            .in('product_color_id', colorIds);

        if (stocksError) throw stocksError;

        setProductStocks(stocksData);
        setLoading(false);

        if (colorsData.length > 0) {
            setSelectedColor(colorsData[0]);
        }
    };

    useEffect(() => {
        fetchProduct();
        fetchProductStock();
    }, [productId]);

    const firstUrl = product?.image_urls && product?.image_urls.length > 0
        ? product?.image_urls[0]
        : null;

    //

    const hasDiscount =
        product?.discount !== undefined &&
        product?.discount !== null &&
        product?.discount !== 0.0;

    const formatCurrency = (value: number) => `$ ${value.toFixed(2)}`;

    const basePrice = product?.price ?? 0;
    const discountPct = product?.discount ?? 0;
    const discountPrice = basePrice - basePrice * (discountPct);

    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
    const sizeMap = new Map(productStocks
        .filter((stock) => stock.product_color_id === selectedColor?.id)
        .map((stock) => [stock.size, stock]));

    const orderedSizes: ProductStock[] = SIZE_ORDER.map((size) => {
        const stockEntry = sizeMap.get(size);
        if (stockEntry) return stockEntry;

        // if product size and color does not exist in database, set the stock to 0
        return {
            id: `${selectedColor?.id}-${size}`,
            product_color_id: selectedColor?.id ?? '',
            size,
            stock: 0,
        }
    })

    const handleColorSelect = (color: ProductColor) => {
        setSelectedColor(color);

        // If a size was already chosen, carry its "size string" over to the new color:
        if (selectedSize) {
            const sameSizeUnderNewColor = productStocks.find(
                (s) =>
                    s.product_color_id === color.id &&
                    s.size === selectedSize.size
            );
            if (sameSizeUnderNewColor) {
                // new color actually has that size
                setSelectedSize(sameSizeUnderNewColor);
            } else {
                // build a dummy stock row so the UI still highlights that size
                setSelectedSize({
                    id: `${color.id}-${selectedSize.size}`,
                    product_color_id: color.id,
                    size: selectedSize.size,
                    stock: 0,
                });
            }
        }
    }

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
                        <Text style={styles.productName}>{product?.name}</Text>
                    </View>
                    <View style={styles.productPriceRow}>
                        <View style={styles.productPriceContainer}>
                            {hasDiscount
                                ? (
                                    <>
                                        <Text style={styles.discountPriceText}>
                                            {formatCurrency(discountPrice)}
                                        </Text>
                                        <View style={styles.productPriceWithDiscountContainer}>
                                            <Text style={styles.productPriceWithDiscountText}>
                                                Was {formatCurrency(basePrice)}
                                            </Text>
                                            <View style={styles.discountContainer}>
                                                <Ionicons name="pricetags-sharp" size={16} style={{ color: '#fff', marginRight: 4 }} />
                                                <Text style={styles.discountPercentText}>
                                                    {discountPct * 100}% off
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <Text style={styles.productPriceText}>
                                        {formatCurrency(basePrice)}
                                    </Text>
                                )}
                        </View>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Pressable
                                style={[styles.addToCartButton,
                                selectedColor && selectedSize && selectedSize.stock > 0
                                    ? styles.addToCartSelection
                                    : styles.addToCartNoSelection]}
                                    disabled={selectedSize && selectedSize.stock === 0}
                            >
                                <Ionicons name="cart-outline" size={24}
                                    style={[styles.addToCartText, {
                                        marginRight: 4,
                                        color: selectedColor && selectedSize && selectedSize.stock > 0
                                            ? '#fff'
                                            : Colors.light.gray
                                    }]} />
                                <Text style={[
                                    styles.addToCartText,
                                    {
                                        color: selectedColor && selectedSize && selectedSize.stock > 0
                                            ? '#fff'
                                            : Colors.light.gray
                                    }]}>
                                    Add to Cart
                                </Text>
                            </Pressable>
                            <Text style={[
                                styles.stockText,
                                { color: selectedSize && selectedSize.stock > 3 ? Colors.light.darkgray : '#f21313' }]}>
                                {selectedColor && selectedSize
                                    ? selectedSize.stock > 3
                                        ? 'In Stock'
                                        : selectedSize.stock === 0
                                            ? 'Out of stock'
                                            : `Only ${selectedSize.stock} left!`
                                    : ''}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.productDescContainer}>
                        <Text style={styles.productDesc}>{product?.description}</Text>
                    </View>
                    <View style={styles.productStockContainer}>

                        {/* colors and stock info */}
                        <View style={styles.colorRow}>
                            {selectedColor &&
                                <View style={styles.stockInfoContainer}>
                                    <Text style={styles.stockInfo}>
                                        {selectedColor.color}
                                    </Text>
                                </View>
                            }

                            <View style={{ flexDirection: 'row' }}>
                                {productColors.map((colorItem) => {
                                    const isSelected = selectedColor?.id === colorItem.id;
                                    return (
                                        <Pressable
                                            key={colorItem.id}
                                            onPress={() => handleColorSelect(colorItem)}
                                            style={[styles.colorContainer, {
                                                borderColor: isSelected ? `#${colorItem.hex}` : 'transparent',
                                            }]}
                                        >
                                            <View
                                                key={colorItem.id}
                                                style={[styles.colorCircle, { backgroundColor: `#${colorItem.hex}` }]}
                                            />
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    </View>

                    {/* sizes */}
                    <View style={styles.sizeContainer}>
                        <View style={styles.sizeInfo}>
                            <Text>
                                Available sizes:
                            </Text>
                        </View>
                        <View style={styles.sizeRow}>
                            {orderedSizes.map((sizeItem) => {
                                const isSelected = selectedSize?.size === sizeItem.size;

                                return (
                                    <Pressable
                                        key={sizeItem.id}
                                        onPress={() => setSelectedSize(sizeItem)}
                                        style={[
                                            styles.sizeBox,
                                            {
                                                backgroundColor: isSelected
                                                    ? (sizeItem?.stock > 0
                                                        ? Colors.light.blue
                                                        : Colors.light.gray)
                                                    : 'transparent'
                                            }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.sizeText,
                                                {
                                                    color: sizeItem?.stock > 0
                                                        ? (isSelected
                                                            ? '#fff'
                                                            : Colors.light.blue)
                                                        : (isSelected
                                                            ? '#fff'
                                                            : Colors.light.lightgray)
                                                }
                                            ]}
                                        >
                                            {sizeItem.size}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
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
        position: 'relative',   // position the icon more in the center
        right: 1,
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
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray,
    },
    productNameContainer: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    productName: {
        fontSize: 24,
        fontFamily: Fonts.semiBold,
    },
    productDescContainer: {
        paddingVertical: 8,
    },
    productDesc: {
        fontSize: 16,
        fontFamily: Fonts.light,
        color: Colors.light.gray,
    },

    // product price
    productPriceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    productPriceContainer: {
        marginRight: 16,
        padding: 8,
    },
    productPriceText: {
        fontSize: 40,
        fontFamily: Fonts.semiBold,
    },
    productPriceWithDiscountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    productPriceWithDiscountText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.lightgray,
    },
    discountPriceText: {
        fontSize: 40,
        fontFamily: Fonts.extraBold,
        color: "#ff3030",
    },
    discountContainer: {
        borderRadius: 3,
        backgroundColor: Colors.light.lightgray,
        padding: 8,
        marginLeft: 8,
        marginVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountPercentText: {
        fontSize: 16,
        fontFamily: Fonts.extraBold,
        color: '#fff',
    },

    // add to cart button
    addToCartButton: {
        marginVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: Colors.light.blue,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    addToCartSelection: {
        borderColor: Colors.light.blue,
        backgroundColor: Colors.light.blue,
    },
    addToCartNoSelection: {
        borderColor: Colors.light.lightgray,
    },
    addToCartText: {
        fontFamily: Fonts.semiBold,
        fontSize: 20,
    },

    // stock info
    stockInfoContainer: {
        width: '30%',
        marginRight: 12,
    },
    stockInfo: {
        fontSize: 20,
        fontFamily: Fonts.semiBold,
        paddingBottom: 4,
    },
    stockText: {
        fontFamily: Fonts.regular,
        marginTop: 4,
    },

    // product stock
    productStockContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    // colors
    colorRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    colorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: 3,
        borderWidth: 2,
        margin: 4,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 1,
    },

    // sizes
    sizeContainer: {
        borderWidth: 1,
        borderColor: Colors.light.gray,
        borderRadius: 3,
        marginVertical: 8,
        padding: 16,

    },
    sizeInfo: {
        marginBottom: 4,
    },
    sizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sizeBox: {
        width: 36,
        height: 36,
        padding: 8,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sizeText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    }
})

