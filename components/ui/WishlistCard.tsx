import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type ProductWishlist = {
    id: string;
    profile_id: string;
    product_id: string;
    product_color_id?: string | null;
    product_stock_id?: string | null;

    products: {
        id: string;
        name: string;
        price: number;
        discount?: number;
    };

    product_colors: {
        color: string;
        hex: string;
        image_urls?: string[];
    };

    product_stocks: {
        size: string;
        stock: number;
    }
}

interface WishlistCardProps {
    item: ProductWishlist;
    onDelete: () => void;
}

export default function WishlistCard({ item, onDelete }: WishlistCardProps) {
    const router = useRouter();

    const imageUrl = item?.product_colors?.image_urls?.[0];

    const productPrice = item.products.price;
    const productDiscount = item.products.discount;

    const hasDiscount =
        productDiscount !== undefined &&
        productDiscount !== null &&
        productDiscount !== 0.0;

    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
    const discountPrice = productPrice - productPrice * (productDiscount ?? 0);

    const stockLevel = item.product_stocks.stock;
    const outOfStock = item.product_stocks.stock <= 0;

    return (
        <Pressable
            onPress={() => router.push(`/product/${item.product_id}`)}
            style={styles.cardContainer}
        >
            <Image source={{ uri: imageUrl }} style={[styles.cardImage, outOfStock && { opacity: 0.4 }]} />
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.products.name}</Text>

                    <Pressable
                        onPress={onDelete}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.light.gray} />
                    </Pressable>
                </View>
                <Text style={styles.cardStockInfo}>{item.product_colors.color}, {item.product_stocks.size}</Text>
                {hasDiscount ? (
                    <View style={styles.priceRow}>
                        <Text style={styles.regularPriceStrikethrough}>
                            {formatCurrency(productPrice)}
                        </Text>

                        <Text style={styles.discountPrice}>
                            {" "}
                            {formatCurrency(discountPrice)}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.regularPrice}>
                        {formatCurrency(productPrice)}
                    </Text>
                )}

                <View style={styles.addToCartRow}>
                    <Text style={styles.stockInfo}>{stockLevel > 0 ? "In Stock" : ''}</Text>
                    <Pressable
                        style={[styles.addToCartButton, outOfStock && { backgroundColor: Colors.light.lightgray }]}
                        disabled={outOfStock}
                    >
                        <Text style={styles.addToCartText}>{outOfStock ? "Out of Stock" : "Add to Cart"}</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    )
};

const styles = StyleSheet.create({
    cardContainer: {
        marginVertical: 10,
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    cardImage: {
        borderRadius: 3,
        width: 100,
        height: 150,
        resizeMode: 'contain',
    },
    cardInfo: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 4,
        fontFamily: Fonts.semiBold,
        color: Colors.light.blue,
    },
    cardStockInfo: {
        fontSize: 12,
        paddingVertical: 4,
        fontFamily: Fonts.regular,
    },

    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    regularPrice: {
        color: "#eee",
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    regularPriceStrikethrough: {
        color: "#aaa",
        fontSize: 14,
        fontFamily: Fonts.regular,
        textDecorationLine: "line-through",
    },
    discountPrice: {
        color: "#ff3030",
        fontSize: 16,
        fontFamily: Fonts.extraBold,
    },

    addToCartRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    addToCartButton: {
        borderRadius: 3,
        backgroundColor: Colors.light.blue,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    stockInfo: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },

    deleteButton: {
        padding: 4,
    }
})