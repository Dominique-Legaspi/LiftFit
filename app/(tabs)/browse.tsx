import TopBar from '@/components/ui/TopBar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import SectionHeader from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import HorizontalProductList from '@/components/ui/HorizontalProductList';

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

export default function BrowseScreen() {
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.blue} />
      </View>
    )
  }

  return (

    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>
        <TopBar title="browse" icon="search-outline" value={searchQuery} onChangeText={setSearchQuery} />

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
                <SectionHeader title={category.name} linkText="View all" />
                <HorizontalProductList data={randomProductsInCategory} cardHeight={200} />

                {typesForThisCategory.map((type, index) => {
                  const isLast = index === typesForThisCategory.length - 1;

                  return (
                    <View key={type.id} style={[styles.categoryLabel, isLast && { borderBottomWidth: 0 }]}>
                      <Text style={styles.categoryText}>{type.name.charAt(0).toUpperCase() + type.name.slice(1)}</Text>
                      <Ionicons name="chevron-forward" size={28} color={Colors.light.blue} />
                    </View>
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
    marginBottom: 60
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

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
