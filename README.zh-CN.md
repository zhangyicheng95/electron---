# 下载神器

基于 Electron + Vite + React 的汽水音乐批量下载桌面应用。启动后先进入卡密授权页，验证通过后再使用下载功能。

[English](README.md) | 简体中文

## 功能

- 卡密验证后进入下载页
- 管理员可生成带期限的临时卡密
- 支持汽水分享链接批量解析，以及按歌名搜索（酷我音源）下载
- 支持试听、单曲下载、批量打包 ZIP
- 安装后软件名：**下载神器**
- 支持一键打包 Windows / macOS

## 快速开始

```sh
# 安装依赖
npm install

# 启动开发环境（默认打开卡密页）
npm run dev
```

管理员密码与临时卡密逻辑见 `public/qishui-cardkey.js`；管理页为 `public/qishui-admin.html`。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境 |
| `npm run build` | 构建并打包当前平台 |
| `npm run build:win` | 打包 Windows x64 安装包（NSIS） |
| `npm run build:mac` | 打包 macOS（dmg / zip） |
| `npm run build:all` | 一键打包 Windows + macOS |
| `npm run mobile:sync` | 同步 `public/` 到 Android / iOS 工程 |
| `npm run build:android` | 打包 Android 调试版 APK（需 JDK + Android SDK） |
| `npm run build:android:release` | 打包 Android 正式版 APK |
| `npm run build:ios` | 同步 iOS 工程（需在 Xcode 中归档） |
| `npm run open:android` | 用 Android Studio 打开 |
| `npm run open:ios` | 用 Xcode 打开 |
| `npm run preview` | 本地预览生产构建 |
| `npm run typecheck` | TypeScript 类型检查 |

打包产物输出到 `release/<version>/`，例如：

- Windows：`下载神器_0.0.1.exe`
- macOS：`下载神器_0.0.1.dmg`

## 移动端打包（Android / iOS）

桌面端用 Electron，移动端用 **Capacitor** 封装同一套 `public/` 页面。

**一键安装/检查环境：**

```sh
npm run mobile:setup
```

会自动下载 JDK 21 到项目 `.tools/`（无需 sudo），并检查 Android SDK、Xcode。

**环境要求：**

| 平台 | 需要 | 你这台机器 |
|------|------|------------|
| Android | JDK 21、Android SDK | JDK 已装到 `.tools/jdk-21`；SDK 在 `~/Library/Android/sdk` |
| iOS | macOS、Xcode、CocoaPods | Xcode 26.5、CocoaPods 已就绪 |

**打包命令：**

```sh
npm run mobile:setup          # 安装/检查环境（首次运行）
npm run mobile:sync           # 同步 public/ 到原生工程
npm run build:android         # Android 调试 APK
npm run build:android:release # Android 正式 APK（需签名）
npm run build:ios             # 同步 iOS 工程
npm run open:ios              # Xcode 归档上架
npm run open:android          # Android Studio
```

Android 调试包输出：`android/app/build/outputs/apk/debug/app-debug.apk`

## 项目结构

```tree
├── build/                     打包图标等资源
├── electron/                  主进程与 preload
│   ├── main/                  窗口入口、CDN Referer 改写
│   └── preload/
├── android/                   Capacitor Android 工程
├── ios/                       Capacitor iOS 工程
├── capacitor.config.ts        移动端配置
├── public/
│   ├── qishui-auth.html       卡密授权页（应用入口）
│   ├── qishui-admin.html      管理员：生成临时卡密
│   ├── qishui-cardkey.js      卡密签发 / 校验
│   └── qishui-downloader.html 下载页
├── src/                       React 渲染进程（模板残留）
├── electron-builder.json      productName: 下载神器
└── release/                   安装包输出目录
```

## 说明

- 授权状态保存在当前会话的 `sessionStorage`，关闭后需重新验证。
- 抖音 CDN 有 Referer 防盗链；Electron 主进程会改写媒体请求头，保证应用内试听/下载可用。
- 仅供个人学习与已获授权内容备份使用。
