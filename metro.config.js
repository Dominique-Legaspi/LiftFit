// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Opt out of ES Module “exports” resolution so Metro falls back to classic CJS.
// This prevents Metro from ever trying to load Node‐only modules like `stream`,
// even if it sees an `exports` field in `node_modules/@supabase/realtime-js`.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
