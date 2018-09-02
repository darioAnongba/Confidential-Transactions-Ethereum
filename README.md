# Confidential Cashless Payment Application - sources

React-Native app for Confidential Cashless Payment project on iOS and Android.

## Getting Started

### Prerequisites

We recommend you to install this tools before starting :

- [Android Studio](https://developer.android.com/studio/index.html) - Android Studio
- [XCode](https://developer.apple.com/xcode/) - (for OSX only) Mandatory if you want to build iOS app.
- [Npm](https://docs.npmjs.com/getting-started/installing-node) - NPM to manage packages
- [React Native](https://facebook.github.io/react-native/docs/getting-started.html) - React Native

### Project Architecture

| Folder            | Description                     |
| --------------    | ------------------------------- |
| android           | Android Studio project folder   |
| app               | Application core                |
| app/components    | React Components                |
| app/containers    | Redux Containers                |
| app/actions       | Redux Actions                   |
| app/reducers      | Redux Reducers                  |
| app/libs          | Crypto libraries                |
| contracts         | Smart Contracts ABIs            |
| ios               | Xcode project folder            |
| resources         | Resource files                  |
| resources/locales | Internalization files           |

### Installing

1.  Install npm dependencies :

```
cd confidential-transactions-app
npm install
```

2.  Create an `.env` file using `.env.example` as example

### Running

1.  Build and run app for iOS or Android

```
npm run ios
npm run android
```

2.  To use the debugger-ui, open in a chrome tab :

```
http://localhost:8081/debugger-ui/
```

In your simulator, press Cmd+D for iOS (press menu button for Android) to open Dev menu. Then select " Debug JS Remotely" to connect the simulator to your Debugger-ui.

### Versioning

To update the app version :

```
npm --no-git-tag-version version 1.0.0
```

This command will automatically update the iOS version (build and version number) and Android Version (versionCode and versionName).

### Deployment

> **:warning: Warning:**
> _Please wait the end of each step before you proceed to the next one._

1.  Install npm dependencies if not installed:

```
cd confidential-transactions-app
npm install
```

2.  Create an `.env` file using `.env.example` as example

3.  Generate Android APK

```
npm run release:android
```

4.  Generate iOS IPA (not tested)

```
Open Xcode > Product > Archive (be sure to select 'Generic iOS Device' in Target)
```

## TODO

- Possibility to switch networks in-app instead of hardcoded in the parameters
- Test app on iOS
- Change logo
- Native implementation for everything crypto (use [this library for iOS](https://github.com/shamatar/BulletproofSwift))