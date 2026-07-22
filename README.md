# 下载神器

基于 Electron + Vite + React 的汽水音乐批量下载桌面应用。启动后先进入卡密授权页，验证通过后再使用下载功能。

English | [简体中文](README.zh-CN.md)

## Features

- Card-key gate before accessing the downloader
- Batch parse Qishui / Douyin Music share links
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

Card keys can be configured in `public/qishui-auth.html` → `VALID_KEYS`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Electron in development |
| `npm run build` | Build and package for the current platform |
| `npm run build:win` | Package Windows x64 installer (NSIS) |
| `npm run build:mac` | Package macOS artifacts (dmg / zip) |
| `npm run build:all` | Package Windows + macOS in one go |
| `npm run preview` | Preview the production web build |
| `npm run typecheck` | Run TypeScript type check |

Build output goes to `release/<version>/`, for example:

- Windows: `下载神器_0.0.1.exe`
- macOS: `下载神器_0.0.1.dmg`

## Project Structure

```tree
├── build/                     Packaging assets (icons)
├── electron/                  Main process & preload
│   ├── main/                  Window entry, CDN Referer rewrite
│   └── preload/
├── public/
│   ├── qishui-auth.html       Card-key auth page (app entry)
│   └── qishui-downloader.html Downloader page
├── src/                       React renderer (template leftovers)
├── electron-builder.json      productName: 下载神器
└── release/                   Packaged installers
```

## Notes

- Auth state is stored in `sessionStorage` for the current session only.
- Douyin CDN enforces Referer checks; the Electron main process rewrites media request headers so preview/download works inside the app.
- For personal / authorized backup use only.
