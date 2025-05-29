import 'dotenv/config';

export default ({config}) => ({
  ...config,
  extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  "expo": {
    "name": "liftfit-app",
    "slug": "liftfit-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "liftfitapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "bundleIdentifier": "com.anonymous.liftfitapp",
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/logos/icon-512.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.anonymous.liftfitapp"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/logos/icon-512.png",
      "name": "LiftFit - Fitness Wear",
      "shortName": "LiftFit",
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/logos/icon-512.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
})
