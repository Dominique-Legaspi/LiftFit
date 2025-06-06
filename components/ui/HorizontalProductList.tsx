import React from "react";
import { Dimensions, FlatList, ImageStyle, StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import ProductCard, { Product } from "./ProductCard";

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
const DEFAULT_CARD_MARGIN = 0;

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
    const renderItem = ({ item }: { item: Product }) => (
        <ProductCard
            product={item}
            onPress={onPressItem}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            cardMargin={cardMargin}
            imageStyle={imageStyle}
            textStyle={textStyle}
        />
    );

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
})

export default HorizontalProductList;