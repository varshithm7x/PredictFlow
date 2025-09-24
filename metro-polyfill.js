/**
 * Metro-level TurboModule Polyfill for Expo SDK 54
 * This polyfill gets injected as the first module in the bundle
 * ensuring TurboModuleRegistry is available before any React Native code runs
 */

(function() {
  'use strict';

  // Detect the environment
  var isReactNative = typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative';
  var isExpo = typeof global !== 'undefined' && global.__expo;

  console.log('[FlowPonder] Initializing TurboModule polyfill for Expo SDK 54');

  // Create comprehensive platform detection
  var getPlatformInfo = function() {
    var platform = 'unknown';
    var version = '1.0.0';
    var isPad = false;

    if (typeof global !== 'undefined' && global.navigator) {
      var ua = global.navigator.userAgent || '';
      if (ua.includes('iPhone') || ua.includes('iOS')) {
        platform = 'ios';
        var match = ua.match(/OS (\d+)_(\d+)/);
        if (match) {
          version = match[1] + '.' + match[2];
        }
      } else if (ua.includes('iPad')) {
        platform = 'ios';
        isPad = true;
        var match = ua.match(/OS (\d+)_(\d+)/);
        if (match) {
          version = match[1] + '.' + match[2];
        }
      } else if (ua.includes('Android')) {
        platform = 'android';
        var match = ua.match(/Android (\d+(?:\.\d+)*)/);
        if (match) {
          version = match[1];
        }
      }
    }

    return {
      OS: platform,
      Version: version,
      isPad: isPad,
      constants: {
        Brand: 'unknown',
        Model: 'unknown',
        systemName: platform,
        systemVersion: version,
        forceTouchAvailable: platform === 'ios'
      }
    };
  };

  var platformInfo = getPlatformInfo();

  // Create the comprehensive PlatformConstants module
  var createPlatformConstants = function() {
    return {
      getConstants: function() {
        return {
          isTesting: false,
          reactNativeVersion: {
            major: 0,
            minor: 74,
            patch: 5,
            prerelease: null
          },
          osVersion: platformInfo.Version,
          systemName: platformInfo.OS,
          systemVersion: platformInfo.Version,
          interfaceIdiom: platformInfo.isPad ? 'pad' : 'phone',
          isMobile: platformInfo.OS === 'ios' || platformInfo.OS === 'android',
          platform: platformInfo.OS,
          isTablet: platformInfo.isPad,
          Brand: platformInfo.constants.Brand,
          Model: platformInfo.constants.Model,
          Manufacturer: 'unknown',
          Fingerprint: 'unknown',
          forceTouchAvailable: platformInfo.constants.forceTouchAvailable,
          // Additional constants that might be expected
          uiMode: 'normal',
          brand: platformInfo.constants.Brand,
          buildId: 'unknown',
          device: platformInfo.constants.Model,
          display: 'unknown',
          hardware: 'unknown',
          host: 'unknown',
          id: 'unknown',
          manufacturer: 'unknown',
          model: platformInfo.constants.Model,
          product: 'unknown',
          tags: 'unknown',
          type: 'user',
          user: 'unknown'
        };
      },

      // Direct properties for immediate access
      forceTouchAvailable: platformInfo.constants.forceTouchAvailable,
      interfaceIdiom: platformInfo.isPad ? 'pad' : 'phone',
      isTesting: false,
      osVersion: platformInfo.Version,
      reactNativeVersion: {
        major: 0,
        minor: 74,
        patch: 5,
        prerelease: null
      },
      systemName: platformInfo.OS,
      systemVersion: platformInfo.Version,

      // Event methods
      addListener: function() { return { remove: function() {} }; },
      removeListeners: function() {},
      removeAllListeners: function() {},
    };
  };

  // Create other common native modules that might be requested
  var createCommonModules = function() {
    return {
      PlatformConstants: createPlatformConstants(),

      DeviceInfo: {
        getConstants: function() { return {}; },
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {}
      },

      NetworkingIOS: {
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {},
        sendRequest: function() {},
        abortRequest: function() {}
      },

      Networking: {
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {},
        sendRequest: function() {},
        abortRequest: function() {}
      },

      AsyncLocalStorage: {
        multiGet: function(keys, callback) {
          callback(null, keys.map(function(key) { return [key, null]; }));
        },
        multiSet: function(keyValuePairs, callback) {
          if (callback) callback(null);
        },
        multiRemove: function(keys, callback) {
          if (callback) callback(null);
        }
      },

      // Add other modules as needed
      AppState: {
        getConstants: function() { return { initialAppState: 'active' }; },
        getCurrentAppState: function(callback) {
          callback({ app_state: 'active' });
        },
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {}
      }
    };
  };

  var commonModules = createCommonModules();

  // Create the TurboModuleRegistry
  var createTurboModuleRegistry = function() {
    return {
      getEnforcing: function(name) {
        console.log('[FlowPonder] TurboModuleRegistry.getEnforcing called for: ' + name);

        if (commonModules[name]) {
          console.log('[FlowPonder] Returning pre-built module for: ' + name);
          return commonModules[name];
        }

        // Create a generic module for unknown requests
        console.warn('[FlowPonder] Creating generic mock for TurboModule: ' + name);
        return {
          getConstants: function() { return {}; },
          addListener: function() { return { remove: function() {} }; },
          removeListeners: function() {},
          removeAllListeners: function() {}
        };
      },

      get: function(name) {
        return this.getEnforcing(name);
      }
    };
  };

  // Install the TurboModuleRegistry globally with multiple fallback locations
  var turboModuleRegistry = createTurboModuleRegistry();

  // Install on global
  if (typeof global !== 'undefined') {
    global.TurboModuleRegistry = turboModuleRegistry;
    global.__turboModuleProxy = commonModules;
    console.log('[FlowPonder] Installed TurboModuleRegistry on global');
  }

  // Install on window for web compatibility
  if (typeof window !== 'undefined') {
    window.TurboModuleRegistry = turboModuleRegistry;
    window.__turboModuleProxy = commonModules;
    console.log('[FlowPonder] Installed TurboModuleRegistry on window');
  }

  // Install on self for worker compatibility
  if (typeof self !== 'undefined' && self !== global) {
    self.TurboModuleRegistry = turboModuleRegistry;
    self.__turboModuleProxy = commonModules;
    console.log('[FlowPonder] Installed TurboModuleRegistry on self');
  }

  // Create a persistent reference that can't be overwritten
  var originalDefineProperty = Object.defineProperty;
  try {
    originalDefineProperty(global, 'TurboModuleRegistry', {
      value: turboModuleRegistry,
      writable: false,
      configurable: false,
      enumerable: true
    });
    console.log('[FlowPonder] Made TurboModuleRegistry non-writable');
  } catch (e) {
    console.warn('[FlowPonder] Could not make TurboModuleRegistry non-writable:', e.message);
  }

  console.log('[FlowPonder] TurboModule polyfill initialization complete');

})();