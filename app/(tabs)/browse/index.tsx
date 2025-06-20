import TopBar from '@/components/ui/TopBar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/app/lib/supabase';
import SectionHeader from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import HorizontalProductList from '@/components/ui/HorizontalProductList';
import { useRouter } from 'expo-router';
import Loading from '@/components/ui/Loading';

type Product = {
  id: string;
  name: string;
  price: number;
  discount: number;
  category_id: number;
  image_url?: string;
}

type ShoppingCategory = {
  id: number;
  name: string;
}

type ShoppingType = {
  id: number;
  name: string;
  category_id: number
}

function getRandomSample<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) {
    return [...arr];
  }

  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

type BrowseCardProps = {
  label: string;
  image?: ImageSourcePropType;
  link?: () => void;
}

export const BrowseCard: React.FC<BrowseCardProps> = ({ label, image, link }) => {
  return (
    <Pressable
      onPress={link}
      style={styles.browseCardRow}>
      <View style={styles.browseCardLabelContainer}>
        <Text style={styles.browseCardLabel}>
          {label}
        </Text>
      </View>
      {image && <Image source={image} style={styles.browseCardImage} resizeMode='cover' />}
    </Pressable>
  )
}

export default function BrowseScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([]);
  const [shoppingTypes, setShoppingTypes] = useState<ShoppingType[]>([]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;

    setProducts(data as Product[]);
  }

  async function fetchShoppingCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*');

    if (error) throw error;

    setShoppingCategories(data as ShoppingCategory[]);
  }

  async function fetchShoppingTypes() {
    const { data, error } = await supabase
      .from('product_types')
      .select('*');

    if (error) throw error;

    setShoppingTypes(data as ShoppingType[]);
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchShoppingCategories(),
        fetchShoppingTypes()
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [])

  // loading spinner
      if (loading) {
          return <Loading />
      }

  const shopAllCategories = [
    {
      id: 1,
      name: 'Shop All',
      image: require('../../../assets/images/browse_all.png'),
      onPress: () => router.push('/browse/shop' as any),
    },
    {
      id: 2,
      name: 'Shop Men',
      image: require('../../../assets/images/browse_men.png'),
      onPress: () => router.push({
        pathname: '/browse/shop'  as any,
        params: { gender: 'Men' },
      }),
    },
    {
      id: 3,
      name: 'Shop Women',
      image: require('../../../assets/images/browse_women.png'),
      onPress: () => router.push({
        pathname: '/browse/shop'  as any,
        params: { gender: 'Women' },
      }),
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}  
      >
        <TopBar title="browse" icon="search-outline" value={searchQuery} onChangeText={setSearchQuery} />

        <View style={styles.browseCardContainer}>
          {shopAllCategories.map((cat) => (
            <BrowseCard
              key={cat.id}
              label={cat.name}
              image={cat.image}
              link={cat.onPress}
            />
          ))}
        </View>

        {shoppingCategories.map((category) => {
          const typesForThisCategory = shoppingTypes.filter(
            (type => type.category_id === category.id)
          );

          const allProductsInCategory = products
            .filter((p) => p.category_id === category.id);

          if (allProductsInCategory.length === 0) return null;

          const randomProductsInCategory = getRandomSample(
            allProductsInCategory,
            5
          );

          return (typesForThisCategory.length > 0 &&
            (
              <View key={category.id} style={styles.categorySection}>
                <SectionHeader
                  title={category.name}
                  linkText="View all"
                  link={() =>
                    router.push({
                      pathname: '/browse/shop' as any,
                      params: { category_id: category.id  },
                    })
                  }
                />
                <HorizontalProductList data={randomProductsInCategory} cardWidth={300} cardHeight={200} />

                {typesForThisCategory.map((type, index) => {
                  const isLast = index === typesForThisCategory.length - 1;

                  return (
                    <Pressable
                      key={type.id}
                      style={[styles.categoryLabel, isLast && { borderBottomWidth: 0 }]}
                      onPress={() =>
                        router.push({
                          pathname: '/browse/shop'  as any,
                          params: { type_id: type.id },
                        })
                      }
                    >
                      <Text style={styles.categoryText}>{type.name.charAt(0).toUpperCase() + type.name.slice(1)}</Text>
                      <Ionicons name="chevron-forward" size={28} color={Colors.light.blue} />
                    </Pressable>
                  )
                })}
              </View>
            ))
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

  // browse card
  browseCardContainer: {
    flex: 1,
    padding: 16,
  },
  browseCardRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 200,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.light.lightgray,
    marginBottom: 8,
    overflow: 'hidden',
  },
  browseCardLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    height: '30%',
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  browseCardLabel: {
    fontSize: 24,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  browseCardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  // category section
  categorySection: {
    marginBottom: 8,
  },
  categoryLabel: {
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
