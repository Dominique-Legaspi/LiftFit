import { useState, useCallback } from "react"

type ToggleAction = {
    onEnable: () => Promise<any> | void;
    onDisable: () => Promise<any> | void;
};

export function useToggleWithActions(
    initialValue: boolean,
    { onEnable, onDisable }: ToggleAction
): [boolean, () => Promise<void>] {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(async () => {
        try {
            if (!value) {
                await onEnable();
            } else {
                await onDisable();
            }

            setValue(v => !v);
        } catch (err) {
            console.error('Error toggling value:', err);
        }
    }, [value, onEnable, onDisable]);

    return [value, toggle];
}