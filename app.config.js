// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "LiftFit",
  slug: "LiftFit",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logos/icon-512.png",
  scheme: "liftfitapp",
  userInterfaceStyle: "automatic",
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
  plugins: [
    "expo-router",
    ["@stripe/stripe-react-native", {}],
    [
      "expo-splash-screen",
      {
        image: "./assets/logos/icon-512.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ]
  ],
  ios: {
    bundleIdentifier: "com.anonymous.liftfitapp",
    supportsTablet: true
  },
  android: {
    package: "com.anonymous.liftfitapp",
    adaptiveIcon: {
      foregroundImage: "./assets/logos/icon-512.png",
      backgroundColor: "#ffffff"
    },
    edgeToEdgeEnabled: true
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/logos/icon-512.png",
    name: "LiftFit - Fitness Wear",
    shortName: "LiftFit"
  },
  experiments: {
    typedRoutes: true,
    newArchEnabled: false,
  }
});
