# 下载神器

基于 Electron + Vite + React 的汽水音乐批量下载桌面应用。启动后先进入卡密授权页，验证通过后再使用下载功能。

English | [简体中文](README.zh-CN.md)

## Features

- Card-key gate before accessing the downloader
- Admin can generate time-limited temporary card keys
- Batch parse Qishui share links, or search by song name (Kuwo source)
- Preview, single download, and ZIP batch download
- Packaged app name: **下载神器**
- One-command packaging for Windows and macOS

## Quick Start

```sh
# install dependencies
npm install

# start development (opens the auth page)
npm run dev
```

Admin password and temporary key logic live in `public/qishui-cardkey.js`; admin UI is `public/qishui-admin.html`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Electron in development |
| `npm run build` | Build and package for the current platform |
| `npm run build:win` | Package Windows x64 installer (NSIS) |
| `npm run build:mac` | Package macOS artifacts (dmg / zip) |
| `npm run build:all` | Package Windows + macOS in one go |
| `npm run mobile:sync` | Sync `public/` to Android / iOS native projects |
| `npm run build:android` | Build Android debug APK (requires JDK + Android SDK) |
| `npm run build:android:release` | Build Android release APK |
| `npm run build:ios` | Sync iOS project (open Xcode to archive) |
| `npm run open:android` | Open Android Studio |
| `npm run open:ios` | Open Xcode |
| `npm run preview` | Preview the production web build |
| `npm run typecheck` | Run TypeScript type check |

Build output goes to `release/<version>/`, for example:

- Windows: `下载神器_0.0.1.exe`
- macOS: `下载神器_0.0.1.dmg`

## Mobile (Android / iOS)

Desktop uses Electron; mobile uses **Capacitor** to wrap the same `public/` pages.

| Platform | Prerequisites |
|----------|----------------|
| Android | JDK 17+, Android Studio (SDK) |
| iOS | macOS, Xcode, Apple developer account (device / App Store) |

```sh
npm run mobile:sync          # sync public/ → native projects
npm run build:android        # debug APK
npm run build:android:release
npm run build:ios && npm run open:ios   # archive in Xcode
npm run open:android         # build in Android Studio
```

## Project Structure

```tree
├── build/                     Packaging assets (icons)
├── electron/                  Main process & preload
│   ├── main/                  Window entry, CDN Referer rewrite
│   └── preload/
├── android/                   Capacitor Android project
├── ios/                       Capacitor iOS project
├── capacitor.config.ts        Mobile config
├── public/
│   ├── qishui-auth.html       Card-key auth page (app entry)
│   ├── qishui-admin.html      Admin: generate temporary keys
│   ├── qishui-cardkey.js      Key signing / verification
│   └── qishui-downloader.html Downloader page
├── src/                       React renderer (template leftovers)
├── electron-builder.json      productName: 下载神器
└── release/                   Packaged installers
```

## Notes

- Auth state is stored in `sessionStorage` for the current session only.
- Douyin CDN enforces Referer checks; the Electron main process rewrites media request headers so preview/download works inside the app.
- For personal / authorized backup use only.
