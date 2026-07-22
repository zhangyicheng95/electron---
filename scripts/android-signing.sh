#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE="$ANDROID_DIR/release.keystore"
PROPS="$ANDROID_DIR/keystore.properties"
ALIAS="qishui-downloader"

# shellcheck source=scripts/mobile-env.sh
source "$ROOT/scripts/mobile-env.sh"

if [ -f "$KEYSTORE" ] && [ -f "$PROPS" ]; then
  echo "签名文件已存在: $KEYSTORE"
  exit 0
fi

PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)"

echo "==> 生成 Android 发布签名..."
"$JAVA_HOME/bin/keytool" -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" \
  -dname "CN=下载神器, OU=Mobile, O=QishuiDownloader, C=CN"

cat > "$PROPS" <<EOF
storeFile=release.keystore
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF

chmod 600 "$PROPS" "$KEYSTORE"

echo ""
echo "已生成："
echo "  密钥库: $KEYSTORE"
echo "  配置:   $PROPS"
echo ""
echo "请妥善备份以上文件，以后更新 App 必须用同一套签名。"
echo "密码已写入 keystore.properties（已加入 .gitignore，不会提交到 Git）。"
