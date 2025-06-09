import { supabase } from "@/app/lib/supabase";
import { useToggleWithActions } from "./useToggleWithActions";

export function useWishlist(itemId: string, initialWishlisted = false) {
    const [isWishlisted, toggleWishlist] = useToggleWithActions(initialWishlisted, {
        onEnable: async () => {
            const { error } = await supabase
                .from('wishlist')
                .insert({ item_id: itemId });

            if (error) throw error;
        },
        onDisable: async () => {
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .match({ item_id: itemId });

            if (error) throw error;
        },
    });

    return { isWishlisted, toggleWishlist }

}