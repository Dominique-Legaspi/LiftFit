import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import SectionHeader from '@/components/ui/SectionHeader';
import TopBar from '@/components/ui/TopBar';
import HorizontalProductList from '@/components/ui/HorizontalProductList';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 10;

type News = {
  id: number;
  title: string;
  content: string;
  background_url: string;
}

type Category = {
  id: number;
  name: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [newsPost, setNewsPost] = useState<News[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);

  const [shoppingCategories, setShoppingCategories] = useState<Category[]>([]);

  async function fetchNews() {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNewsPost(data);
    } catch (err) {
      console.error('Error fetching news posts:', err);
    }
  }

  async function fetchShoppingCategories() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*');

      if (error) throw error;

      setShoppingCategories(data);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([fetchNews(), fetchShoppingCategories()]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchNews(), fetchShoppingCategories()]);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // allow flatlist to auto scroll
  const flatListRef = useRef<FlatList>(null);
  let scrollPosition = 0;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldAutoScroll || newsPost.length === 0) return;


    const interval = setInterval(() => {
      if (!flatListRef.current) return;

      scrollPosition += CARD_WIDTH + CARD_MARGIN;

      if (scrollPosition > (newsPost.length - 1) * (CARD_WIDTH + CARD_MARGIN)) {
        scrollPosition = 0;
      }

      flatListRef.current.scrollToOffset({
        offset: scrollPosition,
        animated: true,
      });
    }, 3000);

    // clean up
    return () => clearInterval(interval);
  }, [newsPost, shouldAutoScroll])

  // resume auto scroll
  let timeout: ReturnType<typeof setTimeout>;
  const handleTouchEnd = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setShouldAutoScroll(true)
    }, 10000); // resume after 10 seconds
  };

  // loading spinner
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.blue} />
      </View>
    )
  }


  // test

  // const hottestStyles = [
  //   {
  //     id: "1",
  //     name: "Titanium Compression Shirt",
  //     image_url: "https://lmreplnzixefnbzgwdxr.supabase.co/storage/v1/object/public/product-images//Titanium%20Compression%20Shirt.png",
  //   },
  //   {
  //     id: "2",
  //     name: "Titanium Compression Shorts",
  //     image_url: "https://lmreplnzixefnbzgwdxr.supabase.co/storage/v1/object/public/product-images//Titanium%20Compression%20Shorts.png",
  //   },
  //   {
  //     id: "3",
  //     name: "Titanium Compression Tank",
  //     image_url: "https://lmreplnzixefnbzgwdxr.supabase.co/storage/v1/object/public/product-images//Titanium%20Compression%20Tank.png",
  //   }
  // ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.blue}
          />
        }
      >

        <TopBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* news cards */}
        <SectionHeader title="What's New" linkText="View all" />

        <Animated.FlatList
          ref={flatListRef}
          horizontal
          data={newsPost}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate={'fast'}
          style={styles.newsCardRow}
          keyExtractor={(item) => item.id.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onTouchStart={() => setShouldAutoScroll(false)}
          onTouchEnd={handleTouchEnd}
          onMomentumScrollEnd={handleTouchEnd}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * (CARD_WIDTH + CARD_MARGIN),
              index * (CARD_WIDTH + CARD_MARGIN),
              (index + 1) * (CARD_WIDTH + CARD_MARGIN),
            ];

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.95, 1, 0.95],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View style={{ opacity, transform: [{ scale }], marginHorizontal: CARD_MARGIN / 2 }}>
                <Pressable
                  style={styles.newsCardBox}
                >
                  {item.background_url && (
                    <Image source={{ uri: item.background_url }} style={styles.newsCardImage} resizeMode='cover' />
                  )}
                  <View style={styles.newsCardTextContainer}>
                    <Text style={styles.newsCardTitle}>{item.title}</Text>
                    <Text style={styles.newsCardSubtitle}>{item.content}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            )
          }}
        />

        {/* trending */}
        <SectionHeader title="Hottest Styles" linkText="View all" />

        {/* <HorizontalProductList data={hottestStyles} /> */}

        {/* clothing categories */}
        <SectionHeader title="Find Your Aesthetic" linkText="Browse" link={() => router.push('/browse' as any)} />

        {shoppingCategories.map((cat, index) => {
          const isLast = index === shoppingCategories.length - 1;

          return (
            <View key={cat.id} style={[styles.categoryCard, isLast && { borderBottomWidth: 0 }]}>
              <Text style={styles.categoryText}>{cat.name}</Text>
              <Ionicons name="chevron-forward" size={28} color={Colors.light.blue} />
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // news card
  newsCardRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  newsCardBox: {
    marginHorizontal: 10,
    backgroundColor: Colors.light.darkblue,
    borderRadius: 3,
    width: CARD_WIDTH + CARD_MARGIN,
    height: 400,
    padding: 20,
    overflow: 'hidden',
  },
  newsCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  newsCardTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  newsCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  newsCardSubtitle: {
    color: '#eee',
    fontSize: 16,
    fontFamily: Fonts.regular,
  },

  // shopping categories
  categoryCard: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray,
    padding: 16,
    marginHorizontal: 5,
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: Colors.light.darkblue,
  }
});
