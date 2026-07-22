/**
 * 卡密工具：管理员密码 + 带过期时间的签名临时卡密（离线可校验）
 * 临时卡密格式：QS1.<payloadBase64url>.<sigBase64url>
 */
(function (global) {
  const ADMIN_PASSWORD = "ZHUANGSHILGM";
  const SIGN_SECRET = "qishui-downloader:" + ADMIN_PASSWORD;
  const PREFIX = "QS1";

  const AUTH_STORAGE_KEY = "qishui_auth_token";
  const ADMIN_STORAGE_KEY = "qishui_admin_token";
  const AUTH_TOKEN = "ok";
  const ADMIN_TOKEN = "admin";
  const HISTORY_STORAGE_KEY = "qishui_temp_key_history";

  function normalizeKey(value) {
    return String(value || "").trim();
  }

  function isAdminPassword(value) {
    return normalizeKey(value).toUpperCase() === ADMIN_PASSWORD;
  }

  function toBase64Url(bytes) {
    let bin = "";
    const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromBase64Url(str) {
    const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function utf8(str) {
    return new TextEncoder().encode(str);
  }

  async function importHmacKey() {
    return crypto.subtle.importKey(
      "raw",
      utf8(SIGN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }

  async function signPayload(payloadB64) {
    const key = await importHmacKey();
    const sig = await crypto.subtle.sign("HMAC", key, utf8(payloadB64));
    return toBase64Url(sig);
  }

  async function verifyPayload(payloadB64, sigB64) {
    const key = await importHmacKey();
    const sig = fromBase64Url(sigB64);
    return crypto.subtle.verify("HMAC", key, sig, utf8(payloadB64));
  }

  function randomId() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes);
  }

  /**
   * @param {number} expiresAtMs 过期时间戳（毫秒）
   * @returns {Promise<string>}
   */
  async function generateTempKey(expiresAtMs) {
    const exp = Math.floor(Number(expiresAtMs));
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      throw new Error("过期时间必须晚于当前时间");
    }
    const payload = JSON.stringify({ e: exp, r: randomId() });
    const payloadB64 = toBase64Url(utf8(payload));
    const sigB64 = await signPayload(payloadB64);
    return `${PREFIX}.${payloadB64}.${sigB64}`;
  }

  /**
   * @param {string} cardKey
   * @returns {Promise<{ ok: boolean, expiresAt?: number, reason?: string }>}
   */
  async function verifyTempKey(cardKey) {
    const raw = normalizeKey(cardKey);
    const parts = raw.split(".");
    if (parts.length !== 3 || parts[0] !== PREFIX) {
      return { ok: false, reason: "卡密格式无效" };
    }
    const [, payloadB64, sigB64] = parts;
    try {
      const validSig = await verifyPayload(payloadB64, sigB64);
      if (!validSig) return { ok: false, reason: "卡密无效" };

      const json = new TextDecoder().decode(fromBase64Url(payloadB64));
      const data = JSON.parse(json);
      const expiresAt = Number(data && data.e);
      if (!Number.isFinite(expiresAt)) return { ok: false, reason: "卡密数据损坏" };
      if (Date.now() >= expiresAt) {
        return { ok: false, reason: "卡密已过期", expiresAt };
      }
      return { ok: true, expiresAt };
    } catch (_) {
      return { ok: false, reason: "卡密无效" };
    }
  }

  function grantUserSession() {
    sessionStorage.setItem(AUTH_STORAGE_KEY, AUTH_TOKEN);
  }

  function grantAdminSession() {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, ADMIN_TOKEN);
    grantUserSession();
  }

  function clearSessions() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  }

  function hasUserSession() {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === AUTH_TOKEN;
  }

  function hasAdminSession() {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY) === ADMIN_TOKEN;
  }

  function formatTime(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(list) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  }

  function pushHistory(entry) {
    const list = loadHistory();
    list.unshift(entry);
    saveHistory(list);
  }

  global.QishuiCardKey = {
    ADMIN_PASSWORD,
    AUTH_STORAGE_KEY,
    ADMIN_STORAGE_KEY,
    AUTH_TOKEN,
    ADMIN_TOKEN,
    isAdminPassword,
    generateTempKey,
    verifyTempKey,
    grantUserSession,
    grantAdminSession,
    clearSessions,
    hasUserSession,
    hasAdminSession,
    formatTime,
    loadHistory,
    saveHistory,
    pushHistory,
  };
})(window);
