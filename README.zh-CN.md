# 下载神器

基于 Electron + Vite + React 的汽水音乐批量下载桌面应用。启动后先进入卡密授权页，验证通过后再使用下载功能。

[English](README.md) | 简体中文

## 功能

- 卡密验证后进入下载页
- 管理员可生成带期限的临时卡密
- 支持批量解析汽水 / 抖音音乐分享链接
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
| `npm run preview` | 本地预览生产构建 |
| `npm run typecheck` | TypeScript 类型检查 |

打包产物输出到 `release/<version>/`，例如：

- Windows：`下载神器_0.0.1.exe`
- macOS：`下载神器_0.0.1.dmg`

## 项目结构

```tree
├── build/                     打包图标等资源
├── electron/                  主进程与 preload
│   ├── main/                  窗口入口、CDN Referer 改写
│   └── preload/
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
