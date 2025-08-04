import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, Modal, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useUser } from '../../context/UserProvider';
import { useEffect, useState } from 'react';
import CustomButton from '@/components/ui/CustomButton';
import { supabase } from '../../lib/supabase';
import Loading from '@/components/ui/Loading';

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

type CardItemProps = {
  item: ProductCart;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function CartScreen() {
  const { user } = useUser();
  const profileId = user?.id;

  const router = useRouter();

  const [cartItems, setCartItems] = useState<ProductCart[]>([]);

  // quantity update modal
  const [selectedItem, setSelectedItem] = useState<ProductCart | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

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
        .eq('profile_id', profileId)
        .order('quantity', { ascending: false });

      if (error) throw error;
      setCartItems(data);
    } catch (err) {
      console.error("Error fetching cart items:", err);
    } finally {
      setLoading(false);
    }
  };

  // delete cart item
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

  // confirmation alert for cart item deletion
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

  // update item quantity
  const updateQuantity = async (item: ProductCart | null, quantity: number) => {
    if (!item || !profileId || quantity < 1 || quantity === item.quantity || quantity > maxStock) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', item.id)
        .eq('profile_id', profileId);

      if (error) throw error;

      // update state locally
      Alert.alert("Quantity updated", "Quantity of selected item has been updated.")
      await fetchCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setLoading(false);
    }
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

  // product stocks
  const maxStock = selectedItem?.product_stocks.stock ?? 10;

  // calculate price
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const originalPrice = cartItems.reduce((sum, item) => {
    return sum + item.products.price * item.quantity;
  }, 0);

  const discountPrice = cartItems.reduce((sum, item) => {
    const discount = item.products.discount ?? 0;
    return sum + item.products.price * discount * item.quantity;
  }, 0);

  const totalPrice = originalPrice - discountPrice;

  // render cart item
  const CartItemCard: React.FC<CardItemProps> = ({ item, containerStyle }) => {
    const image_url = item?.product_colors?.image_urls?.[0];

    const itemPrice = item.products.price;
    const itemDiscount = item.products.discount;
    const itemDiscountPrice = itemPrice - itemPrice * (itemDiscount ?? 0);

    const hasDiscount = Boolean(itemDiscount)

    return (
      <Pressable style={[styles.cardContainer, containerStyle]}>
        <Image source={{ uri: image_url }} style={styles.cardImage} />
        <View style={styles.cardInfoContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.products.name}</Text>
            <Pressable
              onPress={() => confirmDelete(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.light.gray} />
            </Pressable>
          </View>
          <Text style={styles.cardSubtitle}>{item.product_colors.color}, {item.product_stocks.size}</Text>
          <View style={styles.cardPriceRow}>
            {hasDiscount ? (
              <View style={styles.priceRow}>
                <Text style={styles.cardRegularPriceStrikethrough}>{formatCurrency(itemPrice)}</Text>
                <Text style={styles.cardDiscountPrice}>{" "}{formatCurrency(itemDiscountPrice)}</Text>
              </View>
            ) : (
              <Text style={styles.cardRegularPrice}>{formatCurrency(itemPrice)}</Text>
            )}

            <View style={styles.quantityControls}>
              <Pressable
                onPress={() => updateQuantity(item, item.quantity - 1)}
                style={styles.qtyButton}
                disabled={item.quantity <= 1}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>

              <Text style={styles.qtyText}>{item.quantity}</Text>

              <Pressable
                onPress={() => updateQuantity(item, item.quantity + 1)}
                style={styles.qtyButton}
                disabled={item.quantity >= item.product_stocks.stock}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
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
            <CartItemCard
              key={item.id}
              item={item}
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

          <CustomButton text="Checkout" onPress={() => router.push('/cart/checkout')} />
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

  // card
  cardContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 4,
  },
  cardImage: {
    width: 60,
    height: 120,
    resizeMode: 'contain',
  },
  cardInfoContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.light.blue,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  cardPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardRegularPrice: {
    color: "#eee",
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  cardRegularPriceStrikethrough: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: Fonts.regular,
    textDecorationLine: "line-through",
  },
  cardDiscountPrice: {
    color: "#ff3030",
    fontSize: 16,
    fontFamily: Fonts.extraBold,
  },
  deleteButton: {
    padding: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    backgroundColor: Colors.light.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qtyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  qtyText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
