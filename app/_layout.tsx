import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    'Fira-Sans-Black': require('../assets/fonts/FiraSansExtraCondensed-Black.ttf'),
    'Fira-Sans-Bold': require('../assets/fonts/FiraSansExtraCondensed-Bold.ttf'),
    'Fira-Sans-Extra-Bold': require('../assets/fonts/FiraSansExtraCondensed-ExtraBold.ttf'),
    'Fira-Sans-Light': require('../assets/fonts/FiraSansExtraCondensed-Light.ttf'),
    'Fira-Sans-Medium': require('../assets/fonts/FiraSansExtraCondensed-Medium.ttf'),
    'Fira-Sans-Regular': require('../assets/fonts/FiraSansExtraCondensed-Regular.ttf'),
    'Fira-Sans-SemiBold': require('../assets/fonts/FiraSansExtraCondensed-SemiBold.ttf'),
    'Fira-Sans-Thin': require('../assets/fonts/FiraSansExtraCondensed-Thin.ttf'),
  })

  if (!fontsLoaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
