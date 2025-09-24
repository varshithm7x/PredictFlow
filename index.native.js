/**
 * @format
 * React Native Entry Point - Simplified for Expo SDK 49
 */

// Critical polyfills - must be loaded first
import './src/polyfills';

// Standard React Native imports
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => App);