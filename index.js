// Entry point for FlowPonder with Expo SDK 54 compatibility
// Critical: Import order matters for TurboModules compatibility

// 1. Initialize native modules FIRST (before any React Native imports)
import './src/nativeModuleInit';

// 2. Load polyfills SECOND
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