import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/UserProvider';
import { useState } from 'react';
import CustomButton from '@/components/ui/CustomButton';

type ProductCart = {
  id: string;
  profile_id: string;
  product_stock_id: string;
  quantity: number;

  products: {
    name: string;
    price: number;
    discount?: number;
  };

  product_colors: {
    color: string;
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

  // fetch

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* top bar */}
        <TopBar title="Shopping Cart" icon="cart-outline" hasTopBarIcons={false} />

        {/* empty cart */}
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
  
});
