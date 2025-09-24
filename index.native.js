/**
 * @format
 * React Native Entry Point - Enhanced for Expo SDK 54
 */

// CRITICAL: Load TurboModule polyfill FIRST, before any React Native imports
import './src/turboModulePolyfill';

// Critical polyfills - must be loaded second
import './src/polyfills';

// Standard React Native imports
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => App);