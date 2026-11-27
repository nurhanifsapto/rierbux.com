#!/usr/bin/env node
/**
 * RIERBUX.COM All-in-One CLI & Automation Bot
 * (Login + Official API v1 + Web REST + Next.js Server Actions + Auto-Refresh Action IDs + Checkout)
 *
 * Semua fitur dalam 1 file (gaya & UX mirip idv.js):
 *  1. Auto-Login BetterAuth (email/password) + support Paste Cookie / Copy as cURL (Google OAuth)
 *  2. Auto-Relogin otomatis jika .session kosong atau expired
 *  3. Cek Saldo RierCoins, Mutasi Transaksi, & Top Up RierCoins (Duitku)
 *  4. Cek Stok Real-Time semua handler (robux-manual, robux-5d, robux-instant, robux-transfer, private-server)
 *  5. Katalog Produk Lengkap (162+ Game Pass/Item, Robux 5 Hari/Instan/Transfer, Private Server) + sync ke products.json
 *  6. Validasi Username Roblox, Cari Game Private Server, & Verifikasi Game Pass (Robux 5 Hari)
 *  7. Keranjang (Cart) Multi-Item & Direct Checkout + Bayar RierCoins (fee Rp 0) atau Duitku (QRIS/VA/E-Wallet)
 *  8. Auto-Refresh Next.js Server Action IDs dari JS bundle jika rierbux.com update deploy
 *  9. Riwayat Pesanan, Detail & Live Watch Order (RB-...), Cancel Unpaid, Retry Failed, & Official API Key (rb_...)
 *
 * Cara pakai CLI:
 *   node rierbux.js                                                     → Menu interaktif lengkap
 *   node rierbux.js login [--email <e> --password <p> | --cookie]       → Login & simpan .session
 *   node rierbux.js logout                                              → Logout resmi & hapus .session
 *   node rierbux.js balance [--tx [limit]]                              → Cek saldo RierCoins (+ mutasi)
 *   node rierbux.js stock                                               → Cek stok real-time semua handler
 *   node rierbux.js list [--search <q>] [--method <m>]                  → Daftar semua produk
 *   node rierbux.js items <slug|robux-5-hari|robux-instan|robux-transfer> → Daftar varian & item produk
 *   node rierbux.js sync [--all]                                        → Sync katalog lengkap ke products.json
 *   node rierbux.js roblox <username>                                   → Cek validitas username Roblox
 *   node rierbux.js games <query>                                       → Cari game Roblox (Private Server)
 *   node rierbux.js ps <rootPlaceId>                                    → Detail & harga Private Server
 *   node rierbux.js buy --slug <slug> --item <id> --roblox <u> [opts]   → Checkout (default DRY-RUN, tambah --confirm)
 *   node rierbux.js cart [list|add|remove|clear|checkout]               → Kelola keranjang & checkout multi-item
 *   node rierbux.js topup --amount <nominal> --pm <id> [--confirm]      → Top up saldo RierCoins via Duitku
 *   node rierbux.js orders [limit] [--status paid|unpaid]               → Lihat riwayat pesanan
 *   node rierbux.js order <RB-...> [--watch|--pay balance|--cancel]     → Detail, bayar, atau batalkan order
 *   node rierbux.js apikey [create [name] | set <rb_...> | revoke <id>] → Kelola Official API Key (/api/v1)
 *   node rierbux.js refresh-actions                                     → Refresh Next-Action hash terbaru dari live JS
 *
 * Bisa juga di-import sebagai module:
 *   const { RierBuxBot } = require("./rierbux.js");
 */

const fs = require("fs");
const path = require("path");
const dns = require("dns");
const readline = require("readline");

// Hindari IPv6 ConnectTimeoutError
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

// Load .env (pakai dotenv jika terpasang, atau built-in fallback agar jalan tanpa npm install)
(function loadEnv() {
  try {
    require("dotenv").config();
    return;
  } catch {}
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
})();

// ─── Konfigurasi & Paths ─────────────────────────────────────────────────────
const BASE_URL = (process.env.RIERBUX_BASE_URL || "https://rierbux.com").replace(/\/+$/, "");
const DATA_DIR = process.env.RIERBUX_DATA_DIR ? path.resolve(process.env.RIERBUX_DATA_DIR) : __dirname;
const SESSION_PATH = path.resolve(DATA_DIR, ".session");
const ACTION_CACHE_PATH = path.resolve(DATA_DIR, ".action-cache.json");
const PRODUCTS_PATH = path.resolve(__dirname, "products.json");
const TRANSACTIONS_PATH = path.resolve(DATA_DIR, "transactions.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36";

// Default Next.js Server Action IDs (live-verified; otomatis di-refresh dari JS chunks bila berubah)
const DEFAULT_ACTION_IDS = {
  // Cart
  addToCartAction: "7f208747d1bc496ab8b9f1fdddfeb90fe8d770a0f1",
  addLimitedToCartAction: "7f02c86f2914e78a73adae4245d36785a82a95b613",
  updateCartQuantityAction: "7f05b2443f535a7cc32d5cd945b0bc5325fad19a1e",
  removeFromCartAction: "7ff560b1c19a5ec60632c31cd7952de8732fb05f6a",
  removeMultipleFromCartAction: "7f4ec4ccf03b1fc8ff6b340def2e746c8989983eef",
  checkoutCartAction: "7f727300449a34afb464ad1aa3688489e4a444eed3",

  // Direct Checkout
  checkoutProductAction: "7fe1d28a09756407da6fad2efffdaaa35fd2bb9f87",
  checkoutTopupAction: "7f5174b68d9349f044b28dcb54fd3ce37750bfc054",
  checkoutInstantAction: "7f7bf1e4348e25f76c70f109a9c20cb124a5df442a",
  checkoutTransferAction: "7f938e85291e70aae0d7548e63de737bf0efd6089e",
  checkoutLimitedAction: "7f6d0e1dacc61c3d5374c999f35550e521b98f3baa",

  // Game Pass Verification (Robux 5 Hari)
  checkGamePassAction: "7faa0d7da08fd30227fbb39535d70b742f6f0a72e7",
  checkGamePassByIdAction: "7fead0b7e8dfab3f16e300321377b40907569cf943",

  // Order Payment & Lifecycle
  validatePromoCodeAction: "7f1dd9678be64a8a36b7d17947b13b544aeec4b835",
  payWithBalanceAction: "7f8ede284642c3ea0a0a9e25fae6e9303e07f7bf65",
  createPaymentAction: "7fee7ff305d73bd85fa7006d44b0c2369d2c94e772",
  cancelUnpaidOrderAction: "7f317dee41f9013a6fd578ea59cec2dea153cabf4a",
  retryFailedItemAction: "7f9b7995c0c11309c939654d915ab012e02018acd0",
  exportOrdersCsvAction: "7f850b65ea35ae21c451c1357eccf18f0a85348faa",

  // RierCoins
  createTopupWithPaymentAction: "7f644eb98ca2fb47fb236fa3ff6e238afc67dbf031",
  exportTransactionsCsvAction: "7f92f826e4878cde1ca39e5b94f8be9f7455619f21",

  // API Keys
  createApiKeyAction: "7f7b6773b27eae6e0e0659fd71c967d269d14bae90",
  revokeApiKeyAction: "7fd4b602e34711b710ac4dd0e52bf7d107c7214bc5",

  // Private Server Management
  regenerateLinkAction: "7ffdf857f197721680eedecacd0d171487c4bd79b4",
  shutdownPrivateServerAction: "7f92a15cda18d64100341286fa958efb6a278eda95",
  addPrivateServerUserAction: "7fbbcdd1b978f6e8422f0c0d34837b1383cba490f8",
  removePrivateServerUserAction: "7f023fdec55d490874297ceb11c7de4f891b5ad9d8",

  // Membership & Setup
  createMembershipOrderAction: "7f43eaba45d00e714d2e08eb6f95565f331272959f",
  payMembershipWithBalanceAction: "7fb1c5e64ae5a5688093e585b8ca8906cedab03ac1",
  whatsAppSetupAction: "7f807081606783e3080b1017f888c7909f8a321036",
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtRp(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "-";
  return "Rp " + Math.round(Number(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function fmtNum(num) {
  if (num === null || num === undefined) return "∞";
  return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function toUploadUrl(p) {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://uploads.rierbux.com/${s.replace(/^\/+/, "")}`;
}

function fmtWIB(input = new Date()) {
  if (!input) return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value || "00";
  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}:${get("second")} WIB`;
}

function saveTransactionLog(entry) {
  let logs = [];
  if (fs.existsSync(TRANSACTIONS_PATH)) {
    try {
      logs = JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, "utf-8"));
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
  }
  logs.unshift({
    saved_at: new Date().toISOString(),
    saved_wib: fmtWIB(),
    ...entry,
  });
  fs.mkdirSync(path.dirname(TRANSACTIONS_PATH), { recursive: true });
  fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify(logs, null, 2));
}

// ─── CookieJar ───────────────────────────────────────────────────────────────
class CookieJar {
  constructor(initial = "") {
    this.map = new Map();
    if (initial) this.addCookieHeader(initial);
  }

  addCookieHeader(cookieStr) {
    for (const part of String(cookieStr || "").split(";")) {
      const idx = part.indexOf("=");
      if (idx <= 0) continue;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (k) this.map.set(k, v);
    }
  }

  addSetCookies(setCookieHeaders) {
    if (!Array.isArray(setCookieHeaders)) return;
    for (const sc of setCookieHeaders) {
      const first = String(sc).split(";")[0];
      const idx = first.indexOf("=");
      if (idx <= 0) continue;
      const k = first.slice(0, idx).trim();
      const v = first.slice(idx + 1).trim();
      if (!k) continue;
      if (v === "" || /Max-Age=0/i.test(sc)) {
        this.map.delete(k);
      } else {
        this.map.set(k, v);
      }
    }
  }

  get(name) {
    return this.map.get(name) || null;
  }

  toHeader() {
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  size() {
    return this.map.size;
  }
}

/** Ekstrak cookie dari input bebas: Cookie header, Copy as cURL, atau nilai __Secure-rierbux.session_token saja */
function extractCookiesFromInput(rawInput) {
  let s = String(rawInput || "").trim();
  if (!s) return "";

  const curlCookie =
    s.match(/-H\s+["']cookie:\s*([^"']+)["']/i) ||
    s.match(/(?:-b|--cookie)\s+["']([^"']+)["']/i);
  if (curlCookie) {
    s = curlCookie[1].trim();
  }

  s = s.replace(/^cookie:\s*/i, "").trim();

  // Jika user cuma paste nilai token tanpa nama cookie
  if (!s.includes("=")) {
    return `__Secure-rierbux.session_token=${s}`;
  }
  return s;
}

// ─── RSC / Next.js Flight Parsers ────────────────────────────────────────────

/** Gabungkan semua payload RSC dari HTML (`self.__next_f.push([1,"..."])`) atau raw RSC response */
function extractRscText(raw) {
  const str = String(raw || "");
  if (!str.includes("__next_f.push")) return str;

  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    try {
      chunks.push(JSON.parse(`"${m[1]}"`));
    } catch {
      chunks.push(m[1]);
    }
  }
  return chunks.length ? chunks.join("") : str;
}

/** Ekstrak JSON object/array seimbang dimulai dari index `start` (`{` atau `[`) */
function extractBalancedJson(str, start) {
  if (start < 0 || start >= str.length) return null;
  const open = str[start];
  const close = open === "{" ? "}" : open === "[" ? "]" : null;
  if (!close) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = str.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Cari semua nilai JSON untuk key tertentu di dalam payload RSC */
function findAllJsonValuesByKey(rscText, keyName) {
  const results = [];
  const needle = `"${keyName}":`;
  let pos = 0;
  while (true) {
    const idx = rscText.indexOf(needle, pos);
    if (idx === -1) break;
    const valStart = idx + needle.length;
    const ch = rscText[valStart];
    if (ch === "{" || ch === "[") {
      const parsed = extractBalancedJson(rscText, valStart);
      if (parsed !== null) results.push(parsed);
    }
    pos = valStart + 1;
  }
  return results;
}

/** Parse CSV sederhana (dengan support tanda kutip) */
function parseCsv(csvText) {
  const clean = String(csvText || "").replace(/^\uFEFF/, "").trim();
  if (!clean) return [];
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

/** Parse response Next.js Server Action (`text/x-component` + `x-action-redirect`) */
function parseServerActionResponse(res, rawText) {
  const redirectHeader = res.headers.get("x-action-redirect") || "";
  const redirectUrl = redirectHeader ? redirectHeader.split(";")[0].trim() : null;

  const lines = String(rawText || "").split("\n");
  const chunks = {};
  let textPayload = null;

  for (const line of lines) {
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const id = line.slice(0, colon);
    const body = line.slice(colon + 1);

    // Format text besar RSC: 2:T<hexlen>,<content>
    const tMatch = body.match(/^T([0-9a-fA-F]+),([\s\S]*)$/);
    if (tMatch) {
      textPayload = tMatch[2];
      chunks[id] = textPayload;
      continue;
    }
    try {
      chunks[id] = JSON.parse(body);
    } catch {
      chunks[id] = body;
    }
  }

  // Ambil hasil action utama (biasanya chunk "1")
  let result = chunks["1"] !== undefined ? chunks["1"] : null;

  // Resolusi referensi "$2" untuk text/CSV besar
  if (result && typeof result === "object" && result.data && typeof result.data === "object") {
    for (const [k, v] of Object.entries(result.data)) {
      if (typeof v === "string" && v.startsWith("$")) {
        const refId = v.slice(1);
        if (chunks[refId] !== undefined) result.data[k] = chunks[refId];
      }
    }
  }

  // Cek NEXT_REDIRECT di RSC error/digest jika header tidak terisi
  let finalRedirect = redirectUrl;
  if (!finalRedirect) {
    const digestMatch = String(rawText || "").match(/NEXT_REDIRECT;(?:push|replace);([^;"\\]+);/);
    if (digestMatch) finalRedirect = digestMatch[1];
  }

  // Cek apakah textPayload adalah CSV penuh (multi-line)
  if (textPayload && rawText.includes("\n")) {
    const tIdx = rawText.indexOf(textPayload);
    if (tIdx >= 0) {
      // Ambil sisa stream sampai sebelum chunk berikutnya jika ada
      const tail = rawText.slice(tIdx);
      const nextChunkIdx = tail.search(/\n[0-9a-f]+:\{/);
      const fullText = nextChunkIdx > 0 ? tail.slice(0, nextChunkIdx) : tail;
      if (result && result.data && typeof result.data.csv === "string") {
        result.data.csv = fullText;
      } else {
        textPayload = fullText;
      }
    }
  }

  return {
    status: res.status,
    redirectUrl: finalRedirect,
    data: result?.data ?? (result && !result.serverError && !result.validationErrors ? result : null),
    serverError: result?.serverError || null,
    validationErrors: result?.validationErrors || null,
    rawChunks: chunks,
    textPayload,
    rawText,
  };
}

function formatValidationErrors(ve) {
  if (!ve || typeof ve !== "object") return "";
  const parts = [];
  for (const [k, v] of Object.entries(ve)) {
    if (k === "_errors" && Array.isArray(v) && v.length) {
      parts.push(v.join(", "));
    } else if (v && typeof v === "object" && Array.isArray(v._errors) && v._errors.length) {
      parts.push(`${k}: ${v._errors.join(", ")}`);
    } else if (v && typeof v === "object") {
      const nested = formatValidationErrors(v);
      if (nested) parts.push(`${k}.${nested}`);
    }
  }
  return parts.join(" | ");
}

// ─── RierBuxBot Class ────────────────────────────────────────────────────────
class RierBuxBot {
  constructor(opts = {}) {
    this.baseUrl = (opts.baseUrl || BASE_URL).replace(/\/+$/, "");
    this.email = opts.email || process.env.RIERBUX_EMAIL || "";
    this.password = opts.password || process.env.RIERBUX_PASSWORD || "";
    this.apiKey = opts.apiKey || process.env.RIERBUX_API_KEY || "";
    this.sessionPath = opts.sessionPath || SESSION_PATH;
    this.actionCachePath = opts.actionCachePath || ACTION_CACHE_PATH;

    this.session = null;
    this.jar = new CookieJar();
    this.actionIds = { ...DEFAULT_ACTION_IDS };

    this.loadActionCache();
    this.loadSession();

    // Inject cookie dari env jika belum ada .session
    if (!this.jar.size() && process.env.RIERBUX_SESSION_COOKIES) {
      const cleaned = extractCookiesFromInput(process.env.RIERBUX_SESSION_COOKIES);
      if (cleaned) {
        this.jar.addCookieHeader(cleaned);
        this.session = { cookies: this.jar.toHeader(), user: null, apiKey: this.apiKey || null, loginAt: new Date().toISOString() };
      }
    }
  }

  // ── Session & Action Cache Management ─────────────────────────────────────
  loadSession() {
    if (!fs.existsSync(this.sessionPath)) return null;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.sessionPath, "utf-8"));
      this.session = parsed;
      this.jar = new CookieJar(parsed.cookies || "");
      if (!this.apiKey && parsed.apiKey) this.apiKey = parsed.apiKey;
      return parsed;
    } catch {
      return null;
    }
  }

  saveSession(data) {
    const merged = {
      ...(this.session || {}),
      ...data,
      cookies: data.cookies !== undefined ? data.cookies : this.jar.toHeader(),
      apiKey: data.apiKey !== undefined ? data.apiKey : (this.apiKey || this.session?.apiKey || null),
      updatedAt: new Date().toISOString(),
    };
    this.session = merged;
    if (merged.cookies) this.jar = new CookieJar(merged.cookies);
    if (merged.apiKey) this.apiKey = merged.apiKey;
    fs.mkdirSync(path.dirname(this.sessionPath), { recursive: true });
    fs.writeFileSync(this.sessionPath, JSON.stringify(merged, null, 2));
    return merged;
  }

  clearSession() {
    this.session = null;
    this.jar = new CookieJar();
    if (fs.existsSync(this.sessionPath)) {
      fs.unlinkSync(this.sessionPath);
    }
  }

  loadActionCache() {
    if (!fs.existsSync(this.actionCachePath)) return;
    try {
      const cached = JSON.parse(fs.readFileSync(this.actionCachePath, "utf-8"));
      if (cached?.actions && typeof cached.actions === "object") {
        this.actionIds = { ...DEFAULT_ACTION_IDS, ...cached.actions };
      }
    } catch {}
  }

  saveActionCache(map) {
    this.actionIds = { ...this.actionIds, ...map };
    fs.mkdirSync(path.dirname(this.actionCachePath), { recursive: true });
    fs.writeFileSync(
      this.actionCachePath,
      JSON.stringify({ updatedAt: new Date().toISOString(), actions: this.actionIds }, null, 2)
    );
  }

  // ── Low-Level HTTP Helpers ────────────────────────────────────────────────
  baseHeaders(extra = {}) {
    const h = {
      "user-agent": USER_AGENT,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      ...extra,
    };
    const cookieHeader = this.jar.toHeader();
    if (cookieHeader && !h.cookie) h.cookie = cookieHeader;
    return h;
  }

  absorbSetCookies(res) {
    const sc = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    if (sc && sc.length) {
      this.jar.addSetCookies(sc);
      if (this.session) {
        this.saveSession({ cookies: this.jar.toHeader() });
      }
    }
  }

  async fetchJson(urlPath, { method = "GET", body, headers = {}, requireAuth = false, _retried = false } = {}) {
    if (requireAuth) await this.ensureAuth();
    const fullUrl = urlPath.startsWith("http") ? urlPath : `${this.baseUrl}${urlPath}`;
    const res = await fetch(fullUrl, {
      method,
      headers: this.baseHeaders({
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        origin: this.baseUrl,
        referer: `${this.baseUrl}/`,
        ...headers,
      }),
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
    this.absorbSetCookies(res);

    if (res.status === 401 && requireAuth && !_retried && this.email && this.password) {
      await this.loginWithEmail(this.email, this.password);
      return this.fetchJson(urlPath, { method, body, headers, requireAuth, _retried: true });
    }

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { ok: res.ok, status: res.status, json, text, res };
  }

  async fetchV1(urlPath, query = {}) {
    if (!this.apiKey) throw new Error("RIERBUX_API_KEY belum diset.");
    const u = new URL(`${this.baseUrl}${urlPath}`);
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        v.forEach((item) => u.searchParams.append(k, String(item)));
      } else {
        u.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(u.toString(), {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.apiKey}`,
        "user-agent": USER_AGENT,
      },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const errCode = json?.error?.code || res.status;
      const errMsg = json?.error?.message || `HTTP ${res.status}`;
      const err = new Error(`API v1 error (${errCode}): ${errMsg}`);
      err.status = res.status;
      err.code = errCode;
      throw err;
    }
    return json;
  }

  async fetchPageRsc(pagePath, { requireAuth = false, _retried = false } = {}) {
    if (requireAuth) await this.ensureAuth();
    const fullUrl = pagePath.startsWith("http") ? pagePath : `${this.baseUrl}${pagePath}`;
    const res = await fetch(fullUrl, {
      headers: this.baseHeaders({
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        referer: `${this.baseUrl}/`,
      }),
      redirect: "manual",
    });
    this.absorbSetCookies(res);

    // Jika di-redirect ke /login, sesi expired!
    const loc = res.headers.get("location") || "";
    if (res.status >= 300 && res.status < 400 && loc.includes("/login")) {
      if (requireAuth && !_retried && this.email && this.password) {
        await this.loginWithEmail(this.email, this.password);
        return this.fetchPageRsc(pagePath, { requireAuth, _retried: true });
      }
      throw new Error(`Sesi tidak valid / diarahkan ke ${loc}. Jalankan 'node rierbux.js login'.`);
    }

    // Follow non-login redirects if any
    if (res.status >= 300 && res.status < 400 && loc) {
      return this.fetchPageRsc(loc, { requireAuth, _retried: true });
    }

    const html = await res.text();
    if (!res.ok) {
      throw new Error(`Gagal memuat halaman ${pagePath} (HTTP ${res.status})`);
    }
    return { html, rsc: extractRscText(html), status: res.status };
  }

  // ── Next.js Server Action Engine + Auto-Refresh ───────────────────────────
  async refreshActionIds(pages = [
    "/",
    "/products/fish-it",
    "/topup/robux-5-hari",
    "/topup/robux-instan",
    "/topup/robux-transfer",
    "/private-servers/2753915549",
    "/limiteds/bighead",
    "/membership",
    "/cart",
    "/coins",
    "/orders",
    "/settings/api",
  ]) {
    const chunkUrls = new Set();
    for (const p of pages) {
      try {
        const res = await fetch(`${this.baseUrl}${p}`, {
          headers: this.baseHeaders({ accept: "text/html" }),
        });
        const html = await res.text();
        const matches = html.match(/\/_next\/static\/chunks\/[a-zA-Z0-9._\-/]+\.js/g) || [];
        matches.forEach((u) => chunkUrls.add(u));
      } catch {}
    }

    const found = {};
    const re = /createServerReference\)\("([0-9a-f]{40,42})"[^)]*?"([A-Za-z0-9_]+Action)"\)/g;
    const urlArr = [...chunkUrls];

    // Fetch JS chunks secara paralel dalam batch 8
    for (let i = 0; i < urlArr.length; i += 8) {
      const batch = urlArr.slice(i, i + 8);
      await Promise.all(
        batch.map(async (chunkPath) => {
          try {
            const res = await fetch(`${this.baseUrl}${chunkPath}`, {
              headers: { "user-agent": USER_AGENT },
            });
            if (!res.ok) return;
            const js = await res.text();
            let m;
            while ((m = re.exec(js)) !== null) {
              found[m[2]] = m[1];
            }
          } catch {}
        })
      );
    }

    if (Object.keys(found).length > 0) {
      this.saveActionCache(found);
    }
    return { scannedChunks: urlArr.length, foundCount: Object.keys(found).length, found };
  }

  async callServerAction(pagePath, actionName, inputObj, { requireAuth = true, _retriedAuth = false, _retriedAction = false } = {}) {
    if (requireAuth) await this.ensureAuth();
    const actionId = this.actionIds[actionName];
    if (!actionId) {
      throw new Error(`Action ID untuk '${actionName}' tidak ditemukan. Jalankan 'node rierbux.js refresh-actions'.`);
    }

    const fullUrl = `${this.baseUrl}${pagePath}`;
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: this.baseHeaders({
        accept: "text/x-component",
        "content-type": "text/plain;charset=UTF-8",
        "next-action": actionId,
        origin: this.baseUrl,
        referer: fullUrl,
      }),
      body: JSON.stringify([inputObj === undefined ? "$undefined" : inputObj]),
    });
    this.absorbSetCookies(res);

    const rawText = await res.text();

    // Deteksi stale Next-Action setelah RierBux redeploy
    const isStaleAction =
      res.status === 404 ||
      /Failed to find Server Action|was not found on the server/i.test(rawText);
    if (isStaleAction && !_retriedAction) {
      console.log(`🔄 Action ID '${actionName}' kadaluarsa (web baru update). Auto-refresh dari JS bundle...`);
      await this.refreshActionIds([pagePath, "/products/fish-it", "/cart", "/coins", "/orders"]);
      return this.callServerAction(pagePath, actionName, inputObj, {
        requireAuth,
        _retriedAuth,
        _retriedAction: true,
      });
    }

    const parsed = parseServerActionResponse(res, rawText);

    // Cek error sesi expired / unauthenticated
    const isAuthErr =
      res.status === 401 ||
      (parsed.redirectUrl && parsed.redirectUrl.includes("/login")) ||
      /unauthorized|silakan login|masuk dulu|belum login/i.test(String(parsed.serverError || ""));
    if (isAuthErr && requireAuth && !_retriedAuth && this.email && this.password) {
      await this.loginWithEmail(this.email, this.password);
      return this.callServerAction(pagePath, actionName, inputObj, {
        requireAuth,
        _retriedAuth: true,
        _retriedAction,
      });
    }

    if (parsed.serverError) {
      const err = new Error(parsed.serverError);
      err.actionResponse = parsed;
      throw err;
    }
    if (parsed.validationErrors) {
      const msg = formatValidationErrors(parsed.validationErrors) || JSON.stringify(parsed.validationErrors);
      const err = new Error(`Validasi gagal: ${msg}`);
      err.actionResponse = parsed;
      throw err;
    }
    if (!res.ok && !parsed.redirectUrl) {
      throw new Error(`Server Action '${actionName}' gagal (HTTP ${res.status}): ${rawText.slice(0, 200)}`);
    }
    return parsed;
  }

  // ── 1. Authentication (BetterAuth) ────────────────────────────────────────
  async getSession() {
    const r = await this.fetchJson("/api/auth/get-session");
    if (!r.ok || !r.json || !r.json.user) return null;
    return r.json;
  }

  async loginWithEmail(email = this.email, password = this.password) {
    if (!email || !password) {
      throw new Error("Email & password wajib diisi (set RIERBUX_EMAIL & RIERBUX_PASSWORD di .env atau pakai --email / --password).");
    }
    this.jar = new CookieJar();
    const res = await fetch(`${this.baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: this.baseUrl,
        referer: `${this.baseUrl}/login`,
        "user-agent": USER_AGENT,
      },
      body: JSON.stringify({ email, password, rememberMe: true }),
    });
    this.absorbSetCookies(res);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`Login gagal (${data?.code || res.status}): ${data?.message || JSON.stringify(data)}`);
    }

    const sessCheck = await this.getSession();
    const saved = this.saveSession({
      cookies: this.jar.toHeader(),
      sessionToken: this.jar.get("__Secure-rierbux.session_token"),
      user: sessCheck?.user || data?.user || { email },
      sessionExpiresAt: sessCheck?.session?.expiresAt || null,
      loginAt: new Date().toISOString(),
    });
    return saved;
  }

  async loginWithCookie(rawCookieInput) {
    const cookies = extractCookiesFromInput(rawCookieInput);
    if (!cookies) throw new Error("Input cookie kosong.");
    this.jar = new CookieJar(cookies);
    const sess = await this.getSession();
    if (!sess || !sess.user) {
      this.jar = new CookieJar();
      throw new Error("Cookie tidak valid atau sudah expired (/api/auth/get-session mengembalikan null).");
    }
    return this.saveSession({
      cookies: this.jar.toHeader(),
      sessionToken: this.jar.get("__Secure-rierbux.session_token"),
      user: sess.user,
      sessionExpiresAt: sess.session?.expiresAt || null,
      loginAt: new Date().toISOString(),
    });
  }

  async ensureAuth() {
    if (this.jar.size() > 0) {
      // Cek expire lokal jika tercatat
      if (this.session?.sessionExpiresAt) {
        const expMs = new Date(this.session.sessionExpiresAt).getTime();
        if (!Number.isNaN(expMs) && expMs > Date.now() + 60_000) return true;
      } else {
        return true;
      }
    }
    if (this.email && this.password) {
      await this.loginWithEmail(this.email, this.password);
      return true;
    }
    throw new Error("Belum login! Jalankan 'node rierbux.js login' atau isi RIERBUX_EMAIL & RIERBUX_PASSWORD di .env.");
  }

  async logout() {
    let status = null;
    if (this.jar.size() > 0) {
      const r = await this.fetchJson("/api/auth/sign-out", { method: "POST", body: {} }).catch(() => null);
      status = r?.status || null;
    }
    this.clearSession();
    return { ok: true, status };
  }

  // ── 2. Official API Key (/settings/api & /api/v1) ─────────────────────────
  async createApiKey(name = "RierBux CLI") {
    const cleanName = String(name || "RierBux CLI").trim().slice(0, 32);
    const res = await this.callServerAction("/settings/api", "createApiKeyAction", { name: cleanName });
    const key = res.data?.key || res.data?.apiKey || res.data?.rawKey || null;
    if (key) {
      this.apiKey = key;
      this.saveSession({ apiKey: key });
    }
    return res.data;
  }

  async revokeApiKey(keyId) {
    const res = await this.callServerAction("/settings/api", "revokeApiKeyAction", { keyId: String(keyId) });
    return res.data;
  }

  async listApiKeys() {
    const { rsc } = await this.fetchPageRsc("/settings/api", { requireAuth: true });
    const lists = findAllJsonValuesByKey(rsc, "apiKeys");
    if (lists.length) return lists[0];
    const keys2 = findAllJsonValuesByKey(rsc, "keys");
    return keys2[0] || [];
  }

  // ── 3. Saldo RierCoins, Mutasi & Top Up ───────────────────────────────────
  async getCoinsPageData({ topupPage = 1 } = {}) {
    const qs = topupPage > 1 ? `?topupPage=${Number(topupPage)}` : "";
    const { rsc } = await this.fetchPageRsc(`/coins${qs}`, { requireAuth: true });

    // Parse saldo: pola `"children":"603 RC"` atau `"603 RC"`
    let riercoins = null;
    const rcMatch = rsc.match(/"children":"([\d.,]+)\s*RC"/);
    if (rcMatch) {
      riercoins = parseInt(rcMatch[1].replace(/[^\d]/g, ""), 10);
    }

    const paymentMethodsList = findAllJsonValuesByKey(rsc, "paymentMethods");
    const paymentMethods = (paymentMethodsList.find((a) => Array.isArray(a) && a.length > 0) || []).map((pm) => ({
      ...pm,
      imageUrl: toUploadUrl(pm.imagePath),
    }));

    const topupsList = findAllJsonValuesByKey(rsc, "topups");
    const rawTopups = topupsList.find((a) => Array.isArray(a)) || [];
    const topups = rawTopups.map((t) => ({
      ...t,
      createdAt: typeof t.createdAt === "string" ? t.createdAt.replace(/^\$D/, "") : t.createdAt,
      paymentExpiredAt: typeof t.paymentExpiredAt === "string" ? t.paymentExpiredAt.replace(/^\$D/, "") : t.paymentExpiredAt,
    }));

    // Cari pagination topups di sekitar key `"topups":[`
    let totalPages = 1;
    const tpIdx = rsc.indexOf('"topups":[');
    if (tpIdx !== -1) {
      const sliceAfter = rsc.slice(tpIdx, tpIdx + 12000);
      const tpMatch = sliceAfter.match(/"totalPages":(\d+)/);
      if (tpMatch) totalPages = Number(tpMatch[1]) || 1;
    }

    return {
      riercoins,
      paymentMethods,
      topups,
      topupPagination: {
        page: Number(topupPage) || 1,
        totalPages,
        hasNextPage: Number(topupPage) < totalPages,
        hasPrevPage: Number(topupPage) > 1,
      },
    };
  }

  async getBalance() {
    if (this.apiKey) {
      try {
        const res = await this.fetchV1("/api/v1/riercoins");
        return { riercoins: res.data.riercoins, source: "api_v1" };
      } catch (err) {
        if (err.code !== "invalid_api_key" && err.code !== "missing_api_key") throw err;
      }
    }
    const page = await this.getCoinsPageData();
    return { riercoins: page.riercoins, source: "rsc", paymentMethods: page.paymentMethods, topups: page.topups };
  }

  async getCoinTransactions({ page = 1, limit = 20, type } = {}) {
    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(100, Number(limit) || 20));
    if (this.apiKey) {
      const res = await this.fetchV1("/api/v1/riercoins/transactions", { page: pg, limit: lim, type });
      const p = res.data.pagination || {};
      return {
        transactions: res.data.transactions || [],
        pagination: {
          page: p.page || pg,
          limit: p.limit || lim,
          totalItems: p.totalItems ?? (res.data.transactions || []).length,
          totalPages: p.totalPages || 1,
          hasNextPage: Boolean(p.hasNextPage),
          hasPrevPage: (p.page || pg) > 1,
        },
        source: "api_v1",
      };
    }
    // Fallback CSV export via Server Action (punya seluruh riwayat mutasi!)
    const res = await this.callServerAction("/coins", "exportTransactionsCsvAction", {
      type: type || "$undefined",
      date: "$undefined",
      fromDate: "$undefined",
      toDate: "$undefined",
    });
    const csv = res.data?.csv || res.textPayload || "";
    const rows = parseCsv(csv);
    const allTx = rows.map((r) => ({
      createdAt: r["Tanggal"] || "",
      type: r["Tipe"] || "",
      amount: parseInt(String(r["Jumlah"] || "0").replace(/[^\d\-]/g, ""), 10) || 0,
      description: r["Deskripsi"] || "",
      orderId: (r["ID Pesanan"] || "").replace(/^#/, "") || null,
    }));
    const totalItems = allTx.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / lim));
    const start = (pg - 1) * lim;
    return {
      transactions: allTx.slice(start, start + lim),
      pagination: {
        page: pg,
        limit: lim,
        totalItems,
        totalPages,
        hasNextPage: pg < totalPages,
        hasPrevPage: pg > 1,
      },
      csv,
      source: "csv_action",
    };
  }

  async topupCoins({ amount, paymentMethodId }) {
    const numAmt = parseInt(String(amount).replace(/[^\d]/g, ""), 10);
    if (!numAmt || numAmt < 1000) throw new Error("Nominal topup tidak valid.");
    const res = await this.callServerAction("/coins", "createTopupWithPaymentAction", {
      amount: String(numAmt),
      paymentMethodId: Number(paymentMethodId),
    });
    return {
      amount: numAmt,
      paymentMethodId: Number(paymentMethodId),
      paymentUrl: res.redirectUrl || res.data?.paymentUrl || null,
      raw: res.data,
    };
  }

  // ── 4. Stok Real-Time & Katalog Produk ────────────────────────────────────
  async getStock() {
    const r = await this.fetchJson("/api/products/robux-stock");
    if (!r.ok || !r.json?.data) throw new Error(`Gagal cek stok (HTTP ${r.status})`);
    return r.json.data;
  }

  async getStoreNotice() {
    const r = await this.fetchJson("/api/store/notice");
    return r.json?.data || null;
  }

  async getV1Products({ page = 1, limit = 100, deliveryMethod, product, search, available } = {}) {
    const res = await this.fetchV1("/api/v1/products", { page, limit, deliveryMethod, product, search, available });
    return res.data;
  }

  async getAllV1Products(filters = {}) {
    const all = [];
    let page = 1;
    while (true) {
      const data = await this.getV1Products({ ...filters, page, limit: 100 });
      if (Array.isArray(data.products)) all.push(...data.products);
      if (!data.pagination?.hasNextPage) break;
      page++;
    }
    return all;
  }

  /** Ambil daftar semua 162+ produk dari halaman /products (publik, tanpa perlu API key) */
  async getStoreProductsList() {
    const { rsc } = await this.fetchPageRsc("/products", { requireAuth: false });

    // Cari array `products` di RSC
    const arrays = findAllJsonValuesByKey(rsc, "products");
    const best = arrays.find((a) => Array.isArray(a) && a.length > 5 && a[0]?.slug);
    if (best) {
      return best.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category || p.gameName || null,
        itemCount: p.itemCount ?? p.itemsCount ?? null,
        minPrice: p.minPrice ?? p.lowestPrice ?? null,
        maxPrice: p.maxPrice ?? null,
        totalSold: p.totalSold ?? null,
        monthlySold: p.monthlySold ?? null,
        isPopular: Boolean(p.isPopular),
        isActive: p.isActive ?? true,
        thumbnailPath: p.thumbnailPath || p.imagePath || null,
        thumbnailUrl: toUploadUrl(p.thumbnailPath || p.imagePath),
      }));
    }

    // Fallback: ekstrak link `/products/<slug>` + judul terdekat
    const map = new Map();
    const slugRe = /"href":"\/products\/([a-z0-9\-]+)"/g;
    let m;
    while ((m = slugRe.exec(rsc)) !== null) {
      const slug = m[1];
      if (!slug || slug.startsWith("opengraph")) continue;
      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          name: slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        });
      }
    }
    return [...map.values()];
  }

  /** Ambil detail produk beserta semua variasi & item dari `/products/<slug>` atau `/topup/<slug>` */
  async getProductDetail(slugOrType) {
    const clean = String(slugOrType || "").trim().toLowerCase();
    const isTopup = ["robux-5-hari", "robux-instan", "robux-transfer"].includes(clean);
    const pagePath = isTopup ? `/topup/${clean}` : `/products/${clean}`;

    // Parse langsung dari SSR/RSC halaman produk (selalu punya imagePath/icon setiap item!)
    // Jika dipanggil dengan preferIcons=false dan ada API key, bisa pakai /api/v1/products
    if (this.apiKey && !clean.startsWith("robux-") && false) {
      try {
        const query = isTopup ? { deliveryMethod: clean, limit: 100 } : { product: clean, limit: 100 };
        const items = await this.getAllV1Products(query);
        if (items.length > 0) {
          const byVar = new Map();
          for (const it of items) {
            const vName = it.variation || "Default";
            if (!byVar.has(vName)) byVar.set(vName, []);
            byVar.get(vName).push({
              id: it.id,
              name: it.name,
              unitPrice: it.unitPrice,
              price: it.price,
              robuxPrice: it.robuxPrice,
              minQuantity: it.minQuantity,
              maxQuantity: it.maxQuantity,
              stock: it.stock,
              available: it.available,
              unavailableReason: it.unavailableReason,
              deliveryMethod: it.deliveryMethod,
              isPreorder: Boolean(it.preorder),
              preorder: it.preorder,
            });
          }
          return {
            slug: clean,
            pagePath,
            name: items[0].product?.name || clean,
            isTopup,
            source: "api_v1",
            variations: [...byVar.entries()].map(([name, list]) => ({ name, items: list })),
            allItems: items,
          };
        }
      } catch {}
    }

    // Parse langsung dari SSR/RSC halaman produk
    const { rsc } = await this.fetchPageRsc(pagePath, { requireAuth: false });

    // Cari judul dari JSON-LD schema.org
    let productName = clean;
    const ldMatch = rsc.match(/"@type":"Product","name":"([^"]+)"/);
    if (ldMatch) productName = ldMatch[1];

    // Cari object `value` yang berisi `productSlug` atau `variations`
    const variationsCandidates = findAllJsonValuesByKey(rsc, "variations");
    let variations = variationsCandidates.find(
      (v) => Array.isArray(v) && v.length > 0 && (Array.isArray(v[0].items) || Array.isArray(v[0].productItems))
    );

    // Beberapa halaman topup menaruh item langsung di `items` atau `item`
    const allItems = [];
    if (variations) {
      variations = variations.map((v) => {
        const rawItems = v.items || v.productItems || [];
        const norm = rawItems.map((it) => ({
          id: it.id,
          name: it.name,
          variation: v.name || "Default",
          imagePath: it.imagePath || null,
          imageUrl: toUploadUrl(it.imagePath),
          unitPrice: it.unitPrice ?? it.price ?? 0,
          price: it.price ?? it.unitPrice ?? 0,
          robuxPrice: it.robuxPrice ?? null,
          minQuantity: it.minQuantity ?? 1,
          maxQuantity: it.maxQuantity ?? null,
          stock: it.stock ?? null,
          handler: it.handler ?? null,
          available: it.stock === null || it.stock === undefined ? true : it.stock > 0,
          isPreorder: Boolean(it.isPreorder),
          totalSold: it.totalSold ?? null,
        }));
        allItems.push(...norm);
        return { id: v.id, name: v.name || "Default", items: norm };
      });
    } else {
      const itemsCandidates = findAllJsonValuesByKey(rsc, "items");
      const rawItems = itemsCandidates.find((a) => Array.isArray(a) && a.length > 0 && a[0]?.id && a[0]?.unitPrice !== undefined) || [];
      const singleItems = [
        ...findAllJsonValuesByKey(rsc, "robuxItem"),
        ...findAllJsonValuesByKey(rsc, "transferItem"),
        ...findAllJsonValuesByKey(rsc, "item"),
      ].filter((o) => o && typeof o === "object" && o.id && o.unitPrice !== undefined);
      const merged = rawItems.length ? rawItems : singleItems;
      const seen = new Set();
      for (const it of merged) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        const derivedName =
          it.name ||
          it.productVariation?.product?.name ||
          productName;
        if (it.productVariation?.product?.name && productName === clean) {
          productName = it.productVariation.product.name;
        }
        allItems.push({
          id: it.id,
          name: derivedName,
          variation: it.productVariation?.name || "Default",
          imagePath: it.imagePath || null,
          imageUrl: toUploadUrl(it.imagePath || (clean === "robux-5-hari" ? "product-item-images/20261124-1723-ND9Q1MIAI72SS.svg" : clean === "robux-transfer" ? "product-item-images/20261124-1723-C85ST7XYSPN2F.svg" : null)),
          unitPrice: it.unitPrice ?? it.price ?? 0,
          price: it.price ?? it.unitPrice ?? 0,
          robuxPrice: it.robuxPrice ?? null,
          minQuantity: it.minQuantity ?? 1,
          maxQuantity: it.maxQuantity ?? null,
          stock: it.stock ?? null,
          handler: it.handler ?? (clean === "robux-5-hari" ? "robux-5d" : clean),
          available: it.stock === null || it.stock === undefined ? true : it.stock > 0,
          isPreorder: Boolean(it.isPreorder),
        });
      }
      variations = allItems.length ? [{ name: "Default", items: allItems }] : [];
    }

    return {
      slug: clean,
      pagePath,
      name: productName,
      isTopup,
      source: "rsc",
      variations,
      allItems,
    };
  }

  /** Ambil 60 game populer Private Server lengkap dengan thumbnail, productItemId & harga */
  async getPopularPrivateServers() {
    const { rsc } = await this.fetchPageRsc("/private-servers", { requireAuth: false });
    const lists = findAllJsonValuesByKey(rsc, "initialGames");
    const games = lists.find((a) => Array.isArray(a) && a.length > 0 && a[0]?.rootPlaceId) || [];
    return games.map((g) => ({
      universeId: g.universeId,
      rootPlaceId: String(g.rootPlaceId),
      name: g.name,
      creatorName: g.creatorName || "",
      thumbnailUrl: toUploadUrl(g.thumbnailUrl),
      enabled: g.enabled !== false,
      priceRobux: g.priceRobux ?? g.pricing?.robuxPrice ?? null,
      productItemId: g.pricing?.productItemId ?? null,
      unitPrice: g.pricing?.unitPrice ?? 0,
      stock: g.pricing?.stock ?? null,
      soldCount: g.soldCount ?? 0,
    }));
  }

  /** Ambil daftar semua Item Limiteds beserta tag filter, icon, stok & harga */
  async getLimitedsList() {
    const { rsc } = await this.fetchPageRsc("/limiteds", { requireAuth: false });
    const tagLists = findAllJsonValuesByKey(rsc, "filterTags");
    const filterTags = tagLists.find((a) => Array.isArray(a) && a.length > 0) || [];
    const itemLists = findAllJsonValuesByKey(rsc, "items");
    const rawItems = itemLists.find((a) => Array.isArray(a) && a.length > 0 && a[0]?.assetId && a[0]?.slug) || [];

    const items = rawItems.map((it) => {
      // Resolusi tag reference RSC ("$...:filterTags:1") ke nama tag bila ada
      const resolvedTags = (it.tags || [])
        .map((t) => {
          if (t && typeof t === "object" && t.slug) return t.slug;
          const m = typeof t === "string" && t.match(/filterTags:(\d+)$/);
          if (m && filterTags[Number(m[1])]) return filterTags[Number(m[1])].slug;
          return null;
        })
        .filter(Boolean);
      return {
        slug: it.slug,
        name: it.name,
        assetId: it.assetId,
        imagePath: it.imagePath || null,
        imageUrl: toUploadUrl(it.imagePath),
        unitPrice: it.unitPrice ?? 0,
        price: it.unitPrice ?? 0,
        readyStockCount: it.readyStockCount ?? 0,
        holdingStockCount: it.holdingStockCount ?? 0,
        holdingTradeableAt: it.holdingTradeableAt || null,
        totalSold: it.totalSold ?? 0,
        monthlySold: it.monthlySold ?? 0,
        isPreorder: Boolean(it.isPreorder),
        available: (it.readyStockCount ?? 0) > 0 || Boolean(it.isPreorder),
        tags: resolvedTags,
      };
    });

    return { filterTags, items };
  }

  /** Detail 1 Item Limited (/limiteds/<slug>) termasuk Rolimons RAP/Value & harga ready/preorder */
  async getLimitedDetail(slug) {
    const clean = String(slug || "").trim().toLowerCase();
    const { rsc } = await this.fetchPageRsc(`/limiteds/${encodeURIComponent(clean)}`, { requireAuth: false });
    const itemObjs = findAllJsonValuesByKey(rsc, "item");
    const it = itemObjs.find((o) => o && typeof o === "object" && o.slug === clean && o.assetId) || null;
    if (!it) throw new Error(`Item Limited '${clean}' tidak ditemukan.`);
    return {
      slug: it.slug,
      name: it.name,
      assetId: it.assetId,
      imageUrl: toUploadUrl(it.imagePath),
      rolimonsRap: it.rolimonsRap ?? null,
      rolimonsValue: it.rolimonsValue ?? null,
      readyStocks: it.readyStocks || null,
      holdingStocks: it.holdingStocks || null,
      preorder: it.preorder || null,
      totalSold: it.totalSold ?? 0,
    };
  }

  /** Cek small limiteds di inventory akun Roblox user untuk trade Limited */
  async getRobloxInventory(robloxUserId) {
    const r = await this.fetchJson(`/api/roblox/inventory?robloxUserId=${encodeURIComponent(robloxUserId)}`, {
      requireAuth: true,
    });
    if (!r.ok || !r.json) throw new Error(`Gagal cek inventory Roblox (HTTP ${r.status})`);
    return r.json.data ?? r.json;
  }

  async addLimitedToCart({ slug, robloxUsername, robloxUserId, robloxDisplayName, smallAssetId, smallUaid, smallName, isPreorder = false }) {
    const res = await this.callServerAction(`/limiteds/${slug}`, "addLimitedToCartAction", {
      slug: String(slug),
      robloxUsername: String(robloxUsername),
      robloxUserId: Number(robloxUserId),
      robloxDisplayName: String(robloxDisplayName || robloxUsername),
      smallAssetId: Number(smallAssetId),
      smallUaid: Number(smallUaid),
      smallName: String(smallName),
      isPreorder: Boolean(isPreorder),
    });
    return res.data;
  }

  async checkoutLimited({ slug, robloxUsername, robloxUserId, robloxDisplayName, smallAssetId, smallUaid, smallName, isPreorder = false, expectedTotal }) {
    const res = await this.callServerAction(`/limiteds/${slug}`, "checkoutLimitedAction", {
      slug: String(slug),
      robloxUsername: String(robloxUsername),
      robloxUserId: Number(robloxUserId),
      robloxDisplayName: String(robloxDisplayName || robloxUsername),
      smallAssetId: Number(smallAssetId),
      smallUaid: Number(smallUaid),
      smallName: String(smallName),
      isPreorder: Boolean(isPreorder),
      expectedTotal: Number(expectedTotal),
    });
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  /** Cari game Roblox untuk Private Server */
  async searchPrivateServerGames(query) {
    const r = await this.fetchJson(`/api/roblox/games/search?q=${encodeURIComponent(query)}`, { requireAuth: true });
    if (!r.ok || !r.json?.data) throw new Error(`Gagal cari game (HTTP ${r.status}): ${r.json?.error || ""}`);
    return r.json.data;
  }

  /** Detail & harga Private Server berdasarkan rootPlaceId */
  async getPrivateServerDetail(rootPlaceId) {
    const pagePath = `/private-servers/${rootPlaceId}`;
    const { rsc } = await this.fetchPageRsc(pagePath, { requireAuth: false });

    const items = [];
    const variations = findAllJsonValuesByKey(rsc, "variations").find(
      (v) => Array.isArray(v) && v.length > 0 && (v[0].items || v[0].productItems)
    );
    if (variations) {
      for (const v of variations) {
        for (const it of v.items || v.productItems || []) {
          items.push({
            id: it.id,
            name: it.name,
            variation: v.name || "Private Server",
            unitPrice: it.unitPrice ?? it.price ?? 0,
            robuxPrice: it.robuxPrice ?? null,
            minQuantity: it.minQuantity ?? 1,
            maxQuantity: it.maxQuantity ?? 1,
            stock: it.stock ?? null,
            handler: it.handler || "private-server",
          });
        }
      }
    }
    if (!items.length) {
      const pidMatch = rsc.match(/"productItemId":(\d+)/);
      const priceMatch = rsc.match(/"expectedTotal":(\d+)/) || rsc.match(/"unitPrice":(\d+)/);
      const nameMatch = rsc.match(/"gameName":"([^"]+)"/) || rsc.match(/"itemName":"([^"]+)"/);
      if (pidMatch) {
        items.push({
          id: Number(pidMatch[1]),
          name: nameMatch ? nameMatch[1] : `Private Server ${rootPlaceId}`,
          variation: "Private Server",
          unitPrice: priceMatch ? Number(priceMatch[1]) : 0,
          minQuantity: 1,
          maxQuantity: 1,
          handler: "private-server",
        });
      }
    }
    return { rootPlaceId: String(rootPlaceId), pagePath, items };
  }

  // ── 5. Roblox Validation & Game Pass Check ────────────────────────────────
  async checkRobloxUsername(username, requireRobloxPlus = false) {
    const clean = String(username || "").trim().replace(/^@+/, "");
    if (!clean) throw new Error("Username Roblox kosong.");
    if (clean.length < 3 || clean.length > 20 || /^_|_$|__/.test(clean) || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      return { valid: false, user: null, message: "Format username Roblox tidak valid (3-20 karakter, huruf/angka/underscore, tanpa __)." };
    }
    const r = await this.fetchJson(
      `/api/roblox/check-username?robloxUsername=${encodeURIComponent(clean)}&requireRobloxPlus=${requireRobloxPlus}`,
      { requireAuth: true }
    );
    if (!r.ok || !r.json?.data) {
      throw new Error(`Gagal cek username Roblox (HTTP ${r.status}): ${r.json?.error || r.text.slice(0, 150)}`);
    }
    return r.json.data;
  }

  async checkGamePass({ robloxUserId, robloxUsername, expectedPrice }) {
    const res = await this.callServerAction("/topup/robux-5-hari", "checkGamePassAction", {
      robloxUserId: Number(robloxUserId),
      robloxUsername: String(robloxUsername),
      expectedPrice: Number(expectedPrice),
    });
    return res.data;
  }

  async checkGamePassById({ gamePassId, expectedPrice }) {
    const res = await this.callServerAction("/topup/robux-5-hari", "checkGamePassByIdAction", {
      gamePassId: Number(gamePassId),
      expectedPrice: Number(expectedPrice),
    });
    return res.data;
  }

  // ── 6. Cart Management ────────────────────────────────────────────────────
  async getCartCount() {
    const r = await this.fetchJson("/api/cart/count", { requireAuth: true });
    return r.json?.data ?? 0;
  }

  async getCart() {
    const { rsc } = await this.fetchPageRsc("/cart", { requireAuth: true });
    const candidates = [
      ...findAllJsonValuesByKey(rsc, "cartItems"),
      ...findAllJsonValuesByKey(rsc, "items"),
    ];
    const items = candidates.find(
      (a) => Array.isArray(a) && a.length > 0 && (a[0]?.cartItemId !== undefined || a[0]?.productItemId !== undefined)
    ) || [];
    return { count: items.length, items };
  }

  async addToCart({ pagePath = "/products/fish-it", productItemId, quantity = 1, orderInputs = {} }) {
    const res = await this.callServerAction(pagePath, "addToCartAction", {
      productItemId: Number(productItemId),
      quantity: Number(quantity),
      orderInputs,
    });
    return res.data;
  }

  async updateCartQuantity(cartItemId, quantity) {
    const res = await this.callServerAction("/cart", "updateCartQuantityAction", {
      cartItemId: Number(cartItemId),
      quantity: Number(quantity),
    });
    return res.data;
  }

  async removeFromCart(cartItemId) {
    const res = await this.callServerAction("/cart", "removeFromCartAction", {
      cartItemId: Number(cartItemId),
    });
    return res.data;
  }

  async removeMultipleFromCart(cartItemIds) {
    const res = await this.callServerAction("/cart", "removeMultipleFromCartAction", {
      cartItemIds: cartItemIds.map(Number),
    });
    return res.data;
  }

  async checkoutCart({ selectedItems, expectedTotal, parentApprovalAcknowledgedFor }) {
    const payload = {
      selectedItems: selectedItems.map(Number),
      expectedTotal: Number(expectedTotal),
    };
    if (parentApprovalAcknowledgedFor) {
      payload.parentApprovalAcknowledgedFor = parentApprovalAcknowledgedFor;
    }
    const res = await this.callServerAction("/cart", "checkoutCartAction", payload);
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  // ── 7. Direct Checkout & Order Payment ────────────────────────────────────
  async checkoutProduct({ pagePath, productItemId, quantity = 1, orderInputs = {}, expectedTotal }) {
    const res = await this.callServerAction(pagePath, "checkoutProductAction", {
      productItemId: Number(productItemId),
      quantity: Number(quantity),
      orderInputs,
      expectedTotal: Number(expectedTotal),
    });
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  async checkoutTopup5Days({ productItemId, robloxUsername, robloxUserId, robloxDisplayName, gamePassId, quantity, expectedTotal }) {
    const res = await this.callServerAction("/topup/robux-5-hari", "checkoutTopupAction", {
      productItemId: Number(productItemId),
      robloxUsername: String(robloxUsername),
      robloxUserId: Number(robloxUserId),
      robloxDisplayName: String(robloxDisplayName || robloxUsername),
      gamePassId: Number(gamePassId),
      quantity: Number(quantity),
      expectedTotal: Number(expectedTotal),
    });
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  async checkoutRobuxTransfer({ productItemId, robloxUsername, robloxUserId, robloxDisplayName, quantity, expectedTotal, parentApprovalAcknowledged = true }) {
    const res = await this.callServerAction("/topup/robux-transfer", "checkoutTransferAction", {
      productItemId: Number(productItemId),
      robloxUsername: String(robloxUsername),
      robloxUserId: Number(robloxUserId),
      robloxDisplayName: String(robloxDisplayName || robloxUsername),
      quantity: Number(quantity),
      expectedTotal: Number(expectedTotal),
      parentApprovalAcknowledged: Boolean(parentApprovalAcknowledged),
    });
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  async checkoutRobuxInstant({ itemId, quantity = 1, robloxUsername, robloxPassword }) {
    const res = await this.callServerAction("/topup/robux-instan", "checkoutInstantAction", {
      itemId: Number(itemId),
      quantity: Number(quantity),
      robloxUsername: String(robloxUsername),
      robloxPassword: String(robloxPassword),
    });
    const publicId = extractOrderPublicId(res.redirectUrl) || res.data?.publicId || null;
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  async validatePromoCode(orderPublicId, promoCode) {
    const res = await this.callServerAction(`/orders/${orderPublicId}`, "validatePromoCodeAction", {
      orderPublicId: String(orderPublicId),
      promoCode: String(promoCode).trim(),
    });
    return res.data;
  }

  async payWithBalance(publicId, promoCode) {
    const payload = { publicId: String(publicId) };
    if (promoCode) payload.promoCode = String(promoCode).trim();
    const res = await this.callServerAction(`/orders/${publicId}`, "payWithBalanceAction", payload);
    return { publicId, redirectUrl: res.redirectUrl, data: res.data };
  }

  async createDuitkuPayment(publicId, paymentMethodId, promoCode) {
    const payload = {
      publicId: String(publicId),
      paymentMethodId: Number(paymentMethodId),
    };
    if (promoCode) payload.promoCode = String(promoCode).trim();
    const res = await this.callServerAction(`/orders/${publicId}`, "createPaymentAction", payload);
    return {
      publicId,
      paymentUrl: res.redirectUrl || res.data?.paymentUrl || null,
      data: res.data,
    };
  }

  async cancelUnpaidOrder(orderPublicId) {
    const res = await this.callServerAction(`/orders/${orderPublicId}`, "cancelUnpaidOrderAction", {
      orderPublicId: String(orderPublicId),
    });
    return res.data;
  }

  async retryFailedItem(publicId, orderItemId) {
    const res = await this.callServerAction(`/orders/${publicId}`, "retryFailedItemAction", {
      orderItemId: Number(orderItemId),
    });
    return res.data;
  }

  /**
   * High-level Unified Checkout Helper (mirip `bot.checkout()` di idv.js!)
   * Default `dryRun: true` agar aman. Set `dryRun: false` untuk buat order & bayar.
   */
  async buyProduct({
    type = "product", // "product" | "robux-5d" | "robux-transfer" | "robux-instant" | "private-server"
    slug,
    placeId,
    itemId,
    quantity = 1,
    robloxUsername,
    robloxPassword,
    gamePassId,
    payMethod = "balance", // "balance" (RierCoins) | "duitku" | "unpaid"
    paymentMethodId,
    promoCode,
    dryRun = true,
  }) {
    await this.ensureAuth();
    const qty = Number(quantity) || 1;

    // 1. Resolve item & harga
    let itemInfo = null;
    let pagePath = "";
    let productName = slug || type;

    if (type === "private-server") {
      if (!placeId) throw new Error("Wajib isi placeId (--place <rootPlaceId>) untuk private-server.");
      const ps = await this.getPrivateServerDetail(placeId);
      pagePath = ps.pagePath;
      itemInfo = itemId ? ps.items.find((x) => Number(x.id) === Number(itemId)) : ps.items[0];
      if (!itemInfo) throw new Error(`Item Private Server untuk place ${placeId} tidak ditemukan.`);
      productName = `Private Server (${placeId})`;
    } else {
      const targetSlug =
        type === "robux-5d"
          ? "robux-5-hari"
          : type === "robux-transfer"
          ? "robux-transfer"
          : type === "robux-instant"
          ? "robux-instan"
          : slug;
      if (!targetSlug) throw new Error("Wajib isi slug produk (--slug <slug>) atau --type robux-5d|robux-transfer|robux-instant|private-server.");
      const detail = await this.getProductDetail(targetSlug);
      pagePath = detail.pagePath;
      productName = detail.name;
      itemInfo = itemId
        ? detail.allItems.find((x) => Number(x.id) === Number(itemId))
        : detail.allItems.length === 1
        ? detail.allItems[0]
        : null;
      if (!itemInfo) {
        throw new Error(
          itemId
            ? `Item ID ${itemId} tidak ditemukan di '${targetSlug}'. Cek dengan: node rierbux.js items ${targetSlug}`
            : `Produk '${targetSlug}' punya ${detail.allItems.length} item. Pilih --item <id> (cek: node rierbux.js items ${targetSlug}).`
        );
      }
    }

    if (itemInfo.minQuantity && qty < itemInfo.minQuantity) {
      throw new Error(`Minimal quantity untuk ${itemInfo.name} adalah ${itemInfo.minQuantity}.`);
    }
    if (itemInfo.maxQuantity && qty > itemInfo.maxQuantity) {
      throw new Error(`Maksimal quantity untuk ${itemInfo.name} adalah ${itemInfo.maxQuantity}.`);
    }

    const expectedTotal = Math.round(Number(itemInfo.price ?? itemInfo.unitPrice) * qty);

    // 2. Validasi Username Roblox (kecuali private-server)
    let rbxUser = null;
    if (type !== "private-server") {
      if (!robloxUsername) throw new Error("Wajib isi username Roblox (--roblox <username>).");
      const check = await this.checkRobloxUsername(robloxUsername);
      if (!check.valid || !check.user) {
        throw new Error(`Username Roblox '${robloxUsername}' tidak valid / tidak ditemukan.`);
      }
      rbxUser = check.user;
    }

    // 3. Verifikasi Game Pass untuk Robux 5 Hari
    let resolvedGamePassId = gamePassId ? Number(gamePassId) : null;
    if (type === "robux-5d") {
      // Harga Game Pass di Roblox = ceil(qty / 0.7) karena pajak Roblox 30%
      const expectedGpPrice = Math.ceil(qty / 0.7);
      const gpRes = resolvedGamePassId
        ? await this.checkGamePassById({ gamePassId: resolvedGamePassId, expectedPrice: expectedGpPrice })
        : await this.checkGamePass({
            robloxUserId: rbxUser.id,
            robloxUsername: rbxUser.username,
            expectedPrice: expectedGpPrice,
          });
      if (!gpRes?.valid) {
        throw new Error(
          `Game Pass Robux 5 Hari tidak valid (butuh harga ${expectedGpPrice} R$): ${gpRes?.message || gpRes?.reason || JSON.stringify(gpRes)}`
        );
      }
      resolvedGamePassId = gpRes.gamePassId || resolvedGamePassId;
    }

    // 4. Cek Saldo RierCoins
    const bal = await this.getBalance();
    const saldoAwal = bal.riercoins;

    const preview = {
      type,
      pagePath,
      product: productName,
      itemId: itemInfo.id,
      itemName: itemInfo.name,
      variation: itemInfo.variation || null,
      quantity: qty,
      unitPrice: Number(itemInfo.price ?? itemInfo.unitPrice),
      expectedTotal,
      roblox: rbxUser ? { id: rbxUser.id, username: rbxUser.username, displayName: rbxUser.displayName } : null,
      gamePassId: resolvedGamePassId,
      payMethod,
      paymentMethodId: paymentMethodId || null,
      promoCode: promoCode || null,
      saldoAwal,
      saldoCukup: payMethod !== "balance" || (saldoAwal !== null && saldoAwal >= expectedTotal),
    };

    if (dryRun) {
      return { dryRun: true, preview };
    }

    if (payMethod === "balance" && saldoAwal !== null && saldoAwal < expectedTotal) {
      throw new Error(`Saldo RierCoins tidak cukup! Saldo: ${fmtNum(saldoAwal)} RC, Total: ${fmtNum(expectedTotal)} RC.`);
    }
    if (payMethod === "duitku" && !paymentMethodId) {
      throw new Error("Metode bayar 'duitku' wajib isi --pm <paymentMethodId> (cek daftar di 'node rierbux.js balance --pm').");
    }

    // 5. Step 1: Create Unpaid Order
    let created;
    if (type === "robux-5d") {
      created = await this.checkoutTopup5Days({
        productItemId: itemInfo.id,
        robloxUsername: rbxUser.username,
        robloxUserId: rbxUser.id,
        robloxDisplayName: rbxUser.displayName,
        gamePassId: resolvedGamePassId,
        quantity: qty,
        expectedTotal,
      });
    } else if (type === "robux-transfer") {
      created = await this.checkoutRobuxTransfer({
        productItemId: itemInfo.id,
        robloxUsername: rbxUser.username,
        robloxUserId: rbxUser.id,
        robloxDisplayName: rbxUser.displayName,
        quantity: qty,
        expectedTotal,
      });
    } else if (type === "robux-instant") {
      if (!robloxPassword || String(robloxPassword).length < 8) {
        throw new Error("Robux Instan wajib isi --roblox-pass (minimal 8 karakter).");
      }
      created = await this.checkoutRobuxInstant({
        itemId: itemInfo.id,
        quantity: qty,
        robloxUsername: rbxUser.username,
        robloxPassword,
      });
    } else {
      const orderInputs =
        type === "private-server"
          ? {}
          : {
              robloxUsername: rbxUser.username,
              robloxUserId: rbxUser.id,
              robloxDisplayName: rbxUser.displayName,
            };
      created = await this.checkoutProduct({
        pagePath,
        productItemId: itemInfo.id,
        quantity: qty,
        orderInputs,
        expectedTotal,
      });
    }

    if (!created.publicId) {
      throw new Error(`Order tidak menghasilkan publicId RB-...: ${JSON.stringify(created)}`);
    }

    // 6. Step 2: Optional Promo Validation + Payment
    let promoInfo = null;
    if (promoCode) {
      promoInfo = await this.validatePromoCode(created.publicId, promoCode);
    }

    let paymentResult = null;
    if (payMethod === "balance") {
      paymentResult = await this.payWithBalance(created.publicId, promoCode);
    } else if (payMethod === "duitku") {
      paymentResult = await this.createDuitkuPayment(created.publicId, paymentMethodId, promoCode);
    }

    const finalRecord = {
      publicId: created.publicId,
      orderUrl: `${this.baseUrl}/orders/${created.publicId}`,
      ...preview,
      promoInfo,
      paymentStatus: payMethod === "balance" ? "paid" : "unpaid",
      paymentUrl: paymentResult?.paymentUrl || null,
    };

    saveTransactionLog(finalRecord);
    return { dryRun: false, order: finalRecord, rawPayment: paymentResult };
  }

  // ── 8. Orders & Status ────────────────────────────────────────────────────
  async getOrders({ page = 1, limit = 20, paymentStatus, itemStatus, deliveryMethod, search, sort = "newest" } = {}) {
    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(100, Number(limit) || 20));

    if (this.apiKey) {
      try {
        const res = await this.fetchV1("/api/v1/orders", {
          page: pg,
          limit: lim,
          paymentStatus,
          itemStatus,
          deliveryMethod,
          search,
          sort,
        });
        const p = res.data.pagination || {};
        const totalItems = p.totalItems ?? (res.data.orders || []).length;
        const totalPages = p.totalPages || Math.max(1, Math.ceil(totalItems / lim));
        return {
          orders: res.data.orders || [],
          pagination: {
            page: p.page || pg,
            limit: p.limit || lim,
            totalItems,
            totalPages,
            hasNextPage: p.hasNextPage !== undefined ? Boolean(p.hasNextPage) : pg < totalPages,
            hasPrevPage: (p.page || pg) > 1,
          },
          source: "api_v1",
        };
      } catch (err) {
        if (err.code !== "invalid_api_key" && err.code !== "missing_api_key") throw err;
      }
    }

    // Fallback 1: CSV export server action (mengembalikan SEMUA riwayat order — kita paginasi bersih!)
    try {
      const csvRes = await this.callServerAction("/orders", "exportOrdersCsvAction", {
        search: search || "$undefined",
        status: paymentStatus || "$undefined",
        itemStatus: itemStatus || "$undefined",
        sort,
        productIds: "$undefined",
        handlers: "$undefined",
        date: "$undefined",
        fromDate: "$undefined",
        toDate: "$undefined",
      });
      const csv = csvRes.data?.csv || csvRes.textPayload || "";
      const rows = parseCsv(csv);
      if (rows.length > 0) {
        // Kelompokkan baris CSV yang punya ID Pesanan sama (multi-item dalam 1 order)
        const grouped = new Map();
        for (const r of rows) {
          const oid = (r["ID Pesanan"] || "").replace(/^#/, "").trim();
          if (!oid) continue;
          const itemObj = {
            product: r["Produk"] || "",
            variation: r["Varian"] || "",
            item: r["Item"] || "",
            quantity: Number(r["Jumlah"] || 1),
            unitPrice: parseInt(String(r["Harga Satuan"] || "0").replace(/[^\d]/g, ""), 10) || 0,
            netPrice: parseInt(String(r["Harga Bersih"] || r["Total Harga"] || "0").replace(/[^\d]/g, ""), 10) || 0,
            status: r["Status Item"] || "-",
            deliveredAt: r["Dikirim Pada"] || null,
            inputs: { robloxUsername: r["Username Roblox"] || "" },
          };
          if (!grouped.has(oid)) {
            grouped.set(oid, {
              id: oid,
              createdAt: r["Tanggal"] || "",
              paymentStatus: r["Status Bayar"] || "",
              total: itemObj.netPrice,
              items: [itemObj],
            });
          } else {
            const existing = grouped.get(oid);
            existing.total += itemObj.netPrice;
            existing.items.push(itemObj);
          }
        }
        const allOrders = [...grouped.values()];
        const totalItems = allOrders.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / lim));
        const safePage = Math.min(pg, totalPages);
        const start = (safePage - 1) * lim;
        return {
          orders: allOrders.slice(start, start + lim),
          pagination: {
            page: safePage,
            limit: lim,
            totalItems,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1,
          },
          csv,
          source: "csv_action",
        };
      }
    } catch {}

    // Fallback 2: /api/chat/orders
    const chatOrd = await this.fetchJson("/api/chat/orders", { requireAuth: true });
    const rawOrders = chatOrd.json?.data?.orders || [];
    const allOrders = rawOrders.map((o) => ({
      id: o.publicId,
      createdAt: o.createdAt,
      paymentStatus: o.paymentStatus,
      paidAt: o.paidAt,
      total: (o.orderItems || []).reduce((s, it) => s + Number(it.totalPrice || 0), 0),
      items: (o.orderItems || []).map((it) => ({
        id: it.id,
        product: it.productName,
        item: it.itemName,
        imageUrl: toUploadUrl(it.itemImagePath),
        quantity: it.quantity,
        status: it.status,
        netPrice: it.totalPrice,
      })),
    }));
    const totalItems = allOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / lim));
    const start = (pg - 1) * lim;
    return {
      orders: allOrders.slice(start, start + lim),
      pagination: {
        page: pg,
        limit: lim,
        totalItems,
        totalPages,
        hasNextPage: pg < totalPages,
        hasPrevPage: pg > 1,
      },
      source: "chat_orders",
    };
  }

  async getOrderDetail(publicId) {
    const cleanId = String(publicId || "").replace(/^#/, "").trim();
    if (!cleanId) throw new Error("publicId order wajib diisi (contoh: RB-R4ZEBZTUY0IB6).");

    if (this.apiKey) {
      try {
        const res = await this.fetchV1(`/api/v1/orders/${encodeURIComponent(cleanId)}`);
        return { order: res.data, source: "api_v1" };
      } catch (err) {
        if (err.code !== "invalid_api_key" && err.code !== "missing_api_key") throw err;
      }
    }

    const { rsc } = await this.fetchPageRsc(`/orders/${encodeURIComponent(cleanId)}`, { requireAuth: true });
    const ordersObj = findAllJsonValuesByKey(rsc, "order").find((o) => o && (o.publicId === cleanId || o.id));
    const paymentMethods = findAllJsonValuesByKey(rsc, "paymentMethods").find((a) => Array.isArray(a)) || [];
    return { order: ordersObj || { id: cleanId, rawFound: false }, paymentMethods, source: "rsc" };
  }

  // ── 9. Private Server Controls ────────────────────────────────────────────
  async getPrivateServerUsers(orderItemId) {
    const r = await this.fetchJson(`/api/orders/private-server-users?orderItemId=${Number(orderItemId)}`, { requireAuth: true });
    return r.json?.data || [];
  }

  async addPrivateServerUser(publicId, orderItemId, robloxUsername) {
    const res = await this.callServerAction(`/orders/${publicId}`, "addPrivateServerUserAction", {
      orderItemId: Number(orderItemId),
      robloxUsername: String(robloxUsername),
    });
    return res.data;
  }

  async removePrivateServerUser(publicId, orderItemId, robloxUserId) {
    const res = await this.callServerAction(`/orders/${publicId}`, "removePrivateServerUserAction", {
      orderItemId: Number(orderItemId),
      robloxUserId: Number(robloxUserId),
    });
    return res.data;
  }

  async regeneratePrivateServerLink(publicId, orderItemId) {
    const res = await this.callServerAction(`/orders/${publicId}`, "regenerateLinkAction", {
      orderItemId: Number(orderItemId),
    });
    return res.data;
  }

  async shutdownPrivateServer(publicId, orderItemId) {
    const res = await this.callServerAction(`/orders/${publicId}`, "shutdownPrivateServerAction", {
      orderItemId: Number(orderItemId),
    });
    return res.data;
  }
}

function extractOrderPublicId(str) {
  if (!str) return null;
  const m = String(str).match(/\/orders\/(RB-[A-Z0-9]+)/i);
  return m ? m[1] : null;
}

// ─── Catalog Sync ────────────────────────────────────────────────────────────
async function syncCatalog(bot, { fetchAllDetails = false } = {}) {
  const [stock, storeProducts] = await Promise.all([
    bot.getStock().catch(() => null),
    bot.getStoreProductsList().catch(() => []),
  ]);

  let balance = null;
  try {
    if (bot.apiKey || bot.jar.size() > 0) {
      const b = await bot.getBalance();
      balance = b.riercoins;
    }
  } catch {}

  let allItems = [];
  let source = "rsc";

  // Jika ada API Key resmi, kita dapet SELURUH item & harga dari /api/v1/products hanya dalam beberapa detik!
  if (bot.apiKey) {
    try {
      allItems = await bot.getAllV1Products();
      source = "api_v1";
    } catch (err) {
      console.log(`⚠️  /api/v1/products gagal (${err.message}), fallback ke RSC...`);
    }
  }

  // Jika tidak ada API key, ambil topup robux (3 halaman) + opsional semua detail produk jika --all
  if (allItems.length === 0) {
    const topupSlugs = ["robux-5-hari", "robux-instan", "robux-transfer"];
    for (const s of topupSlugs) {
      try {
        const d = await bot.getProductDetail(s);
        d.allItems.forEach((it) =>
          allItems.push({ ...it, product: { slug: s, name: d.name }, deliveryMethod: s })
        );
      } catch {}
    }

    if (fetchAllDetails && storeProducts.length > 0) {
      console.log(`🔄 Mengambil detail item dari ${storeProducts.length} produk (batch 6)...`);
      for (let i = 0; i < storeProducts.length; i += 6) {
        const batch = storeProducts.slice(i, i + 6);
        await Promise.all(
          batch.map(async (p) => {
            try {
              const d = await bot.getProductDetail(p.slug);
              d.allItems.forEach((it) =>
                allItems.push({ ...it, product: { slug: p.slug, name: d.name }, deliveryMethod: it.handler || "gift-in-game" })
              );
            } catch {}
          })
        );
        process.stdout.write(`   Progress: ${Math.min(i + 6, storeProducts.length)}/${storeProducts.length} produk\r`);
      }
      console.log("");
    }
  }

  // Kelompokkan item per slug produk
  const bySlug = new Map();
  for (const p of storeProducts) {
    bySlug.set(p.slug, { ...p, items: [] });
  }
  for (const it of allItems) {
    const slug = it.product?.slug || it.deliveryMethod || "unknown";
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { slug, name: it.product?.name || slug, items: [] });
    }
    bySlug.get(slug).items.push(it);
  }

  const catalog = {
    synced_at: new Date().toISOString(),
    synced_wib: fmtWIB(),
    source,
    riercoins: balance,
    stock,
    total_products: bySlug.size,
    total_items: allItems.length,
    products: [...bySlug.values()],
  };

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(catalog, null, 2));
  return catalog;
}

// ─── CLI Helpers & Printers ──────────────────────────────────────────────────
function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

function ask(rl, prompt) {
  return new Promise((resolve) => {
    if (rl.closed) return resolve("");
    const onClose = () => resolve("");
    rl.once("close", onClose);
    rl.question(prompt, (ans) => {
      rl.removeListener("close", onClose);
      resolve(ans.trim());
    });
  });
}

function formatStockOneLine(stock) {
  if (!stock) return "-";
  const map = {};
  if (stock.manual) map[stock.manual.handlerId] = stock.manual;
  for (const h of stock.handlerStocks || []) map[h.handlerId] = h;
  const f = (id, label) => {
    const h = map[id];
    if (!h) return `${label}:?`;
    const val = h.stock === null ? h.status.toUpperCase() : `${fmtNum(h.stock)}${h.status === "out" ? "(OUT)" : ""}`;
    return `${label} ${val}`;
  };
  return [
    f("robux-manual", "Manual"),
    f("robux-5d", "5D"),
    f("robux-instant", "Instan"),
    f("robux-transfer", "Transfer"),
    f("private-server", "PS"),
  ].join(" | ");
}

function printStockTable(stock) {
  console.log("\n📊 STOK REAL-TIME RIERBUX:");
  console.log("───────────────────────────────────────────────────────────");
  const all = [stock.manual, ...(stock.handlerStocks || [])].filter(Boolean);
  for (const h of all) {
    const icon = h.status === "ready" ? "✅" : "❌";
    const st = h.stock === null ? "Unlimited / Ready" : fmtNum(h.stock);
    const blk = h.purchaseBlock ? ` [BLOCKED: ${h.purchaseBlock}]` : "";
    console.log(`  ${icon} ${h.handlerId.padEnd(18)} | Status: ${h.status.toUpperCase().padEnd(6)} | Stok: ${st}${blk}`);
  }
}

function printOrdersList(orders, total) {
  console.log(`\n📜 Riwayat Pesanan (${orders.length}${total ? ` dari ${total}` : ""}):\n`);
  if (!orders.length) {
    console.log("  (Belum ada pesanan)");
    return;
  }
  for (const o of orders) {
    const id = o.id || o.publicId;
    const payIcon = o.paymentStatus === "paid" || o.paymentStatus === "Udah Dibayar" ? "✅" : o.paymentStatus === "unpaid" ? "⏳" : "⚪";
    console.log(`  ${payIcon} #${id} | ${fmtWIB(o.createdAt)} | ${o.paymentStatus} | ${fmtRp(o.total)}`);
    for (const it of o.items || []) {
      const rbx = it.inputs?.robloxUsername ? ` → @${it.inputs.robloxUsername}` : "";
      console.log(`     • ${it.product || "-"} / ${it.item || "-"} x${it.quantity || 1}${rbx} [${it.status || "-"}]`);
    }
  }
}

function printOrderDetail(order) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  📦 DETAIL PESANAN #${order.id || order.publicId}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Status Bayar  : ${order.paymentStatus || "-"}`);
  console.log(`  Metode Bayar  : ${order.paymentMethod || "-"}`);
  console.log(`  Total         : ${fmtRp(order.total)}${order.paymentFee ? ` (Fee ${fmtRp(order.paymentFee)})` : ""}`);
  console.log(`  Dibuat        : ${fmtWIB(order.createdAt)}`);
  if (order.paidAt) console.log(`  Dibayar       : ${fmtWIB(order.paidAt)}`);
  if (order.items && order.items.length) {
    console.log("\n  Items:");
    for (const it of order.items) {
      console.log(`   • [#${it.id || "-"}] ${it.product} (${it.variation || "-"}) — ${it.item} x${it.quantity}`);
      console.log(`     Harga: ${fmtRp(it.netPrice ?? it.totalPrice)} | Status: ${it.status}${it.deliveredAt ? ` (${fmtWIB(it.deliveredAt)})` : ""}`);
      if (it.inputs?.robloxUsername) console.log(`     Roblox: ${it.inputs.robloxUsername} (ID: ${it.inputs.robloxUserId || "-"})`);
      if (it.failureReason) console.log(`     Alasan Gagal: ${it.failureReason}`);
    }
  }
  console.log("═══════════════════════════════════════════════════════════\n");
}

// ─── Interactive Login Prompt ────────────────────────────────────────────────
async function promptLogin(bot, { flags = {}, existingRl = null } = {}) {
  if (flags.cookie) {
    const rl = existingRl || readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log("\n📋 Paste salah satu dari Chrome (sudah login di rierbux.com):");
      console.log("   • Nilai header `cookie:` dari DevTools Network");
      console.log("   • ATAU Copy as cURL dari request `get-session`");
      console.log("   • ATAU nilai cookie `__Secure-rierbux.session_token` saja\n");
      const raw = typeof flags.cookie === "string" ? flags.cookie : await ask(rl, "Paste di sini lalu Enter: ");
      const saved = await bot.loginWithCookie(raw);
      console.log(`✅ Cookie VALID! User: ${saved.user?.name || "-"} (${saved.user?.email || "-"})`);
      return saved;
    } finally {
      if (!existingRl) rl.close();
    }
  }

  if (flags.email && flags.password) {
    const saved = await bot.loginWithEmail(flags.email, flags.password);
    console.log(`✅ Login berhasil! User: ${saved.user?.name || "-"} (${saved.user?.email || "-"})`);
    return saved;
  }

  if (!existingRl && !process.stdin.isTTY) {
    const saved = await bot.loginWithEmail();
    console.log(`✅ Login berhasil! User: ${saved.user?.name || "-"} (${saved.user?.email || "-"})`);
    return saved;
  }

  const rl = existingRl || readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("\n🔑 Pilih Metode Login RIERBUX.COM:");
    console.log("   [1] Email & Password (otomatis dari .env atau ketik langsung)");
    console.log("   [2] Paste Cookie / Copy as cURL dari Chrome (untuk akun Google OAuth)");
    const pick = (await ask(rl, "Pilih metode (1/2, default 1): ")) || "1";

    if (pick === "2") {
      console.log("\n📋 Paste header `cookie:` / Copy as cURL / nilai `__Secure-rierbux.session_token`:");
      const raw = await ask(rl, "Paste di sini: ");
      const saved = await bot.loginWithCookie(raw);
      console.log(`✅ Cookie VALID! User: ${saved.user?.name || "-"} (${saved.user?.email || "-"})`);
      return saved;
    }

    let email = bot.email;
    let password = bot.password;
    if (email && password) {
      const useEnv = (await ask(rl, `Pakai akun .env (${email})? (y/n, default y): `)).toLowerCase();
      if (useEnv === "n" || useEnv === "no") {
        email = "";
        password = "";
      }
    }
    if (!email) email = await ask(rl, "Email RierBux : ");
    if (!password) password = await ask(rl, "Password      : ");
    console.log("🔄 Logging in ke https://rierbux.com/api/auth/sign-in/email ...");
    const saved = await bot.loginWithEmail(email, password);
    console.log(`✅ Login berhasil! User: ${saved.user?.name || "-"} (${saved.user?.email || "-"})`);
    if (saved.sessionExpiresAt) console.log(`   Berlaku s/d: ${fmtWIB(saved.sessionExpiresAt)}`);
    return saved;
  } finally {
    if (!existingRl) rl.close();
  }
}

// ─── Interactive Checkout Flow (mirip idv.js!) ───────────────────────────────
async function interactiveCheckoutFlow(bot, rl) {
  await bot.ensureAuth();
  while (true) {
    console.log("\n───────────────────────────────────────────────────────────");
    console.log("  🛒 PILIH KATEGORI PRODUK RIERBUX");
    console.log("───────────────────────────────────────────────────────────");
    console.log("  1. 🎮 Gift / Item In-Game (162+ Game — Fish It, Blox Fruits, dll)");
    console.log("  2. 💎 Top Up Robux 5 Hari (Game Pass)");
    console.log("  3. ⚡ Top Up Robux Transfer (Instan Tanpa Password)");
    console.log("  4. 🚀 Top Up Robux Instan (Login)");
    console.log("  5. 🔒 Private Server (Cari Game Roblox)");
    console.log("  0. ← Kembali ke Menu Utama");

    const cat = await ask(rl, "\nPilih kategori (0-5): ");
    if (cat === "0" || cat === "q") return;

    let type = "product";
    let slug = null;
    let placeId = null;
    let items = [];
    let productTitle = "";

    if (cat === "1") {
      type = "product";
      console.log("🔄 Memuat daftar produk...");
      const allProds = await bot.getStoreProductsList();
      const kw = await ask(rl, `Cari nama/slug game (Enter untuk lihat 30 pertama dari ${allProds.length} produk): `);
      const filtered = kw
        ? allProds.filter((p) => p.name.toLowerCase().includes(kw.toLowerCase()) || p.slug.includes(kw.toLowerCase()))
        : allProds.slice(0, 30);

      if (!filtered.length) {
        console.log("❌ Produk tidak ditemukan.");
        continue;
      }
      console.log("");
      filtered.slice(0, 40).forEach((p, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${p.name.padEnd(32)} (${p.slug})`);
      });
      console.log("   0. ← Batal");
      const pAns = await ask(rl, "\nPilih nomor produk (atau ketik slug langsung): ");
      if (pAns === "0" || !pAns) continue;
      const pIdx = parseInt(pAns, 10);
      slug = pIdx >= 1 && pIdx <= filtered.length ? filtered[pIdx - 1].slug : pAns;

      console.log(`🔄 Memuat item untuk '${slug}'...`);
      const detail = await bot.getProductDetail(slug);
      productTitle = detail.name;
      items = detail.allItems;
    } else if (cat === "2") {
      type = "robux-5d";
      const detail = await bot.getProductDetail("robux-5-hari");
      productTitle = detail.name;
      items = detail.allItems;
    } else if (cat === "3") {
      type = "robux-transfer";
      const detail = await bot.getProductDetail("robux-transfer");
      productTitle = detail.name;
      items = detail.allItems;
    } else if (cat === "4") {
      type = "robux-instant";
      const detail = await bot.getProductDetail("robux-instan");
      productTitle = detail.name;
      items = detail.allItems;
    } else if (cat === "5") {
      type = "private-server";
      const q = await ask(rl, "Cari nama game Roblox (contoh: fish it / blox fruits): ");
      if (!q) continue;
      const games = await bot.searchPrivateServerGames(q);
      if (!games.length) {
        console.log("❌ Game tidak ditemukan.");
        continue;
      }
      games.slice(0, 15).forEach((g, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${g.name.padEnd(36)} | PlaceID: ${g.rootPlaceId} | Playing: ${fmtNum(g.playerCount)}`);
      });
      const gAns = await ask(rl, "\nPilih nomor game (0 batal): ");
      const gIdx = parseInt(gAns, 10);
      if (!gIdx || gIdx < 1 || gIdx > games.length) continue;
      placeId = String(games[gIdx - 1].rootPlaceId);
      productTitle = `Private Server — ${games[gIdx - 1].name}`;
      const ps = await bot.getPrivateServerDetail(placeId);
      items = ps.items;
    } else {
      console.log("❌ Pilihan tidak valid.");
      continue;
    }

    if (!items.length) {
      console.log("❌ Tidak ada item ditemukan pada produk ini.");
      continue;
    }

    // Pilih item (kalau cuma 1, otomatis kepilih)
    let chosenItem = items[0];
    if (items.length > 1) {
      console.log(`\n📦 ${productTitle} (${items.length} item):`);
      console.log("───────────────────────────────────────────────────────────");
      items.forEach((it, i) => {
        const vTag = it.variation ? `[${it.variation}] ` : "";
        const rbxTag = it.robuxPrice ? ` (${fmtNum(it.robuxPrice)} R$)` : "";
        const stTag = it.stock !== null && it.stock !== undefined ? ` | stok:${it.stock}` : "";
        console.log(
          `  ${String(i + 1).padStart(2)}. ${vTag}${it.name.padEnd(34)} ${fmtRp(it.price ?? it.unitPrice).padStart(12)}${rbxTag}${stTag}`
        );
      });
      console.log("   0. ← Kembali");
      const iAns = await ask(rl, "\nPilih nomor item: ");
      const iIdx = parseInt(iAns, 10);
      if (!iIdx || iIdx < 1 || iIdx > items.length) continue;
      chosenItem = items[iIdx - 1];
    } else {
      console.log(`\n📦 ${productTitle} — ${chosenItem.name} (${fmtRp(chosenItem.price ?? chosenItem.unitPrice)} / unit, min:${chosenItem.minQuantity || 1})`);
    }

    // Input quantity
    const defaultQty = chosenItem.minQuantity || 1;
    const qtyStr = await ask(rl, `Jumlah / Quantity (Enter = ${defaultQty}): `);
    const quantity = parseInt(qtyStr, 10) || defaultQty;

    // Input Roblox Username / Password / GamePass
    let robloxUsername = null;
    let robloxPassword = null;
    let gamePassId = null;

    if (type !== "private-server") {
      robloxUsername = await ask(rl, "Username Roblox tujuan: ");
      if (!robloxUsername) {
        console.log("⏸️  Dibatalkan.");
        continue;
      }
      if (type === "robux-instant") {
        robloxPassword = await ask(rl, "Password Roblox (min 8 char): ");
      }
      if (type === "robux-5d") {
        const gpStr = await ask(rl, `Game Pass ID (kosongkan = auto-detect harga ${Math.ceil(quantity / 0.7)} R$): `);
        if (gpStr) gamePassId = Number(gpStr);
      }
    }

    // Pilih aksi: Bayar Langsung (RierCoins / Duitku) atau Masuk Keranjang
    console.log("\n💳 Pilih Aksi / Metode Pembayaran:");
    console.log("   [1] Beli Langsung & Bayar pakai Saldo RierCoins (Fee Rp 0)");
    console.log("   [2] Beli Langsung & Bayar pakai Duitku (QRIS / VA / E-Wallet)");
    console.log("   [3] Buat Order Unpaid Saja (bayar nanti)");
    console.log("   [4] Masukkan ke Keranjang (Cart)");
    const actPick = (await ask(rl, "Pilih (1-4, default 1): ")) || "1";

    if (actPick === "4") {
      let orderInputs = {};
      if (type !== "private-server") {
        const chk = await bot.checkRobloxUsername(robloxUsername);
        if (!chk.valid) {
          console.log(`❌ Username Roblox '${robloxUsername}' tidak ditemukan.`);
          continue;
        }
        orderInputs = {
          robloxUsername: chk.user.username,
          robloxUserId: chk.user.id,
          robloxDisplayName: chk.user.displayName,
        };
        if (gamePassId) orderInputs.gamePassId = gamePassId;
      }
      const cartRes = await bot.addToCart({
        pagePath: type === "private-server" ? `/private-servers/${placeId}` : slug ? `/products/${slug}` : `/topup/${type === "robux-5d" ? "robux-5-hari" : "robux-transfer"}`,
        productItemId: chosenItem.id,
        quantity,
        orderInputs,
      });
      console.log(`✅ Berhasil masuk keranjang!`, JSON.stringify(cartRes));
      continue;
    }

    const payMethod = actPick === "2" ? "duitku" : actPick === "3" ? "unpaid" : "balance";
    let paymentMethodId = null;

    if (payMethod === "duitku") {
      const coinsData = await bot.getCoinsPageData();
      console.log("\n🏦 Pilih Metode Pembayaran Duitku:");
      coinsData.paymentMethods.forEach((pm) => {
        const feeStr = pm.feeType === "percentage" ? `${pm.fee}%` : fmtRp(pm.fee);
        console.log(`   [${String(pm.id).padStart(2)}] ${pm.name.padEnd(32)} (${pm.group}) | Fee: ${feeStr} | Min: ${fmtRp(pm.minimumAmount)}`);
      });
      paymentMethodId = Number(await ask(rl, "Masukkan ID metode pembayaran: "));
    }

    const promoCode = (await ask(rl, "Kode Promo (Enter jika tidak ada): ")) || undefined;

    // Preview Dry-Run dulu
    console.log("\n🔄 Memvalidasi produk, username Roblox & saldo...");
    let dry;
    try {
      dry = await bot.buyProduct({
        type,
        slug,
        placeId,
        itemId: chosenItem.id,
        quantity,
        robloxUsername,
        robloxPassword,
        gamePassId,
        payMethod,
        paymentMethodId,
        promoCode,
        dryRun: true,
      });
    } catch (err) {
      console.log(`❌ Validasi gagal: ${err.message}`);
      continue;
    }

    const pv = dry.preview;
    console.log("\n📋 KONFIRMASI DETAIL ORDER:");
    console.log(`   Produk       : ${pv.product}`);
    console.log(`   Item         : [#${pv.itemId}] ${pv.itemName} x${pv.quantity}`);
    if (pv.roblox) console.log(`   Roblox       : ${pv.roblox.username} (Display: ${pv.roblox.displayName}, ID: ${pv.roblox.id})`);
    if (pv.gamePassId) console.log(`   Game Pass ID : ${pv.gamePassId}`);
    console.log(`   Total Harga  : ${fmtRp(pv.expectedTotal)}`);
    console.log(`   Saldo RC     : ${pv.saldoAwal !== null ? fmtNum(pv.saldoAwal) + " RC" : "-"} ${pv.saldoCukup ? "✅" : "❌ TIDAK CUKUP"}`);
    console.log(`   Metode Bayar : ${pv.payMethod}${pv.paymentMethodId ? ` (PM #${pv.paymentMethodId})` : ""}`);
    if (pv.promoCode) console.log(`   Kode Promo   : ${pv.promoCode}`);

    if (!pv.saldoCukup) {
      console.log("\n❌ Saldo RierCoins tidak cukup untuk transaksi ini.");
      continue;
    }

    const ok = (await ask(rl, "\n✅ Lanjut EKSEKUSI order sekarang? (y/n): ")).toLowerCase();
    if (ok !== "y" && ok !== "yes") {
      console.log("⏸️  Dibatalkan.");
      continue;
    }

    console.log("⚡ Membuat order & memproses pembayaran...");
    const res = await bot.buyProduct({
      type,
      slug,
      placeId,
      itemId: chosenItem.id,
      quantity,
      robloxUsername,
      robloxPassword,
      gamePassId,
      payMethod,
      paymentMethodId,
      promoCode,
      dryRun: false,
    });

    console.log("\n🎉 ORDER BERHASIL DIBUAT!");
    console.log(`   Order ID     : #${res.order.publicId}`);
    console.log(`   Status Bayar : ${res.order.paymentStatus}`);
    console.log(`   Link Order   : ${res.order.orderUrl}`);
    if (res.order.paymentUrl) console.log(`   Link Bayar   : ${res.order.paymentUrl}`);
    console.log(`   💾 Disimpan ke transactions.json`);
    return;
  }
}

// ─── Interactive Main Menu (mirip idv.js!) ───────────────────────────────────
async function runInteractive(bot) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      let userLabel = bot.session?.user ? `${bot.session.user.name} (${bot.session.user.email})` : "Belum Login";
      let saldoStr = "-";
      let stockStr = "-";

      try {
        const stock = await bot.getStock();
        stockStr = formatStockOneLine(stock);
      } catch {}

      if (bot.apiKey || bot.jar.size() > 0) {
        try {
          const bal = await bot.getBalance();
          if (bal.riercoins !== null && bal.riercoins !== undefined) {
            saldoStr = `${fmtNum(bal.riercoins)} RC (${fmtRp(bal.riercoins)})`;
          }
          if (!bot.session?.user && bot.jar.size() > 0) {
            const s = await bot.getSession();
            if (s?.user) {
              bot.saveSession({ user: s.user, sessionExpiresAt: s.session?.expiresAt });
              userLabel = `${s.user.name} (${s.user.email})`;
            }
          }
        } catch (err) {
          saldoStr = `⚠️ ${err.message.slice(0, 45)}`;
        }
      }

      console.log("\n═══════════════════════════════════════════════════════════════════");
      console.log(`  ⚡ RIERBUX.COM CLI | User: ${userLabel}`);
      console.log(`  💰 Saldo RierCoins : ${saldoStr}${bot.apiKey ? " [API v1 ✓]" : ""}`);
      console.log(`  📊 Stok Handler    : ${stockStr}`);
      console.log("═══════════════════════════════════════════════════════════════════");
      console.log("  1. 🛒 Beli / Checkout Produk (Game Pass, Item, Robux, Private Server)");
      console.log("  2. 🛍️  Kelola Keranjang (Cart) & Checkout Multi-Item");
      console.log("  3. 🔍 Cek Username Roblox & Cari Game Private Server");
      console.log("  4. 📊 Cek Stok Real-Time & Cari Katalog Produk");
      console.log("  5. 📜 Riwayat Pesanan & Cek Detail Order (RB-...)");
      console.log("  6. 💰 Cek Saldo, Mutasi & Top Up RierCoins");
      console.log("  7. 🔄 Sync Katalog ke products.json");
      console.log("  8. 🔑 Login / Kelola Session & Official API Key (rb_...)");
      console.log("  9. 💾 Lihat Transaksi Lokal Tersimpan (transactions.json)");
      console.log("  0. 🚪 Keluar");

      const choice = await ask(rl, "\nPilih menu (0-9): ");

      try {
        switch (choice) {
          case "1":
            await interactiveCheckoutFlow(bot, rl);
            break;

          case "2": {
            await bot.ensureAuth();
            const cart = await bot.getCart();
            console.log(`\n🛍️  Isi Keranjang (${cart.count} item):`);
            if (!cart.items.length) {
              console.log("   (Keranjang kosong)");
              break;
            }
            let total = 0;
            cart.items.forEach((it, i) => {
              const id = it.cartItemId ?? it.id;
              const sub = Number(it.totalPrice ?? (it.unitPrice || 0) * (it.quantity || 1));
              total += sub;
              console.log(`   ${i + 1}. [cartItemId=${id}] ${it.itemName || it.name || it.productItemId} x${it.quantity || 1} — ${fmtRp(sub)}`);
            });
            console.log(`   Total: ${fmtRp(total)}`);
            console.log("\n   [1] Checkout Semua & Bayar RierCoins");
            console.log("   [2] Hapus 1 Item");
            console.log("   [3] Kosongkan Semua Keranjang");
            console.log("   [0] Kembali");
            const cAct = await ask(rl, "Pilih aksi: ");
            if (cAct === "1") {
              const ok = (await ask(rl, `Checkout semua (${fmtRp(total)}) & bayar pakai RierCoins? (y/n): `)).toLowerCase();
              if (ok === "y") {
                const ids = cart.items.map((it) => it.cartItemId ?? it.id);
                const out = await bot.checkoutCart({ selectedItems: ids, expectedTotal: total });
                console.log(`📦 Order dibuat: #${out.publicId}`);
                if (out.publicId) {
                  await bot.payWithBalance(out.publicId);
                  console.log(`✅ Berhasil dibayar pakai RierCoins! Link: ${bot.baseUrl}/orders/${out.publicId}`);
                  saveTransactionLog({ publicId: out.publicId, type: "cart", total, paymentStatus: "paid" });
                }
              }
            } else if (cAct === "2") {
              const delId = await ask(rl, "Masukkan cartItemId yang mau dihapus: ");
              if (delId) {
                await bot.removeFromCart(Number(delId));
                console.log("✅ Item dihapus dari keranjang.");
              }
            } else if (cAct === "3") {
              const ids = cart.items.map((it) => it.cartItemId ?? it.id);
              await bot.removeMultipleFromCart(ids);
              console.log("✅ Keranjang dikosongkan.");
            }
            break;
          }

          case "3": {
            console.log("\n   [1] Cek Username Roblox");
            console.log("   [2] Cari Game Roblox (Private Server)");
            const sub = (await ask(rl, "Pilih (1/2, default 1): ")) || "1";
            if (sub === "2") {
              const q = await ask(rl, "Nama game Roblox: ");
              if (q) {
                const games = await bot.searchPrivateServerGames(q);
                games.slice(0, 15).forEach((g, i) => {
                  console.log(`  ${String(i + 1).padStart(2)}. ${g.name.padEnd(36)} | PlaceID: ${g.rootPlaceId} | Players: ${fmtNum(g.playerCount)}`);
                });
              }
            } else {
              const u = await ask(rl, "Username Roblox: ");
              if (u) {
                const r = await bot.checkRobloxUsername(u);
                if (r.valid && r.user) {
                  console.log(`✅ VALID | Username: ${r.user.username} | Display: ${r.user.displayName} | UserID: ${r.user.id}`);
                } else {
                  console.log(`❌ Username '${u}' tidak ditemukan.`);
                }
              }
            }
            break;
          }

          case "4": {
            const st = await bot.getStock();
            printStockTable(st);
            const kw = await ask(rl, "\nCari produk (kosongkan untuk kembali): ");
            if (kw) {
              const prods = await bot.getStoreProductsList();
              const hits = prods.filter((p) => p.name.toLowerCase().includes(kw.toLowerCase()) || p.slug.includes(kw.toLowerCase()));
              console.log(`\nDitemukan ${hits.length} produk:`);
              hits.slice(0, 30).forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p.name.padEnd(32)} (${p.slug})`));
            }
            break;
          }

          case "5": {
            console.log("\n   [1] Lihat Daftar Pesanan Terakhir");
            console.log("   [2] Cek Detail 1 Pesanan (RB-...)");
            const sub = (await ask(rl, "Pilih (1/2, default 1): ")) || "1";
            if (sub === "2") {
              const pid = await ask(rl, "Masukkan Order ID (contoh RB-R4ZEBZTUY0IB6): ");
              if (pid) {
                const det = await bot.getOrderDetail(pid);
                printOrderDetail(det.order);
              }
            } else {
              const lim = parseInt(await ask(rl, "Tampilkan berapa pesanan? (default 10): "), 10) || 10;
              const res = await bot.getOrders({ limit: lim });
              printOrdersList(res.orders, res.pagination?.totalItems);
            }
            break;
          }

          case "6": {
            await bot.ensureAuth();
            const coins = await bot.getCoinsPageData();
            console.log(`\n💰 Saldo RierCoins: ${fmtNum(coins.riercoins)} RC (${fmtRp(coins.riercoins)})`);
            console.log("   [1] Lihat Mutasi RierCoins");
            console.log("   [2] Top Up RierCoins (Duitku QRIS/VA)");
            console.log("   [0] Kembali");
            const sub = await ask(rl, "Pilih (0-2): ");
            if (sub === "1") {
              const tx = await bot.getCoinTransactions({ limit: 15 });
              console.log(`\n📜 Mutasi RierCoins (${tx.transactions.length}):`);
              for (const t of tx.transactions) {
                const sign = t.amount >= 0 ? "+" : "";
                console.log(`  [${fmtWIB(t.createdAt)}] ${t.type.padEnd(12)} ${sign}${fmtNum(t.amount)} RC | ${t.description}`);
              }
            } else if (sub === "2") {
              coins.paymentMethods.forEach((pm) => {
                const feeStr = pm.feeType === "percentage" ? `${pm.fee}%` : fmtRp(pm.fee);
                console.log(`  [${String(pm.id).padStart(2)}] ${pm.name.padEnd(32)} (${pm.group}) | Fee: ${feeStr}`);
              });
              const amt = await ask(rl, "\nNominal Top Up (contoh 50000): ");
              const pmId = await ask(rl, "ID Metode Pembayaran: ");
              if (amt && pmId) {
                const ok = (await ask(rl, `Buat invoice topup ${fmtRp(amt)} via PM #${pmId}? (y/n): `)).toLowerCase();
                if (ok === "y") {
                  const top = await bot.topupCoins({ amount: amt, paymentMethodId: pmId });
                  console.log(`✅ Invoice Top Up berhasil dibuat!\n   Link Bayar Duitku: ${top.paymentUrl}`);
                }
              }
            }
            break;
          }

          case "7": {
            const allAns = (await ask(rl, "Sync semua detail item jika tanpa API Key? (y/n, default n): ")).toLowerCase();
            console.log("🔄 Menyinkronkan katalog ke products.json...");
            const cat = await syncCatalog(bot, { fetchAllDetails: allAns === "y" });
            console.log(`✅ Selesai! ${cat.total_products} produk & ${cat.total_items} item disimpan ke products.json (sumber: ${cat.source}).`);
            break;
          }

          case "8": {
            console.log("\n   [1] Login / Ganti Akun (Email+Password atau Paste Cookie)");
            console.log("   [2] Buat Official API Key baru (rb_...) otomatis & simpan");
            console.log("   [3] Refresh Next-Action Hash dari live JS");
            console.log("   [4] Logout & Hapus .session");
            const sub = await ask(rl, "Pilih (1-4): ");
            if (sub === "1") {
              await promptLogin(bot, { existingRl: rl });
            } else if (sub === "2") {
              const name = (await ask(rl, "Nama API Key (Enter = RierBux CLI): ")) || "RierBux CLI";
              const created = await bot.createApiKey(name);
              console.log("✅ Official API Key dibuat & disimpan ke .session!");
              console.log(JSON.stringify(created, null, 2));
            } else if (sub === "3") {
              console.log("🔄 Scanning JS chunks live rierbux.com...");
              const ref = await bot.refreshActionIds();
              console.log(`✅ Selesai! Scanned ${ref.scannedChunks} chunks, ditemukan ${ref.foundCount} Server Actions.`);
            } else if (sub === "4") {
              await bot.logout();
              console.log("✅ Logout berhasil & .session dihapus.");
            }
            break;
          }

          case "9": {
            if (!fs.existsSync(TRANSACTIONS_PATH)) {
              console.log("\nBelum ada transaksi lokal di transactions.json.");
            } else {
              const logs = JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, "utf-8"));
              console.log(`\n💾 Transaksi Lokal Tersimpan (${logs.length}):\n`);
              logs.slice(0, 15).forEach((t, i) => {
                console.log(
                  `  ${i + 1}. [${t.saved_wib || t.saved_at}] #${t.publicId || "-"} | ${t.product || t.type} — ${t.itemName || "-"} x${t.quantity || 1} (${fmtRp(t.expectedTotal ?? t.total)}) [${t.paymentStatus}]`
                );
                if (t.roblox?.username) console.log(`     Roblox: @${t.roblox.username} | ${t.orderUrl || ""}`);
                if (t.paymentUrl) console.log(`     Pay URL: ${t.paymentUrl}`);
              });
            }
            break;
          }

          case "0":
          case "q":
          case "exit":
            console.log("👋 Keluar.");
            return;

          default:
            console.log("❌ Pilihan tidak dikenal.");
        }
      } catch (err) {
        console.log(`\n❌ Error: ${err.message}`);
      }
    }
  } finally {
    rl.close();
  }
}

// ─── CLI Command Router ──────────────────────────────────────────────────────
async function runCli() {
  const bot = new RierBuxBot();
  const [cmd, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);

  try {
    if (!cmd) {
      await runInteractive(bot);
      return;
    }

    switch (cmd) {
      case "login":
        await promptLogin(bot, { flags });
        break;

      case "logout": {
        const out = await bot.logout();
        console.log(`✅ Logout selesai (HTTP ${out.status ?? "-"}) & .session dihapus.`);
        break;
      }

      case "session":
      case "whoami": {
        const sess = await bot.getSession();
        if (!sess) {
          console.log("⚠️  Belum login atau sesi sudah expired. Jalankan: node rierbux.js login");
        } else {
          console.log(`✅ Logged in as: ${sess.user.name} (${sess.user.email}) | ID: ${sess.user.id}`);
          console.log(`   Session Expires: ${fmtWIB(sess.session.expiresAt)}`);
          console.log(`   Official API v1: ${bot.apiKey ? "AKTIF (" + bot.apiKey.slice(0, 10) + "...)" : "Belum diset"}`);
        }
        break;
      }

      case "balance":
      case "saldo":
      case "coins": {
        const bal = await bot.getBalance();
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`  💰 Saldo RierCoins : ${fmtNum(bal.riercoins)} RC (${fmtRp(bal.riercoins)})`);
        console.log(`  📡 Sumber Data     : ${bal.source}`);
        console.log("═══════════════════════════════════════════════════════════");
        if (flags.pm || flags.methods) {
          const coins = bal.paymentMethods ? bal : await bot.getCoinsPageData();
          console.log("\n🏦 Metode Pembayaran Duitku:");
          for (const pm of coins.paymentMethods || []) {
            const feeStr = pm.feeType === "percentage" ? `${pm.fee}%` : fmtRp(pm.fee);
            console.log(`  [${String(pm.id).padStart(2)}] ${pm.name.padEnd(32)} | ${pm.group.padEnd(16)} | Fee: ${feeStr.padEnd(9)} | Min: ${fmtRp(pm.minimumAmount)}`);
          }
        }
        if (flags.tx) {
          const lim = typeof flags.tx === "string" ? parseInt(flags.tx, 10) || 15 : 15;
          const tx = await bot.getCoinTransactions({ limit: lim });
          console.log(`\n📜 Mutasi RierCoins (${tx.transactions.length}):`);
          for (const t of tx.transactions) {
            const sign = t.amount >= 0 ? "+" : "";
            console.log(`  [${fmtWIB(t.createdAt)}] ${String(t.type).padEnd(12)} ${sign}${fmtNum(t.amount)} RC | ${t.description}`);
          }
        }
        break;
      }

      case "stock":
      case "stok": {
        const st = await bot.getStock();
        if (flags.json) {
          console.log(JSON.stringify(st, null, 2));
        } else {
          printStockTable(st);
        }
        break;
      }

      case "list":
      case "products": {
        if (bot.apiKey && (flags.method || flags.v1)) {
          const data = await bot.getV1Products({
            page: parseInt(flags.page || "1", 10),
            limit: parseInt(flags.limit || "50", 10),
            deliveryMethod: flags.method,
            search: flags.search || positional[0],
            available: flags.available,
          });
          console.log(`📦 Katalog API v1 (Page ${data.pagination.page}/${data.pagination.totalPages}, total ${data.pagination.totalItems} item):\n`);
          for (const it of data.products) {
            const av = it.available ? "✅" : "❌";
            console.log(`  ${av} [#${String(it.id).padEnd(5)}] ${(it.product?.name || "-").padEnd(20)} | ${it.name.padEnd(28)} | ${fmtRp(it.price).padStart(12)} | ${it.deliveryMethod}`);
          }
          break;
        }

        const [stock, prods] = await Promise.all([
          bot.getStock().catch(() => null),
          bot.getStoreProductsList(),
        ]);
        const kw = String(flags.search || positional[0] || "").toLowerCase();
        const filtered = kw
          ? prods.filter((p) => p.name.toLowerCase().includes(kw) || p.slug.toLowerCase().includes(kw))
          : prods;

        console.log("═══════════════════════════════════════════════════════════════════");
        console.log(`  📦 DAFTAR PRODUK RIERBUX (${filtered.length}${kw ? ` cocok '${kw}'` : ""} dari ${prods.length} produk)`);
        if (stock) console.log(`  📊 Stok: ${formatStockOneLine(stock)}`);
        console.log("═══════════════════════════════════════════════════════════════════\n");
        console.log("  Top Up Robux Langsung:");
        console.log("    • robux-5-hari     | Top Up Robux 5 Hari (Game Pass)");
        console.log("    • robux-transfer   | Top Up Robux Transfer (Tanpa Password)");
        console.log("    • robux-instan     | Top Up Robux Instan (Login)");
        console.log("    • private-servers  | Private Server (cari: node rierbux.js games <q>)\n");
        const limitShow = parseInt(flags.limit || "50", 10);
        filtered.slice(0, limitShow).forEach((p, i) => {
          console.log(`  ${String(i + 1).padStart(3)}. ${p.slug.padEnd(32)} | ${p.name}`);
        });
        if (filtered.length > limitShow) {
          console.log(`\n  ... dan ${filtered.length - limitShow} produk lainnya (pakai --limit 200 atau --search <kata>)`);
        }
        console.log("\n💡 Lihat item & harga: node rierbux.js items <slug>");
        break;
      }

      case "items": {
        const slug = positional[0];
        if (!slug) throw new Error("Masukkan slug produk. Contoh: node rierbux.js items fish-it  atau  node rierbux.js items robux-5-hari");
        const detail = await bot.getProductDetail(slug);
        if (flags.json) {
          console.log(JSON.stringify(detail, null, 2));
          break;
        }
        console.log(`\n📦 ${detail.name} (${detail.slug}) — ${detail.allItems.length} item [sumber: ${detail.source}]\n`);
        for (const v of detail.variations) {
          console.log(`  ── ${v.name} (${v.items.length}) ──`);
          for (const it of v.items) {
            const av = it.available === false ? "❌" : "✅";
            const rbx = it.robuxPrice ? ` (${fmtNum(it.robuxPrice)} R$)` : "";
            const st = it.stock !== null && it.stock !== undefined ? ` | stok:${it.stock}` : "";
            const qtyRule = it.minQuantity > 1 || it.maxQuantity ? ` | qty:${it.minQuantity || 1}..${it.maxQuantity || "∞"}` : "";
            console.log(`    ${av} ID:${String(it.id).padEnd(6)} | ${it.name.padEnd(34)} | ${fmtRp(it.price ?? it.unitPrice).padStart(12)}${rbx}${st}${qtyRule}`);
          }
          console.log("");
        }
        console.log(`💡 Order dry-run: node rierbux.js buy --slug ${detail.slug} --item <ID> --roblox <username>`);
        break;
      }

      case "dashboard":
      case "ui":
      case "web": {
        const { createDashboardServer } = require("./dashboard.js");
        const port = parseInt(flags.port || process.env.HEALTH_PORT || process.env.PORT || "3030", 10) || 3030;
        const host = flags.host || process.env.DASHBOARD_HOST || "127.0.0.1";
        const secret = (flags.secret || process.env.DASHBOARD_SECRET || "").trim();
        const dash = createDashboardServer(bot, { port, host, secret });
        const info = await dash.start();
        console.log(`\n🌐 Buka Web Console RierBux di browser: ${info.url}`);
        console.log(`🔗 Direct Webhook Endpoint            : POST ${info.url}/webhook/order`);
        console.log(`⏹️  Tekan Ctrl+C untuk menghentikan server.\n`);
        break;
      }

      case "worker": {
        const { createDashboardServer } = require("./dashboard.js");
        const { runWorker } = require("./webhook.js");
        await runWorker(bot, { createDashboardServer, syncCatalog, fmtWIB });
        break;
      }

      case "ping-sheet": {
        const { callSheetBridge } = require("./webhook.js");
        const ping = await callSheetBridge("ping");
        const meta = await callSheetBridge("meta").catch(() => null);
        console.log("✅ Google Sheet Bridge OK:", JSON.stringify(ping));
        if (meta) console.log("📊 Meta (Saldo, Stok & Katalog):", JSON.stringify(meta));
        break;
      }

      case "test-sheet": {
        const { callSheetBridge } = require("./webhook.js");
        console.log("🔄 Mengirim 1 baris TEST ke Google Sheet...");
        const res = await callSheetBridge("result", {
          ref: "",
          status: "SUCCESS",
          t_id: "RB-TEST0001",
          trx_id: "RB-TEST0001",
          product: "TEST KONEKSI RIERBUX",
          item: "Dummy Test Item x1",
          player_id: "test_roblox_user",
          amount: "0",
          ending_balance: "0",
          order_url: "https://rierbux.com/orders/RB-TEST0001",
        });
        console.log("✅ Test Sheet OK:", JSON.stringify(res));
        break;
      }

      case "sync": {
        console.log("🔄 Menyinkronkan katalog RierBux ke products.json...");
        const cat = await syncCatalog(bot, { fetchAllDetails: Boolean(flags.all) });
        console.log(`✅ Katalog disimpan ke products.json!`);
        console.log(`   Produk : ${cat.total_products}`);
        console.log(`   Item   : ${cat.total_items} (sumber: ${cat.source})`);
        if (cat.riercoins !== null) console.log(`   Saldo  : ${fmtNum(cat.riercoins)} RC`);
        if (process.env.GSHEET_WEBHOOK_URL && process.env.GSHEET_SECRET && cat.total_items > 0) {
          const { uploadCatalogToSheet } = require("./webhook.js");
          const rows = await uploadCatalogToSheet(cat);
          console.log(`📊 Katalog diunggah ke Google Sheet tab "Katalog" (${rows} item)`);
        }
        if (!bot.apiKey && !flags.all) {
          console.log("💡 Tip: Buat API key (`node rierbux.js apikey create`) atau tambah `--all` agar semua item dari 162+ game ikut tersimpan.");
        }
        break;
      }

      case "roblox": {
        const username = positional[0] || flags.user || flags.username;
        if (!username) throw new Error("Masukkan username Roblox. Contoh: node rierbux.js roblox a1dam_9999");
        const r = await bot.checkRobloxUsername(username, Boolean(flags.plus));
        if (flags.json) {
          console.log(JSON.stringify(r, null, 2));
        } else if (r.valid && r.user) {
          console.log(`✅ VALID Roblox Account`);
          console.log(`   Username    : ${r.user.username}`);
          console.log(`   DisplayName : ${r.user.displayName}`);
          console.log(`   User ID     : ${r.user.id}`);
          console.log(`   Roblox+     : ${r.isRobloxPlus ? "Ya" : "Tidak"}`);
        } else {
          console.log(`❌ Username Roblox '${username}' tidak ditemukan.`);
        }
        break;
      }

      case "games": {
        const q = positional.join(" ") || flags.q;
        if (!q) throw new Error("Masukkan nama game. Contoh: node rierbux.js games fish it");
        const games = await bot.searchPrivateServerGames(q);
        if (flags.json) {
          console.log(JSON.stringify(games, null, 2));
        } else {
          console.log(`\n🎮 Hasil Pencarian Game Private Server ('${q}' — ${games.length} game):\n`);
          games.forEach((g, i) => {
            console.log(`  ${String(i + 1).padStart(2)}. ${g.name.padEnd(36)} | PlaceID: ${String(g.rootPlaceId).padEnd(16)} | Playing: ${fmtNum(g.playerCount)}`);
          });
          console.log("\n💡 Cek harga Private Server: node rierbux.js ps <PlaceID>");
        }
        break;
      }

      case "ps":
      case "private-server": {
        const placeId = positional[0] || flags.place;
        if (!placeId) throw new Error("Masukkan rootPlaceId. Contoh: node rierbux.js ps 121864768012064");
        const ps = await bot.getPrivateServerDetail(placeId);
        console.log(`\n🔒 Private Server PlaceID ${ps.rootPlaceId}:`);
        for (const it of ps.items) {
          console.log(`   • ID:${it.id} | ${it.name} | ${fmtRp(it.unitPrice)}`);
        }
        console.log(`\n💡 Order: node rierbux.js buy --type private-server --place ${ps.rootPlaceId}`);
        break;
      }

      case "buy":
      case "order-now": {
        const isConfirm = Boolean(flags.confirm);
        const type = flags.type || (flags.place ? "private-server" : "product");
        const payMethod = flags.pay || "balance";

        console.log(`🛒 Checkout (${isConfirm ? "LIVE - EKSEKUSI ORDER" : "DRY-RUN"}) → ${flags.slug || type} / item=${flags.item || "auto"}`);
        const res = await bot.buyProduct({
          type,
          slug: flags.slug || flags.product,
          placeId: flags.place,
          itemId: flags.item ? Number(flags.item) : undefined,
          quantity: flags.qty ? Number(flags.qty) : 1,
          robloxUsername: flags.roblox || flags.user,
          robloxPassword: flags["roblox-pass"],
          gamePassId: flags.gamepass ? Number(flags.gamepass) : undefined,
          payMethod,
          paymentMethodId: flags.pm ? Number(flags.pm) : undefined,
          promoCode: flags.promo,
          dryRun: !isConfirm,
        });

        if (res.dryRun) {
          const pv = res.preview;
          console.log("\n📋 Detail Preview (DRY-RUN):");
          console.log(`   Produk       : ${pv.product}`);
          console.log(`   Item         : [#${pv.itemId}] ${pv.itemName} x${pv.quantity}`);
          if (pv.roblox) console.log(`   Roblox       : ${pv.roblox.username} (${pv.roblox.displayName}, ID: ${pv.roblox.id})`);
          if (pv.gamePassId) console.log(`   Game Pass ID : ${pv.gamePassId}`);
          console.log(`   Total Harga  : ${fmtRp(pv.expectedTotal)}`);
          console.log(`   Saldo RC     : ${pv.saldoAwal !== null ? fmtNum(pv.saldoAwal) + " RC" : "-"} ${pv.saldoCukup ? "✅" : "❌ TIDAK CUKUP"}`);
          console.log(`   Metode Bayar : ${pv.payMethod}${pv.paymentMethodId ? ` (PM #${pv.paymentMethodId})` : ""}`);
          console.log("\n⏸️  DRY-RUN selesai (order BELUM dibuat & saldo BELUM dipotong). Tambah --confirm untuk eksekusi.");
        } else {
          console.log("\n🎉 ORDER BERHASIL!");
          console.log(`   Order ID     : #${res.order.publicId}`);
          console.log(`   Status Bayar : ${res.order.paymentStatus}`);
          console.log(`   Total        : ${fmtRp(res.order.expectedTotal)}`);
          console.log(`   Link Order   : ${res.order.orderUrl}`);
          if (res.order.paymentUrl) console.log(`   Link Duitku  : ${res.order.paymentUrl}`);
          console.log(`   💾 Tersimpan di transactions.json`);
        }
        break;
      }

      case "cart": {
        const sub = positional[0] || "list";
        if (sub === "list") {
          const cart = await bot.getCart();
          console.log(`\n🛍️  Keranjang (${cart.count} item):`);
          cart.items.forEach((it, i) => {
            console.log(`  ${i + 1}. [cartItemId=${it.cartItemId ?? it.id}] productItemId=${it.productItemId} | ${it.itemName || it.name || "-"} x${it.quantity || 1} | ${fmtRp(it.totalPrice ?? it.unitPrice)}`);
          });
        } else if (sub === "add") {
          const slug = flags.slug || "fish-it";
          const itemId = Number(flags.item);
          const qty = Number(flags.qty || 1);
          if (!itemId) throw new Error("Wajib isi --item <productItemId>");
          let orderInputs = {};
          if (flags.roblox) {
            const chk = await bot.checkRobloxUsername(flags.roblox);
            if (!chk.valid) throw new Error(`Username Roblox '${flags.roblox}' tidak valid.`);
            orderInputs = {
              robloxUsername: chk.user.username,
              robloxUserId: chk.user.id,
              robloxDisplayName: chk.user.displayName,
            };
          }
          if (flags.gamepass) orderInputs.gamePassId = Number(flags.gamepass);
          const out = await bot.addToCart({
            pagePath: flags.place ? `/private-servers/${flags.place}` : `/products/${slug}`,
            productItemId: itemId,
            quantity: qty,
            orderInputs,
          });
          console.log("✅ Ditambahkan ke keranjang:", JSON.stringify(out));
        } else if (sub === "remove") {
          const id = Number(positional[1] || flags.id);
          if (!id) throw new Error("Pakai: node rierbux.js cart remove <cartItemId>");
          await bot.removeFromCart(id);
          console.log(`✅ Item #${id} dihapus dari keranjang.`);
        } else if (sub === "clear") {
          const cart = await bot.getCart();
          if (!cart.items.length) {
            console.log("Keranjang sudah kosong.");
          } else {
            await bot.removeMultipleFromCart(cart.items.map((it) => it.cartItemId ?? it.id));
            console.log(`✅ ${cart.items.length} item dihapus dari keranjang.`);
          }
        } else if (sub === "checkout") {
          const cart = await bot.getCart();
          if (!cart.items.length) throw new Error("Keranjang kosong.");
          const ids = cart.items.map((it) => it.cartItemId ?? it.id);
          const total = cart.items.reduce((s, it) => s + Number(it.totalPrice ?? (it.unitPrice || 0) * (it.quantity || 1)), 0);
          if (!flags.confirm) {
            console.log(`⏸️  DRY-RUN Checkout Cart: ${ids.length} item, Total ${fmtRp(total)}. Tambah --confirm untuk eksekusi.`);
            break;
          }
          const out = await bot.checkoutCart({ selectedItems: ids, expectedTotal: total });
          console.log(`📦 Order dibuat: #${out.publicId}`);
          const pay = flags.pay || "balance";
          if (out.publicId && pay === "balance") {
            await bot.payWithBalance(out.publicId, flags.promo);
            console.log(`✅ Dibayar pakai RierCoins! ${bot.baseUrl}/orders/${out.publicId}`);
          } else if (out.publicId && pay === "duitku") {
            const p = await bot.createDuitkuPayment(out.publicId, flags.pm, flags.promo);
            console.log(`💳 Link Bayar Duitku: ${p.paymentUrl}`);
          }
        }
        break;
      }

      case "topup": {
        const amount = flags.amount || positional[0];
        const pm = flags.pm || positional[1];
        if (!amount || !pm) {
          throw new Error("Pakai: node rierbux.js topup --amount 50000 --pm 18 [--confirm] (cek ID metode: node rierbux.js balance --pm)");
        }
        if (!flags.confirm) {
          console.log(`⏸️  DRY-RUN Top Up RierCoins ${fmtRp(amount)} via Payment Method #${pm}. Tambah --confirm untuk buat link Duitku.`);
          break;
        }
        const out = await bot.topupCoins({ amount, paymentMethodId: pm });
        console.log(`✅ Invoice Top Up RierCoins dibuat!`);
        console.log(`   Nominal    : ${fmtRp(out.amount)}`);
        console.log(`   Link Bayar : ${out.paymentUrl}`);
        break;
      }

      case "orders":
      case "history": {
        const limit = parseInt(positional[0] || flags.limit || "15", 10);
        const res = await bot.getOrders({
          limit,
          page: parseInt(flags.page || "1", 10),
          paymentStatus: flags.status,
          itemStatus: flags["item-status"],
          search: flags.search,
        });
        if (flags.json) {
          console.log(JSON.stringify(res, null, 2));
        } else {
          printOrdersList(res.orders, res.pagination?.totalItems);
        }
        break;
      }

      case "order": {
        const pid = positional[0] || flags.id;
        if (!pid) throw new Error("Pakai: node rierbux.js order <RB-...> [--watch|--pay balance|--cancel]");

        if (flags.cancel) {
          const out = await bot.cancelUnpaidOrder(pid);
          console.log(`✅ Order #${pid} dibatalkan:`, JSON.stringify(out));
          break;
        }
        if (flags.retry) {
          const out = await bot.retryFailedItem(pid, Number(flags.retry));
          console.log(`✅ Retry item #${flags.retry}:`, JSON.stringify(out));
          break;
        }
        if (flags.pay) {
          if (flags.pay === "balance") {
            await bot.payWithBalance(pid, flags.promo);
            console.log(`✅ Order #${pid} berhasil dibayar pakai RierCoins!`);
          } else if (flags.pay === "duitku") {
            const p = await bot.createDuitkuPayment(pid, flags.pm, flags.promo);
            console.log(`💳 Link Bayar Duitku: ${p.paymentUrl}`);
          }
          break;
        }

        if (flags.watch) {
          console.log(`👀 Memantau order #${pid} setiap 5 detik (Ctrl+C untuk berhenti)...`);
          while (true) {
            const det = await bot.getOrderDetail(pid);
            const items = det.order?.items || [];
            const statuses = items.map((x) => `${x.item}:${x.status}`).join(", ");
            console.log(`[${fmtWIB()}] #${pid} | pay=${det.order?.paymentStatus || "-"} | ${statuses || "-"}`);
            const done =
              items.length > 0 &&
              items.every((x) => ["delivered", "failed", "canceled", "void"].includes(String(x.status).toLowerCase()));
            if (done) {
              printOrderDetail(det.order);
              break;
            }
            await sleep(5000);
          }
          break;
        }

        const det = await bot.getOrderDetail(pid);
        if (flags.json) {
          console.log(JSON.stringify(det, null, 2));
        } else {
          printOrderDetail(det.order);
        }
        break;
      }

      case "apikey": {
        const sub = positional[0] || "status";
        if (sub === "create") {
          const name = positional[1] || flags.name || "RierBux CLI";
          const out = await bot.createApiKey(name);
          console.log("✅ Official API Key dibuat & otomatis disimpan ke .session!");
          console.log(JSON.stringify(out, null, 2));
        } else if (sub === "set") {
          const key = positional[1];
          if (!key || !key.startsWith("rb_")) throw new Error("Masukkan API key diawali 'rb_'.");
          bot.saveSession({ apiKey: key });
          console.log("✅ API Key disimpan ke .session!");
        } else if (sub === "revoke") {
          const keyId = positional[1];
          if (!keyId) throw new Error("Pakai: node rierbux.js apikey revoke <keyId>");
          await bot.revokeApiKey(keyId);
          console.log(`✅ API Key ${keyId} dicabut.`);
        } else if (sub === "list") {
          const keys = await bot.listApiKeys();
          console.log(JSON.stringify(keys, null, 2));
        } else {
          console.log(`Official API Key: ${bot.apiKey ? bot.apiKey.slice(0, 12) + "..." : "(belum diset)"}`);
          console.log("Pakai: node rierbux.js apikey create [nama] | set <rb_...> | list | revoke <id>");
        }
        break;
      }

      case "refresh-actions": {
        console.log("🔄 Scanning Next.js JS chunks live di rierbux.com...");
        const res = await bot.refreshActionIds();
        console.log(`✅ Scanned ${res.scannedChunks} chunks → ditemukan ${res.foundCount} Server Actions (disimpan ke .action-cache.json).`);
        if (flags.json) console.log(JSON.stringify(res.found, null, 2));
        break;
      }

      case "help":
      case "--help":
      case "-h":
      default:
        console.log(`RIERBUX.COM All-in-One CLI, Web Console & Webhook Worker

Perintah:
  node rierbux.js                                                      Menu interaktif lengkap (mirip IDV)
  node rierbux.js dashboard [--port 3030] [--host 127.0.0.1]           Buka Web Dashboard (Dark UI bergaya IDV)
  node rierbux.js worker                                               Jalankan 24/7 Google Sheet Queue Worker + Web Console + Webhook
  node rierbux.js ping-sheet                                           Test koneksi Google Sheet Bridge v3 & cek Meta
  node rierbux.js test-sheet                                           Kirim 1 baris dummy TEST ke Google Sheet
  node rierbux.js login [--email <e> --password <p> | --cookie]        Login & simpan .session
  node rierbux.js logout                                               Logout resmi & hapus .session
  node rierbux.js whoami                                               Cek status sesi & API key aktif
  node rierbux.js balance [--tx [limit]] [--pm]                        Cek saldo RierCoins, mutasi & metode bayar
  node rierbux.js stock [--json]                                       Cek stok real-time semua handler
  node rierbux.js list [--search <q>] [--limit 50] [--method <m>]      Daftar 162+ produk RierBux
  node rierbux.js items <slug|robux-5-hari|robux-instan|robux-transfer> Daftar variasi, item ID & harga
  node rierbux.js sync [--all]                                         Sync katalog lengkap ke products.json
  node rierbux.js roblox <username>                                    Validasi username & ID Roblox
  node rierbux.js games <query>                                        Cari game Roblox untuk Private Server
  node rierbux.js ps <rootPlaceId>                                     Cek item & harga Private Server
  node rierbux.js buy --slug <slug> --item <id> --roblox <u> [opts]    Checkout (default DRY-RUN, tambah --confirm)
                      [--type product|robux-5d|robux-transfer|robux-instant|private-server]
                      [--qty 1] [--pay balance|duitku|unpaid] [--pm <id>] [--promo <kode>]
                      [--gamepass <id>] [--place <rootPlaceId>] [--roblox-pass <pass>]
  node rierbux.js cart [list|add|remove <id>|clear|checkout --confirm] Kelola keranjang & checkout multi-item
  node rierbux.js topup --amount <nominal> --pm <id> [--confirm]       Top up RierCoins via Duitku
  node rierbux.js orders [limit] [--status paid|unpaid] [--search <q>] Riwayat pesanan
  node rierbux.js order <RB-...> [--watch|--pay balance|--cancel]      Detail, pantau, bayar, atau batalkan order
  node rierbux.js apikey [create [nama]|set <rb_...>|list|revoke <id>] Kelola Official API Key (/api/v1)
  node rierbux.js refresh-actions                                      Auto-update Next-Action hash dari live JS
`);
    }
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

module.exports = {
  RierBuxBot,
  CookieJar,
  DEFAULT_ACTION_IDS,
  syncCatalog,
  fmtRp,
  fmtNum,
  fmtWIB,
};

if (require.main === module) {
  runCli();
}
