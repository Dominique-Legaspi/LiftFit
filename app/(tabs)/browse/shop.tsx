import { supabase } from '@/app/lib/supabase';
import ProductCard from '@/components/ui/ProductCard';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

type Product = {
    id: string;
    created_at: string;
    name: string;
    price: number;
    discount?: number;
    category_id?: number;
    type_id?: number;
    image_urls: string[];
}

export default function ShopScreen() {
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [products, setProducts] = useState<Product[]>([]);
    const [isGrid, setIsGrid] = useState<boolean>(true);

    // pagination
    const PAGE_SIZE = 10;
    const [page, setPage] = useState<number>(0);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);

    const fetchProductsPage = useCallback(
        async (pageNumber: number) => {
            const from = pageNumber * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (!data || data.length == 0) {
                setHasMore(false);
                return;
            }

            if (pageNumber === 0) {
                setProducts(data as Product[]);
            } else {
                setProducts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const filteredNew = (data as Product[]).filter((p) => !existingIds.has(p.id));
                    return [...prev, ...filteredNew];
                });
            }

            if ((data as Product[]).length < PAGE_SIZE) {
                setHasMore(false);
            }

            setPage((prev) => prev + 1);
        },
        []
    );

    useEffect(() => {
        (async () => {
            await fetchProductsPage(0);
            setInitialLoading(false);
        })();
    }, [fetchProductsPage]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        await fetchProductsPage(page);
        setLoadingMore(false);
    }, [fetchProductsPage, hasMore, loadingMore, page]);

    const viewingStyle: { id: number; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
        { id: 1, icon: 'grid-outline' },
        { id: 2, icon: 'square-outline' },
    ]

    const HORIZONTAL_PADDING = 4;
    const GAP_BETWEEN_CARDS = 8;

    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    const cardWidthGrid = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2 + GAP_BETWEEN_CARDS)) / 2;
    const cardWidthList = SCREEN_WIDTH - 4 * 2;
    const cardWidth = isGrid ? cardWidthGrid : cardWidthList;

    const cardHeight = isGrid ? 300 : SCREEN_HEIGHT / 3.5;
    const cardMargin = !isGrid ? 4 : 0;

    const renderProductItem = ({ item }: { item: Product }) => (
        <ProductCard
            product={item}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            cardMargin={cardMargin}
            textStyle={{ fontSize: 14 }}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerWrapper}>
                <TopBar title="shop" icon="shirt-outline" hasBackButton={true} value={searchQuery} onChangeText={setSearchQuery} />
                <View style={styles.filterRow}>
                    <View style={styles.viewingStyleContainer}>
                        {viewingStyle.map((cat) => {
                            const active = (isGrid && cat.id === 1) || (!isGrid && cat.id === 2);

                            return (
                                <Pressable
                                    key={cat.id}
                                    style={[
                                        styles.viewingStyleBox,
                                        active && styles.activeIconBackground
                                    ]}
                                    onPress={() => {
                                        setIsGrid(cat.id === 1)
                                    }}
                                >
                                    <Ionicons
                                        name={cat.icon}
                                        size={20}
                                        color={active ? '#fff' : Colors.light.gray}
                                    />
                                </Pressable>
                            )
                        })}
                    </View>
                </View>
            </View>

            <View style={styles.listWrapper}>
                {initialLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.light.blue} />
                    </View>

                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        renderItem={renderProductItem}
                        horizontal={false}
                        numColumns={isGrid ? 2 : 1}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.productsContainer}
                        columnWrapperStyle={isGrid ? styles.columnWrapper : undefined}
                        style={{ flex: 1 }}
                        key={isGrid ? 'GRID' : 'LIST'}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                            loadingMore ? (
                                <View style={styles.footerSpinner}>
                                    <ActivityIndicator size="small" color={Colors.light.blue} />
                                </View>
                            ) : null
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // Spinner overlay for initial load
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Spinner at bottom for subsequent “load more”
    footerSpinner: {
        paddingVertical: 16,
    },

    headerWrapper: {
        paddingVertical: 10,
        backgroundColor: '#fff',
        height: 153,
    },

    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
    },

    // viewing style
    viewingStyleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewingStyleBox: {
        borderWidth: 1,
        borderColor: Colors.light.gray,
        borderRadius: 3,
        padding: 8,
        marginHorizontal: 2,
    },
    activeIconBackground: {
        borderColor: Colors.light.blue,
        backgroundColor: Colors.light.blue,
    },

    productsContainer: {
        paddingBottom: 60,
    },

    listWrapper: {
        flex: 1,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardWrapper: {
        marginBottom: 4,
    }
});
