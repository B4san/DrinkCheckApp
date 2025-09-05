const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoConfig } = require('expo/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const expoConfig = getExpoConfig(__dirname);

const config = mergeConfig(defaultConfig, expoConfig);

// Add alias support for @/ path
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

// Ensure the resolver can find TypeScript files
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

module.exports = config;