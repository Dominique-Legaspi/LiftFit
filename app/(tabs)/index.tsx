import Ionicons from '@expo/vector-icons/Ionicons';
import { Dimensions, FlatList, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../lib/supabase';

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
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [newsPost, setNewsPost] = useState<News[]>([]);
  const [shoppingCategories, setShoppingCategories] = useState<Category[]>([]);

  async function fetchNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching news posts:', error);
      return;
    }

    setNewsPost(data);
  }

  async function fetchShoppingCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*');

    if (error) {
      console.error('Error fetching product categories:', error);
      return;
    }

    setShoppingCategories(data);
  }

  useEffect(() => {
    fetchNews();
    fetchShoppingCategories();
  }, []);

  // allow flatlist to auto scroll
  const flatListRef = useRef<FlatList>(null);
  let scrollPosition = 0;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [newsPost])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>

        {/* title */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>
            LIFTFIT
          </Text>

          {/* search bar - web */}
          {Platform.OS === 'web' && (
            <Pressable
              style={[styles.searchBarContainer, { borderColor: searchActive ? Colors.light.blue : Colors.light.gray }]}>
              <Ionicons name="search-outline" size={20} style={[{ color: searchActive ? Colors.light.blue : Colors.light.gray }]} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchActive(true)}
                onBlur={() => setSearchActive(false)}
                placeholder="Looking for something?"
                placeholderTextColor={searchActive ? Colors.light.blue : Colors.light.gray}
                style={[styles.searchBarInput, { fontStyle: !searchQuery ? 'italic' : 'normal' }]}
              />
            </Pressable>
          )}

          {/* top bar notifications + cart */}
          <View style={styles.topBarButtonsContainer}>
            <Pressable style={styles.topBarButtons}>
              <Ionicons name="notifications-outline" size={28} />
            </Pressable>
            <Pressable style={styles.topBarButtons}>
              <Ionicons name="cart-outline" size={28} />
            </Pressable>
          </View>
        </View>

        {/* search bar - mobile */}
        {Platform.OS !== 'web' && (
          <Pressable
            style={[styles.searchBarContainer, { borderColor: searchActive ? Colors.light.blue : Colors.light.gray }]}>
            <Ionicons name="search-outline" size={20} style={[{ color: searchActive ? Colors.light.blue : Colors.light.gray }]} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
              placeholder="Looking for something?"
              placeholderTextColor={searchActive ? Colors.light.blue : Colors.light.gray}
              style={[styles.searchBarInput, { fontStyle: !searchQuery ? 'italic' : 'normal' }]}
            />
          </Pressable>
        )}

        {/* news cards */}
        <Text style={styles.sectionTitle}>
          What's New
        </Text>
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

        {/* clothing categories */}
        <Text style={styles.sectionTitle}>
          Shop by Category
        </Text>

        <FlatList
          horizontal
          data={shoppingCategories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          )}
        />
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

  // top bar
  topBar: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    color: Colors.light.blue,
  },
  topBarButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButtons: {
    marginHorizontal: 5,
  },

  // search bar
  searchBarContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 3,
    ...(Platform.OS === 'web' ? { width: 500, padding: 5 } : { flex: 1, marginVertical: 10, padding: 10 }),
  },
  searchBarInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.light.blue,
    outlineWidth: 0,
  },

  // section title
  sectionTitle: {
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 20,
    fontSize: 24,
    fontFamily: Fonts.semiBold,
  },

  // news card
  newsCardRow: {
    marginVertical: 10,
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
    borderRadius: 10,
    backgroundColor: Colors.light.blue,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 4px rgba(220, 220, 220, 0.5)',
  },
  categoryText: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: Colors.light.darkblue,
  }
});
