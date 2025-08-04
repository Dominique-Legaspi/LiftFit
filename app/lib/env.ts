import Constants from 'expo-constants';

type EnvConfig = {
    stripePublishableKey: string;
    apiBaseUrl: string;
};

const extra = Constants.expoConfig?.extra as EnvConfig;

export const STRIPE_PUBLISHABLE_KEY = extra.stripePublishableKey;
export const API_BASE_URL = extra.apiBaseUrl;