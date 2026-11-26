const $ = (id) => document.getElementById(id);

function setMsg(text, color = "#a1a1aa") {
  $("msg").style.color = color;
  $("msg").textContent = text;
}

function renderAll(res) {
  const br = res?.browser;
  if (br?.loggedIn && br.user) {
    $("brUser").textContent = br.user.email || br.user.name || "Aktif";
    $("brUser").style.color = "#34d399";
  } else {
    $("brUser").textContent = "Belum login";
    $("brUser").style.color = "#f87171";
  }

  const srv = res?.server;
  const pill = $("srvPill");
  if (!srv) {
    pill.textContent = "Server Off";
    pill.className = "pill err";
    $("srvUser").textContent = "Tidak terhubung";
    $("srvSaldo").textContent = "-";
    return;
  }

  if (srv.loggedIn) {
    pill.textContent = "Online";
    pill.className = "pill ok";
    $("srvUser").textContent = srv.user?.email || srv.user?.name || "Aktif";
    $("srvSaldo").textContent =
      srv.balance !== null && srv.balance !== undefined
        ? Number(srv.balance).toLocaleString("id-ID") + " RC"
        : "-";
  } else {
    pill.textContent = "Perlu Sync";
    pill.className = "pill err";
    $("srvUser").textContent = "Belum ada sesi";
    $("srvSaldo").textContent = "-";
  }
}

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "CHECK_ALL" }, (res) => {
    if (res) renderAll(res);
  });
}

async function init() {
  const cfg = await chrome.storage.local.get(["serverUrl", "secret", "autoSync", "autoCloseTab", "lastPushAt"]);
  $("serverUrl").value = cfg.serverUrl || "https://rierbux.noircheck.my.id";
  $("secret").value = cfg.secret || "";
  $("autoSync").checked = cfg.autoSync !== false;
  $("autoCloseTab").checked = Boolean(cfg.autoCloseTab);
  if (cfg.lastPushAt) setMsg("Terakhir sync: " + cfg.lastPushAt);
  refreshStatus();
}

$("saveBtn").addEventListener("click", async () => {
  await chrome.storage.local.set({
    serverUrl: $("serverUrl").value.trim() || "https://rierbux.noircheck.my.id",
    secret: $("secret").value.trim(),
    autoSync: $("autoSync").checked,
    autoCloseTab: $("autoCloseTab").checked,
  });
  setMsg("Pengaturan tersimpan.", "#34d399");
  refreshStatus();
});

$("pushBtn").addEventListener("click", () => {
  setMsg("Mengirim sesi Chrome ke Dashboard/VPS...", "#a1a1aa");
  chrome.runtime.sendMessage({ type: "PUSH_NOW" }, (res) => {
    if (res?.ok) {
      const bal = res.data?.balance !== null && res.data?.balance !== undefined ? ` | Saldo: ${res.data.balance} RC` : "";
      setMsg("Sesi berhasil dikirim!" + bal, "#34d399");
      refreshStatus();
    } else {
      setMsg(res?.error || "Gagal kirim sesi.", "#f87171");
    }
  });
});

$("googleBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_GOOGLE_LOGIN", fresh: false }, () => {
    setMsg("Tab login RierBux dibuka — klik Masuk dengan Google.", "#34d399");
  });
});

$("copyBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GET_COOKIE" }, async (res) => {
    if (!res?.sessionToken) {
      setMsg("Belum ada cookie sesi di Chrome. Login RierBux dulu.", "#f87171");
      return;
    }
    try {
      await navigator.clipboard.writeText(res.cookieHeader);
      setMsg("Cookie sesi disalin! Paste ke Dashboard / CLI.", "#34d399");
    } catch {
      setMsg("Gagal akses clipboard.", "#f87171");
    }
  });
});

init();
