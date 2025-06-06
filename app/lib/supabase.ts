// supabaseClient.ts
import 'react-native-url-polyfill/auto'; // make sure this is at the very top
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Fallback so it works both in dev (Constants.manifest) and in prod (Constants.expoConfig)
const expoConfig = (Constants.expoConfig ?? Constants.manifest) as any;
const SUPABASE_URL = expoConfig.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = expoConfig.extra?.supabaseAnonKey;

// 👇 Early check to fail fast if something’s wrong
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Key is missing!', {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    expoConfig,
  });
  throw new Error(
    'Missing Supabase credentials—check your app.config.js and .env file'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    realtime: ({ enabled: false } as any),
  }
);
