import { useStripe } from "@stripe/stripe-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, View } from "react-native";
import { API_BASE_URL } from '../../lib/env';
import Loading from "@/components/ui/Loading";
import { useRouter } from "expo-router";
import { useUser } from "@/app/context/UserProvider";
import { supabase } from "@/app/lib/supabase";

type ProductCart = {
    id: string;
    quantity: number;
    products: {
        id: string;
        name: string;
        price: number;
        discount?: number;
    };
    product_colors: { id: string; colors: string; };
    product_stocks: { id: string; size: string };
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
                product_colors(id, color),
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
            total: sub - disc,
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

        const { clientSecret, error: piError } = await resp.json();
        if (piError || !clientSecret) {
            console.error(piError);
            Alert.alert('Error', 'Could not initialize payment.');
            setProcessing(false);
            return;
        };

        // initialize Stripe native sheet
        const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'LiftFit',
            paymentIntentClientSecret: clientSecret,
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

            if (orderError || !orderRow?.id ) {
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
            setCartItems([]);
        }

        setProcessing(false);
    }

    if (loading) {
        return <Loading />
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <Button
                title="Back"
                onPress={() => router.back()}
            />
            <Button
                title="Pay $19.99"
                onPress={handlePay}
            />
        </View>
    );
}