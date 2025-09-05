module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-navigation|@react-native-community|lucide-react-native)/)',
  ],
};