import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, SafeAreaView, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SUPABASE_URL, supabase } from '@/app/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Fonts } from '@/constants/Fonts';
import TopBar from '@/components/ui/TopBar';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import StarRating from '@/components/ui/StarRating';
import { useWishlist } from '@/hooks/useWishlist';

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

type ProductReviews = {
    id: string;
    profile_id: string;
    product_id: string;
    rating: number;
    value: number;
    quality: number;
    comfort: number;
    sizing: number;
    aesthetic: number;
    comment: string;
    image_urls?: string[];
    created_at: string;
    profiles: { username: string; avatar_url: string; }
}

type ReviewCardProps = {
    review: ProductReviews;
    onImagePress: (uri: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
}

export default function ProductScreen() {
    // product
    const { productId } = useLocalSearchParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);

    // product color and size
    const [productColors, setProductColors] = useState<ProductColor[]>([]);
    const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
    const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
    const [selectedSize, setSelectedSize] = useState<ProductStock | null>(null);

    // handle wishlist
    const { isWishlisted, toggleWishlist } = useWishlist({
        productId,
        productColorId: selectedColor?.id ?? '',
        productStockId: selectedSize?.id ?? '',
    });

    // new item tag
    const [isNewItem, setIsNewItem] = useState<boolean>(false);

    // reviews
    const [reviews, setReviews] = useState<ProductReviews[]>([]);
    const [modalUri, setModalUri] = useState<string | null>(null);

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

        // set a default color and size on screen entry
        if (colorsData.length > 0) {
            // set the first color
            const defaultColor = colorsData[0];
            setSelectedColor(defaultColor);

            // set 'M' as default
            const defaultSize = stocksData.find(
                s => s.product_color_id === defaultColor.id && s.size === 'M'
            );

            if (defaultSize) {
                setSelectedSize(defaultSize);
            } else {
                // if no M in product_stock, set the stock to 0
                setSelectedSize({
                    id: `${defaultColor.id}-M`,
                    product_color_id: defaultColor.id,
                    size: 'M',
                    stock: 0,
                });
            }
        };

    };

    useEffect(() => {
        fetchProduct();
        fetchProductStock();
    }, [productId]);

    // define public bucket url 
    const REVIEW_IMAGES_BASE =
        `${SUPABASE_URL}/storage/v1/object/public/review-images/`;

    // helper to safely encode path segments
    function encodePath(path: string) {
        return path.split('/').map(encodeURIComponent).join('/')
    }

    // fetch reviews
    async function fetchReviews() {
        if (!productId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    profiles(username, avatar_url)
                    `)
                .eq('product_id', productId)
                .order('rating', { ascending: false })
                .limit(5);

            if (error) throw error;

            const reviews = (data ?? []) as ProductReviews[];

            if (!reviews) {
                setReviews([]);
                return;
            }

            // map image_urls
            // ensures zero storage-API metadata calls to reduce duplicated API calls
            const withUrls = reviews.map((r) => ({
                ...r,
                image_urls: r.image_urls?.map((x) => {
                    // if it's already a URL, just use it
                    if (x.startsWith('http')) return x
                    // otherwise assume it's a storage-key and build public URL
                    return `${REVIEW_IMAGES_BASE}${encodePath(x)}`
                }) ?? []
            }))

            setReviews(withUrls);

            // setReviews(data);

        } catch (err) {
            console.error("Error fetching reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId])

    // determine if new item
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    useEffect(() => {
        if (!product?.created_at) {
            setIsNewItem(false);
            return;
        }

        const productDate = new Date(product.created_at);
        const validDate = productDate instanceof Date && !isNaN(productDate.getTime());
        const isNew = validDate && (Date.now() - productDate.getTime() < SEVEN_DAYS_MS);

        setIsNewItem(isNew);
    }, [product])


    // determine discount
    const hasDiscount =
        product?.discount !== undefined &&
        product?.discount !== null &&
        product?.discount !== 0.0;

    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

    const basePrice = product?.price ?? 0;
    const discountPct = product?.discount ?? 0;
    const discountPrice = basePrice - basePrice * (discountPct);
    const savingsPrice = basePrice - discountPrice;

    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
    const sizeMap = new Map(productStocks
        .filter((stock) => stock.product_color_id === selectedColor?.id)
        .map((stock) => [stock.size, stock]));

    // sizes
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
    };

    // loading spinner
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.blue} />
            </View>
        )
    }

    const StockPanel = () => (
        <View style={styles.stockInfoContainer}>
            {selectedColor && selectedSize ? (
                <View style={styles.stockInfo}>
                    <Text style={styles.stockText}>
                        {selectedColor.color}, {selectedSize.size}
                    </Text>
                    <Text style={[
                        styles.stockText,
                        {
                            marginTop: 4,
                            color: selectedSize && selectedSize.stock > 3 ? Colors.light.darkgray : '#f21313'
                        }]}>
                        {selectedSize.stock > 3
                            ? 'In Stock'
                            : selectedSize.stock <= 0   // negative values to account for improper inventory tracking
                                ? 'Out of stock'
                                : `Only ${selectedSize.stock} left!`
                        }
                    </Text>
                </View>
            ) : (
                <View style={styles.stockInfo}>
                    <Text style={styles.stockText}>
                        Select a color and size
                    </Text>
                </View>

            )}

            <View style={styles.addToCartContainer}>
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
            </View>
        </View>
    )

    const ReviewCard: React.FC<ReviewCardProps> = ({ review, onImagePress, containerStyle }) => {
        const reviewDate = new Date(review.created_at).toLocaleDateString();

        // set image if only one image
        const firstUrl = review?.image_urls && review?.image_urls.length > 0
            ? review?.image_urls[0]
            : null;

        return (
            <View style={[styles.reviewCard, containerStyle]}>
                {/* user info, avatar, and date */}
                <View style={styles.reviewUserInfo}>
                    <View style={{ flexDirection: 'row' }}>
                        <Image source={{ uri: review.profiles.avatar_url }} style={styles.reviewAvatar} />

                        <View style={{ flexDirection: 'column' }}>
                            <Text style={styles.reviewUsername}>{review.profiles.username}</Text>
                            <StarRating
                                average={review.rating}
                                size={16}
                                fullColor={Colors.light.blue}
                                emptyColor={Colors.light.blue}
                            />
                        </View>
                    </View>
                    <Text style={styles.reviewDate}>{reviewDate}</Text>
                </View>
                {/* review images */}
                {review.image_urls && review.image_urls?.length > 1 && (
                    <FlatList
                        data={review.image_urls}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(uri) => uri}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => onImagePress(item)}
                            >
                                <Image
                                    source={{ uri: item }}
                                    style={styles.reviewImages}
                                    onError={({ nativeEvent }) =>
                                        console.warn('Image load error', item, nativeEvent.error)
                                    }
                                />
                            </Pressable>
                        )}
                        contentContainerStyle={styles.reviewImagesContainer}
                    />
                )}
                {/* review comment */}
                <View style={[
                    styles.reviewCommentContainer,
                    firstUrl ? { flexDirection: 'row', justifyContent: 'space-between' } : undefined]}
                >
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    {firstUrl && review.image_urls?.length === 1 && (
                        <Pressable
                            onPress={() => onImagePress(firstUrl)}
                            style={{ marginLeft: 4 }}
                        >
                            <Image
                                source={{ uri: firstUrl }}
                                style={styles.reviewImages}
                                onError={({ nativeEvent }) =>
                                    console.warn('Image load error', firstUrl, nativeEvent.error)
                                }
                            />
                        </Pressable>
                    )}
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* full size image view */}
            <Modal
                visible={!!modalUri}
                transparent
                onRequestClose={() => setModalUri(null)}
            >
                <Pressable
                    style={styles.modalBackground}
                    onPress={() => setModalUri(null)}
                >
                    <Image
                        source={{ uri: modalUri! }}
                        style={styles.fullImage}
                    />
                </Pressable>
            </Modal>

            <Animated.ScrollView
                style={styles.scrollViewContainer}
                contentContainerStyle={{ paddingBottom: 90 }} // padding to prevent floating panel from blocking content under
            >
                <TopBar title='' hasSearch={false} hasBackButton={true} style={{ marginVertical: 8 }} />
                {/* <Pressable
                    onPress={() => router.back()}
                    style={styles.backButtonContainer}
                >
                    <Ionicons name="chevron-back" style={styles.backButton} size={24} />
                </Pressable> */}

                {/* <View style={styles.imageContainer}>
                    {firstUrl ? (
                        <Image source={{ uri: firstUrl }} style={styles.image} />
                    ) : (
                        <Ionicons name="image-outline" size={60} color={Colors.light.gray} />
                    )}
                </View> */}

                {product?.image_urls?.length
                    ? <ImageCarousel images={product.image_urls} height={520} />
                    : (
                        <View style={[styles.imageContainer, { justifyContent: 'center' }]}>
                            <Ionicons name="image-outline" size={60} color={Colors.light.gray} />
                        </View>
                    )
                }

                <View style={styles.productInfoContainer}>
                    <View style={styles.productHeaderContainer}>
                        <View style={styles.productNameContainer}>
                            <Text style={styles.productName}>{product?.name}</Text>
                        </View>
                        <View style={styles.iconButtonContainer}>
                            {/* wishlist */}
                            <Pressable onPress={toggleWishlist}>
                                <Ionicons
                                    name={isWishlisted ? "heart" : "heart-outline"}
                                    size={32}
                                    color={Colors.light.blue}
                                    style={styles.iconButton}
                                />
                            </Pressable>
                            {/* share */}
                            <Ionicons name="share-outline" size={32} color={Colors.light.blue} style={styles.iconButton} />
                        </View>
                    </View>
                    <View style={styles.tagsRow}>
                        {isNewItem && (
                            <View style={styles.tagBox}>
                                <Ionicons name="sparkles-sharp" size={16} style={styles.tagIcon} />
                                <Text style={styles.tagText}>
                                    New
                                </Text>
                            </View>
                        )}
                        <View style={styles.tagBox}>
                            <Ionicons name="flame-sharp" size={16} style={styles.tagIcon} />
                            <Text style={styles.tagText}>
                                Popular
                            </Text>
                        </View>
                        {hasDiscount && (
                            <View style={styles.tagBox}>
                                <Ionicons name="pricetags-sharp" size={16} style={styles.tagIcon} />
                                <Text style={styles.tagText}>
                                    {discountPct * 100}% off
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.productPriceStockRow}>
                        <View style={styles.productPriceContainer}>
                            {hasDiscount
                                ? (
                                    <>
                                        <Text style={styles.productPriceText}>
                                            {formatCurrency(discountPrice)}
                                        </Text>
                                        <Text style={styles.productPriceWithDiscountText}>
                                            Was {formatCurrency(basePrice)}, Save {formatCurrency(savingsPrice)}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.productPriceText}>
                                        {formatCurrency(basePrice)}
                                    </Text>
                                )}
                        </View>
                        <View style={styles.reviewsContainer}>
                            <View style={styles.ratingsRow}>
                                <Ionicons name="star" size={24} />
                                <Text style={styles.ratingsText}>
                                    4.6
                                </Text>
                            </View>
                            <Text style={styles.reviewsText}>
                                5 reviews
                            </Text>
                        </View>
                    </View>
                    {/* stock info */}

                    <Text style={styles.sectionTitle}>Product Selection</Text>
                    <View style={styles.productStockContainer}>
                        {/* colors and stock info */}
                        <View style={styles.colorContainer}>
                            <View style={{ flexDirection: 'row' }}>
                                {productColors.map((colorItem) => {
                                    const isSelected = selectedColor?.id === colorItem.id;
                                    return (
                                        <Pressable
                                            key={colorItem.id}
                                            onPress={() => handleColorSelect(colorItem)}
                                            style={[styles.colorRow, {
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

                        {/* sizes */}
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

                    <Text style={styles.sectionTitle}>Product Details</Text>
                    <View style={styles.productDescContainer}>
                        <Text style={styles.productDesc}>{product?.description}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.length > 0 ?
                        reviews.map((review, index) => {
                            const isLast = index === reviews.length - 1;
                            return (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    onImagePress={setModalUri}
                                    containerStyle={isLast ? { borderBottomWidth: 0 } : undefined}
                                />
                            )
                        }) : (
                            <View style={styles.noReviewsContainer}>
                                <Text style={styles.noReviews}>Be the first to review this product.</Text>
                            </View>
                        )}
                </View>
            </Animated.ScrollView>

            {/* floating selected stock and add to cart button */}
            <Animated.View
                pointerEvents="box-none"
                style={styles.floatingStockInfoContainer}
            >
                <StockPanel />
            </Animated.View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContainer: {
        paddingVertical: 5,
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

    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        paddingVertical: 4,
        marginTop: 8,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray + '33',
    },

    // image
    imageContainer: {
        // flex: 1,
        width: '100%',
        height: 520,
        // overflow: 'hidden',
        backgroundColor: '#00000033',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },

    // product info container
    productInfoContainer: {
        marginHorizontal: 20,
    },
    productHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingBottom: 8,
    },
    productNameContainer: {
        flex: 1,
        marginRight: 8,
    },
    productName: {
        fontSize: 24,
        fontFamily: Fonts.semiBold,
    },

    // icon buttons
    iconButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    iconButton: {
        marginHorizontal: 4,
    },

    // tags
    tagsRow: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
    },
    tagBox: {
        minWidth: 60,
        borderRadius: 3,
        backgroundColor: Colors.light.lightgray,
        padding: 4,
        marginVertical: 4,
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagText: {
        fontSize: 16,
        fontFamily: Fonts.extraBold,
        color: '#fff',
    },
    tagIcon: {
        color: '#fff',
        marginRight: 4
    },

    // description
    productDescContainer: {
        paddingVertical: 8,
    },
    productDesc: {
        fontSize: 16,
        fontFamily: Fonts.light,
        color: Colors.light.gray,
    },

    // product price
    productPriceStockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productPriceContainer: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: Colors.light.gray + '33',
        paddingVertical: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productPriceText: {
        fontSize: 40,
        fontFamily: Fonts.bold,
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

    // reviews
    reviewsContainer: {
        width: '50%',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    ratingsText: {
        fontSize: 24,
        fontFamily: Fonts.semiBold,
        marginLeft: 4,
    },
    reviewsText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.lightgray,
    },

    // product stock
    productStockContainer: {
        flex: 1,
        alignItems: 'center',
    },

    // colors
    colorContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        paddingVertical: 8,
    },
    colorRow: {
        flexDirection: 'row',
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
        marginVertical: 8,
        padding: 16,
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
    },

    // stock info
    stockInfoContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        paddingBottom: 24,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    floatingStockInfoContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    stockInfo: {
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stockText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },

    // add to cart button
    addToCartContainer: {
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
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

    // reviews
    reviewCard: {
        margin: 4,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray + '33',
    },
    reviewUserInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    reviewUsername: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        paddingVertical: 4,
    },
    reviewAvatar: {
        marginRight: 8,
        alignItems: 'center',
        width: 40,
        height: 40,
        borderRadius: 50,
    },

    // review images
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    },
    reviewImagesContainer: {
        marginVertical: 8,
    },
    reviewImages: {
        width: 100,
        height: 150,
        marginRight: 4,
        resizeMode: 'contain',
    },

    // review comments
    reviewCommentContainer: {
        paddingVertical: 8,
    },
    reviewComment: {
        flex: 1,
        fontSize: 14,
    },
    reviewRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewRatingText: {
        marginLeft: 4,
        fontSize: 16,
    },
    reviewDate: {
        color: Colors.light.lightgray,
        fontSize: 14,
    },

    noReviewsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginVertical: 12,
    },
    noReviews: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    }
})

