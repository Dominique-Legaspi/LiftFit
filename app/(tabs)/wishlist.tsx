import SectionHeader from '@/components/ui/SectionHeader';
import TopBar from '@/components/ui/TopBar';
import { Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/UserProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Loading from '@/components/ui/Loading';
import { useRouter } from 'expo-router';
import WishlistCard from '@/components/ui/WishlistCard';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '@/components/ui/CustomButton';

type ProductWishlist = {
  id: string;
  profile_id: string;
  product_id: string;
  product_color_id?: string | null;
  product_stock_id?: string | null;

  products: {
    id: string;
    name: string;
    price: number;
    discount?: number;
  };

  product_colors: {
    color: string;
    hex: string;
    image_urls?: string[];
  };

  product_stocks: {
    size: string;
    stock: number;
  }
}

export default function WishlistScreen() {
  const { user } = useUser();
  const profileId = user?.id;

  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [wishlist, setWishlist] = useState<ProductWishlist[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  async function fetchWishlist() {
    if (!profileId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
            *,
            products(*),
            product_colors(*),
            product_stocks(*)
          `)
        .eq('profile_id', profileId)
        .order('product_stocks(stock)', { ascending: false });

      if (error) throw error;

      setWishlist(data);

    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [profileId]);

  const onDeletePress = async (wishId: string) => {
    if (!profileId) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishId);

      // reload with new list
      await fetchWishlist();

    } catch (err) {
      console.error("Error deleting wishlist:", err);
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = (wishId: string) => {
    Alert.alert(
      "Remove from Wishlist",
      "Are you sure you want to remove this item?",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDeletePress(wishId) },
      ]
    );
  };

  if (loading) {
    return <Loading />
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TopBar title="My Wishlist" icon="heart-outline" hasBackButton={false} hasSearch={false} />
        {wishlist.length > 0 ? (
          wishlist.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              onDelete={() => confirmDelete(item.id)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart" size={48} color={Colors.light.blue} />
            <Text style={styles.emptyText}>
              Your wishlist is empty.
            </Text>
            <CustomButton
              text="Go Shopping"
              onPress={() => router.push('/(tabs)/browse')}
            />
          </View>
        )}
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

  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },

  // empty cart
  emptyContainer: {
    marginTop: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 8,
    fontSize: 20,
    fontFamily: Fonts.medium,
  },
  goShoppingButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderRadius: 3,
    backgroundColor: Colors.light.blue,
  },
  goShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },

  cardContainer: {
    marginVertical: 10,
  },

});
