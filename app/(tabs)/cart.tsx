import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/UserProvider';
import { useEffect, useState } from 'react';
import CustomButton from '@/components/ui/CustomButton';
import { supabase } from '../lib/supabase';
import Loading from '@/components/ui/Loading';
import WishlistCard from '@/components/ui/WishlistCard';

type ProductCart = {
  id: string;
  profile_id: string;
  product_id: string;
  product_stock_id: string;
  quantity: number;

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
    id: string;
    size: string;
    stock: number;
  };
}

export default function CartScreen() {
  const { user } = useUser();
  const profileId = user?.id;

  const router = useRouter();

  const [cartItems, setCartItems] = useState<ProductCart[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // fetch
  const fetchCart = async () => {
    if (!profileId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products(*),
          product_colors(*),
          product_stocks(*)
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      setCartItems(data);
    } catch (err) {
      console.error("Error fetching cart items:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDeletePress = async (cartId: string) => {
    if (!profileId) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartId);

      // reload with new list
      await fetchCart();

    } catch (err) {
      console.error("Error deleting cart item:", err);
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = (cartId: string) => {
    Alert.alert(
      "Remove from Cart",
      "Are you sure you want to remove this item?",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDeletePress(cartId) },
      ]
    );
  };

  useEffect(() => {
    fetchCart()
  }, [profileId])

  // refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  // loading
  if (loading) {
    return <Loading />
  }

  // empty cart
  const isEmpty = cartItems.length === 0;

  // calculate price
  const originalPrice = cartItems.reduce((sum, item) => {
    return sum + item.products.price * item.quantity;
  }, 0);

  const discountPrice = cartItems.reduce((sum, item) => {
    const discount = item.products.discount ?? 0;
    return sum + item.products.price * discount * item.quantity;
  }, 0);

  const totalPrice = originalPrice - discountPrice;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* top bar */}
        <TopBar title="Shopping Cart" icon="cart-outline" hasTopBarIcons={false} />

        {isEmpty ? (
          // empty cart
          <View style={styles.emptyContainer}>
            <Ionicons name="cart" size={48} color={Colors.light.blue} />
            <Text style={styles.emptyText}>
              Your cart is empty.
            </Text>
            <CustomButton
              text="Go Shopping"
              onPress={() => router.push('/(tabs)/browse')}
            />
          </View>
        ) : (
          cartItems.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              onDelete={() => confirmDelete(item.id)}
            />
          ))
        )}

        {/* total price */}
        <View style={styles.totalPriceContainer}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, styles.subtotalText]}>Subtotal</Text>
            <Text style={[styles.priceText, styles.subtotalText]}>${originalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, styles.subtotalText]}>Discount</Text>
            <Text style={[styles.priceText, styles.discountText]}>-${discountPrice.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 4 }]}>
            <Text style={[styles.priceText, styles.totalPriceText]}>Total</Text>
            <Text style={[styles.priceText, styles.totalPriceText]}>${totalPrice.toFixed(2)}</Text>
          </View>

          <CustomButton text="Checkout" onPress={() => router.push('/')} />
        </View>
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

  totalPriceContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.gray + '33',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  subtotalText: {
    color: Colors.light.gray,
  },
  discountText: {
    color: "#ff3030",
  },
  totalPriceText: {
    fontFamily: Fonts.medium,
    fontSize: 20,
  },

});
