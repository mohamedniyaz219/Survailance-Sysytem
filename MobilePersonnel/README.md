# MobilePersonnel – Responder App

## Overview

`MobilePersonnel` provides the responder workflow: incident assignments, notifications, settings, and profile management. Screens are located in `src/screens`, and service helpers live under `src/services/api.ts`.

## Status

- Built with React Native CLI plus Hermes; Android and iOS directories are configured for production-ready builds.
- Includes mock data under `src/data/mockData.ts` to seed screens while the backend integration stabilizes.

## Requirements

- Node.js 20+, npm, and watchman (recommended on macOS).
- Android Studio with SDK platforms or Xcode with CocoaPods.
- Ruby/Bundler for `pod install`.

## Setup

1. Install npm dependencies:
   ```bash
   cd MobilePersonnel
   npm install
   ```
2. Start Metro:
   ```bash
   npm start
   ```
3. Deploy to Android:
   ```bash
   npm run android
   ```
4. Deploy to iOS (after installing CocoaPods):
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   npm run ios
   ```

## Additional tooling

- Run `npm run lint` and `npm test` to exercise the Jest suite under `__tests__/App.test.tsx`.
- If native modules change, rerun CocoaPods and rebuild the native project to keep the bridge in sync.

## Notes

- Use `adb reverse tcp:8081 tcp:8081` for Android device testing while Metro runs locally.
- Keep the Metro bundler active while you develop so fast refresh and live reload work as expected.