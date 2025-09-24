// Native Module Initialization for Expo SDK 54 + React Native 0.76.4
// This handles TurboModules initialization before React Native bridge starts

import { NativeModules, Platform } from 'react-native';

// Pre-initialize critical native modules to prevent TurboModuleRegistry errors
const initializeNativeModules = () => {
  // PlatformConstants - Critical for React Native initialization
  if (!NativeModules.PlatformConstants) {
    const platformConstants = {
      getConstants: () => ({
        isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
        osVersion: Platform.Version,
        platform: Platform.OS,
        isTablet: Platform.isPad || false,
        Brand: Platform.constants?.Brand || 'unknown',
        Model: Platform.constants?.Model || 'unknown',
        systemName: Platform.OS,
        systemVersion: Platform.Version,
      }),
      forceTouchAvailable: Platform.OS === 'ios' && Platform.constants?.forceTouchAvailable || false,
      interfaceIdiom: Platform.isPad ? 'pad' : 'phone',
      systemName: Platform.OS,
      systemVersion: Platform.Version,
    };

    // Register in both locations for compatibility
    NativeModules.PlatformConstants = platformConstants;

    // Also register in global scope for TurboModuleRegistry
    global.__turboModuleProxy = global.__turboModuleProxy || new Proxy({}, {
      get(target, name) {
        if (name === 'PlatformConstants') {
          return platformConstants;
        }
        return NativeModules[name] || null;
      }
    });
  }

  // Enhanced TurboModuleRegistry with better error handling
  if (typeof global.TurboModuleRegistry === 'undefined') {
    global.TurboModuleRegistry = {
      getEnforcing: (name) => {
        if (name === 'PlatformConstants') {
          return NativeModules.PlatformConstants;
        }

        if (NativeModules[name]) {
          return NativeModules[name];
        }

        // Check global proxy
        if (global.__turboModuleProxy && global.__turboModuleProxy[name]) {
          return global.__turboModuleProxy[name];
        }

        console.warn(`TurboModule '${name}' not found in Expo SDK 54 environment`);
        return null;
      },
      get: (name) => {
        return global.TurboModuleRegistry.getEnforcing(name);
      }
    };
  }

  console.log('Native modules initialized for Expo SDK 54 compatibility');
};

// Initialize immediately
initializeNativeModules();

export default initializeNativeModules;