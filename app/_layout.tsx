import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider, useUser } from './context/UserProvider';
import { useEffect } from 'react';

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
      <UserProvider>
        <SplashController />
        <RootNavigator />
      </UserProvider>
    </ThemeProvider>
  );
};

function SplashController() {
  const { loading } = useUser();

  useEffect(() => {
    if (!loading) {
      // move user to login screen
      SplashScreen.hideAsync()
    }
  }, [loading]);

  return null;
};

// show login in screen when not signed in upon app initialization
function RootNavigator() {
  const { user } = useUser();

  return (
    <>
      <Stack>
        {/* only mount screens if user is logged in */}
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* user is signed out */}
        <Stack.Protected guard={!user}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
};