const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

// CRITICAL: Inject our TurboModule polyfill using getPolyfills
config.serializer = {
  ...config.serializer,
  getPolyfills: () => {
    try {
      const polyfillPath = path.join(__dirname, 'metro-polyfill-bulletproof.js');
      console.log('[FlowPonder] Returning bulletproof polyfill path for injection');

      // Return the polyfill file path to be included in the bundle
      return [polyfillPath];
    } catch (error) {
      console.error('[FlowPonder] Error with bulletproof polyfill path:', error);
      return [];
    }
  }
};

module.exports = config;