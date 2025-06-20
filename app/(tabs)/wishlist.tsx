import SectionHeader from '@/components/ui/SectionHeader';
import TopBar from '@/components/ui/TopBar';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/UserProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Loading from '@/components/ui/Loading';
import { useRouter } from 'expo-router';
import WishlistCard from '@/components/ui/WishlistCard';

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
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
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
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 12,
    fontSize: 16,
  },

  cardContainer: {
    marginVertical: 10,
  },

});
