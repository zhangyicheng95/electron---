/**
 * 移动端网络层：Capacitor 原生 HTTP 绕过 CORS，抖音 CDN 仅带 Referer（勿带 Origin）
 */
(function (global) {
  const QISHUI_REFERER = "https://qishui.douyin.com/";
  const MOBILE_UA =
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
  const CDN_RE = /douyin|douyinvod|bytecdn|byteicdn|snssdk|ibytedtos|toutiaovod|kuwo|sycdn/i;
  const blobCache = new Map();

  function isNative() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
  }

  function platform() {
    return global.Capacitor?.getPlatform?.() || "web";
  }

  /** Android WebView 已在原生层注入 Referer，audio 可直接用直链 */
  function supportsDirectStream() {
    return isNative() && platform() === "android";
  }

  function getHttp() {
    const cap = global.Capacitor;
    if (!cap) return null;
    return cap.Plugins?.CapacitorHttp || cap.Plugins?.Http || null;
  }

  function nativeHttpRequest(options) {
    const cap = global.Capacitor;
    const http = getHttp();
    if (http && typeof http.request === "function") {
      return http.request(options);
    }
    if (cap && typeof cap.nativePromise === "function") {
      return cap.nativePromise("CapacitorHttp", "request", options);
    }
    return null;
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label || "请求"}超时 (${Math.round(ms / 1000)}s)`)), ms)
      ),
    ]);
  }

  function needsReferer(url) {
    try {
      return CDN_RE.test(new URL(url).hostname);
    } catch (_) {
      return false;
    }
  }

  function cdnHeaders(url) {
    if (!needsReferer(url)) return {};
    return {
      Referer: QISHUI_REFERER,
      "User-Agent": MOBILE_UA,
    };
  }

  function base64ToBlob(base64, mime) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime || "application/octet-stream" });
  }

  function pickContentType(headers, url) {
    let mime = "application/octet-stream";
    if (headers) {
      mime = (headers["content-type"] || headers["Content-Type"] || mime).split(";")[0].trim();
    }
    if (mime === "video/mp4" && url && /m4a|audio|mime_type=audio/i.test(url)) {
      return "audio/mp4";
    }
    if (url && /\.mp3/i.test(url)) return "audio/mpeg";
    return mime;
  }

  async function nativeRequest(url, responseType) {
    const req = nativeHttpRequest({
      url,
      method: "GET",
      headers: cdnHeaders(url),
      responseType,
      connectTimeout: 60000,
      readTimeout: 180000,
    });
    if (!req) throw new Error("CapacitorHttp 不可用");

    const res = await withTimeout(req, 180000, "下载");

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  }

  function normalizeHeaders(headers) {
    const out = {};
    if (!headers) return out;
    for (const [k, v] of Object.entries(headers)) {
      out[String(k).toLowerCase()] = v;
    }
    return out;
  }

  function headerValue(headers, name) {
    if (!headers) return null;
    if (typeof headers.get === "function") {
      return headers.get(name) || headers.get(name.toLowerCase());
    }
    const key = String(name).toLowerCase();
    return headers[key] ?? headers[name] ?? null;
  }

  async function headLength(url) {
    const res = await netFetch(url, { method: "HEAD" });
    if (!res.ok) return null;
    const raw = headerValue(res.headers, "content-length");
    const len = raw ? Number(raw) : NaN;
    return Number.isFinite(len) ? len : null;
  }

  async function netFetch(url, init) {
    if (isNative()) {
      const method = ((init && init.method) || "GET").toUpperCase();
      const headers = { ...cdnHeaders(url) };
      if (init && init.headers) {
        const extra = new Headers(init.headers);
        extra.forEach((v, k) => {
          headers[k] = v;
        });
      }
      delete headers.Origin;
      delete headers.origin;

      const req = nativeHttpRequest({
        url,
        method,
        headers,
        data: init && init.body ? init.body : undefined,
        responseType: "text",
        connectTimeout: 60000,
        readTimeout: 120000,
      });

      if (req) {
        const res = await withTimeout(req, 120000, "网络请求");

        return {
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          headers: normalizeHeaders(res.headers),
          async text() {
            return typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
          },
          async json() {
            if (typeof res.data === "string") return JSON.parse(res.data);
            return res.data;
          },
          async blob() {
            if (typeof res.data === "string" && res.data.length > 0) {
              try {
                return base64ToBlob(res.data, pickContentType(res.headers, url));
              } catch (_) {
                return new Blob([res.data], { type: "text/plain" });
              }
            }
            return new Blob([res.data ?? ""], { type: "text/plain" });
          },
        };
      }
    }

    const headers = new Headers((init && init.headers) || {});
    if (needsReferer(url)) {
      if (!headers.has("Referer")) headers.set("Referer", QISHUI_REFERER);
    }
    const resp = await fetch(url, { ...(init || {}), headers });
    return {
      ok: resp.ok,
      status: resp.status,
      headers: normalizeHeaders(Object.fromEntries(resp.headers.entries())),
      text: () => resp.text(),
      json: () => resp.json(),
      blob: () => resp.blob(),
    };
  }

  async function downloadBlob(url) {
    if (blobCache.has(url)) return blobCache.get(url);

    let blob;
    if (isNative()) {
      const res = await nativeRequest(url, "arraybuffer");
      blob = base64ToBlob(res.data, pickContentType(res.headers, url));
    } else {
      const res = await netFetch(url);
      if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`);
      blob = await res.blob();
    }

    blobCache.set(url, blob);
    return blob;
  }

  async function playableUrl(url) {
    if (!url) return url;
    if (supportsDirectStream() && needsReferer(url)) return url;
    if (!isNative() || !needsReferer(url)) return url;
    const blob = await downloadBlob(url);
    return URL.createObjectURL(blob);
  }

  global.MobileNet = {
    isNative,
    platform,
    supportsDirectStream,
    needsReferer,
    netFetch,
    headLength,
    downloadBlob,
    playableUrl,
  };
})(window);
