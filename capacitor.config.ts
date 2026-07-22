import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.qishui.downloader',
  appName: '下载神器',
  webDir: 'public',
  // https 方案保证 Web Crypto（卡密签名）在 Android WebView 可用
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
}

export default config
