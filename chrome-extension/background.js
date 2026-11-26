const DEFAULT_SERVER = "https://rierbux.noircheck.my.id";
const SESSION_COOKIE_NAME = "__Secure-rierbux.session_token";
const NOTIF_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function getConfig() {
  const data = await chrome.storage.local.get([
    "serverUrl",
    "secret",
    "autoSync",
    "autoCloseTab",
    "lastPushedToken",
  ]);
  return {
    serverUrl: (data.serverUrl || DEFAULT_SERVER).replace(/\/+$/, ""),
    secret: (data.secret || "").trim(),
    autoSync: data.autoSync !== false,
    autoCloseTab: Boolean(data.autoCloseTab),
    lastPushedToken: data.lastPushedToken || "",
  };
}

/** Ambil semua cookie rierbux.com (termasuk HttpOnly __Secure-rierbux.session_token) */
async function readRierBuxCookies() {
  const all = await chrome.cookies.getAll({ url: "https://rierbux.com/" });
  const sessCookie = all.find((c) => c.name === SESSION_COOKIE_NAME);
  const cookieHeader = all.map((c) => `${c.name}=${c.value}`).join("; ");
  return {
    all,
    sessCookie,
    sessionToken: sessCookie?.value || null,
    cookieHeader,
  };
}

/** Cek siapa yang sedang login di Chrome pada rierbux.com */
async function checkBrowserSession() {
  const { sessionToken } = await readRierBuxCookies();
  if (!sessionToken) {
    return { loggedIn: false, user: null, session: null };
  }
  try {
    const res = await fetch("https://rierbux.com/api/auth/get-session", {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      return { loggedIn: true, user: data.user, session: data.session || null };
    }
  } catch {}
  return { loggedIn: false, user: null, session: null };
}

/** Push cookie Chrome (termasuk hasil Google OAuth) ke RierBux Dashboard / VPS */
async function pushSessionToServer({ manual = false, sourceTabId = null } = {}) {
  const cfg = await getConfig();
  if (!cfg.serverUrl) {
    return { ok: false, error: "Isi URL Dashboard / VPS dulu di popup extension." };
  }

  const { sessionToken, cookieHeader } = await readRierBuxCookies();
  if (!sessionToken) {
    return { ok: false, error: "Belum login di rierbux.com pada browser ini. Klik Login Google dulu." };
  }

  if (!manual && sessionToken === cfg.lastPushedToken) {
    return { ok: true, skipped: true };
  }

  const headers = { "content-type": "application/json" };
  if (cfg.secret) headers["x-api-key"] = cfg.secret;

  let res;
  try {
    res = await fetch(`${cfg.serverUrl}/session`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        secret: cfg.secret || undefined,
        cookies: cookieHeader,
        sessionToken,
        loginAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Tidak bisa konek ke ${cfg.serverUrl}. Pastikan 'node rierbux.js dashboard' atau worker sudah jalan.`,
    };
  }

  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!res.ok || data.ok === false) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }

  await chrome.storage.local.set({
    lastPushedToken: sessionToken,
    lastPushAt: new Date().toLocaleTimeString("id-ID"),
    lastPushUser: data.user?.email || data.user?.name || "",
  });

  chrome.action.setBadgeText({ text: "ON" });
  chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });

  chrome.notifications.create({
    type: "basic",
    iconUrl: NOTIF_ICON,
    title: "RierBux Session Tersinkron!",
    message: `Akun: ${data.user?.name || data.user?.email || "-"}${
      data.balance !== null && data.balance !== undefined ? ` | Saldo: ${data.balance} RC` : ""
    }`,
  });

  if (cfg.autoCloseTab && sourceTabId) {
    setTimeout(() => {
      chrome.tabs.remove(sourceTabId).catch(() => {});
    }, 1500);
  }

  return { ok: true, data };
}

/** Cek status Dashboard / VPS */
async function checkServerStatus() {
  const cfg = await getConfig();
  if (!cfg.serverUrl) {
    chrome.action.setBadgeText({ text: "?" });
    chrome.action.setBadgeBackgroundColor({ color: "#71717a" });
    return null;
  }
  try {
    const headers = {};
    if (cfg.secret) headers["x-api-key"] = cfg.secret;
    const res = await fetch(`${cfg.serverUrl}/api/status`, { headers });
    const d = await res.json().catch(() => null);
    if (!res.ok || !d || d.ok === false) throw new Error(d?.error || `HTTP ${res.status}`);

    await chrome.storage.local.set({ serverStatusCache: d });

    if (d.loggedIn) {
      chrome.action.setBadgeText({ text: "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
    } else {
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
    }
    return d;
  } catch {
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#71717a" });
    return null;
  }
}

// 1. Auto-detect saat user selesai Google OAuth dan redirect kembali ke https://rierbux.com/
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  if (!tab.url.startsWith("https://rierbux.com/")) return;
  if (tab.url.includes("/login")) return;

  const cfg = await getConfig();
  if (!cfg.autoSync) return;
  await pushSessionToServer({ manual: false, sourceTabId: tabId });
});

// 2. Auto-detect langsung saat cookie __Secure-rierbux.session_token baru terbentuk (Google OAuth callback)
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (changeInfo.removed) return;
  const c = changeInfo.cookie;
  if (!c || c.name !== SESSION_COOKIE_NAME || !c.domain.includes("rierbux.com")) return;
  const cfg = await getConfig();
  if (!cfg.autoSync) return;
  setTimeout(() => {
    pushSessionToServer({ manual: false }).catch(() => {});
  }, 800);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("checkRierBuxServer", { periodInMinutes: 2 });
  checkServerStatus();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkRierBuxServer") checkServerStatus();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "PUSH_NOW") {
    pushSessionToServer({ manual: true }).then(sendResponse);
    return true;
  }
  if (msg?.type === "CHECK_ALL") {
    Promise.all([checkBrowserSession(), checkServerStatus(), readRierBuxCookies()]).then(
      ([browser, server, cookies]) => {
        sendResponse({
          browser,
          server,
          hasCookie: Boolean(cookies.sessionToken),
          cookieHeader: cookies.cookieHeader,
        });
      }
    );
    return true;
  }
  if (msg?.type === "GET_COOKIE") {
    readRierBuxCookies().then(sendResponse);
    return true;
  }
  if (msg?.type === "START_GOOGLE_LOGIN") {
    // Hapus cookie sesi lama opsional kalau user minta ganti akun, lalu buka /login
    (async () => {
      if (msg.fresh) {
        await chrome.cookies.remove({ url: "https://rierbux.com/", name: SESSION_COOKIE_NAME }).catch(() => {});
        await chrome.cookies.remove({ url: "https://rierbux.com/", name: "__Secure-rierbux.session_data" }).catch(() => {});
        await chrome.storage.local.set({ lastPushedToken: "" });
      }
      await chrome.tabs.create({ url: "https://rierbux.com/login", active: true });
      sendResponse({ ok: true });
    })();
    return true;
  }
});
