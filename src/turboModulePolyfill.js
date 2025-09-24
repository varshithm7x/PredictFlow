// Critical TurboModule polyfill for Expo SDK 54
// This must execute BEFORE any React Native modules are imported

// Polyfill TurboModuleRegistry at the global level immediately
(function() {
  'use strict';

  // Create a comprehensive PlatformConstants mock that matches React Native's interface
  const createPlatformConstants = () => {
    // Detect platform based on user agent or global objects
    let platform = 'web';
    let version = '1.0.0';
    let isPad = false;

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
        platform = 'ios';
        isPad = ua.includes('iPad');
        const match = ua.match(/OS (\d+)_(\d+)/);
        if (match) {
          version = `${match[1]}.${match[2]}`;
        }
      } else if (ua.includes('Android')) {
        platform = 'android';
        const match = ua.match(/Android (\d+(?:\.\d+)*)/);
        if (match) {
          version = match[1];
        }
      }
    }

    return {
      // Constants method required by React Native
      getConstants: () => ({
        isTesting: false,
        reactNativeVersion: {
          major: 0,
          minor: 74,
          patch: 5,
          prerelease: null
        },
        osVersion: version,
        systemName: platform,
        interfaceIdiom: isPad ? 'pad' : 'phone',
        isMobile: platform === 'ios' || platform === 'android',
        platform: platform,
        isTablet: isPad,
        Brand: 'unknown',
        Model: 'unknown',
        Fingerprint: 'unknown',
        Manufacturer: 'unknown',
        getAndroidID: () => 'unknown',
        getBrand: () => 'unknown',
        getModel: () => 'unknown',
        getDeviceType: () => isPad ? 'Tablet' : 'Handset'
      }),

      // Direct properties for compatibility
      forceTouchAvailable: platform === 'ios',
      interfaceIdiom: isPad ? 'pad' : 'phone',
      isTesting: false,
      osVersion: version,
      reactNativeVersion: {
        major: 0,
        minor: 74,
        patch: 5,
        prerelease: null
      },
      systemName: platform,
      systemVersion: version,

      // Additional methods that might be called
      addListener: () => {},
      removeListeners: () => {},
    };
  };

  // Create the TurboModuleRegistry polyfill
  const createTurboModuleRegistry = () => {
    const platformConstants = createPlatformConstants();

    return {
      getEnforcing: (name) => {
        if (name === 'PlatformConstants') {
          return platformConstants;
        }

        // Handle other common modules
        if (name === 'DeviceInfo') {
          return {
            getConstants: () => ({}),
            addListener: () => {},
            removeListeners: () => {},
          };
        }

        if (name === 'NetworkingIOS' || name === 'Networking') {
          return {
            addListener: () => {},
            removeListeners: () => {},
            sendRequest: () => {},
            abortRequest: () => {},
          };
        }

        // Default mock for unknown modules
        console.warn(`TurboModule '${name}' not found, providing mock`);
        return {
          addListener: () => {},
          removeListeners: () => {},
        };
      },

      get: (name) => {
        return createTurboModuleRegistry().getEnforcing(name);
      }
    };
  };

  // Immediately set global TurboModuleRegistry if not exists
  if (typeof global !== 'undefined' && typeof global.TurboModuleRegistry === 'undefined') {
    global.TurboModuleRegistry = createTurboModuleRegistry();
  }

  // Also set on window for web compatibility
  if (typeof window !== 'undefined' && typeof window.TurboModuleRegistry === 'undefined') {
    window.TurboModuleRegistry = createTurboModuleRegistry();
  }

  console.log('Critical TurboModule polyfills loaded before React Native initialization');
})();