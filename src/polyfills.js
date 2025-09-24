// Polyfill setup for React Native compatibility with Expo 49
// This file must be imported FIRST in your app entry point

// Core polyfills for React Native compatibility
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// TurboModule compatibility for Expo 49 + RN 0.72.10
import { NativeModules, Platform } from 'react-native';

// Fix TurboModuleRegistry PlatformConstants issue
if (typeof global.TurboModuleRegistry === 'undefined') {
  global.TurboModuleRegistry = {
    getEnforcing: (name) => {
      if (name === 'PlatformConstants') {
        return {
          getConstants: () => ({
            isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
            osVersion: Platform.Version,
            platform: Platform.OS,
            isTablet: Platform.isPad || false,
          }),
          forceTouchAvailable: false,
          interfaceIdiom: Platform.isPad ? 'pad' : 'phone',
          systemName: Platform.OS,
          systemVersion: Platform.Version,
        };
      }

      // Check if module exists in NativeModules
      if (NativeModules[name]) {
        return NativeModules[name];
      }

      // Return a mock for unknown modules to prevent crashes
      console.warn(`TurboModule '${name}' not found, returning mock`);
      return {};
    },
    get: (name) => {
      return global.TurboModuleRegistry.getEnforcing(name);
    }
  };
}

// Ensure PlatformConstants is available
if (!NativeModules.PlatformConstants) {
  NativeModules.PlatformConstants = {
    getConstants: () => ({
      isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
      osVersion: Platform.Version,
      platform: Platform.OS,
      isTablet: Platform.isPad || false,
    }),
    forceTouchAvailable: false,
    interfaceIdiom: Platform.isPad ? 'pad' : 'phone',
    systemName: Platform.OS,
    systemVersion: Platform.Version,
  };
}

// Process polyfill
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

// Additional React Native polyfills
if (typeof __dirname === 'undefined') global.__dirname = '/';
if (typeof __filename === 'undefined') global.__filename = '';

console.log('FlowPonder Expo 49 polyfills loaded successfully with TurboModule compatibility');