import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, ImageStyle, Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

export type Product = {
    id: string;
    name: string;
    price: number;
    discount?: number;
    image_urls?: string[];
};

type ProductCardProps = {
    product: Product;
    onPress?: (item: Product) => void;
    cardWidth?: number;
    cardHeight?: number;
    cardMargin?: number;
    imageStyle?: StyleProp<ImageStyle>;
    textStyle?: StyleProp<TextStyle>;
};

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    cardWidth,
    cardHeight,
    cardMargin,
    imageStyle,
    textStyle,
}) => {
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const opacity = useRef(new Animated.Value(0)).current;

    const firstUrl = product.image_urls && product.image_urls.length > 0
        ? product.image_urls[0]
        : null;

    useEffect(() => {

        if (!firstUrl) {
            setImageLoaded(true);
            return;
        }
        Image.prefetch(firstUrl)
            .then(() => {
                setImageLoaded(true);
            })
            .catch((err) => {
                console.warn('Image.prefetch failed for', firstUrl, err);
                setImageLoaded(true);
            })

    }, [firstUrl])

    useEffect(() => {
        if (imageLoaded && firstUrl) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [imageLoaded, firstUrl, opacity]);

    const hasDiscount =
        product.discount !== undefined &&
        product.discount !== null &&
        product.discount !== 0.0;

    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
    const discountPrice = product.price - product.price * (product.discount ?? 0);

    return (
        <Pressable
            style={[
                styles.cardBase,
                { width: cardWidth, height: cardHeight, margin: cardMargin },
            ]}
            onPress={() => onPress && onPress(product)}
        >
            {!imageLoaded && firstUrl && (
                <View style={[styles.imagePlaceholder, { width: cardWidth, height: cardHeight }]}>
                    <ActivityIndicator size="small" color={Colors.light.lightgray} />
                </View>
            )}
            {firstUrl && (
                <Animated.Image
                    source={{ uri: firstUrl }}
                    style={[
                        styles.image,
                        { width: cardWidth, height: cardHeight, opacity },
                        imageStyle]}
                    resizeMode="cover"
                    onError={(e) => {
                        console.warn('Failed to load image', firstUrl, e.nativeEvent.error);
                    }}
                />
            )}

            {hasDiscount && (
                <View style={[styles.discountTag, styles.buttonContainer]}>
                    <Ionicons
                        name="pricetags-sharp"
                        size={24}
                        style={{ color: '#ff3030' }}
                    />
                </View>
            )}

            <View style={[styles.wishlistButton, styles.buttonContainer]}>
                <Ionicons
                    name="heart-outline"
                    size={24}
                    style={{ color: Colors.light.blue }}
                />
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.productName, textStyle]} numberOfLines={2}>
                    {product.name}
                </Text>

                {hasDiscount ? (
                    <View style={styles.priceRow}>
                        <Text style={styles.regularPriceStrikethrough}>
                            {formatCurrency(product.price)}
                        </Text>

                        <Text style={[styles.discountPrice, textStyle]}>
                            {" "}
                            {formatCurrency(discountPrice)}
                        </Text>
                    </View>
                ) : (
                    <Text style={[styles.regularPrice, textStyle]}>
                        {formatCurrency(product.price)}
                    </Text>
                )}
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    cardBase: {
        marginHorizontal: 4,
        backgroundColor: Colors.light.darkgray,
        borderRadius: 5,
        overflow: "hidden",
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.darkgray,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    image: {
        ...StyleSheet.absoluteFillObject,
    },
    textContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        zIndex: 2,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    productName: {
        color: "#fff",
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
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
    buttonContainer: {
        padding: 5,
        borderRadius: 50,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 2, height: 2 },
        elevation: 2,
    },
    discountTag: {
        position: "absolute",
        top: 5,
        left: 5,
    },
    wishlistButton: {
        position: "absolute",
        top: 5,
        right: 5,
    },
});

export default ProductCard;