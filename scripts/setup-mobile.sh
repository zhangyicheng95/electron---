#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JDK_DIR="$ROOT/.tools/jdk-21"
JDK_HOME="$JDK_DIR/Contents/Home"
ARCH="$(uname -m)"

echo "==> 检查移动端打包环境"

# 1. JDK 17（免安装，下载到项目 .tools/）
if [ ! -x "$JDK_HOME/bin/java" ]; then
  echo "==> 下载 Temurin JDK 21..."
  mkdir -p "$ROOT/.tools"
  TMP="$(mktemp -t temurin21.XXXXXX.tar.gz)"
  if [ "$ARCH" = "arm64" ]; then
    URL="https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jdk/hotspot/normal/eclipse?project=jdk"
  else
    URL="https://api.adoptium.net/v3/binary/latest/21/ga/mac/x64/jdk/hotspot/normal/eclipse?project=jdk"
  fi
  curl -fL "$URL" -o "$TMP"
  rm -rf "$JDK_DIR"
  mkdir -p "$JDK_DIR"
  tar -xzf "$TMP" -C "$JDK_DIR" --strip-components=1
  rm -f "$TMP"
  echo "    JDK 已安装到 $JDK_HOME"
else
  echo "    JDK 已就绪: $JDK_HOME"
fi

"$JDK_HOME/bin/java" -version

# 2. Android SDK
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [ ! -d "$SDK" ]; then
  echo ""
  echo "未检测到 Android SDK。"
  echo "请安装 Android Studio 并打开一次，完成 SDK 下载："
  echo "  https://developer.android.com/studio"
  echo ""
  echo "安装后在 Android Studio → Settings → Languages & Frameworks → Android SDK"
  echo "勾选 Android SDK Platform 35 与 Build-Tools 35.x"
  exit 1
fi
echo "    Android SDK: $SDK"

# 3. Xcode / CocoaPods（iOS）
if command -v xcodebuild >/dev/null 2>&1; then
  echo "    Xcode: $(xcodebuild -version | head -1)"
else
  echo "    Xcode: 未安装（iOS 打包需要，从 App Store 安装）"
fi

if command -v pod >/dev/null 2>&1; then
  echo "    CocoaPods: $(pod --version)"
else
  echo "==> 安装 CocoaPods..."
  sudo gem install cocoapods 2>/dev/null || gem install cocoapods --user-install || true
fi

# 4. 同步 Capacitor
echo "==> 同步 Capacitor 工程..."
cd "$ROOT"
npx cap sync

echo ""
echo "环境准备完成。可执行："
echo "  npm run build:android      # Android 调试 APK"
echo "  npm run open:ios           # Xcode 归档 iOS"
