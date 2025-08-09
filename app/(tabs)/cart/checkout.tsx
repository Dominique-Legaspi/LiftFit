import { useStripe } from "@stripe/stripe-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, SafeAreaView, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { API_BASE_URL } from '../../lib/env';
import Loading from "@/components/ui/Loading";
import { useRouter } from "expo-router";
import { useUser } from "@/app/context/UserProvider";
import { supabase } from "@/app/lib/supabase";
import TopBar from "@/components/ui/TopBar";
import { Fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";
import CustomButton from "@/components/ui/CustomButton";

type ProductCart = {
    id: string;
    quantity: number;
    products: {
        id: string;
        name: string;
        price: number;
        discount?: number;
    };
    product_colors: {
        id: string;
        color: string;
        image_urls?: string[];
    };
    product_stocks: {
        id: string;
        size: string
    };
}

type CardItemProps = {
    item: ProductCart;
    containerStyle?: StyleProp<ViewStyle>;
}

export default function CheckoutScreen() {
    const router = useRouter();
    const { user } = useUser();
    const profileId = user?.id;

    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [cartItems, setCartItems] = useState<ProductCart[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // fetch cart items
    const fetchCart = async () => {
        if (!profileId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                products(id, name, price, discount),
                product_colors(id, color, image_urls),
                product_stocks(id, size)
                `)
            .eq('profile_id', profileId);

        if (error) {
            console.error('Error fetching cart items', error);
        } else {
            setCartItems(data as ProductCart[]);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchCart();
    }, [profileId]);

    // compute prices
    const { subtotal, discountAmount, total } = useMemo(() => {
        const sub = cartItems.reduce(
            (sum, item) => sum + item.products.price * item.quantity,
            0
        );
        const disc = cartItems.reduce(
            (sum, item) => sum + item.products.price * (item.products.discount ?? 0) * item.quantity,
            0
        );
        return {
            subtotal: sub,
            discountAmount: disc,
            total: Math.max(0, sub - disc),
        };
    }, [cartItems]);

    const handlePay = async () => {
        if (!profileId) {
            Alert.alert("You must be signed in to checkout.");
            return;
        }
        if (cartItems.length === 0) {
            Alert.alert("Your cart is empty.");
            return;
        }

        setProcessing(true);

        // create PaymentIntent with exact total in cents
        const amountInCents = Math.round(total * 100);
        const resp = await fetch(`${API_BASE_URL}/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountInCents }),
        });

        if (!resp.ok) {
            setProcessing(false);
            Alert.alert('Error', 'Could not reach payment server.');
            return;
        }

        const { clientSecret, error: piError } = await resp.json();
        if (piError || !clientSecret) {
            console.error(piError);
            Alert.alert('Error', 'Could not initialize payment.');
            setProcessing(false);
            return;
        };

        const defaultBillingDetails = {
            name: [ (user as any)?.first_name, (user as any)?.last_name ].filter(Boolean).join(' ') || undefined,
            email: (user as any)?.email || undefined,
            phone: undefined,
            address: {
                line1: undefined,
                line2: undefined,
                city: undefined,
                state: undefined,
                postalCode: undefined,
                country: 'US',
            },
        };

        // initialize Stripe native sheet
        const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'LiftFit',
            paymentIntentClientSecret: clientSecret,
            billingDetailsCollectionConfiguration: {
                name: 'always',
                email: 'always',
                phone: 'automatic',
                address: 'automatic',
            } as any,
            defaultBillingDetails
        });
        if (initError) {
            console.error(initError);
            Alert.alert('Error', initError.message);
            setProcessing(false);
            return;
        }

        // present sheet
        const { error: sheetError } = await presentPaymentSheet();

        // determine order status
        const orderStatus = sheetError ? "FAILED" : "COMPLETED";

        // record order
        try {
            const { data: orderRow, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        profile_id: profileId,
                        total,
                        status: orderStatus,
                    },
                ])
                .select('id')
                .single();

            if (orderError || !orderRow?.id) {
                console.error("Order insert error:", orderError);
                throw orderError;
            }

            const orderItemsPayload = cartItems.map((item) => ({
                order_id: orderRow.id,
                product_id: item.products.id,
                product_color_id: item.product_colors.id,
                product_stock_id: item.product_stocks.id,
                quantity: item.quantity,
                price: item.products.price,
                discount: item.products.discount ?? 0,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsPayload);

            if (itemsError) {
                console.error("Error inserting order items:", itemsError);
            }
        } catch (err) {
            console.error("Error recording order:", err);
        }

        if (sheetError) {
            Alert.alert('Payment failed', sheetError.message);
        } else {
            Alert.alert('Success', 'Your payment was processed!');
            // clear cart
            await supabase
                .from('cart_items')
                .delete()
                .eq('profile_id', profileId);
            router.replace('/(tabs)/cart');
        }

        setProcessing(false);
    }

    if (loading) {
        return <Loading />
    }

    const OrderSummaryItem: React.FC<CardItemProps> = ({ item, containerStyle }) => {
        const image_url = item?.product_colors?.image_urls?.[0];

        const price = item.products.price;
        const discount = item.products.discount ?? 0;
        const finalPrice = price - price * discount;
        return (
            <View style={styles.itemRow}>
                <Image source={{ uri: image_url }} style={styles.itemImage} />
                <Text style={styles.itemName}>{item.quantity}x {item.products.name}</Text>
                <Text style={styles.itemDetail}>
                    {item.product_colors.color}, {item.product_stocks.size}
                </Text>
                <Text style={styles.itemPrice}>
                    ${(finalPrice * item.quantity).toFixed(2)}
                </Text>
            </View>
        );
    }

    const isEmpty = cartItems.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollViewContainer}
                contentContainerStyle={{ paddingBottom: 80 }}
                keyboardShouldPersistTaps="handled"
            >
                <TopBar title="Checkout" icon="card-outline" hasBackButton={true} hasSearch={false} hasTopBarIcons={false} />

                <View style={styles.orderSummaryContainer}>
                    <Text style={styles.sectionTitle}>Order Review</Text>

                    {!isEmpty && cartItems.map(item => (
                        <OrderSummaryItem
                            key={item.id}
                            item={item}
                        />
                    ))}

                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount</Text>
                            <Text style={styles.summaryValue}>-${discountAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <CustomButton
                        text={`Place order - $${total.toFixed(2)}`}
                        onPress={handlePay}
                        disabled={isEmpty || processing}
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

    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        paddingVertical: 4,
        marginTop: 8,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gray + '33',
    },

    orderSummaryContainer: {
        marginHorizontal: 20,
    },

    cartItemList: {
        paddingBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    itemImage: {
        width: 40,
        height: 60,
        resizeMode: 'contain',
    },
    itemName: {
        flex: 2,
        fontFamily: Fonts.medium,
        paddingHorizontal: 4,
    },
    itemDetail: {
        flex: 1.5,
        paddingHorizontal: 4,
        fontFamily: Fonts.regular,
        color: Colors.light.gray,
    },
    itemPrice: {
        flex: 1,
        fontFamily: Fonts.medium,
        textAlign: 'right',
    },

    summary: {
        paddingTop: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontFamily: Fonts.regular,
        color: Colors.light.gray,
    },
    summaryValue: {
        fontFamily: Fonts.regular,
    },
    totalRow: {
        marginTop: 4,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
        fontSize: 18,
    },
    totalValue: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.blue,
    },
})