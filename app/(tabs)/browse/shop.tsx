import { supabase } from '@/app/lib/supabase';
import ProductCard from '@/components/ui/ProductCard';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Product = {
    id: string;
    created_at: string;
    name: string;
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
}

// for category, type, style fetch
type ProdCategory = { id: number; name: string };
type ProdType = { id: number; name: string; category_id: number };
type ProdStyle = { id: string; name: string };

export default function ShopScreen() {
    // read local search params
    const { category_id, type_id, gender } = useLocalSearchParams() as {
        category_id?: string;
        type_id?: string;
        gender?: string;
    };

    // search query
    const [searchQuery, setSearchQuery] = useState<string>('');

    // product list
    const [products, setProducts] = useState<Product[]>([]);
    const [isGrid, setIsGrid] = useState<boolean>(true);

    // pagination
    const PAGE_SIZE = 6;
    const [page, setPage] = useState<number>(0);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);

    // applied filters
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
    const [newOnly, setNewOnly] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<string>('created_at_asc');

    // temp filter state used inside modal
    const [tempSelectedStyles, setTempSelectedStyles] = useState<string[]>([]);
    const [tempSelectedTypes, setTempSelectedTypes] = useState<number[]>([]);
    const [tempSelectedCategories, setTempSelectedCategories] = useState<number[]>([]);
    const [tempSelectedGender, setTempSelectedGender] = useState<string | null>(null);
    const [tempOnSaleOnly, setTempOnSaleOnly] = useState<boolean>(false);
    const [tempNewOnly, setTempNewOnly] = useState<boolean>(false);
    const [tempSortBy, setTempSortBy] = useState<string>('created_at_asc');

    // control which modal is open: main vs sub-screen
    const [activeSubFilter, setActiveSubFilter] = useState<
        'none' | 'category' | 'style' | 'type' | 'sort'
    >('none');

    // control main filter modal visibility
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

    // fetch lists for categories, types, styles
    const [allCategories, setAllCategories] = useState<ProdCategory[]>([]);
    const [allTypes, setAllTypes] = useState<ProdType[]>([]);
    const [allStyles, setAllStyles] = useState<ProdStyle[]>([]);

    useEffect(() => {
        (async () => {
            // fetch categories
            const { data: catData, error: catErr } = await supabase
                .from('product_categories')
                .select('id, name');
            if (!catErr && catData) setAllCategories(catData);

            // fetch types
            const { data: typeData, error: typeErr } = await supabase
                .from('product_types')
                .select('id, name, category_id');
            if (!typeErr && typeData) setAllTypes(typeData);

            // fetch styles
            const { data: styleData, error: styleErr } = await supabase
                .from('product_styles')
                .select('id, name');
            if (!styleErr && styleData) setAllStyles(styleData);
        })();
    }, []);

    const categoryLookUp: { [key: number]: string } = {}
    allCategories.forEach((cat) => {
        categoryLookUp[cat.id] = cat.name
    });
    // group types by category id
    const typesByCategory: { [key: number]: ProdType[] } = {};
    allTypes.forEach((tp) => {
        if (!typesByCategory[tp.category_id]) {
            typesByCategory[tp.category_id] = [];
        }
        typesByCategory[tp.category_id].push(tp);
    });

    function renderSummary(
        selectedIds: number[] | string[],
        lookupArray: { id: number | string; name: string }[]
    ) {
        if (selectedIds.length === 0) return '';

        // get first two names
        const selectedNames = selectedIds
            .map((sid) => {
                const match = lookupArray.find((u) => String(u.id) === String(sid));
                return match ? match.name : '';
            })
            .filter((n) => n.length > 0);

        if (selectedNames.length === 0) return '';
        if (selectedNames.length === 1) return selectedNames[0];
        if (selectedNames.length === 2) return `${selectedNames[0]}, ${selectedNames[1]}`;

        // if > 2
        return `${selectedNames[0]}, ${selectedNames[1]} +${selectedNames.length - 2}`;
    }

    // fetches
    const fetchProductsPage = useCallback(
        async (pageNumber: number) => {
            const from = pageNumber * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // build base query
            let query = supabase
                .from('products')
                .select(`
                    *,
                    product_styles (name),
                    product_types (name),
                    product_categories (name)   
                `);

            // search filter
            if (searchQuery.trim() !== '') {
                query = query.ilike('name', `%${searchQuery.trim()}%`);
            }

            // type filter
            if (selectedTypes.length > 0) {
                query = query.in('type_id', selectedTypes);
            }

            // category filter
            if (selectedCategories.length > 0) {
                query = query.in('category_id', selectedCategories);
            }

            // style filter
            if (selectedStyles.length > 0) {
                query = query.in('style_id', selectedStyles);
            }

            // gender filter
            if (selectedGender) {
                query = query.eq('gender', selectedGender);
            }

            // if discount
            if (onSaleOnly) {
                query = query.gt('discount', 0);
            }

            // if less than 30 days
            if (newOnly) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                query = query.gte('created_at', thirtyDaysAgo.toISOString());
            }

            // apply sorting
            switch (sortBy) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'created_at_asc':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'created_at_desc':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'name_asc':
                    query = query.order('name', { ascending: true });
                    break;
                case 'name_desc':
                    query = query.order('name', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: true });
            }

            // apply pagination
            query = query.range(from, to);

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length == 0) {
                setHasMore(false);
                return;
            }

            if (pageNumber === 0) {
                setProducts(data as Product[]);
            } else {
                // ensure no duplicates
                setProducts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const filteredNew = (data as Product[]).filter((p) => !existingIds.has(p.id));
                    return [...prev, ...filteredNew];
                });
            }

            if ((data as Product[]).length < PAGE_SIZE) {
                setHasMore(false);
            }

            setPage(pageNumber + 1);
        },
        [searchQuery, selectedCategories, selectedStyles, selectedTypes, selectedGender, onSaleOnly, newOnly, sortBy]
    );

    // if any params are present, reset products and fetch immediately
    useFocusEffect(
        useCallback(() => {
            // Parse route params to numeric arrays / string
            const cats: number[] = [];
            const types: number[] = [];
            let gen: string | null = null;

            if (category_id) {
                const cid = parseInt(category_id, 10);
                if (!isNaN(cid)) cats.push(cid);
            }
            if (type_id) {
                const tid = parseInt(type_id, 10);
                if (!isNaN(tid)) types.push(tid);
            }
            if (gender) {
                gen = gender;
            }

            // Reset pagination, products, hasMore, loading state
            setPage(0);
            setHasMore(true);
            setProducts([]);
            setInitialLoading(true);

            // Update our “applied filters” so that loadMore() will know what to request next
            setSelectedCategories(cats);
            setSelectedTypes(types);
            setSelectedGender(gen);

            // Do a “page 0” Supabase query inline
            (async () => {
                try {
                    const from = 0;
                    const to = PAGE_SIZE - 1;

                    let query = supabase
                        .from('products')
                        .select(`
              *,
              product_styles(name),
              product_types(name),
              product_categories(name)
            `);

                    // Apply the same filters
                    if (cats.length > 0) {
                        query = query.in('category_id', cats);
                    }
                    if (types.length > 0) {
                        query = query.in('type_id', types);
                    }
                    if (gen) {
                        query = query.eq('gender', gen);
                    }

                    // Sort by oldest first
                    query = query.order('created_at', { ascending: true });

                    // Pagination range
                    query = query.range(from, to);

                    const { data, error } = await query;
                    if (error) {
                        console.error('Error on initial fetch (focus):', error);
                        setHasMore(false);
                        setProducts([]);
                        return;
                    }

                    if (!data || data.length === 0) {
                        setHasMore(false);
                        setProducts([]);
                    } else {
                        setProducts(data as Product[]);
                        if ((data as Product[]).length < PAGE_SIZE) {
                            setHasMore(false);
                        }
                        setPage(1);
                    }
                } catch (err) {
                    console.error('Unexpected fetch error:', err);
                    setProducts([]);
                    setHasMore(false);
                } finally {
                    setInitialLoading(false);
                }
            })();

            // Cleanup
            return () => { };
        }, [category_id, type_id, gender]) //
    );

    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setProducts([]);
        setInitialLoading(true);

        fetchProductsPage(0).then(() => {
            setInitialLoading(false);
        });
    }, [selectedCategories, selectedTypes, selectedStyles, selectedGender, searchQuery, onSaleOnly, newOnly, sortBy]);


    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        await fetchProductsPage(page);
        setLoadingMore(false);
    }, [fetchProductsPage, hasMore, loadingMore, page]);

    const viewingStyle: {
        id: number;
        icon: React.ComponentProps<typeof Ionicons>['name'];
        activeIcon: React.ComponentProps<typeof Ionicons>['name']
    }[] = [
            { id: 1, icon: 'grid-outline', activeIcon: 'grid' },
            { id: 2, icon: 'square-outline', activeIcon: 'square' },
        ]

    const HORIZONTAL_PADDING = 4;
    const GAP_BETWEEN_CARDS = 8;

    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    const cardWidthGrid = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2 + GAP_BETWEEN_CARDS)) / 2;
    const cardWidthList = SCREEN_WIDTH - 4 * 2;
    const cardWidth = isGrid ? cardWidthGrid : cardWidthList;

    const cardHeight = isGrid ? 300 : SCREEN_HEIGHT / 2.5;
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

    // filter tapped, copy applied-temp then open modal
    const openFilterModal = () => {
        setTempSelectedStyles(selectedStyles);
        setTempSelectedTypes(selectedTypes);
        setTempSelectedCategories(selectedCategories);
        setTempSelectedGender(selectedGender);
        setTempOnSaleOnly(onSaleOnly);
        setTempNewOnly(newOnly);
        setTempSortBy(sortBy);
        setShowFilterModal(true);
    };

    // when apply is tapped inside modal, copy temp-applied and close modal
    const applyFilters = () => {
        setSelectedStyles(tempSelectedStyles);
        setSelectedTypes(tempSelectedTypes);
        setSelectedCategories(tempSelectedCategories);
        setSelectedGender(tempSelectedGender);
        setOnSaleOnly(tempOnSaleOnly);
        setNewOnly(tempNewOnly);
        setSortBy(tempSortBy);
        setShowFilterModal(false);
    };

    // display filter count
    const appliedFilterCount = [
        selectedCategories.length,
        selectedStyles.length,
        selectedTypes.length,
        selectedGender ? 1 : 0,
        onSaleOnly ? 1 : 0,
        newOnly ? 1 : 0,
    ].filter((n) => n > 0).reduce((a, b) => a + b, 0);

    // clear filters
    const clearTempFilters = () => {
        setTempSelectedStyles([]);
        setTempSelectedTypes([]);
        setTempSelectedCategories([]);
        setTempSelectedGender(null);
        setTempOnSaleOnly(false);
        setTempNewOnly(false);
        setTempSortBy('created_at_asc');
    };

    // sub-filter toggle helpers
    const toggleTempCategory = (catId: number) =>
        setTempSelectedCategories((prev) => prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId]);
    const toggleTempType = (typeId: number) =>
        setTempSelectedTypes((prev) => prev.includes(typeId) ? prev.filter((x) => x !== typeId) : [...prev, typeId]);
    const toggleTempStyle = (styleId: string) =>
        setTempSelectedStyles((prev) => prev.includes(styleId) ? prev.filter((x) => x !== styleId) : [...prev, styleId]);
    const selectTempSort = (sortValue: string) =>
        setTempSortBy(sortValue);
    const toggleTempGender = (gender: string) =>
        setTempSelectedGender(gender);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerWrapper}>
                <TopBar title="shop" icon="shirt-outline" hasBackButton={true} value={searchQuery} onChangeText={setSearchQuery} />
                <View style={styles.filterRow}>
                    <View style={styles.filterContainer}>
                        {viewingStyle.map((cat) => {
                            const active = (isGrid && cat.id === 1) || (!isGrid && cat.id === 2);

                            return (
                                <Pressable
                                    key={cat.id}
                                    style={[
                                        styles.filterBox,
                                        active && styles.activeIconBackground
                                    ]}
                                    onPress={() => {
                                        setIsGrid(cat.id === 1)
                                    }}
                                >
                                    <Ionicons
                                        name={active ? cat.activeIcon : cat.icon}
                                        size={20}
                                        color={active ? '#fff' : Colors.light.gray}
                                    />
                                </Pressable>
                            )
                        })}
                    </View>

                    {/* filter buttons */}
                    <View style={styles.filterContainer}>
                        {/* clear filter button */}
                        {/* <Pressable
                            style={styles.filterBox}
                        >
                            <Ionicons name="close" size={20} color={Colors.light.gray} />
                        </Pressable> */}
                        {/* filter button */}
                        <Pressable
                            style={[
                                styles.filterBox,
                                styles.filterContainer,
                                appliedFilterCount > 0 && styles.activeIconBackground
                            ]}
                            onPress={openFilterModal}
                        >
                            <Ionicons name="filter-outline" size={20} color={appliedFilterCount > 0 ? '#fff' : Colors.light.gray} />
                            <Text style={[styles.filterButtonText, appliedFilterCount > 0 && styles.filterButtonTextActive]}>Filter{appliedFilterCount > 0 && ` (${appliedFilterCount})`}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={styles.listWrapper}>
                {initialLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.light.blue} />
                    </View>

                ) : (products.length > 0 ? (<FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
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
                />) : (
                    <View style={styles.noProductsContainer}>
                        <Text style={styles.noProductsText}>No products available.</Text>
                    </View>
                )
                )}
            </View>

            {/* filter modal */}
            <Modal
                visible={showFilterModal}
                animationType='slide'
                transparent
                onRequestClose={() => setShowFilterModal(false)}
            >
                {/* semi-transparent backdrop */}
                <View style={styles.modalBackdrop}>
                    {/* bottom sheet container */}
                    <View style={styles.modalContainer}>
                        {/* header and close button */}
                        <View style={styles.modalHeader}>
                            {activeSubFilter === 'none' ? (
                                <>
                                    <Text style={styles.modalTitle}>Filter</Text>
                                    <Pressable onPress={() => setShowFilterModal(false)}>
                                        <Ionicons name="close" size={24} color={Colors.light.gray} />
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <Pressable onPress={() => setActiveSubFilter('none')}>
                                        <Ionicons name="chevron-back" size={24} color={Colors.light.gray} />
                                    </Pressable>

                                    <Text style={styles.modalTitle}>
                                        {activeSubFilter.charAt(0).toUpperCase() + activeSubFilter.slice(1)}
                                    </Text>
                                    {/* placeholder to balance layout */}
                                    <View style={{ width: 24 }} />
                                </>
                            )}
                        </View>
                        {/* modal body */}
                        {activeSubFilter === 'none' ? (
                            <ScrollView style={styles.modalBody}>
                                {/* CATEGORY */}
                                <Pressable
                                    style={styles.rowContainer}
                                    onPress={() => setActiveSubFilter('category')}
                                >
                                    <Text style={styles.rowLabel}>Category</Text>
                                    <View style={styles.rowRight}>
                                        <Text style={styles.rowSummaryText}>
                                            {renderSummary(tempSelectedCategories, allCategories)}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.light.gray} />
                                    </View>
                                </Pressable>
                                {/* STYLE */}
                                <Pressable
                                    style={styles.rowContainer}
                                    onPress={() => setActiveSubFilter('style')}
                                >
                                    <Text style={styles.rowLabel}>Style</Text>
                                    <View style={styles.rowRight}>
                                        <Text style={styles.rowSummaryText}>
                                            {renderSummary(tempSelectedStyles, allStyles)}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.light.gray} />
                                    </View>
                                </Pressable>
                                {/* TYPE */}
                                <Pressable
                                    style={styles.rowContainer}
                                    onPress={() => setActiveSubFilter('type')}
                                >
                                    <Text style={styles.rowLabel}>Type</Text>
                                    <View style={styles.rowRight}>
                                        <Text style={styles.rowSummaryText}>
                                            {renderSummary(tempSelectedTypes, allTypes)}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.light.gray} />
                                    </View>
                                </Pressable>
                                {/* SORT BY */}
                                <Pressable
                                    style={styles.rowContainer}
                                    onPress={() => setActiveSubFilter('sort')}
                                >
                                    <Text style={styles.rowLabel}>Sort By</Text>
                                    <View style={styles.rowRight}>
                                        <Text style={styles.rowSummaryText}>
                                            {(() => {
                                                switch (tempSortBy) {
                                                    case 'price_asc':
                                                        return 'Price: Low to High'
                                                    case 'price_desc':
                                                        return 'Price: High to Low'
                                                    case 'created_at_asc':
                                                        return 'Oldest'
                                                    case 'created_at_desc':
                                                        return 'Newest'
                                                    case 'name_asc':
                                                        return 'Name: A to Z'
                                                    case 'name_desc':
                                                        return 'Name: Z to A'
                                                    default:
                                                        return 'Newest'
                                                }
                                            })()}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.light.gray} />
                                    </View>
                                </Pressable>
                                {/* GENDER */}
                                <View style={styles.rowContainer}>
                                    <Text style={styles.rowLabel}>Gender</Text>

                                    <View style={styles.modalOptionContainer}>
                                        {['Men', 'Women', 'Unisex'].map((gend) => {
                                            const isActive = tempSelectedGender?.includes(gend);

                                            return (
                                                <Pressable
                                                    key={gend}
                                                    style={[styles.modalOptionBox, isActive && styles.modalOptionBoxActive]}
                                                    onPress={() => toggleTempGender(gend)}>
                                                    <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                                                        {gend}
                                                    </Text>
                                                </Pressable>
                                            )
                                        })}
                                    </View>
                                </View>

                                {/* ON SALE / NEW ONLY TOGGLES */}
                                <View style={[styles.rowContainer, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.rowLabel}>Other</Text>
                                    <View style={styles.toggleRow}>
                                        <View style={styles.toggleContainer}>
                                            <Text style={styles.toggleText}>On Sale</Text>
                                            <Pressable onPress={() => setTempOnSaleOnly((p) => !p)}>
                                                <Ionicons
                                                    name={tempOnSaleOnly ? 'checkbox' : 'square-outline'}
                                                    size={24}
                                                    color={tempOnSaleOnly ? Colors.light.blue : Colors.light.gray}
                                                />
                                            </Pressable>
                                        </View>
                                        <View style={styles.toggleContainer}>
                                            <Text style={styles.toggleText}>New Items</Text>
                                            <Pressable onPress={() => setTempNewOnly((p) => !p)}>
                                                <Ionicons
                                                    name={tempNewOnly ? 'checkbox' : 'square-outline'}
                                                    size={24}
                                                    color={tempNewOnly ? Colors.light.blue : Colors.light.gray}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        ) : activeSubFilter === 'category' ? (
                            // CATEGORY SUB SCREEN
                            <ScrollView style={styles.modalBody}>
                                {allCategories.map((cat) => {
                                    const isActive = tempSelectedCategories.includes(cat.id);
                                    return (
                                        <Pressable
                                            key={cat.id}
                                            style={styles.subRowContainer}
                                            onPress={() => toggleTempCategory(cat.id)}
                                        >
                                            <Text style={styles.subRowLabel}>{cat.name}</Text>
                                            <Ionicons
                                                name={isActive ? 'checkbox' : 'square-outline'}
                                                size={22}
                                                color={isActive ? Colors.light.blue : Colors.light.gray}
                                            />
                                        </Pressable>
                                    )
                                })}
                            </ScrollView>
                        ) : activeSubFilter === 'style' ? (
                            // STYLE SUB SCREEN
                            <ScrollView style={styles.modalBody}>
                                {allStyles.map((sty) => {
                                    const isActive = tempSelectedStyles.includes(sty.id);
                                    return (
                                        <Pressable
                                            key={sty.id}
                                            style={styles.subRowContainer}
                                            onPress={() => toggleTempStyle(sty.id)}
                                        >
                                            <Text style={styles.subRowLabel}>{sty.name}</Text>
                                            <Ionicons
                                                name={isActive ? 'checkbox' : 'square-outline'}
                                                size={22}
                                                color={isActive ? Colors.light.blue : Colors.light.gray}
                                            />
                                        </Pressable>
                                    )
                                })}

                            </ScrollView>
                        ) : activeSubFilter === 'type' ? (
                            // TYPE SUB SCREEN
                            <ScrollView style={styles.modalBody}>
                                {allCategories.map((cat) => {
                                    const typesForThisCat = typesByCategory[cat.id] || [];
                                    if (typesForThisCat.length === 0) return null;

                                    return (
                                        <View key={cat.id} style={{ marginVertical: 16 }}>
                                            {/* type category label */}
                                            <Text style={styles.modalTitle}>{cat.name}</Text>

                                            {/* list each type in category */}
                                            {typesForThisCat.map((typeObj) => {
                                                const isActive = tempSelectedTypes.includes(typeObj.id);

                                                return (
                                                    <Pressable
                                                        key={typeObj.id}
                                                        style={[styles.subRowContainer, { marginLeft: 24 }]}
                                                        onPress={() => toggleTempType(typeObj.id)}
                                                    >
                                                        <Text style={styles.subRowLabel}>{typeObj.name}</Text>
                                                        <Ionicons
                                                            name={isActive ? 'checkbox' : 'square-outline'}
                                                            size={22}
                                                            color={isActive ? Colors.light.blue : Colors.light.gray}
                                                        />
                                                    </Pressable>
                                                )
                                            })}
                                        </View>
                                    )
                                })}
                            </ScrollView>
                        ) : (
                            // SORT BY SUB SCREEN
                            <ScrollView style={styles.modalBody}>
                                {[
                                    { label: 'Newest', value: 'created_at_desc' },
                                    { label: 'Oldest', value: 'created_at_asc' },
                                    { label: 'Price: Low to High', value: 'price_asc' },
                                    { label: 'Price: High to Low', value: 'price_desc' },
                                    { label: 'Name: A to Z', value: 'name_asc' },
                                    { label: 'Name: Z to A', value: 'name_desc' },
                                ].map((opt) => {
                                    const isActive = tempSortBy === opt.value;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            style={styles.subRowContainer}
                                            onPress={() => selectTempSort(opt.value)}
                                        >
                                            <Text style={styles.subRowLabel}>{opt.label}</Text>
                                            <Ionicons
                                                name={isActive ? 'radio-button-on' : 'radio-button-off'}
                                                size={22}
                                                color={isActive ? Colors.light.blue : Colors.light.gray}
                                            />
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* modal footer */}
                        {activeSubFilter === 'none' && (
                            <View style={styles.modalFooter}>
                                <Pressable
                                    style={styles.clearButton}
                                    onPress={clearTempFilters}
                                >
                                    <Text style={styles.clearButtonText}>
                                        Clear Filters ({[
                                            tempSelectedCategories.length,
                                            tempSelectedStyles.length,
                                            tempSelectedTypes.length,
                                            tempSelectedGender ? 1 : 0,
                                            tempOnSaleOnly ? 1 : 0,
                                            tempNewOnly ? 1 : 0,
                                        ]
                                            .filter((n) => n > 0)
                                            .reduce((a, b) => a + b, 0)})
                                    </Text>
                                </Pressable>
                                <Pressable style={styles.applyButton} onPress={applyFilters}>
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
    noProductsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noProductsText: {
        fontSize: 36,
        fontFamily: Fonts.bold,
        color: Colors.light.lightgray,
    },

    // header
    headerWrapper: {
        paddingVertical: 10,
        backgroundColor: '#fff',
        height: 153,
    },

    // viewing style and filter row
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
    },

    // viewing style
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBox: {
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
    filterButtonText: {
        marginLeft: 4,
        color: Colors.light.gray,
        fontSize: 16,
        fontFamily: Fonts.regular,
        letterSpacing: 1,
    },
    filterButtonTextActive: {
        color: '#fff',
        fontFamily: Fonts.semiBold,
    },

    // product list
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
    },

    // modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '70%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },

    // modal header
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray + '33',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.medium,
        color: Colors.light.blue,
        letterSpacing: 1,
    },

    // modal body
    modalBody: {
        paddingHorizontal: 24,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray + '33',
    },
    rowLabel: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        letterSpacing: 1,
        color: Colors.light.blue,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowSummaryText: {
        marginRight: 8,
        fontSize: 14,
        color: Colors.light.gray,
    },

    // modal section
    modalSectionTitleContainer: {
        marginTop: 14,
        marginBottom: 6,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.light.blue,
        letterSpacing: 1,
    },
    modalOptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    modalOptionBox: {
        borderWidth: 1,
        borderColor: Colors.light.gray,
        borderRadius: 3,
        marginHorizontal: 8,
        padding: 12,
    },
    modalOptionBoxActive: {
        backgroundColor: Colors.light.blue,
        borderColor: Colors.light.blue,
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.gray,
    },
    modalOptionTextActive: {
        color: '#fff',
        fontFamily: Fonts.semiBold,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 4,
    },
    toggleText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        marginRight: 8,
    },

    // sub-screen rows
    subRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBlockColor: Colors.light.gray + '33',
    },
    subRowLabel: {
        fontSize: 16,
        color: Colors.light.darkblue,
    },

    // modal footer
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: Colors.light.gray + '33',
    },
    clearButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginRight: 8,
    },
    clearButtonText: {
        color: Colors.light.blue,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    applyButton: {
        flex: 1,
        backgroundColor: Colors.light.blue,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginLeft: 8,
        borderRadius: 3,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    }
});
