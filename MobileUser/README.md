# MobileUser – Citizen App

## Overview

`MobileUser` is the citizen-facing React Native application that lets the public submit reports, view incident timelines, and browse relevant notifications. Screens live under `src/screens` (Auth, EventSelect, Home, Report) and services under `src/services/api.ts`.

## Status

- Fully bootstrapped with React Native CLI and Hermes for JS execution.
- Bundle includes assets under `android`, `ios`, and the `vendor/bundle/ruby` layers for native build tooling.

## Requirements

- Node.js 20+, npm, and watchman (optional but recommended for macOS).
- Android Studio + SDK for Android builds or Xcode + CocoaPods for iOS.
- Ruby/Bundler for CocoaPods integration.

## Setup steps

1. Install npm dependencies:
   ```bash
   cd MobileUser
   npm install
   ```
2. Start Metro (runs the JavaScript bundle server):
   ```bash
   npm start
   ```
3. Build and deploy to Android:
   ```bash
   npm run android
   ```
4. Build and deploy to iOS (requires CocoaPods):
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   npm run ios
   ```

## Additional commands

- `npm run lint` and `npm test` are available if you want to run static analysis or Jest tests under `__tests__`.
- If native modules change, rerun `bundle exec pod install` inside `ios/` before rebuilding.

## Notes

- Keep Metro running in a dedicated terminal session while targeting emulators or devices.
- Use `adb reverse tcp:8081 tcp:8081` when testing on Android devices to forward Metro.