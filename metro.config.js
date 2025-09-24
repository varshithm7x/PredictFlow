const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced configuration for Expo SDK 49 with TurboModules support
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

module.exports = config;