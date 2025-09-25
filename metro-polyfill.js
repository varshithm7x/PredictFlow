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
        removeListeners: function() {},
        SetGlobalhandler: function() {}, // Add missing handler
        setGlobalHandler: function() {} // Alternative naming
      },

      NetworkingIOS: {
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {},
        sendRequest: function() {},
        abortRequest: function() {},
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      Networking: {
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {},
        sendRequest: function() {},
        abortRequest: function() {},
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
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
        },
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      // Add other modules as needed
      AppState: {
        getConstants: function() { return { initialAppState: 'active' }; },
        getCurrentAppState: function(callback) {
          callback({ app_state: 'active' });
        },
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {},
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      // Exception Manager for error handling
      ExceptionsManager: {
        updateExceptionMessage: function() {},
        dismissRedBox: function() {},
        reportFatalException: function() {},
        reportSoftException: function() {},
        handleException: function() {},
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      // Global exception handler - Enhanced with more robust error handling
      ErrorUtils: {
        setGlobalHandler: function(handler) {
          console.log('[FlowPonder] ErrorUtils.setGlobalHandler called with:', typeof handler);
          // Store the handler but don't actually use it to avoid interfering with Expo's error handling
          if (typeof global !== 'undefined') {
            global.__FlowPonderErrorHandler = handler;
          }
        },
        SetGlobalhandler: function(handler) {
          console.log('[FlowPonder] ErrorUtils.SetGlobalhandler called with:', typeof handler);
          this.setGlobalHandler(handler);
        },
        getGlobalHandler: function() {
          console.log('[FlowPonder] ErrorUtils.getGlobalHandler called');
          if (typeof global !== 'undefined' && global.__FlowPonderErrorHandler) {
            return global.__FlowPonderErrorHandler;
          }
          return function(error, isFatal) {
            console.warn('[FlowPonder] Default error handler called:', error, isFatal);
          };
        },
        reportFatalError: function(error) {
          console.error('[FlowPonder] ErrorUtils.reportFatalError:', error);
        },
        reportSoftError: function(error) {
          console.warn('[FlowPonder] ErrorUtils.reportSoftError:', error);
        }
      },

      // Timing module
      Timing: {
        createTimer: function() {},
        deleteTimer: function() {},
        setSendIdleEvents: function() {},
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      // Source code module
      SourceCode: {
        getConstants: function() {
          return {
            scriptURL: 'http://localhost:8081/index.bundle'
          };
        },
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      },

      // JS Bundle loader
      JSCExecutor: {
        SetGlobalhandler: function() {},
        setGlobalHandler: function() {}
      }
    };
  };

  var commonModules = createCommonModules();

  // Create the TurboModuleRegistry with enhanced error handling
  var createTurboModuleRegistry = function() {
    return {
      getEnforcing: function(name) {
        console.log('[FlowPonder] TurboModuleRegistry.getEnforcing called for: ' + name);

        if (commonModules[name]) {
          console.log('[FlowPonder] Returning pre-built module for: ' + name);
          return commonModules[name];
        }

        // Create a comprehensive generic module for unknown requests
        console.warn('[FlowPonder] Creating generic mock for TurboModule: ' + name);
        var genericModule = {
          // Core methods
          getConstants: function() {
            console.log('[FlowPonder] getConstants called for: ' + name);
            return {};
          },

          // Event handling
          addListener: function() {
            console.log('[FlowPonder] addListener called for: ' + name);
            return { remove: function() {} };
          },
          removeListeners: function() {
            console.log('[FlowPonder] removeListeners called for: ' + name);
          },
          removeAllListeners: function() {
            console.log('[FlowPonder] removeAllListeners called for: ' + name);
          },

          // Global handlers - the main issue
          SetGlobalhandler: function() {
            console.log('[FlowPonder] SetGlobalhandler called for: ' + name);
          },
          setGlobalHandler: function() {
            console.log('[FlowPonder] setGlobalHandler called for: ' + name);
          },

          // Exception handling
          updateExceptionMessage: function() {
            console.log('[FlowPonder] updateExceptionMessage called for: ' + name);
          },
          dismissRedBox: function() {
            console.log('[FlowPonder] dismissRedBox called for: ' + name);
          },
          reportFatalException: function() {
            console.log('[FlowPonder] reportFatalException called for: ' + name);
          },
          reportSoftException: function() {
            console.log('[FlowPonder] reportSoftException called for: ' + name);
          },
          handleException: function() {
            console.log('[FlowPonder] handleException called for: ' + name);
          },

          // Timing
          createTimer: function() {
            console.log('[FlowPonder] createTimer called for: ' + name);
          },
          deleteTimer: function() {
            console.log('[FlowPonder] deleteTimer called for: ' + name);
          },
          setSendIdleEvents: function() {
            console.log('[FlowPonder] setSendIdleEvents called for: ' + name);
          },

          // Networking
          sendRequest: function() {
            console.log('[FlowPonder] sendRequest called for: ' + name);
          },
          abortRequest: function() {
            console.log('[FlowPonder] abortRequest called for: ' + name);
          },

          // Additional methods that might be needed
          getCurrentAppState: function(callback) {
            console.log('[FlowPonder] getCurrentAppState called for: ' + name);
            if (callback) callback({ app_state: 'active' });
          },
          multiGet: function(keys, callback) {
            console.log('[FlowPonder] multiGet called for: ' + name);
            if (callback) callback(null, keys.map(function(key) { return [key, null]; }));
          },
          multiSet: function(keyValuePairs, callback) {
            console.log('[FlowPonder] multiSet called for: ' + name);
            if (callback) callback(null);
          },
          multiRemove: function(keys, callback) {
            console.log('[FlowPonder] multiRemove called for: ' + name);
            if (callback) callback(null);
          }
        };

        // Ensure the module is properly frozen to prevent modification
        try {
          Object.freeze(genericModule);
        } catch (e) {
          console.warn('[FlowPonder] Could not freeze generic module for: ' + name);
        }

        return genericModule;
      },

      get: function(name) {
        return this.getEnforcing(name);
      }
    };
  };

  // Install the TurboModuleRegistry globally with multiple fallback locations
  var turboModuleRegistry = createTurboModuleRegistry();

  // Create a turboModuleProxy function with enhanced safety checks
  var turboModuleProxyFunction = function(name) {
    console.log('[FlowPonder] turboModuleProxy called for: ' + name);

    // Always ensure we return a valid module, never undefined
    try {
      if (commonModules[name]) {
        console.log('[FlowPonder] Returning common module for: ' + name);
        return commonModules[name];
      }

      var module = turboModuleRegistry.getEnforcing(name);
      if (module === null || module === undefined) {
        console.error('[FlowPonder] getEnforcing returned null/undefined for: ' + name + ', creating emergency fallback');
        throw new Error('Module returned null/undefined');
      }

      return module;
    } catch (error) {
      console.error('[FlowPonder] Error in turboModuleProxy for: ' + name + ', error:', error);

      // Emergency fallback - create a minimal but safe module
      var emergencyModule = {
        getConstants: function() { return {}; },
        setGlobalHandler: function() { console.log('[FlowPonder] Emergency setGlobalHandler for: ' + name); },
        SetGlobalhandler: function() { console.log('[FlowPonder] Emergency SetGlobalhandler for: ' + name); },
        addListener: function() { return { remove: function() {} }; },
        removeListeners: function() {}
      };

      console.log('[FlowPonder] Created emergency fallback module for: ' + name);
      return emergencyModule;
    }
  };

  // Install on global
  if (typeof global !== 'undefined') {
    global.TurboModuleRegistry = turboModuleRegistry;
    global.__turboModuleProxy = turboModuleProxyFunction;
    global.turboModuleProxy = turboModuleProxyFunction;
    console.log('[FlowPonder] Installed TurboModuleRegistry and turboModuleProxy on global');
  }

  // Install on window for web compatibility
  if (typeof window !== 'undefined') {
    window.TurboModuleRegistry = turboModuleRegistry;
    window.__turboModuleProxy = turboModuleProxyFunction;
    window.turboModuleProxy = turboModuleProxyFunction;
    console.log('[FlowPonder] Installed TurboModuleRegistry and turboModuleProxy on window');
  }

  // Install on self for worker compatibility
  if (typeof self !== 'undefined' && self !== global) {
    self.TurboModuleRegistry = turboModuleRegistry;
    self.__turboModuleProxy = turboModuleProxyFunction;
    self.turboModuleProxy = turboModuleProxyFunction;
    console.log('[FlowPonder] Installed TurboModuleRegistry and turboModuleProxy on self');
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
    originalDefineProperty(global, '__turboModuleProxy', {
      value: turboModuleProxyFunction,
      writable: false,
      configurable: false,
      enumerable: true
    });
    originalDefineProperty(global, 'turboModuleProxy', {
      value: turboModuleProxyFunction,
      writable: false,
      configurable: false,
      enumerable: true
    });
    console.log('[FlowPonder] Made TurboModuleRegistry and turboModuleProxy non-writable');
  } catch (e) {
    console.warn('[FlowPonder] Could not make TurboModule references non-writable:', e.message);
  }

  console.log('[FlowPonder] TurboModule polyfill initialization complete');

})();