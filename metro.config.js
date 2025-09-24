const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enhanced configuration for Expo SDK 54 with TurboModules support
config.resolver = {
  ...config.resolver,
  alias: {
    crypto: 'react-native-get-random-values',
    stream: 'stream-browserify',
    buffer: '@craftzdog/react-native-buffer',
  },
  platforms: ['ios', 'android', 'native', 'web'],
  // Enhanced resolver for TurboModules compatibility
  resolverMainFields: ['react-native', 'browser', 'main'],
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json'],
};

// Enhanced transformer for TurboModules
config.transformer = {
  ...config.transformer,
  // Ensure proper module resolution
  enableBabelRCLookup: false,
  hermesParser: true,
};

// CRITICAL: Inject our TurboModule polyfill as the first module in every bundle
config.serializer = {
  ...config.serializer,
  getPolyfills: () => {
    return [
      // Our custom TurboModule polyfill gets injected first
      path.resolve(__dirname, 'metro-polyfill.js')
    ];
  }
};

module.exports = config;