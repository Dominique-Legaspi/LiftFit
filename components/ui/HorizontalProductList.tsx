import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Dimensions, FlatList, Image, ImageStyle, ListRenderItemInfo, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type Product = {
    id: string;
    name: string;
    price: number;
    discount?: number;
    image_urls?: string[];
};

type HorizontalProductListProps = {
    data: Product[];
    onPressItem?: (item: Product) => void;
    cardWidth?: number;
    cardHeight?: number;
    cardMargin?: number;
    style?: StyleProp<ViewStyle>;
    imageStyle?: StyleProp<ImageStyle>;
    textStyle?: StyleProp<TextStyle>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH * 0.6;
const DEFAULT_CARD_HEIGHT = 300;
const DEFAULT_CARD_MARGIN = 10;

const HorizontalProductList: React.FC<HorizontalProductListProps> = ({
    data,
    onPressItem,
    cardWidth = DEFAULT_CARD_WIDTH,
    cardHeight = DEFAULT_CARD_HEIGHT,
    cardMargin = DEFAULT_CARD_MARGIN,
    style,
    imageStyle,
    textStyle
}) => {
    const renderItem = ({ item }: ListRenderItemInfo<Product>) => {
        const hasDiscount = item.discount !== undefined && item.discount !== null && item.discount !== 0.00;
        const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

        const discountPrice = item.price - (item.price * item.discount!);

        return (
            <Pressable
                style={[
                    styles.card,
                    { width: cardWidth, height: cardHeight, marginRight: cardMargin }
                ]}
                onPress={() => onPressItem && onPressItem(item)}
            >
                {item.image_urls && (
                    <Image
                        source={{ uri: item.image_urls[0] }}
                        style={[
                            styles.image,
                            { width: cardWidth },
                            imageStyle,
                        ]}
                        resizeMode="cover"
                    />
                )}

                {hasDiscount && (
                    <View style={[styles.discountTag, styles.buttonContainer]}>
                        <Ionicons name="pricetags-sharp" size={24} style={{ color: '#ff3030' }} />
                    </View>
                )}

                <View style={[styles.wishlistButton, styles.buttonContainer]}>
                    <Ionicons name={"heart-outline"} size={24} style={{color: Colors.light.blue}}/>
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.productName, textStyle]} numberOfLines={2}>
                        {item.name}
                    </Text>
                    {hasDiscount ? (
                        <View style={styles.priceRow}>
                            <Text style={styles.regularPriceStrikethrough}>
                                {formatCurrency(item.price)}
                            </Text>
                            <Text style={[styles.discountPrice, textStyle]}>
                                {" "}
                                {formatCurrency(discountPrice)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.regularPrice, textStyle]}>
                            {formatCurrency(item.price)}
                        </Text>
                    )}
                </View>
            </Pressable>
        )
    };

    return (
        <FlatList
            horizontal
            data={data}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            style={[styles.row, style]}
            keyExtractor={(item) => item.id.toString()}
            snapToInterval={cardWidth + cardMargin}
            renderItem={renderItem}
        />
    )
}

const styles = StyleSheet.create({
    row: {
        marginVertical: 10,
    },
    card: {
        marginHorizontal: 10,
        backgroundColor: Colors.light.darkgray,
        borderRadius: 5,
        width: DEFAULT_CARD_WIDTH + DEFAULT_CARD_MARGIN,
        height: DEFAULT_CARD_HEIGHT,
        padding: 10,
        overflow: 'hidden'
    },
    image: {
        ...StyleSheet.absoluteFillObject,
    },
    textContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    productName: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    regularPrice: {
        color: '#eee',
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    regularPriceStrikethrough: {
        color: '#aaa',
        fontSize: 14,
        fontFamily: Fonts.regular,
        textDecorationLine: 'line-through',
    },
    discountPrice: {
        color: '#ff3030',
        fontSize: 16,
        fontFamily: Fonts.extraBold,
    },

    buttonContainer: {
        padding: 5,
        borderRadius: 50,
        backgroundColor: '#fff',
        boxShadow: '2px 2px 3px rgba(0,0,0,0.2)',
    },
    discountTag: {
        position: 'absolute',
        top: 5,
        left: 5,
    },
    wishlistButton: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
})

export default HorizontalProductList;