#!/usr/bin/env bash
# 移动端打包环境变量（项目内 JDK + 本机 Android SDK）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export JAVA_HOME="${JAVA_HOME:-$ROOT/.tools/jdk-21/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "未找到 JDK 21，请先运行: npm run mobile:setup"
  exit 1
fi

if [ ! -d "$ANDROID_HOME" ]; then
  echo "未找到 Android SDK，请安装 Android Studio 并安装 SDK"
  echo "下载: https://developer.android.com/studio"
  exit 1
fi
