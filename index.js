// Entry point for FlowPonder with Expo SDK 54 compatibility
// Critical: Import order matters for TurboModules compatibility

// 0. CRITICAL: Load TurboModule polyfill FIRST, before any React Native imports
import './src/turboModulePolyfill';

// 1. Initialize native modules SECOND (after TurboModule polyfill)
import './src/nativeModuleInit';

// 2. Load additional polyfills THIRD
import './src/polyfills';

// 3. React Native app registration
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('flowponder', () => App);

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') || document.getElementById('flowponder');
  AppRegistry.runApplication('flowponder', { rootTag });
}