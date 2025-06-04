import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[productId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}