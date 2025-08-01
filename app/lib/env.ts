import Constants from 'expo-constants';

type EnvConfig = {
    stripePublishableKey: string;
    apiBaseUrl: string;
};

const extra = Constants.expoConfig?.extra || {};

export const env: EnvConfig = {
    stripePublishableKey: extra.stripePublishableKey,
    apiBaseUrl: extra.apiBaseUrl,
};