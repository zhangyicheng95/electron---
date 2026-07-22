package com.qishui.downloader;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private static final String REFERER = "https://qishui.douyin.com/";
    private static final String UA =
        "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    private boolean refererClientReady = false;

    /** 仅对媒体 CDN 域名注入 Referer，不能匹配 URL 查询参数里的 douyin.com */
    private static boolean needsReferer(String url) {
        if (url == null || url.isEmpty()) return false;
        if (url.contains("/_capacitor_http_interceptor_")) return false;
        if (url.contains("/_capacitor_file_")) return false;
        if (url.contains("/_capacitor_content_")) return false;

        try {
            String host = new URL(url).getHost();
            if (host == null) return false;
            host = host.toLowerCase(Locale.ROOT);
            return host.endsWith("douyinvod.com")
                || host.endsWith("douyin.com")
                || host.contains("bytecdn.cn")
                || host.contains("byteicdn.com")
                || host.contains("snssdk.com")
                || host.contains("ibytedtos.com")
                || host.contains("toutiaovod.com")
                || host.endsWith("kuwo.cn")
                || host.contains("sycdn.kuwo.cn");
        } catch (Exception ignored) {
            return false;
        }
    }

    private static String guessMime(String url, String contentType) {
        if (contentType != null && !contentType.isEmpty()) {
            return contentType.split(";")[0].trim();
        }
        String u = url.toLowerCase(Locale.ROOT);
        if (u.contains(".mp3")) return "audio/mpeg";
        if (u.contains(".m4a") || u.contains("audio") || u.contains("mime_type=audio")) {
            return "audio/mp4";
        }
        return "application/octet-stream";
    }

    @Override
    protected void load() {
        super.load();
        setupRefererWebViewClient();
    }

    private void setupRefererWebViewClient() {
        if (refererClientReady) return;
        Bridge bridge = getBridge();
        if (bridge == null) return;

        bridge.setWebViewClient(
            new BridgeWebViewClient(bridge) {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    if (needsReferer(url)) {
                        HttpURLConnection conn = null;
                        try {
                            conn = (HttpURLConnection) new URL(url).openConnection();
                            conn.setInstanceFollowRedirects(true);
                            conn.setConnectTimeout(30000);
                            conn.setReadTimeout(120000);

                            Map<String, String> reqHeaders = request.getRequestHeaders();
                            if (reqHeaders != null) {
                                for (Map.Entry<String, String> entry : reqHeaders.entrySet()) {
                                    String key = entry.getKey();
                                    if ("origin".equalsIgnoreCase(key)) continue;
                                    if ("referer".equalsIgnoreCase(key)) continue;
                                    conn.setRequestProperty(key, entry.getValue());
                                }
                            }

                            conn.setRequestProperty("Referer", REFERER);
                            conn.setRequestProperty("User-Agent", UA);
                            conn.connect();

                            int code = conn.getResponseCode();
                            String mime = guessMime(url, conn.getContentType());
                            String encoding = conn.getContentEncoding();
                            InputStream stream = code >= 400 ? conn.getErrorStream() : conn.getInputStream();

                            if (code >= 200 && code < 400 && stream != null) {
                                Map<String, String> headers = new HashMap<>();
                                headers.put("Access-Control-Allow-Origin", "*");
                                return new WebResourceResponse(mime, encoding, code, "OK", headers, stream);
                            }
                        } catch (Exception ignored) {
                            if (conn != null) conn.disconnect();
                        }
                    }
                    return super.shouldInterceptRequest(view, request);
                }
            }
        );

        refererClientReady = true;
    }
}
