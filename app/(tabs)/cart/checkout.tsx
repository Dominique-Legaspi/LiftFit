import { useStripe } from "@stripe/stripe-react-native";
import { useEffect, useState } from "react";
import { Alert, Button, View } from "react-native";
import { API_BASE_URL } from '../../lib/env';
import Loading from "@/components/ui/Loading";
import { useRouter } from "expo-router";

export default function CheckoutScreen() {
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState<boolean>(false);
    const [sheetReady, setSheetReady] = useState<boolean>(false);

    const fetchPaymentIntent = async (): Promise<string | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 1999 }) // $19.99
            });
            const json = await res.json();

            return json.clientSecret;
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Unable to fetch payment intent');
            return null;
        }
    };

    useEffect(() => {
        (async () => {
            const clientSecret = await fetchPaymentIntent();
            if (!clientSecret) return;

            const { error } = await initPaymentSheet({
                merchantDisplayName: 'LiftFit',
                paymentIntentClientSecret: clientSecret,
            });

            if (error) {
                console.error('initPaymentSheet error', error);
                Alert.alert('Error', error.message);
            } else {
                setSheetReady(true);
            }
            setLoading(false);
        })();
    }, []);

    const handlePayPress = async () => {
        if (!sheetReady) return;
        setLoading(true);

        const { error } = await presentPaymentSheet();
        if (error) {
            Alert.alert('Payment failed', error.message);
        } else {
            Alert.alert('Success', 'Your payment was processed!');
        }
        setLoading(false);
    };

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
                onPress={handlePayPress}
                disabled={!sheetReady}
            />
        </View>
    );
}