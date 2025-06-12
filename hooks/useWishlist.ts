import { supabase } from "@/app/lib/supabase";
import { useUser } from "@/app/context/UserProvider";
import { useCallback, useEffect, useState } from "react";

interface UseWishlistParams {
    productId: string,
    productColorId?: string | null,
    productStockId?: string | null,
};

export function useWishlist({
    productId,
    productColorId,
    productStockId
}: UseWishlistParams) {
    const { user } = useUser();
    const profileId = user?.id;
    const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
    const [wishlistId, setWishlistId] = useState<string | null>(null);

    const hasColor = !!productColorId;      // false for "", null, undefined
    const hasStock = !!productStockId;

    useEffect(() => {
        if (!profileId || !productId) return;

        const load = async () => {
            let query = supabase
                .from('wishlist')
                .select('id')
                .eq('profile_id', profileId)
                .eq('product_id', productId);

            // check if color id exists
            if (hasColor) {
                query = query.eq('product_color_id', productColorId);
            } else {
                query = query.is('product_color_id', null);
            }

            // check if stock id exists
            if (hasStock) {
                query = query.eq('product_stock_id', productStockId);
            } else {
                query = query.is('product_stock_id', null);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error("Error fetching wishlist:", error);
                return;
            } else if (data) {
                setWishlistId(data.id);
                setIsWishlisted(true);
            } else {
                setWishlistId(null);
                setIsWishlisted(false);
            }
        }

        load()
    }, [profileId, productId, productColorId, productStockId])

    const toggleWishlist = useCallback(async () => {
        if (!profileId || !productId) return;

        if (!isWishlisted) {
            // insert wishlist
            const { data, error } = await supabase
                .from('wishlist')
                .insert({
                    profile_id: profileId,
                    product_id: productId,
                    product_color_id: hasColor ? productColorId! : null,
                    product_stock_id: hasStock ? productStockId! : null,
                })
                .select('id')
                .single();

            if (error) {
                console.error("Error inserting to wishlist:", error);
                return;
            } else {
                setWishlistId(data.id);
                setIsWishlisted(true);
            }
        } else {
            // delete wishlist
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', wishlistId!);

            if (error) {
                console.error("Error deleting wishlist:", error);
                return;
            } else {
                setWishlistId(null);
                setIsWishlisted(false);
            }
        }
    }, [isWishlisted, wishlistId, profileId, productId, productColorId, productStockId]);

    return { isWishlisted, toggleWishlist };
}