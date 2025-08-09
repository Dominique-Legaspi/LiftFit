import { useUser } from "@/app/context/UserProvider";
import { supabase } from "@/app/lib/supabase";
import { useCallback, useState } from "react";

interface UseAddToCartParams {
    productId: string;
    productColorId: string;
    productStockId: string;
}

export function useAddToCart({
    productId,
    productColorId,
    productStockId,
}: UseAddToCartParams) {
    const { user } = useUser();
    const profileId = user?.id;

    const [isLoading, setIsLoading] = useState(false);

    const addToCart = useCallback(async () => {
        if (!profileId) return;

        setIsLoading(true);

        try {
            // check if item already exists in cart
            const { data: existing, error: selectError } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('profile_id', profileId)
                .eq('product_id', productId)
                .eq('product_color_id', productColorId)
                .eq('product_stock_id', productStockId)
                .maybeSingle();

            if (selectError) throw selectError;

            if (existing) {
                // update quantity if already in cart
                const { data, error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existing.quantity + 1 })
                    .eq('id', existing.id)
                    .select('id, quantity')
                    .maybeSingle();

                if (updateError) throw updateError;
                return data;
            } else {
                // insert new row if not in cart
                const { data, error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        profile_id: profileId,
                        product_id: productId,
                        product_color_id: productColorId,
                        product_stock_id: productStockId,
                        quantity: 1,
                    })
                    .select('id, quantity')
                    .single();

                if (insertError) throw insertError;
                return data;
            }
        } catch (err) {
            console.error("Error adding item to cart:", err);
        } finally {
            setIsLoading(false);
        }
    }, [profileId, productId, productColorId, productStockId]);

    return { addToCart, isLoading };
}