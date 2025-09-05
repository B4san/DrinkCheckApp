# DrinkCheckApp

A React Native app for monitoring drinks with ESP32 integration.

## Development Setup

This app supports both Expo managed workflow and React Native CLI (bare workflow) for maximum flexibility.

### Prerequisites

- Node.js 16+
- Android Studio (for Android development)
- Android SDK and device/emulator

### Installation

```bash
npm install
```

### Running the App

#### For Physical Device Testing (React Native CLI)

To run on a physical Android device using the standard React Native CLI:

```bash
# Start Metro bundler
npm run start

# In another terminal, run on Android device
npx react-native run-android
```

Alternative npm scripts:
```bash
npm run android    # Same as npx react-native run-android
npm run start      # Start Metro bundler
```

#### For Development with Expo

```bash
npm run dev              # Start Expo development server
npm run expo:android     # Run with Expo on Android
npm run expo:ios         # Run with Expo on iOS
```

### Build Commands

```bash
npm run build:web        # Build for web
npm run lint            # Run linter
```

## Project Structure

- `/app` - Main application screens (Expo Router)
- `/components` - Reusable UI components  
- `/hooks` - Custom React hooks
- `/services` - API and external service integrations
- `/utils` - Utility functions
- `/android` - Native Android code (generated)

## Key Features

- ESP32 sensor integration
- Drink monitoring and history
- Push notifications
- Camera integration
- Real-time data updates
