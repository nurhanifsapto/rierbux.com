/**
 * RIERBUX.COM — Minimal Neutral-Gray (Zinc) Web Console UI v2
 * - Logo asli RierBux (/assets/logo.svg)
 * - Icon item & thumbnail game pada semua kategori (Gift/Item, Robux 5D/Transfer/Instan, 60+ Private Server, & Item Limiteds)
 * - Riwayat Pesanan lengkap dengan Pagination, Filter Status Bayar/Item, Modal Detail Order (+ Retry & Kontrol PS), & Export CSV
 * - RierCoins lengkap: Top Up Duitku + Riwayat Mutasi Saldo (Paginated + Filter + CSV) + Riwayat Top Up (Paginated)
 * - Menu Pengaturan API & Webhook terpisah dari Menu Akun (Login/Cookie/Logout)
 * - Tema Abu Gelap / Abu Terang (1-klik toggle)
 */

function buildDashboardHtml({ requireSecret = false } = {}) {
  return `<!DOCTYPE html>
<html lang="id" data-theme="dark-gray">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RierBux — Console</title>
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml" />
<style>
  :root,
  [data-theme="dark-gray"] {
    --bg: #141416;
    --bg-sub: #1a1a1d;
    --surface: #1f1f23;
    --surface-2: #27272b;
    --surface-hover: #2d2d32;
    --border: #323238;
    --border-strong: #46464f;
    --text: #f4f4f5;
    --text-2: #d4d4d8;
    --muted: #8e8e98;
    --btn-bg: #f4f4f5;
    --btn-text: #141416;
    --btn-hover: #e4e4e7;
    --ok: #34d399;
    --ok-bg: rgba(52, 211, 153, 0.12);
    --ok-bd: rgba(52, 211, 153, 0.3);
    --warn: #fbbf24;
    --warn-bg: rgba(251, 191, 36, 0.12);
    --warn-bd: rgba(251, 191, 36, 0.3);
    --err: #f87171;
    --err-bg: rgba(248, 113, 113, 0.12);
    --err-bd: rgba(248, 113, 113, 0.3);
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.38);
  }

  [data-theme="light-gray"] {
    --bg: #ececef;
    --bg-sub: #f4f4f6;
    --surface: #ffffff;
    --surface-2: #f4f4f6;
    --surface-hover: #eaeaee;
    --border: #dcdce2;
    --border-strong: #c4c4cc;
    --text: #18181b;
    --text-2: #3f3f46;
    --muted: #71717a;
    --btn-bg: #18181b;
    --btn-text: #fafafa;
    --btn-hover: #2e2e34;
    --ok: #059669;
    --ok-bg: rgba(5, 150, 105, 0.1);
    --ok-bd: rgba(5, 150, 105, 0.25);
    --warn: #b45309;
    --warn-bg: rgba(180, 83, 9, 0.1);
    --warn-bd: rgba(180, 83, 9, 0.25);
    --err: #dc2626;
    --err-bg: rgba(220, 38, 38, 0.09);
    --err-bd: rgba(220, 38, 38, 0.25);
    --shadow: 0 10px 30px rgba(24, 24, 27, 0.09);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    background: var(--bg); color: var(--text);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13.5px; line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  .hidden { display: none !important; }

  .top-loader { position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 1000; overflow: hidden; }
  .top-loader-bar { width: 35%; height: 100%; background: var(--text); opacity: .75; animation: slide 1s ease-in-out infinite; }
  @keyframes slide { 0% { transform: translateX(-120%); } 100% { transform: translateX(340%); } }

  /* Shell */
  .shell { display: grid; grid-template-columns: 248px 1fr; min-height: 100vh; }
  @media (max-width: 920px) {
    .shell { grid-template-columns: 1fr; }
    .sidebar { position: static !important; height: auto !important; border-right: none !important; border-bottom: 1px solid var(--border); }
  }

  /* Sidebar */
  .sidebar {
    position: sticky; top: 0; height: 100vh; background: var(--bg-sub);
    border-right: 1px solid var(--border); padding: 18px 14px;
    display: flex; flex-direction: column; gap: 13px; overflow-y: auto;
  }
  .brand-row { display: flex; align-items: center; justify-content: space-between; padding: 2px 6px; gap: 8px; }
  .brand-mark { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 15px; letter-spacing: -0.02em; }
  .brand-logo { width: 26px; height: 26px; object-fit: contain; border-radius: 6px; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600;
    padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--muted);
  }
  .status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .status-pill.ok { color: var(--ok); border-color: var(--ok-bd); background: var(--ok-bg); }
  .status-pill.ok .dot { background: var(--ok); }
  .status-pill.err { color: var(--err); border-color: var(--err-bd); background: var(--err-bg); }
  .status-pill.err .dot { background: var(--err); }

  .wallet-card { background: var(--surface); border: 1px solid var(--border); border-radius: 11px; padding: 12px 13px; }
  .wallet-lbl { font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; align-items: center; }
  .wallet-val { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-top: 2px; }
  .wallet-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .nav-group-lbl { font-size: 10.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; padding: 6px 10px 2px; }
  .nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .nav-btn {
    width: 100%; background: transparent; border: 1px solid transparent; color: var(--muted);
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 8px 10px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: background .12s, color .12s, border-color .12s; text-align: left;
  }
  .nav-btn:hover { background: var(--surface-hover); color: var(--text); }
  .nav-btn.active { background: var(--surface); color: var(--text); font-weight: 600; border-color: var(--border); }
  .nav-left { display: flex; align-items: center; gap: 9px; }
  .nav-btn svg { width: 15px; height: 15px; opacity: .82; flex-shrink: 0; }
  .nav-count {
    font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
    background: var(--surface-2); border: 1px solid var(--border); color: var(--text-2);
  }

  .sidebar-foot { border-top: 1px solid var(--border); padding-top: 11px; display: flex; flex-direction: column; gap: 8px; }
  .foot-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .clock-txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: var(--muted); }

  /* Main */
  .main { padding: 22px 26px 52px; max-width: 1220px; width: 100%; margin: 0 auto; }
  @media (max-width: 640px) { .main { padding: 16px 14px 40px; } }
  .page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .page-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .page-sub { font-size: 12.5px; color: var(--muted); margin-top: 2px; }

  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .panel-title { font-size: 13.5px; font-weight: 600; color: var(--text); }

  .stock-strip { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
  @media (max-width: 820px) { .stock-strip { grid-template-columns: repeat(2, 1fr); } }
  .metric { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; }
  .metric .k { font-size: 11px; color: var(--muted); font-weight: 500; }
  .metric .v { font-size: 16px; font-weight: 700; margin-top: 3px; letter-spacing: -0.01em; }
  .metric .s { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .seg {
    display: inline-flex; flex-wrap: wrap; gap: 4px; background: var(--bg-sub);
    border: 1px solid var(--border); padding: 4px; border-radius: 10px; margin-bottom: 14px;
  }
  .seg-btn {
    background: transparent; border: 1px solid transparent; color: var(--muted);
    padding: 6px 12px; border-radius: 7px; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all .12s;
  }
  .seg-btn:hover { color: var(--text); }
  .seg-btn.active { background: var(--surface); color: var(--text); font-weight: 600; border-color: var(--border); }

  .order-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: start; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 980px) { .order-grid, .grid-2 { grid-template-columns: 1fr; } }
  .sticky-col { position: sticky; top: 18px; }

  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 11.5px; font-weight: 600; color: var(--muted); margin-bottom: 5px; }
  input, select, textarea {
    width: 100%; background: var(--bg-sub); color: var(--text); border: 1px solid var(--border);
    border-radius: 8px; padding: 8.5px 11px; font-family: inherit; font-size: 13px; outline: none; transition: border-color .15s;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--border-strong); }
  textarea { min-height: 86px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .input-group { display: flex; gap: 8px; }
  .input-group input { flex: 1; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: 8px; padding: 8px 13px; font-size: 12.5px; font-weight: 600;
    cursor: pointer; border: 1px solid var(--border); transition: all .12s;
    background: var(--surface-2); color: var(--text);
  }
  .btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-strong); }
  .btn:disabled { opacity: .42; cursor: not-allowed; }
  .btn-primary { background: var(--btn-bg); color: var(--btn-text); border-color: var(--btn-bg); }
  .btn-primary:hover:not(:disabled) { background: var(--btn-hover); border-color: var(--btn-hover); }
  .btn-danger { background: var(--err-bg); color: var(--err); border-color: var(--err-bd); }
  .btn-sm { padding: 5px 10px; font-size: 11.5px; border-radius: 7px; }
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  /* Game Cards with Thumbnail */
  .game-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 7px;
    max-height: 220px; overflow-y: auto; padding-right: 2px; margin-top: 9px;
  }
  .game-card {
    display: flex; align-items: center; gap: 9px; background: var(--bg-sub); border: 1px solid var(--border);
    border-radius: 8px; padding: 6px 8px; cursor: pointer; text-align: left; color: var(--text-2);
    transition: all .12s; overflow: hidden;
  }
  .game-card:hover { border-color: var(--border-strong); color: var(--text); background: var(--surface-hover); }
  .game-card.active { background: var(--btn-bg); color: var(--btn-text); border-color: var(--btn-bg); font-weight: 600; }
  .game-card img { width: 34px; height: 24px; border-radius: 5px; object-fit: cover; flex-shrink: 0; background: var(--surface-2); }
  .game-card .g-info { min-width: 0; flex: 1; }
  .game-card .g-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .game-card .g-sub { font-size: 10.5px; opacity: .72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Variation & Tag Filter */
  .var-bar { display: flex; gap: 5px; flex-wrap: wrap; margin: 12px 0 8px; }
  .var-pill {
    font-size: 11.5px; padding: 4px 10px; border-radius: 6px; cursor: pointer;
    background: var(--bg-sub); border: 1px solid var(--border); color: var(--muted);
  }
  .var-pill.active { background: var(--surface-2); color: var(--text); border-color: var(--border-strong); font-weight: 600; }

  /* Item Tiles WITH ICONS */
  .items-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(225px, 1fr)); gap: 8px; max-height: 410px; overflow-y: auto; padding-right: 2px; }
  .item-tile {
    background: var(--bg-sub); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 11px; cursor: pointer; transition: all .12s;
    display: flex; align-items: center; gap: 11px;
  }
  .item-tile:hover { border-color: var(--border-strong); background: var(--surface-hover); }
  .item-tile.active { border-color: var(--text); background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--text); }
  .item-tile.out { opacity: .45; }
  .item-icon {
    width: 42px; height: 42px; border-radius: 8px; object-fit: contain; flex-shrink: 0;
    background: var(--surface); border: 1px solid var(--border); padding: 3px;
  }
  .item-icon.cover { object-fit: cover; padding: 0; }
  .item-body { min-width: 0; flex: 1; }
  .it-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 10.5px; color: var(--muted); }
  .it-name { font-size: 12.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .it-bottom { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; margin-top: 3px; }
  .it-price { font-size: 13px; font-weight: 700; color: var(--text); }
  .it-sub { font-size: 10.5px; color: var(--muted); }

  /* Stepper */
  .stepper { display: inline-flex; align-items: center; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-sub); overflow: hidden; }
  .stepper button { width: 32px; height: 34px; border: none; background: transparent; color: var(--text); font-size: 15px; cursor: pointer; }
  .stepper button:hover { background: var(--surface-hover); }
  .stepper input { width: 66px; text-align: center; border: none; border-left: 1px solid var(--border); border-right: 1px solid var(--border); border-radius: 0; padding: 6px 4px; background: transparent; }

  .rbx-chip {
    display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 10px;
    border-radius: 8px; background: var(--ok-bg); border: 1px solid var(--ok-bd);
  }
  .rbx-chip img { width: 34px; height: 34px; border-radius: 50%; background: var(--surface); }
  .rbx-chip .name { font-weight: 600; font-size: 12.5px; }
  .rbx-chip .id { font-size: 11px; color: var(--muted); }

  .pay-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .pay-opt {
    background: var(--bg-sub); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 6px; cursor: pointer; text-align: center; font-size: 12px; color: var(--muted); transition: all .12s;
  }
  .pay-opt.active { background: var(--surface-2); border-color: var(--text); color: var(--text); font-weight: 600; }
  .pay-opt small { display: block; font-size: 10px; opacity: .75; margin-top: 1px; }

  .summary { background: var(--bg-sub); border: 1px solid var(--border); border-radius: 9px; padding: 11px 13px; margin: 12px 0; }
  .sum-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 3.5px 0; font-size: 12.5px; }
  .sum-row.total { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 700; }

  /* Tables & Pagination */
  .table-wrap { overflow-x: auto; max-height: 490px; overflow-y: auto; border: 1px solid var(--border); border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  th { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; background: var(--bg-sub); position: sticky; top: 0; z-index: 2; }
  tbody tr:hover { background: var(--surface-hover); }
  tbody tr:last-child td { border-bottom: none; }

  .pager {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    padding: 11px 14px; border-top: 1px solid var(--border); background: var(--bg-sub); font-size: 12px; color: var(--muted);
  }
  .pager-btns { display: flex; align-items: center; gap: 6px; }

  .tag {
    display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; background: var(--surface-2); color: var(--text-2); border: 1px solid var(--border);
  }
  .tag.ok { background: var(--ok-bg); color: var(--ok); border-color: var(--ok-bd); }
  .tag.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-bd); }
  .tag.err { background: var(--err-bg); color: var(--err); border-color: var(--err-bd); }

  .log-box {
    background: var(--bg); border: 1px solid var(--border); border-radius: 9px;
    padding: 10px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px; max-height: 240px; overflow-y: auto; color: var(--text-2);
  }
  .log-row { padding: 2px 0; border-bottom: 1px solid rgba(128,128,128,.08); }
  .log-t { color: var(--muted); margin-right: 7px; }
  .log-ok { color: var(--ok); }
  .log-err { color: var(--err); }
  .log-warn { color: var(--warn); }

  /* Modals */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0, 0, 0, .6); backdrop-filter: blur(3px);
    display: grid; place-items: center; z-index: 900; padding: 16px;
  }
  .modal {
    width: 100%; max-width: 520px; max-height: 86vh; overflow-y: auto;
    background: var(--surface); border: 1px solid var(--border-strong);
    border-radius: 13px; padding: 20px; box-shadow: var(--shadow);
  }
  .modal h3 { font-size: 15.5px; font-weight: 700; margin-bottom: 6px; }
  .modal p { font-size: 12.5px; color: var(--muted); margin-bottom: 12px; }

  .toast-stack { position: fixed; right: 18px; bottom: 18px; z-index: 950; display: flex; flex-direction: column; gap: 8px; max-width: 360px; }
  .toast {
    background: var(--surface); border: 1px solid var(--border-strong); color: var(--text);
    padding: 10px 14px; border-radius: 10px; box-shadow: var(--shadow);
    font-size: 12.5px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .toast.ok { border-left: 3px solid var(--ok); }
  .toast.err { border-left: 3px solid var(--err); }
  .toast.warn { border-left: 3px solid var(--warn); }

  a.ext { color: var(--text); text-decoration: underline; text-underline-offset: 3px; font-weight: 500; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }
  .muted { color: var(--muted); font-size: 12px; }
  .divider { height: 1px; background: var(--border); margin: 14px 0; }
</style>
</head>
<body>
<div id="topLoader" class="top-loader hidden"><div class="top-loader-bar"></div></div>

<!-- Optional Auth Gate -->
<div id="authGate" class="modal-backdrop hidden">
  <div class="modal" style="max-width:400px;">
    <h3>Akses RierBux Console</h3>
    <p>Masukkan <code>DASHBOARD_SECRET</code> untuk membuka dashboard.</p>
    <div class="field"><input id="secretInput" type="password" placeholder="DASHBOARD_SECRET..." onkeydown="if(event.key==='Enter')saveSecret()" /></div>
    <button class="btn btn-primary" style="width:100%;" onclick="saveSecret()">Masuk</button>
  </div>
</div>

<!-- Confirm Modal -->
<div id="confirmModal" class="modal-backdrop hidden">
  <div class="modal" style="max-width:440px;">
    <h3 id="cmTitle">Konfirmasi</h3>
    <p id="cmDesc"></p>
    <div id="cmBody" class="summary hidden"></div>
    <div class="btn-row" style="justify-content:flex-end;margin-top:14px;">
      <button class="btn" onclick="closeModal(false)">Batal</button>
      <button id="cmOkBtn" class="btn btn-primary" onclick="closeModal(true)">Lanjutkan</button>
    </div>
  </div>
</div>

<!-- Order Detail Modal -->
<div id="detailModal" class="modal-backdrop hidden" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="modal">
    <div class="panel-head" style="margin-bottom:8px;">
      <h3 id="dmTitle" style="margin:0;">Detail Pesanan</h3>
      <button class="btn btn-sm" onclick="document.getElementById('detailModal').classList.add('hidden')">Tutup</button>
    </div>
    <div id="dmContent" class="muted">Memuat detail...</div>
  </div>
</div>

<div class="toast-stack" id="toastStack"></div>

<div class="shell">
  <!-- ── SIDEBAR ── -->
  <aside class="sidebar">
    <div class="brand-row">
      <div class="brand-mark">
        <img class="brand-logo" src="/assets/logo.svg" alt="RierBux" onerror="this.style.display='none'" />
        <span>RierBux</span>
      </div>
      <span id="sessPill" class="status-pill"><span class="dot"></span><span id="sessText">...</span></span>
    </div>

    <div class="wallet-card">
      <div class="wallet-lbl">
        <span>Saldo RierCoins</span>
        <span id="apiV1Tag" class="tag ok hidden" style="font-size:10px;padding:1px 6px;">API v1</span>
      </div>
      <div id="sideSaldo" class="wallet-val">-</div>
      <div id="sideUser" class="wallet-sub">Belum login</div>
    </div>

    <nav class="nav">
      <div class="nav-group-lbl">Transaksi</div>
      <button class="nav-btn active" id="nav-order" onclick="go('order')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Order Cepat
        </span>
      </button>
      <button class="nav-btn" id="nav-cart" onclick="go('cart')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Keranjang
        </span>
        <span id="navCartCount" class="nav-count">0</span>
      </button>
      <button class="nav-btn" id="nav-orders" onclick="go('orders')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Pesanan
        </span>
      </button>
      <button class="nav-btn" id="nav-coins" onclick="go('coins')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2"/><path d="M12 6v12"/></svg>
          RierCoins & Mutasi
        </span>
      </button>
      <button class="nav-btn" id="nav-stock" onclick="go('stock')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Stok & Katalog
        </span>
      </button>

      <div class="nav-group-lbl" style="margin-top:6px;">Sistem</div>
      <button class="nav-btn" id="nav-api" onclick="go('api')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Pengaturan API
        </span>
      </button>
      <button class="nav-btn" id="nav-account" onclick="go('account')">
        <span class="nav-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Akun & Login
        </span>
      </button>
    </nav>

    <div class="sidebar-foot">
      <div class="foot-row">
        <button class="btn btn-sm" style="flex:1;" onclick="toggleTheme()" id="themeBtn">Abu Terang</button>
        <button class="btn btn-sm" onclick="loadStatus(true)">Refresh</button>
      </div>
      <div class="foot-row">
        <span id="clockWib" class="clock-txt">--:--:-- WIB</span>
      </div>
    </div>
  </aside>

  <!-- ── MAIN CONTENT ── -->
  <main class="main">
    <div id="loginNotice" class="panel hidden" style="display:flex;align-items:center;justify-content:space-between;gap:12px;border-color:var(--warn-bd);background:var(--warn-bg);">
      <span style="font-size:12.5px;">Sesi belum aktif. Login email/password atau paste cookie agar bisa cek saldo, mutasi, verifikasi Roblox, dan transaksi.</span>
      <button class="btn btn-primary btn-sm" onclick="go('account')">Login Sekarang</button>
    </div>

    <!-- ════════ 1. ORDER CEPAT ════════ -->
    <section id="view-order">
      <div class="page-head">
        <div>
          <div class="page-title">Order Cepat</div>
          <div class="page-sub">Semua kategori RierBux lengkap: Gift/Item, Robux 5 Hari, Transfer, Instan, Private Server, & Limiteds.</div>
        </div>
        <div class="btn-row">
          <span class="tag" id="miniStockManual">Manual: -</span>
          <span class="tag" id="miniStockPs">PS: -</span>
        </div>
      </div>

      <div class="seg">
        <button class="seg-btn active" id="cat-product" onclick="setCat('product')">Game Pass & Item</button>
        <button class="seg-btn" id="cat-robux-5d" onclick="setCat('robux-5d')">Robux 5 Hari</button>
        <button class="seg-btn" id="cat-robux-transfer" onclick="setCat('robux-transfer')">Robux Transfer</button>
        <button class="seg-btn" id="cat-robux-instant" onclick="setCat('robux-instant')">Robux Instan</button>
        <button class="seg-btn" id="cat-private-server" onclick="setCat('private-server')">Private Server</button>
        <button class="seg-btn" id="cat-limited" onclick="setCat('limited')">Item Limiteds</button>
      </div>

      <div class="order-grid">
        <!-- Step 1 -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title" id="step1Title">1. Pilih Produk & Item</span>
            <span class="tag" id="itemCountTag">0 item</span>
          </div>

          <!-- Game Pass & Item Search -->
          <div id="wrapGameSearch">
            <input id="prodSearch" placeholder="Cari dari 165+ game (fish it, blox fruits, evade, dll)..." oninput="renderGameCards()" />
            <div id="gameGrid" class="game-grid"></div>
          </div>

          <!-- Private Server (60 Popular Preloaded + Search Any Game) -->
          <div id="wrapPsSearch" class="hidden">
            <div class="input-group">
              <input id="psSearch" placeholder="Filter 60 game populer atau tekan Enter cari game Roblox lain..." oninput="renderPsCards()" onkeydown="if(event.key==='Enter')searchPsLive()" />
              <button class="btn" onclick="searchPsLive()">Cari Roblox</button>
            </div>
          </div>

          <!-- Limiteds Filter -->
          <div id="wrapLimSearch" class="hidden">
            <input id="limSearch" placeholder="Cari item limited (bighead, crown, fedora, dll)..." oninput="renderLimiteds()" />
          </div>

          <div id="varBar" class="var-bar hidden"></div>
          <div id="itemsList" class="items-list" style="margin-top:10px;">
            <div class="muted" style="padding:14px 4px;">Pilih game di atas untuk melihat daftar item beserta icon & harganya.</div>
          </div>
        </div>

        <!-- Step 2 (Sticky) -->
        <div class="panel sticky-col">
          <div class="panel-head">
            <span class="panel-title">2. Tujuan & Pembayaran</span>
            <span id="selIdTag" class="tag hidden"></span>
          </div>

          <!-- Selected Item Preview With Icon -->
          <div id="selPreview" class="hidden" style="display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:9px;background:var(--bg-sub);border:1px solid var(--border);margin-bottom:12px;">
            <img id="selPrevImg" class="item-icon" src="" alt="" />
            <div style="min-width:0;flex:1;">
              <div id="selPrevName" style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
              <div id="selPrevMeta" class="muted"></div>
            </div>
          </div>

          <div id="wrapRoblox" class="field">
            <label>Username Roblox Tujuan</label>
            <div class="input-group">
              <input id="rbxInput" placeholder="Masukkan username Roblox" onkeydown="if(event.key==='Enter')checkRoblox()" />
              <button class="btn" onclick="checkRoblox()">Cek</button>
            </div>
            <div id="rbxChip" class="rbx-chip hidden">
              <img id="rbxImg" src="" alt="" />
              <div>
                <div id="rbxName" class="name"></div>
                <div id="rbxId" class="id"></div>
              </div>
            </div>
          </div>

          <!-- Robux 5 Hari: Game Pass Check -->
          <div id="wrapGp" class="field hidden">
            <label>Game Pass ID <span id="gpPriceHint" class="muted"></span></label>
            <div class="input-group">
              <input id="gpInput" placeholder="Kosongkan = auto-detect" />
              <button class="btn" onclick="checkGamePassNow()">Cek GP</button>
            </div>
            <div id="gpStatus" class="muted" style="margin-top:4px;"></div>
          </div>

          <!-- Robux Instan: Password -->
          <div id="wrapPass" class="field hidden">
            <label>Password Akun Roblox (min 8 karakter)</label>
            <input id="passInput" type="password" placeholder="Password akun Roblox" />
          </div>

          <!-- Limiteds: Small Limited Inventory Picker -->
          <div id="wrapLimTrade" class="field hidden">
            <label>Small Limited untuk Trade (wajib punya 1 small limited di akun Roblox)</label>
            <div class="btn-row" style="margin-bottom:6px;">
              <button class="btn btn-sm" onclick="loadRobloxInventory()">Muat Inventory Small Limited</button>
              <label style="margin:0;display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
                <input id="limPreorderChk" type="checkbox" style="width:auto;" onchange="updateSummary()" /> Preorder
              </label>
            </div>
            <select id="smallLimSelect"><option value="">-- Cek Roblox & muat inventory dulu --</option></select>
          </div>

          <div id="wrapQty" class="field" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <label style="margin:0;">Jumlah / Quantity</label>
            <div class="stepper">
              <button type="button" onclick="stepQty(-1)">−</button>
              <input id="qtyInput" type="number" value="1" min="1" oninput="updateSummary()" />
              <button type="button" onclick="stepQty(1)">+</button>
            </div>
          </div>

          <div class="field">
            <label>Metode Pembayaran</label>
            <div class="pay-opts">
              <div class="pay-opt active" id="pay-balance" onclick="setPay('balance')">RierCoins<small>Fee Rp 0</small></div>
              <div class="pay-opt" id="pay-duitku" onclick="setPay('duitku')">Duitku<small>QRIS / VA</small></div>
              <div class="pay-opt" id="pay-unpaid" onclick="setPay('unpaid')">Unpaid<small>Bayar nanti</small></div>
            </div>
          </div>

          <div id="wrapDuitkuPm" class="field hidden">
            <label>Channel Pembayaran Duitku</label>
            <select id="orderPmSelect"><option value="">Memuat channel...</option></select>
          </div>

          <div class="field">
            <label>Kode Promo (opsional)</label>
            <input id="promoInput" placeholder="Kosongkan jika tidak ada" />
          </div>

          <div class="summary">
            <div class="sum-row"><span class="muted">Produk</span><span id="sumProd">-</span></div>
            <div class="sum-row"><span class="muted">Item</span><span id="sumItem">-</span></div>
            <div class="sum-row total"><span>Total Estimasi</span><span id="sumTotal">Rp 0</span></div>
          </div>

          <div class="btn-row" style="margin-bottom:8px;">
            <button class="btn btn-primary" style="flex:1;padding:10px 14px;" onclick="submitOrder(false)">Buat & Bayar Order</button>
          </div>
          <div class="btn-row">
            <button class="btn" style="flex:1;" onclick="submitOrder(true)">Preview Dry-Run</button>
            <button class="btn" style="flex:1;" onclick="addCartNow()">+ Keranjang</button>
          </div>

          <div id="orderResult" class="summary hidden" style="margin-top:12px;border-color:var(--ok-bd);"></div>
        </div>
      </div>
    </section>

    <!-- ════════ 2. KERANJANG ════════ -->
    <section id="view-cart" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">Keranjang</div>
          <div class="page-sub">Checkout banyak item sekaligus dalam 1 transaksi.</div>
        </div>
        <div class="btn-row">
          <button class="btn" onclick="loadCart()">Refresh</button>
          <button class="btn btn-primary" onclick="checkoutCartPrompt()">Checkout Semua (RierCoins)</button>
        </div>
      </div>
      <div class="panel" style="padding:0;overflow:hidden;">
        <div class="table-wrap" style="border:none;">
          <table>
            <thead><tr><th>ID</th><th>Item</th><th>Qty</th><th>Subtotal</th><th>Aksi</th></tr></thead>
            <tbody id="cartTbody"><tr><td colspan="5" class="muted" style="text-align:center;padding:24px;">Memuat keranjang...</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ════════ 3. PESANAN (LENGKAP + PAGINATION + DETAIL MODAL + CSV) ════════ -->
    <section id="view-orders" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">Riwayat Pesanan</div>
          <div class="page-sub">Daftar seluruh pesanan lengkap dengan filter, pagination, modal detail, & export CSV.</div>
        </div>
        <div class="btn-row">
          <input id="ordSearch" placeholder="Cari RB-... / username" style="width:185px;" onkeydown="if(event.key==='Enter'){ordPage=1;loadOrders();}" />
          <select id="ordStatus" style="width:125px;" onchange="ordPage=1;loadOrders()">
            <option value="">Status Bayar</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
          <select id="ordItemStatus" style="width:125px;" onchange="ordPage=1;loadOrders()">
            <option value="">Status Item</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select id="ordLimit" style="width:86px;" onchange="ordPage=1;loadOrders()">
            <option value="15">15 / hal</option>
            <option value="25" selected>25 / hal</option>
            <option value="50">50 / hal</option>
            <option value="100">100 / hal</option>
          </select>
          <button class="btn" onclick="loadOrders()">Muat</button>
          <a class="btn" href="/api/orders/csv" target="_blank" style="text-decoration:none;">Export CSV</a>
        </div>
      </div>

      <div class="panel" style="padding:0;overflow:hidden;">
        <div class="table-wrap" style="border:none;max-height:520px;">
          <table>
            <thead><tr><th>Order ID</th><th>Tanggal</th><th>Produk & Item</th><th>Roblox</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody id="ordersTbody"><tr><td colspan="7" class="muted" style="text-align:center;padding:26px;">Memuat pesanan...</td></tr></tbody>
          </table>
        </div>
        <div class="pager">
          <span id="ordPagerInfo">Halaman 1 / 1</span>
          <div class="pager-btns">
            <button class="btn btn-sm" id="ordPrevBtn" onclick="ordPage=Math.max(1,ordPage-1);loadOrders()">← Sebelumnya</button>
            <button class="btn btn-sm" id="ordNextBtn" onclick="ordPage++;loadOrders()">Berikutnya →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════ 4. RIERCOINS (TOP UP + MUTASI SALDO + RIWAYAT TOP UP + PAGINATION) ════════ -->
    <section id="view-coins" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">RierCoins & Mutasi Saldo</div>
          <div class="page-sub">Top up saldo via Duitku, riwayat mutasi keluar/masuk RierCoins, dan riwayat invoice top up.</div>
        </div>
        <div class="btn-row">
          <span id="coinsBalTag" class="tag ok" style="font-size:12.5px;padding:4px 11px;">- RC</span>
          <button class="btn" onclick="loadCoins()">Refresh</button>
          <a class="btn" href="/api/coins/csv" target="_blank" style="text-decoration:none;">Export CSV</a>
        </div>
      </div>

      <!-- Top Up Form Compact -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">Top Up RierCoins (Duitku)</span>
          <span class="muted">Bonus otomatis 0,5% (&lt;50k) · 0,7% (≥50k)</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1.6fr auto;gap:10px;align-items:end;">
          <div class="field" style="margin:0;"><label>Nominal (Rp)</label><input id="topupAmt" type="number" value="50000" min="10000" step="5000" /></div>
          <div class="field" style="margin:0;"><label>Channel Pembayaran</label><select id="topupPm"><option value="">Memuat channel...</option></select></div>
          <button class="btn btn-primary" style="height:37px;" onclick="doTopup()">Buat Invoice</button>
        </div>
        <div id="topupRes" class="summary hidden" style="margin-top:10px;margin-bottom:0;"></div>
      </div>

      <!-- Sub-tab Mutasi Saldo vs Riwayat Top Up -->
      <div class="seg" style="margin-bottom:10px;">
        <button class="seg-btn active" id="ctab-mutasi" onclick="setCoinTab('mutasi')">Mutasi Saldo RierCoins</button>
        <button class="seg-btn" id="ctab-topup" onclick="setCoinTab('topup')">Riwayat Top Up RierCoins</button>
      </div>

      <!-- Panel Mutasi Saldo -->
      <div id="cpane-mutasi" class="panel" style="padding:0;overflow:hidden;">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="panel-title">Riwayat Mutasi Saldo</span>
          <div class="btn-row">
            <select id="txTypeFilter" style="width:155px;padding:6px 9px;" onchange="txPage=1;loadCoins()">
              <option value="">Semua Tipe</option>
              <option value="usage">Pembayaran (usage)</option>
              <option value="topup">Top Up</option>
              <option value="topup_bonus">Bonus Top Up</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <select id="txLimit" style="width:88px;padding:6px 9px;" onchange="txPage=1;loadCoins()">
              <option value="15">15 / hal</option>
              <option value="25" selected>25 / hal</option>
              <option value="50">50 / hal</option>
            </select>
          </div>
        </div>
        <div class="table-wrap" style="border:none;max-height:420px;">
          <table>
            <thead><tr><th>Tanggal</th><th>Tipe</th><th>Jumlah</th><th>Deskripsi</th><th>Order ID</th></tr></thead>
            <tbody id="txTbody"><tr><td colspan="5" class="muted" style="text-align:center;padding:24px;">Memuat mutasi...</td></tr></tbody>
          </table>
        </div>
        <div class="pager">
          <span id="txPagerInfo">Halaman 1 / 1</span>
          <div class="pager-btns">
            <button class="btn btn-sm" id="txPrevBtn" onclick="txPage=Math.max(1,txPage-1);loadCoins()">← Sebelumnya</button>
            <button class="btn btn-sm" id="txNextBtn" onclick="txPage++;loadCoins()">Berikutnya →</button>
          </div>
        </div>
      </div>

      <!-- Panel Riwayat Top Up -->
      <div id="cpane-topup" class="panel hidden" style="padding:0;overflow:hidden;">
        <div class="table-wrap" style="border:none;max-height:420px;">
          <table>
            <thead><tr><th>ID Top Up</th><th>Tanggal</th><th>Metode</th><th>Nominal</th><th>Fee</th><th>Status</th><th>Link</th></tr></thead>
            <tbody id="topupTbody"><tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Memuat riwayat top up...</td></tr></tbody>
          </table>
        </div>
        <div class="pager">
          <span id="topupPagerInfo">Halaman 1 / 1</span>
          <div class="pager-btns">
            <button class="btn btn-sm" id="topupPrevBtn" onclick="topupPage=Math.max(1,topupPage-1);loadCoins()">← Sebelumnya</button>
            <button class="btn btn-sm" id="topupNextBtn" onclick="topupPage++;loadCoins()">Berikutnya →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════ 5. STOK & KATALOG ════════ -->
    <section id="view-stock" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">Stok & Katalog</div>
          <div class="page-sub">Monitoring stok handler real-time dan sinkronisasi katalog ke products.json / Google Sheet.</div>
        </div>
        <div class="btn-row">
          <button class="btn" onclick="loadStatus(true)">Cek Stok</button>
          <button class="btn btn-primary" onclick="syncNow()">Sync Katalog</button>
        </div>
      </div>

      <div class="stock-strip">
        <div class="metric"><div class="k">Robux Manual</div><div class="v" id="sk-manual">-</div><div class="s" id="sk-manual-s">-</div></div>
        <div class="metric"><div class="k">Robux 5 Hari</div><div class="v" id="sk-5d">-</div><div class="s" id="sk-5d-s">-</div></div>
        <div class="metric"><div class="k">Robux Instan</div><div class="v" id="sk-inst">-</div><div class="s" id="sk-inst-s">-</div></div>
        <div class="metric"><div class="k">Robux Transfer</div><div class="v" id="sk-trf">-</div><div class="s" id="sk-trf-s">-</div></div>
        <div class="metric"><div class="k">Private Server</div><div class="v" id="sk-ps">-</div><div class="s" id="sk-ps-s">-</div></div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">Daftar Produk Aktif</span>
          <span class="tag" id="catCountTag">0 produk</span>
        </div>
        <input id="catFilter" placeholder="Filter produk..." oninput="renderCatalogTable()" style="margin-bottom:10px;" />
        <div class="table-wrap" style="max-height:420px;">
          <table>
            <thead><tr><th>#</th><th>Produk</th><th>Slug</th><th>Terjual</th><th>Aksi</th></tr></thead>
            <tbody id="catTbody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ════════ 6. PENGATURAN API & WEBHOOK (MENU KHUSUS TERPISAH!) ════════ -->
    <section id="view-api" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">Pengaturan API & Webhook</div>
          <div class="page-sub">Kelola Official RierBux API Key (/api/v1), Google Sheet Bridge v3, Direct HTTP Webhook, & Action Hash.</div>
        </div>
        <button class="btn" onclick="loadApiKeys()">Refresh Keys</button>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">Official API Key (/api/v1)</span>
            <span id="apiActiveTag" class="tag">Belum Aktif</span>
          </div>
          <p class="muted" style="margin-bottom:10px;">Gunakan API Key <code>rb_...</code> untuk akses JSON resmi (saldo, mutasi, katalog, pesanan) dengan rate limit 120 req/menit.</p>
          <div class="input-group" style="margin-bottom:8px;">
            <input id="newKeyName" placeholder="Nama API Key baru (default: RierBux Console)" />
            <button class="btn btn-primary" onclick="createKey()">Buat Key</button>
          </div>
          <div class="input-group" style="margin-bottom:12px;">
            <input id="inApiKey" placeholder="Atau paste rb_xxxxxxxx yang sudah ada..." />
            <button class="btn" onclick="setKey()">Simpan</button>
          </div>
          <div class="table-wrap" style="max-height:200px;">
            <table>
              <thead><tr><th>Nama</th><th>Prefix / ID</th><th>Aksi</th></tr></thead>
              <tbody id="apiKeysTbody"><tr><td colspan="3" class="muted" style="text-align:center;padding:14px;">Klik Refresh Keys (butuh login).</td></tr></tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><span class="panel-title">Webhook & Google Sheet Bridge v3</span></div>
          <p class="muted" style="margin-bottom:10px;">Protokol 100% kompatibel dengan GerbangAPI ↔ IDV.CO.ID (<code>google-apps-script.gs</code>).</p>
          <div class="summary" style="margin-top:0;">
            <div class="sum-row"><span class="muted">Direct Order</span><code>POST /webhook/order</code></div>
            <div class="sum-row"><span class="muted">Remote Session</span><code>POST /session</code></div>
            <div class="sum-row"><span class="muted">Sync Katalog</span><code>POST /sync-catalog</code></div>
            <div class="sum-row"><span class="muted">Health Check</span><code>GET /health</code></div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" style="flex:1;" onclick="pingSheet()">Test Google Sheet</button>
            <button class="btn" style="flex:1;" onclick="refreshActions()">Refresh Action Hash</button>
          </div>
          <div id="sheetPingBox" class="summary hidden" style="margin-top:10px;margin-bottom:0;"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><span class="panel-title">Live Activity Log</span></div>
        <div id="logBox" class="log-box">Menunggu aktivitas...</div>
      </div>
    </section>

    <!-- ════════ 7. AKUN & LOGIN (TERPISAH DARI PENGATURAN API!) ════════ -->
    <section id="view-account" class="hidden">
      <div class="page-head">
        <div>
          <div class="page-title">Akun & Login</div>
          <div class="page-sub">Kelola autentikasi akun RierBux (Email/Password atau Cookie Chrome untuk Google OAuth).</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="logoutPrompt()">Logout</button>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Login Email & Password</span></div>
          <div class="field"><label>Email RierBux</label><input id="inEmail" type="email" placeholder="email@gmail.com" /></div>
          <div class="field"><label>Password</label><input id="inPass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')loginEmail()" /></div>
          <button class="btn btn-primary" style="width:100%;" onclick="loginEmail()">Login</button>
        </div>

        <div class="panel">
          <div class="panel-head"><span class="panel-title">Paste Cookie / Copy as cURL (Google OAuth)</span></div>
          <p class="muted" style="margin-bottom:8px;">Buka <code>rierbux.com</code> di Chrome → <code>F12</code> → Network → klik kanan <code>get-session</code> → <strong>Copy as cURL</strong> → paste di bawah.</p>
          <div class="field"><textarea id="inCookie" placeholder="Paste header cookie: atau Copy as cURL..."></textarea></div>
          <button class="btn btn-primary" style="width:100%;" onclick="loginCookie()">Verifikasi & Aktifkan Sesi</button>
        </div>
      </div>
    </section>
  </main>
</div>

<script>
const REQUIRE_SECRET = ${requireSecret ? "true" : "false"};
let dashSecret = localStorage.getItem("rb_dash_secret") || "";
let activeView = localStorage.getItem("rb_view") || "order";
let activeCat = "product";
let payMode = "balance";

let allProducts = [];
let allPsGames = [];
let allLimiteds = [];
let limTags = [];
let activeLimTag = "ALL";
let verifiedRbxUser = null;
let smallLimList = [];

let selSlug = null;
let selPlaceId = null;
let currentItems = [];
let activeVar = "ALL";
let selItem = null;
let pmList = [];

let ordPage = 1;
let txPage = 1;
let topupPage = 1;
let modalResolve = null;

function esc(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function fmtRp(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return "-";
  return "Rp " + Math.round(Number(n)).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
}
function fmtNum(n) {
  if (n === null || n === undefined) return "∞";
  return Number(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
}
function setLoading(on) { document.getElementById("topLoader").classList.toggle("hidden", !on); }

function toast(type, text) {
  const stack = document.getElementById("toastStack");
  const el = document.createElement("div");
  el.className = "toast " + (type || "");
  el.innerHTML = '<span>' + text + '</span><button class="btn btn-sm" style="padding:2px 6px;" onclick="this.parentElement.remove()">✕</button>';
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function askModal({ title, desc, rows = [], okLabel = "Lanjutkan" }) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    document.getElementById("cmTitle").textContent = title;
    document.getElementById("cmDesc").textContent = desc || "";
    document.getElementById("cmOkBtn").textContent = okLabel;
    const body = document.getElementById("cmBody");
    if (rows.length) {
      body.classList.remove("hidden");
      body.innerHTML = rows.map(([k, v]) => '<div class="sum-row"><span class="muted">' + esc(k) + '</span><strong>' + esc(v) + '</strong></div>').join("");
    } else body.classList.add("hidden");
    document.getElementById("confirmModal").classList.remove("hidden");
  });
}
function closeModal(ok) {
  document.getElementById("confirmModal").classList.add("hidden");
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(ok); }
}

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("rb_theme", t);
  document.getElementById("themeBtn").textContent = t === "dark-gray" ? "Abu Terang" : "Abu Gelap";
}
function toggleTheme() {
  applyTheme((document.documentElement.getAttribute("data-theme") || "dark-gray") === "dark-gray" ? "light-gray" : "dark-gray");
}
function saveSecret() {
  dashSecret = document.getElementById("secretInput").value.trim();
  localStorage.setItem("rb_dash_secret", dashSecret);
  document.getElementById("authGate").classList.add("hidden");
  init();
}

async function api(path, opts = {}) {
  setLoading(true);
  try {
    const res = await fetch(path, {
      ...opts,
      headers: {
        "content-type": "application/json",
        ...(dashSecret ? { "x-api-key": dashSecret } : {}),
        ...(opts.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({ ok: false, error: "Respon bukan JSON" }));
    if (res.status === 401 && REQUIRE_SECRET) {
      document.getElementById("authGate").classList.remove("hidden");
      throw new Error(data.error || "Unauthorized");
    }
    if (!res.ok || data.ok === false) throw new Error(data.error || "HTTP " + res.status);
    return data;
  } finally {
    setLoading(false);
  }
}

function go(view) {
  activeView = view;
  localStorage.setItem("rb_view", view);
  for (const v of ["order", "cart", "orders", "coins", "stock", "api", "account"]) {
    document.getElementById("nav-" + v).classList.toggle("active", v === view);
    document.getElementById("view-" + v).classList.toggle("hidden", v !== view);
  }
  if (view === "cart") loadCart();
  if (view === "orders") loadOrders();
  if (view === "coins") loadCoins();
  if (view === "stock") renderCatalogTable();
  if (view === "api") loadApiKeys();
}

async function loadStatus(fresh = false) {
  try {
    const d = await api("/api/status" + (fresh ? "?fresh=1" : ""));
    const pill = document.getElementById("sessPill");
    pill.className = "status-pill " + (d.loggedIn ? "ok" : "err");
    document.getElementById("sessText").textContent = d.loggedIn ? "Online" : "Offline";
    document.getElementById("loginNotice").classList.toggle("hidden", d.loggedIn);
    document.getElementById("apiV1Tag").classList.toggle("hidden", !d.hasApiKey);

    const apiTag = document.getElementById("apiActiveTag");
    apiTag.textContent = d.hasApiKey ? ("Aktif · " + (d.apiKeyPreview || "rb_...")) : "Belum Aktif";
    apiTag.className = "tag " + (d.hasApiKey ? "ok" : "");

    document.getElementById("sideSaldo").textContent = d.balance !== null ? fmtNum(d.balance) + " RC" : "-";
    document.getElementById("sideUser").textContent = d.loggedIn && d.user ? (d.user.name || d.user.email) : "Belum login";
    document.getElementById("navCartCount").textContent = String(d.cartCount || 0);
    document.getElementById("coinsBalTag").textContent = d.balance !== null ? fmtNum(d.balance) + " RC (" + fmtRp(d.balance) + ")" : "- RC";

    if (d.stock) {
      const byId = {};
      if (d.stock.manual) byId[d.stock.manual.handlerId] = d.stock.manual;
      (d.stock.handlerStocks || []).forEach(h => byId[h.handlerId] = h);
      const setSk = (id, h) => {
        if (!h) return;
        document.getElementById("sk-" + id).textContent = h.stock === null ? h.status.toUpperCase() : fmtNum(h.stock);
        document.getElementById("sk-" + id + "-s").textContent = h.status.toUpperCase();
      };
      setSk("manual", byId["robux-manual"]);
      setSk("5d", byId["robux-5d"]);
      setSk("inst", byId["robux-instant"]);
      setSk("trf", byId["robux-transfer"]);
      setSk("ps", byId["private-server"]);
      document.getElementById("miniStockManual").textContent = "Manual: " + (byId["robux-manual"] ? fmtNum(byId["robux-manual"].stock) : "-");
      document.getElementById("miniStockPs").textContent = "PS: " + (byId["private-server"] ? fmtNum(byId["private-server"].stock) : "-");
    }

    const logBox = document.getElementById("logBox");
    if (d.logs && d.logs.length) {
      logBox.innerHTML = d.logs.map(l => '<div class="log-row"><span class="log-t">' + esc(l.time) + '</span><span class="log-' + esc(l.level) + '">' + esc(l.msg) + '</span></div>').join("");
    }
  } catch (err) { toast("err", esc(err.message)); }
}

async function loadProducts() {
  try {
    const d = await api("/api/products");
    allProducts = d.products || [];
    document.getElementById("catCountTag").textContent = allProducts.length + " produk";
    renderGameCards();
    renderCatalogTable();
  } catch (err) { toast("err", "Gagal muat produk: " + esc(err.message)); }
}

function renderGameCards() {
  const q = document.getElementById("prodSearch").value.toLowerCase().trim();
  const list = q ? allProducts.filter(p => p.name.toLowerCase().includes(q) || p.slug.includes(q)) : allProducts.slice(0, 40);
  const el = document.getElementById("gameGrid");
  if (!list.length) { el.innerHTML = '<div class="muted" style="padding:8px 2px;">Tidak ada game yang cocok.</div>'; return; }
  el.innerHTML = list.map(p =>
    '<button class="game-card ' + (selSlug === p.slug ? "active" : "") + '" onclick="pickSlug(\\'' + esc(p.slug) + '\\')" title="' + esc(p.name) + '">' +
    (p.thumbnailUrl ? '<img src="' + esc(p.thumbnailUrl) + '" loading="lazy" alt="" />' : '') +
    '<div class="g-info"><div class="g-name">' + esc(p.name) + '</div><div class="g-sub">' + (p.totalSold ? fmtNum(p.totalSold) + ' terjual' : esc(p.slug)) + '</div></div></button>'
  ).join("");
}

function renderCatalogTable() {
  const q = (document.getElementById("catFilter")?.value || "").toLowerCase().trim();
  const list = q ? allProducts.filter(p => p.name.toLowerCase().includes(q) || p.slug.includes(q)) : allProducts;
  const tb = document.getElementById("catTbody");
  if (!tb) return;
  tb.innerHTML = list.slice(0, 165).map((p, i) =>
    '<tr><td>' + (i + 1) + '</td><td><div style="display:flex;align-items:center;gap:9px;">' +
    (p.thumbnailUrl ? '<img src="' + esc(p.thumbnailUrl) + '" style="width:36px;height:24px;border-radius:4px;object-fit:cover;" loading="lazy" />' : '') +
    '<strong>' + esc(p.name) + '</strong></div></td><td><code>' + esc(p.slug) + '</code></td><td class="muted">' + (p.totalSold ? fmtNum(p.totalSold) : '-') + '</td>' +
    '<td><button class="btn btn-sm" onclick="openFromCatalog(\\'' + esc(p.slug) + '\\')">Pilih</button></td></tr>'
  ).join("");
}
function openFromCatalog(slug) { go("order"); setCat("product"); pickSlug(slug); }

async function setCat(cat) {
  activeCat = cat;
  selItem = null; selSlug = null; selPlaceId = null; currentItems = []; activeVar = "ALL"; activeLimTag = "ALL";
  updateSummary();
  for (const c of ["product", "robux-5d", "robux-transfer", "robux-instant", "private-server", "limited"]) {
    document.getElementById("cat-" + c).classList.toggle("active", c === cat);
  }
  document.getElementById("wrapGameSearch").classList.toggle("hidden", cat !== "product");
  document.getElementById("wrapPsSearch").classList.toggle("hidden", cat !== "private-server");
  document.getElementById("wrapLimSearch").classList.toggle("hidden", cat !== "limited");
  document.getElementById("wrapRoblox").classList.toggle("hidden", cat === "private-server");
  document.getElementById("wrapGp").classList.toggle("hidden", cat !== "robux-5d");
  document.getElementById("wrapPass").classList.toggle("hidden", cat !== "robux-instant");
  document.getElementById("wrapLimTrade").classList.toggle("hidden", cat !== "limited");
  document.getElementById("wrapQty").classList.toggle("hidden", cat === "limited" || cat === "private-server");
  document.getElementById("varBar").classList.add("hidden");

  if (cat === "robux-5d") await pickSlug("robux-5-hari");
  else if (cat === "robux-transfer") await pickSlug("robux-transfer");
  else if (cat === "robux-instant") await pickSlug("robux-instan");
  else if (cat === "private-server") await loadPopularPrivateServers();
  else if (cat === "limited") await loadLimiteds();
  else {
    document.getElementById("itemsList").innerHTML = '<div class="muted" style="padding:14px 4px;">Pilih game di atas untuk melihat item beserta icon & harga.</div>';
    document.getElementById("itemCountTag").textContent = "0 item";
  }
}

async function pickSlug(slug) {
  selSlug = slug; activeVar = "ALL"; renderGameCards();
  document.getElementById("itemsList").innerHTML = '<div class="muted" style="padding:14px 4px;">Memuat item...</div>';
  try {
    const d = await api("/api/items?slug=" + encodeURIComponent(slug));
    currentItems = d.detail.allItems || [];
    document.getElementById("itemCountTag").textContent = currentItems.length + " item";
    renderVariations();
    renderItems();
    if (currentItems.length === 1) selectItemById(currentItems[0].id);
  } catch (err) { document.getElementById("itemsList").innerHTML = '<div class="muted">' + esc(err.message) + '</div>'; }
}

async function loadPopularPrivateServers() {
  document.getElementById("itemsList").innerHTML = '<div class="muted" style="padding:14px 4px;">Memuat 60 game Private Server populer...</div>';
  try {
    if (!allPsGames.length) {
      const d = await api("/api/private-servers");
      allPsGames = d.games || [];
    }
    renderPsCards();
  } catch (err) { toast("err", esc(err.message)); }
}

function renderPsCards() {
  const q = (document.getElementById("psSearch")?.value || "").toLowerCase().trim();
  const list = q ? allPsGames.filter(g => g.name.toLowerCase().includes(q) || g.rootPlaceId.includes(q)) : allPsGames;
  document.getElementById("itemCountTag").textContent = list.length + " game PS";
  const el = document.getElementById("itemsList");
  if (!list.length) {
    el.innerHTML = '<div class="muted" style="padding:14px 4px;">Tidak ada di 60 game populer. Klik tombol <strong>Cari Roblox</strong> untuk mencari semua game Roblox.</div>';
    return;
  }
  el.innerHTML = list.map(g => {
    const act = selPlaceId === String(g.rootPlaceId) ? " active" : "";
    return '<div class="item-tile' + act + '" onclick="pickPsGame(\\'' + esc(g.rootPlaceId) + '\\',' + (g.productItemId || 0) + ',' + (g.unitPrice || 0) + ',\\'' + esc(g.name).replace(/'/g, "") + '\\',\\'' + esc(g.thumbnailUrl || "") + '\\')">' +
      (g.thumbnailUrl ? '<img class="item-icon cover" src="' + esc(g.thumbnailUrl) + '" loading="lazy" alt="" />' : '') +
      '<div class="item-body"><div class="it-top"><span>Place ' + esc(g.rootPlaceId) + '</span><span>' + (g.priceRobux ? g.priceRobux + ' R$' : '') + '</span></div>' +
      '<div class="it-name">' + esc(g.name) + '</div>' +
      '<div class="it-bottom"><span class="it-price">' + fmtRp(g.unitPrice) + '</span><span class="it-sub">' + (g.soldCount ? fmtNum(g.soldCount) + ' terjual' : '') + '</span></div></div></div>';
  }).join("");
}

async function searchPsLive() {
  const q = document.getElementById("psSearch").value.trim();
  if (!q) return renderPsCards();
  try {
    const d = await api("/api/games/search?q=" + encodeURIComponent(q));
    const games = d.games || [];
    document.getElementById("itemCountTag").textContent = games.length + " hasil Roblox";
    const el = document.getElementById("itemsList");
    if (!games.length) { el.innerHTML = '<div class="muted" style="padding:12px 4px;">Game tidak ditemukan di Roblox.</div>'; return; }
    el.innerHTML = games.slice(0, 24).map(g =>
      '<div class="item-tile" onclick="pickPsPlaceFetch(\\'' + g.rootPlaceId + '\\',\\'' + esc(g.name).replace(/'/g, "") + '\\',\\'' + esc(g.thumbnailUrl || "") + '\\')">' +
      (g.thumbnailUrl ? '<img class="item-icon cover" src="' + esc(g.thumbnailUrl) + '" loading="lazy" alt="" />' : '') +
      '<div class="item-body"><div class="it-top"><span>Place ' + g.rootPlaceId + '</span><span>' + fmtNum(g.playerCount) + ' playing</span></div>' +
      '<div class="it-name">' + esc(g.name) + '</div><div class="it-bottom"><span class="it-sub">Klik cek harga PS</span></div></div></div>'
    ).join("");
  } catch (err) { toast("err", esc(err.message)); }
}

function pickPsGame(placeId, productItemId, unitPrice, name, thumb) {
  selPlaceId = String(placeId);
  selItem = { id: productItemId, name: "Private Server — " + name, price: unitPrice, unitPrice, imageUrl: thumb, variation: "Private Server", minQuantity: 1 };
  renderPsCards();
  updateSummary();
}

async function pickPsPlaceFetch(placeId, name, thumb) {
  try {
    const d = await api("/api/private-server?placeId=" + encodeURIComponent(placeId));
    const it = d.ps?.items?.[0];
    if (!it) return toast("warn", "Game ini belum punya Private Server aktif di RierBux.");
    selPlaceId = String(placeId);
    selItem = { ...it, name: "Private Server — " + (it.name || name), imageUrl: thumb, price: it.unitPrice };
    updateSummary();
    toast("ok", "Harga Private Server dimuat: " + fmtRp(it.unitPrice));
  } catch (err) { toast("err", esc(err.message)); }
}

async function loadLimiteds() {
  document.getElementById("itemsList").innerHTML = '<div class="muted" style="padding:14px 4px;">Memuat daftar Item Limiteds...</div>';
  try {
    if (!allLimiteds.length) {
      const d = await api("/api/limiteds");
      limTags = d.filterTags || [];
      allLimiteds = d.items || [];
    }
    const bar = document.getElementById("varBar");
    bar.classList.remove("hidden");
    bar.innerHTML = [{ slug: "ALL", name: "Semua" }, ...limTags].map(t =>
      '<button class="var-pill ' + (activeLimTag === t.slug ? "active" : "") + '" onclick="setLimTag(\\'' + esc(t.slug) + '\\')">' + esc(t.name) + '</button>'
    ).join("");
    renderLimiteds();
  } catch (err) { toast("err", esc(err.message)); }
}
function setLimTag(slug) { activeLimTag = slug; loadLimiteds(); }

function renderLimiteds() {
  const q = (document.getElementById("limSearch")?.value || "").toLowerCase().trim();
  const list = allLimiteds.filter(it => {
    const matchQ = !q || it.name.toLowerCase().includes(q) || it.slug.includes(q);
    const matchT = activeLimTag === "ALL" || (it.tags || []).includes(activeLimTag);
    return matchQ && matchT;
  });
  document.getElementById("itemCountTag").textContent = list.length + " limited";
  const el = document.getElementById("itemsList");
  if (!list.length) { el.innerHTML = '<div class="muted" style="padding:12px 4px;">Tidak ada limited yang cocok.</div>'; return; }
  el.innerHTML = list.map(it => {
    const act = selItem && selItem.slug === it.slug ? " active" : "";
    const stockTxt = it.readyStockCount > 0 ? ("Ready: " + it.readyStockCount) : (it.holdingStockCount > 0 ? ("Holding: " + it.holdingStockCount) : (it.isPreorder ? "Preorder" : "Habis"));
    return '<div class="item-tile' + act + (!it.available ? " out" : "") + '" onclick="pickLimited(\\'' + esc(it.slug) + '\\')">' +
      (it.imageUrl ? '<img class="item-icon" src="' + esc(it.imageUrl) + '" loading="lazy" alt="" />' : '') +
      '<div class="item-body"><div class="it-top"><span>' + esc(stockTxt) + '</span><span>Asset ' + it.assetId + '</span></div>' +
      '<div class="it-name">' + esc(it.name) + '</div>' +
      '<div class="it-bottom"><span class="it-price">' + fmtRp(it.unitPrice) + '</span><span class="it-sub">' + (it.totalSold ? it.totalSold + ' terjual' : '') + '</span></div></div></div>';
  }).join("");
}

async function pickLimited(slug) {
  const base = allLimiteds.find(x => x.slug === slug);
  if (!base) return;
  selSlug = slug;
  selItem = { ...base, id: base.assetId, price: base.unitPrice, variation: "Limited" };
  renderLimiteds();
  updateSummary();
  try {
    const d = await api("/api/limited-detail?slug=" + encodeURIComponent(slug));
    if (d.detail) {
      selItem = {
        ...selItem,
        rolimonsRap: d.detail.rolimonsRap,
        rolimonsValue: d.detail.rolimonsValue,
        readyPrice: d.detail.readyStocks?.unitPrice || base.unitPrice,
        preorderPrice: d.detail.preorder?.unitPrice || base.unitPrice,
      };
      updateSummary();
    }
  } catch {}
}

async function loadRobloxInventory() {
  if (!verifiedRbxUser) {
    await checkRoblox();
    if (!verifiedRbxUser) return;
  }
  try {
    const d = await api("/api/roblox/inventory?userId=" + encodeURIComponent(verifiedRbxUser.id));
    smallLimList = Array.isArray(d.data) ? d.data : (d.data?.items || d.data?.limiteds || []);
    const sel = document.getElementById("smallLimSelect");
    if (!smallLimList.length) {
      sel.innerHTML = '<option value="">Tidak ditemukan small limited tradeable di akun ini</option>';
      return toast("warn", "Tidak ada small limited di inventory Roblox user.");
    }
    sel.innerHTML = smallLimList.map((it, idx) =>
      '<option value="' + idx + '">' + esc(it.name || it.assetName) + ' (UAID: ' + (it.userAssetId || it.uaid) + ')</option>'
    ).join("");
    toast("ok", "Ditemukan " + smallLimList.length + " small limited di inventory.");
  } catch (err) { toast("err", esc(err.message)); }
}

function renderVariations() {
  const vars = [...new Set(currentItems.map(i => i.variation || "Default"))];
  const bar = document.getElementById("varBar");
  if (vars.length <= 1) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  bar.innerHTML = ["ALL", ...vars].map(v =>
    '<button class="var-pill ' + (activeVar === v ? "active" : "") + '" onclick="setVar(\\'' + esc(v) + '\\')">' + (v === "ALL" ? "Semua" : esc(v)) + '</button>'
  ).join("");
}
function setVar(v) { activeVar = v; renderVariations(); renderItems(); }

function renderItems() {
  const list = activeVar === "ALL" ? currentItems : currentItems.filter(i => (i.variation || "Default") === activeVar);
  const el = document.getElementById("itemsList");
  if (!list.length) { el.innerHTML = '<div class="muted" style="padding:12px 4px;">Tidak ada item tersedia.</div>'; return; }
  el.innerHTML = list.map(it => {
    const act = selItem && selItem.id === it.id ? " active" : "";
    const out = it.available === false ? " out" : "";
    const meta = it.stock !== null && it.stock !== undefined ? ("Stok " + it.stock) : (it.robuxPrice ? fmtNum(it.robuxPrice) + " R$" : "");
    return '<div class="item-tile' + act + out + '" onclick="selectItemById(' + it.id + ')">' +
      (it.imageUrl ? '<img class="item-icon" src="' + esc(it.imageUrl) + '" loading="lazy" alt="" />' : '') +
      '<div class="item-body"><div class="it-top"><span>' + esc(it.variation || "Item") + '</span><span>#' + it.id + '</span></div>' +
      '<div class="it-name">' + esc(it.name) + '</div>' +
      '<div class="it-bottom"><span class="it-price">' + fmtRp(it.price ?? it.unitPrice) + '</span><span class="it-sub">' + esc(meta) + '</span></div></div></div>';
  }).join("");
}

function selectItemById(id) {
  selItem = currentItems.find(x => x.id === id) || null;
  if (selItem) {
    const qEl = document.getElementById("qtyInput");
    qEl.min = selItem.minQuantity || 1;
    if (Number(qEl.value) < (selItem.minQuantity || 1)) qEl.value = selItem.minQuantity || 1;
  }
  renderItems();
  updateSummary();
}
function stepQty(delta) {
  const el = document.getElementById("qtyInput");
  el.value = Math.max(Number(el.min) || 1, (Number(el.value) || 1) + delta);
  updateSummary();
}
function setPay(m) {
  payMode = m;
  for (const x of ["balance", "duitku", "unpaid"]) document.getElementById("pay-" + x).classList.toggle("active", x === m);
  document.getElementById("wrapDuitkuPm").classList.toggle("hidden", m !== "duitku");
  if (m === "duitku" && !pmList.length) loadCoins();
}

function updateSummary() {
  const qty = activeCat === "limited" || activeCat === "private-server" ? 1 : Math.max(1, Number(document.getElementById("qtyInput").value) || 1);
  if (activeCat === "robux-5d") {
    document.getElementById("gpPriceHint").textContent = "(wajib harga " + Math.ceil(qty / 0.7) + " R$)";
  }
  const idTag = document.getElementById("selIdTag");
  const prev = document.getElementById("selPreview");
  if (!selItem) {
    idTag.classList.add("hidden"); prev.classList.add("hidden");
    document.getElementById("sumProd").textContent = selSlug || selPlaceId || "-";
    document.getElementById("sumItem").textContent = "-";
    document.getElementById("sumTotal").textContent = "Rp 0";
    return;
  }
  const unit = activeCat === "limited" && document.getElementById("limPreorderChk")?.checked && selItem.preorderPrice ? selItem.preorderPrice : (selItem.price ?? selItem.unitPrice);
  idTag.textContent = "#" + (selItem.id || selItem.assetId);
  idTag.classList.remove("hidden");
  prev.classList.remove("hidden");
  const imgEl = document.getElementById("selPrevImg");
  if (selItem.imageUrl) { imgEl.src = selItem.imageUrl; imgEl.classList.remove("hidden"); } else imgEl.classList.add("hidden");
  document.getElementById("selPrevName").textContent = selItem.name;
  document.getElementById("selPrevMeta").textContent = (selItem.variation || activeCat) + (selItem.rolimonsRap ? (" · RAP " + fmtNum(selItem.rolimonsRap) + " · Val " + fmtNum(selItem.rolimonsValue)) : (" · " + fmtRp(unit) + "/unit"));

  document.getElementById("sumProd").textContent = selSlug || (selPlaceId ? "Place " + selPlaceId : activeCat);
  document.getElementById("sumItem").textContent = selItem.name + " ×" + qty;
  document.getElementById("sumTotal").textContent = fmtRp(unit * qty);
}

async function checkRoblox() {
  const u = document.getElementById("rbxInput").value.trim().replace(/^@+/, "");
  if (!u) return;
  document.getElementById("rbxInput").value = u;
  try {
    const d = await api("/api/roblox/check?username=" + encodeURIComponent(u));
    if (d.data?.valid && d.data?.user) {
      verifiedRbxUser = d.data.user;
      document.getElementById("rbxImg").src = d.data.user.avatar || "";
      document.getElementById("rbxName").textContent = d.data.user.username + " (" + d.data.user.displayName + ")";
      document.getElementById("rbxId").textContent = "Roblox ID: " + d.data.user.id;
      document.getElementById("rbxChip").classList.remove("hidden");
      toast("ok", "Akun Roblox valid: " + esc(d.data.user.username));
    } else {
      verifiedRbxUser = null;
      document.getElementById("rbxChip").classList.add("hidden");
      toast("err", esc(d.data?.message || "Username Roblox tidak ditemukan."));
    }
  } catch (err) { toast("err", esc(err.message)); }
}

async function checkGamePassNow() {
  if (!verifiedRbxUser) await checkRoblox();
  if (!verifiedRbxUser) return;
  const qty = Number(document.getElementById("qtyInput").value) || 1;
  const gpId = document.getElementById("gpInput").value.trim();
  try {
    const d = await api("/api/roblox/check-gamepass?userId=" + verifiedRbxUser.id + "&username=" + encodeURIComponent(verifiedRbxUser.username) + "&qty=" + qty + (gpId ? "&gamePassId=" + encodeURIComponent(gpId) : ""));
    const st = document.getElementById("gpStatus");
    if (d.data?.valid) {
      if (d.data.gamePassId) document.getElementById("gpInput").value = d.data.gamePassId;
      st.style.color = "var(--ok)";
      st.textContent = "Game Pass valid! ID: " + (d.data.gamePassId || gpId) + " (harga " + d.expectedPrice + " R$)";
      toast("ok", "Game Pass valid!");
    } else {
      st.style.color = "var(--err)";
      st.textContent = "Belum valid (butuh " + d.expectedPrice + " R$): " + (d.data?.message || d.data?.reason || "tidak ditemukan");
    }
  } catch (err) { toast("err", esc(err.message)); }
}

async function submitOrder(dryRun) {
  if (!selItem) return toast("warn", "Pilih item produk dulu.");

  // Khusus Limiteds
  if (activeCat === "limited") {
    const idx = document.getElementById("smallLimSelect").value;
    const small = smallLimList[Number(idx)];
    if (!small) return toast("warn", "Muat & pilih Small Limited dari inventory Roblox dulu.");
    const isPreorder = Boolean(document.getElementById("limPreorderChk").checked);
    const total = isPreorder && selItem.preorderPrice ? selItem.preorderPrice : selItem.unitPrice;
    if (dryRun) {
      return toast("ok", "Preview Limited: " + selItem.name + " (" + fmtRp(total) + ") trade dg " + (small.name || small.assetName));
    }
    const ok = await askModal({
      title: "Konfirmasi Order Limited",
      desc: "Order limited via trade small limited akan dibuat & dibayar.",
      rows: [["Limited", selItem.name], ["Small Trade", small.name || small.assetName], ["Total", fmtRp(total)], ["Metode", payMode]],
      okLabel: "Order Limited",
    });
    if (!ok) return;
    try {
      const r = await api("/api/limited/buy", {
        method: "POST",
        body: JSON.stringify({
          slug: selItem.slug,
          robloxUsername: document.getElementById("rbxInput").value.trim(),
          smallAssetId: small.assetId || small.id,
          smallUaid: small.userAssetId || small.uaid,
          smallName: small.name || small.assetName,
          isPreorder,
          expectedTotal: total,
          payMethod: payMode,
          paymentMethodId: document.getElementById("orderPmSelect").value || undefined,
          promoCode: document.getElementById("promoInput").value.trim() || undefined,
        }),
      });
      toast("ok", "Order Limited #" + esc(r.order.publicId) + " berhasil!");
      loadStatus(true);
    } catch (err) { toast("err", esc(err.message)); }
    return;
  }

  const qty = activeCat === "private-server" ? 1 : (Number(document.getElementById("qtyInput").value) || 1);
  const payload = {
    type: activeCat, slug: selSlug, placeId: selPlaceId, itemId: selItem.id, quantity: qty,
    robloxUsername: document.getElementById("rbxInput").value.trim() || undefined,
    robloxPassword: document.getElementById("passInput").value || undefined,
    gamePassId: document.getElementById("gpInput").value.trim() || undefined,
    payMethod: payMode,
    paymentMethodId: document.getElementById("orderPmSelect").value || undefined,
    promoCode: document.getElementById("promoInput").value.trim() || undefined,
    dryRun,
  };
  if (!dryRun) {
    const ok = await askModal({
      title: "Konfirmasi Transaksi",
      desc: "Pastikan detail berikut sudah benar sebelum eksekusi order.",
      rows: [
        ["Item", selItem.name + " ×" + qty],
        ...(payload.robloxUsername ? [["Roblox", payload.robloxUsername]] : []),
        ["Total", fmtRp((selItem.price ?? selItem.unitPrice) * qty)],
        ["Pembayaran", payMode === "balance" ? "RierCoins (Fee Rp 0)" : payMode.toUpperCase()],
      ],
      okLabel: "Eksekusi Order",
    });
    if (!ok) return;
  }
  try {
    const res = await api("/api/buy", { method: "POST", body: JSON.stringify(payload) });
    const box = document.getElementById("orderResult");
    box.classList.remove("hidden");
    if (res.dryRun) {
      const p = res.preview;
      box.innerHTML =
        '<div style="font-weight:600;margin-bottom:5px;">Preview Dry-Run (Saldo belum dipotong)</div>' +
        '<div class="sum-row"><span class="muted">Item</span><span>' + esc(p.itemName) + ' ×' + p.quantity + '</span></div>' +
        (p.roblox ? '<div class="sum-row"><span class="muted">Roblox</span><span>' + esc(p.roblox.username) + ' (#' + p.roblox.id + ')</span></div>' : '') +
        '<div class="sum-row"><span class="muted">Total</span><strong>' + fmtRp(p.expectedTotal) + '</strong></div>' +
        '<div class="sum-row"><span class="muted">Saldo RC</span><span>' + fmtNum(p.saldoAwal) + ' RC ' + (p.saldoCukup ? '(Cukup)' : '(Kurang)') + '</span></div>';
      toast("ok", "Dry-Run valid!");
    } else {
      const o = res.order;
      box.innerHTML =
        '<div style="font-weight:700;color:var(--ok);margin-bottom:5px;">Order Berhasil #' + esc(o.publicId) + '</div>' +
        '<div class="sum-row"><span class="muted">Status</span><span>' + esc(o.paymentStatus) + '</span></div>' +
        '<div class="sum-row"><span class="muted">Link Order</span><a class="ext" target="_blank" href="' + esc(o.orderUrl) + '">Buka di RierBux ↗</a></div>' +
        (o.paymentUrl ? '<div class="sum-row"><span class="muted">Link Bayar</span><a class="ext" target="_blank" href="' + esc(o.paymentUrl) + '">Bayar Duitku ↗</a></div>' : '');
      toast("ok", "Order #" + esc(o.publicId) + " berhasil!");
      loadStatus(true);
    }
  } catch (err) { toast("err", esc(err.message)); }
}

async function addCartNow() {
  if (!selItem) return toast("warn", "Pilih item dulu.");
  try {
    if (activeCat === "limited") {
      const idx = document.getElementById("smallLimSelect").value;
      const small = smallLimList[Number(idx)];
      if (!small) return toast("warn", "Pilih small limited dulu.");
      await api("/api/limited/buy", {
        method: "POST",
        body: JSON.stringify({
          addToCart: true, slug: selItem.slug, robloxUsername: document.getElementById("rbxInput").value.trim(),
          smallAssetId: small.assetId || small.id, smallUaid: small.userAssetId || small.uaid,
          smallName: small.name || small.assetName, isPreorder: Boolean(document.getElementById("limPreorderChk").checked),
        }),
      });
    } else {
      await api("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({
          slug: selSlug, placeId: selPlaceId, itemId: selItem.id,
          quantity: Number(document.getElementById("qtyInput").value) || 1,
          robloxUsername: document.getElementById("rbxInput").value.trim() || undefined,
        }),
      });
    }
    toast("ok", "Item ditambahkan ke keranjang.");
    loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}

async function loadCart() {
  try {
    const d = await api("/api/cart");
    const items = d.cart?.items || [];
    const tb = document.getElementById("cartTbody");
    if (!items.length) { tb.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px;">Keranjang kosong.</td></tr>'; return; }
    tb.innerHTML = items.map(it => {
      const cid = it.cartItemId ?? it.id;
      return '<tr><td><code>#' + cid + '</code></td><td>' + esc(it.itemName || it.name || ('Item #' + it.productItemId)) + '</td><td>' + (it.quantity || 1) + '</td><td><strong>' + fmtRp(it.totalPrice ?? it.unitPrice) + '</strong></td><td><button class="btn btn-danger btn-sm" onclick="delCart(' + cid + ')">Hapus</button></td></tr>';
    }).join("");
  } catch (err) { toast("err", esc(err.message)); }
}
async function delCart(cid) { await api("/api/cart/remove", { method: "POST", body: JSON.stringify({ cartItemId: cid }) }); loadCart(); loadStatus(true); }
async function checkoutCartPrompt() {
  const ok = await askModal({ title: "Checkout Keranjang", desc: "Semua item di keranjang akan dibuat order dan dibayar pakai RierCoins.", okLabel: "Checkout & Bayar" });
  if (!ok) return;
  try {
    const d = await api("/api/cart/checkout", { method: "POST", body: JSON.stringify({ payMethod: "balance" }) });
    toast("ok", "Order #" + esc(d.publicId) + " berhasil!");
    loadCart(); loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}

// ── Orders with FULL Pagination & Detail Modal ───────────────────────────────
async function loadOrders() {
  try {
    const q = document.getElementById("ordSearch").value.trim();
    const st = document.getElementById("ordStatus").value;
    const ist = document.getElementById("ordItemStatus").value;
    const lim = document.getElementById("ordLimit").value;
    const d = await api("/api/orders?page=" + ordPage + "&limit=" + lim + "&status=" + encodeURIComponent(st) + "&itemStatus=" + encodeURIComponent(ist) + "&search=" + encodeURIComponent(q));
    const list = d.orders || [];
    const pg = d.pagination || { page: ordPage, totalPages: 1, totalItems: list.length, hasNextPage: false, hasPrevPage: ordPage > 1 };
    ordPage = pg.page || ordPage;

    document.getElementById("ordPagerInfo").textContent = "Halaman " + pg.page + " / " + pg.totalPages + " · Total " + fmtNum(pg.totalItems) + " pesanan (" + (d.source || "-") + ")";
    document.getElementById("ordPrevBtn").disabled = !pg.hasPrevPage && pg.page <= 1;
    document.getElementById("ordNextBtn").disabled = !pg.hasNextPage && pg.page >= pg.totalPages;

    const tb = document.getElementById("ordersTbody");
    if (!list.length) { tb.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Tidak ada pesanan cocok.</td></tr>'; return; }
    tb.innerHTML = list.map(o => {
      const id = o.id || o.publicId;
      const stLower = String(o.paymentStatus || "").toLowerCase();
      const isUnpaid = stLower === "unpaid" || stLower.includes("belum");
      const isPaid = stLower === "paid" || stLower.includes("dibayar");
      const itemsHtml = (o.items || []).map(it => esc(it.product) + ' · ' + esc(it.item) + ' ×' + (it.quantity || 1) + ' <span class="tag">' + esc(it.status || "-") + '</span>').join("<br>");
      const rbx = (o.items || []).map(it => it.inputs?.robloxUsername || "").filter(Boolean).join(", ") || "-";
      const act = '<div class="btn-row">' +
        '<button class="btn btn-sm" onclick="openOrderDetail(\\'' + esc(id) + '\\')">Detail</button>' +
        (isUnpaid ? '<button class="btn btn-primary btn-sm" onclick="ordAct(\\'pay_balance\\',\\'' + esc(id) + '\\')">Bayar</button><button class="btn btn-danger btn-sm" onclick="ordAct(\\'cancel\\',\\'' + esc(id) + '\\')">Batal</button>' : '') +
        '</div>';
      return '<tr><td><code>#' + esc(id) + '</code></td><td class="muted">' + esc(String(o.createdAt || "").slice(0, 16).replace("T", " ")) + '</td><td>' + itemsHtml + '</td><td>' + esc(rbx) + '</td><td><strong>' + fmtRp(o.total) + '</strong></td><td><span class="tag ' + (isPaid ? 'ok' : isUnpaid ? 'warn' : '') + '">' + esc(o.paymentStatus) + '</span></td><td>' + act + '</td></tr>';
    }).join("");
  } catch (err) { toast("err", esc(err.message)); }
}

async function openOrderDetail(publicId) {
  document.getElementById("dmTitle").textContent = "Pesanan #" + publicId;
  document.getElementById("dmContent").innerHTML = "Memuat detail pesanan...";
  document.getElementById("detailModal").classList.remove("hidden");
  try {
    const d = await api("/api/order-detail?id=" + encodeURIComponent(publicId));
    const o = d.order || {};
    const items = o.items || o.orderItems || [];
    const discTotal = items.reduce((s, it) => s + Number(it.discounts?.item || 0) + Number(it.discounts?.promoCode || 0) + Number(it.discounts?.membership || 0), 0);
    const isUnpaid = String(o.paymentStatus || "").toLowerCase() === "unpaid";

    let html = '<div class="summary" style="margin-top:0;">' +
      '<div class="sum-row"><span class="muted">Status Bayar</span><span class="tag ' + (o.paymentStatus === "paid" ? "ok" : isUnpaid ? "warn" : "") + '">' + esc(o.paymentStatus || "-") + '</span></div>' +
      (o.paymentMethod ? '<div class="sum-row"><span class="muted">Metode Bayar</span><span>' + esc(o.paymentMethod) + '</span></div>' : '') +
      (o.createdAt ? '<div class="sum-row"><span class="muted">Dibuat</span><span>' + esc(String(o.createdAt).slice(0, 19).replace("T", " ")) + '</span></div>' : '') +
      (o.paidAt ? '<div class="sum-row"><span class="muted">Dibayar</span><span>' + esc(String(o.paidAt).slice(0, 19).replace("T", " ")) + '</span></div>' : '') +
      (discTotal > 0 ? '<div class="sum-row"><span class="muted">Total Diskon</span><span style="color:var(--ok);">-' + fmtRp(discTotal) + '</span></div>' : '') +
      '<div class="sum-row"><span class="muted">Biaya Admin</span><span>' + (o.paymentFee ? fmtRp(o.paymentFee) : 'Gratis') + '</span></div>' +
      '<div class="sum-row total"><span>Total</span><span>' + fmtRp(o.total) + '</span></div>' +
      (o.refundedAmount > 0 ? '<div class="sum-row"><span class="muted">Refunded RC</span><span style="color:var(--ok);">+' + fmtNum(o.refundedAmount) + ' RC</span></div>' : '') +
      (o.paymentUrl ? '<div class="sum-row"><span class="muted">Link Pembayaran</span><a class="ext" target="_blank" href="' + esc(o.paymentUrl) + '">Bayar Duitku ↗</a></div>' : '') +
      '<div class="sum-row"><span class="muted">Halaman RierBux</span><a class="ext" target="_blank" href="https://rierbux.com/orders/' + esc(publicId) + '">Buka di Web ↗</a></div></div>';

    if (isUnpaid) {
      html += '<div class="btn-row" style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="ordAct(\\'pay_balance\\',\\'' + esc(publicId) + '\\')">Bayar RierCoins</button><button class="btn btn-danger btn-sm" onclick="ordAct(\\'cancel\\',\\'' + esc(publicId) + '\\')">Batalkan Order</button></div>';
    }

    if (items.length) {
      html += '<div style="font-weight:600;margin-bottom:6px;">Items (' + items.length + ')</div>';
      html += items.map(it => {
        const failed = String(it.status || "").toLowerCase() === "failed";
        const deliv = it.deliveryInfo || null;
        const inp = it.inputs || {};
        const rbxProfile = inp.robloxUserId ? 'https://www.roblox.com/users/' + inp.robloxUserId + '/profile' : null;
        let delivHtml = '';
        if (deliv?.link) {
          delivHtml += '<div class="sum-row"><span class="muted">Link Private Server</span><a class="ext" target="_blank" href="' + esc(deliv.link) + '">Buka Server ↗</a></div>';
          if (deliv.expirationDate) delivHtml += '<div class="sum-row"><span class="muted">Berlaku s/d</span><span>' + esc(String(deliv.expirationDate).slice(0, 16).replace("T", " ")) + '</span></div>';
          if (it.id) {
            delivHtml += '<div class="btn-row" style="margin-top:6px;">' +
              '<button class="btn btn-sm" onclick="psControl(\\'regenerate\\',\\'' + esc(publicId) + '\\',' + it.id + ')">Regenerate Link</button>' +
              '<button class="btn btn-danger btn-sm" onclick="psControl(\\'shutdown\\',\\'' + esc(publicId) + '\\',' + it.id + ')">Shutdown PS</button></div>';
          }
        } else if (it.handler === "robux-5d" && (deliv?.deliveredAt || it.deliveredAt)) {
          delivHtml += '<div class="sum-row"><span class="muted">Robux Pending</span><a class="ext" target="_blank" href="https://www.roblox.com/transactions">Cek Transactions Roblox ↗</a></div>';
        } else if (deliv?.approvalDeadline) {
          delivHtml += '<div class="sum-row"><span class="muted">Batas Izin Ortu</span><span>' + esc(String(deliv.approvalDeadline).slice(0, 16).replace("T", " ")) + '</span></div>';
        }

        return '<div class="summary" style="margin:7px 0;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
          (it.imageUrl ? '<img class="item-icon" src="' + esc(it.imageUrl) + '" style="width:36px;height:36px;" />' : '') +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:12.5px;">' + esc(it.product || it.productName) + ' · ' + esc(it.item || it.itemName) + ' ×' + (it.quantity || 1) + '</div>' +
          '<div class="muted">' + esc(it.handler || it.deliveryMethod || "") + (it.deliveredAt ? ' · Dikirim ' + esc(String(it.deliveredAt).slice(0, 16).replace("T", " ")) : '') + '</div></div>' +
          '<span class="tag ' + (it.status === "delivered" ? "ok" : failed ? "err" : "") + '">' + esc(it.status || "-") + '</span></div>' +
          (inp.robloxUsername ? '<div class="sum-row"><span class="muted">Roblox</span><span>' + (rbxProfile ? '<a class="ext" target="_blank" href="' + rbxProfile + '">@' + esc(inp.robloxUsername) + ' ↗</a>' : '@' + esc(inp.robloxUsername)) + '</span></div>' : '') +
          (inp.smallName ? '<div class="sum-row"><span class="muted">Tumbal Limited</span><span>' + esc(inp.smallName) + ' (UAID ' + esc(inp.smallUaid || "-") + ')</span></div>' : '') +
          '<div class="sum-row"><span class="muted">Harga Bersih</span><strong>' + fmtRp(it.netPrice ?? it.totalPrice) + '</strong></div>' +
          delivHtml +
          (it.failureReason ? '<div style="color:var(--err);font-size:12px;margin-top:4px;">Error: ' + esc(it.failureReason) + '</div>' : '') +
          (failed && it.id ? '<div class="btn-row" style="margin-top:6px;"><button class="btn btn-sm" onclick="retryItem(\\'' + esc(publicId) + '\\',' + it.id + ')">Retry Pengiriman</button></div>' : '') +
          '</div>';
      }).join("");
    }
    document.getElementById("dmContent").innerHTML = html;
  } catch (err) { document.getElementById("dmContent").innerHTML = '<div style="color:var(--err);">' + esc(err.message) + '</div>'; }
}

async function psControl(action, publicId, orderItemId) {
  const ok = await askModal({ title: "Kontrol Private Server", desc: "Jalankan '" + action + "' pada item #" + orderItemId + "?" });
  if (!ok) return;
  try {
    await api("/api/ps-action", { method: "POST", body: JSON.stringify({ action, publicId, orderItemId }) });
    toast("ok", "Private Server '" + action + "' berhasil!");
    openOrderDetail(publicId);
  } catch (err) { toast("err", esc(err.message)); }
}

async function retryItem(publicId, orderItemId) {
  try {
    await api("/api/order-action", { method: "POST", body: JSON.stringify({ action: "retry", publicId, orderItemId }) });
    toast("ok", "Item diantrekan ulang!");
    openOrderDetail(publicId);
  } catch (err) { toast("err", esc(err.message)); }
}

async function ordAct(action, publicId) {
  const ok = await askModal({ title: "Konfirmasi Aksi Order", desc: "Jalankan '" + action + "' pada order #" + publicId + "?" });
  if (!ok) return;
  try {
    await api("/api/order-action", { method: "POST", body: JSON.stringify({ action, publicId }) });
    toast("ok", "Berhasil: " + action + " #" + publicId);
    loadOrders(); loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}

// ── RierCoins: Mutasi Saldo (Paginated) + Riwayat Top Up (Paginated) ─────────
function setCoinTab(tab) {
  document.getElementById("ctab-mutasi").classList.toggle("active", tab === "mutasi");
  document.getElementById("ctab-topup").classList.toggle("active", tab === "topup");
  document.getElementById("cpane-mutasi").classList.toggle("hidden", tab !== "mutasi");
  document.getElementById("cpane-topup").classList.toggle("hidden", tab !== "topup");
}

async function loadCoins() {
  try {
    const txType = document.getElementById("txTypeFilter")?.value || "";
    const txLim = document.getElementById("txLimit")?.value || "25";
    const d = await api("/api/coins?txPage=" + txPage + "&txLimit=" + txLim + "&txType=" + encodeURIComponent(txType) + "&topupPage=" + topupPage);
    pmList = d.paymentMethods || [];
    const opts = pmList.map(pm => {
      const fee = pm.feeType === "percentage" ? pm.fee + "%" : fmtRp(pm.fee);
      return '<option value="' + pm.id + '">' + esc(pm.name) + ' (' + esc(pm.group) + ' · Fee ' + fee + ')</option>';
    }).join("");
    if (opts) {
      document.getElementById("topupPm").innerHTML = opts;
      document.getElementById("orderPmSelect").innerHTML = opts;
    }
    document.getElementById("coinsBalTag").textContent = fmtNum(d.riercoins) + " RC (" + fmtRp(d.riercoins) + ")";

    // Mutasi Saldo Table + Pagination
    const txs = d.transactions || [];
    const txPg = d.txPagination || { page: txPage, totalPages: 1, totalItems: txs.length };
    txPage = txPg.page || txPage;
    document.getElementById("txPagerInfo").textContent = "Halaman " + txPg.page + " / " + txPg.totalPages + " · Total " + fmtNum(txPg.totalItems) + " mutasi";
    document.getElementById("txPrevBtn").disabled = !txPg.hasPrevPage && txPg.page <= 1;
    document.getElementById("txNextBtn").disabled = !txPg.hasNextPage && txPg.page >= txPg.totalPages;

    const tb = document.getElementById("txTbody");
    if (!txs.length) {
      tb.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;padding:20px;">Belum ada mutasi saldo.</td></tr>';
    } else {
      tb.innerHTML = txs.map(t => {
        const pos = Number(t.amount) >= 0;
        const oid = t.orderId ? '<a class="ext" href="javascript:void(0)" onclick="openOrderDetail(\\'' + esc(t.orderId) + '\\')">#' + esc(t.orderId) + '</a>' : '-';
        return '<tr><td class="muted">' + esc(String(t.createdAt || "").slice(0, 16).replace("T", " ")) + '</td><td><span class="tag">' + esc(t.type) + '</span></td>' +
          '<td style="font-weight:700;color:' + (pos ? 'var(--ok)' : 'var(--err)') + ';">' + (pos ? '+' : '') + fmtNum(t.amount) + ' RC</td>' +
          '<td>' + esc(t.description) + '</td><td>' + oid + '</td></tr>';
      }).join("");
    }

    // Riwayat Top Up Table + Pagination
    const tops = d.topups || [];
    const topPg = d.topupPagination || { page: topupPage, totalPages: 1 };
    topupPage = topPg.page || topupPage;
    document.getElementById("topupPagerInfo").textContent = "Halaman " + topPg.page + " / " + topPg.totalPages;
    document.getElementById("topupPrevBtn").disabled = !topPg.hasPrevPage && topPg.page <= 1;
    document.getElementById("topupNextBtn").disabled = !topPg.hasNextPage && topPg.page >= topPg.totalPages;

    const ttb = document.getElementById("topupTbody");
    if (!tops.length) {
      ttb.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:20px;">Belum ada riwayat top up.</td></tr>';
    } else {
      ttb.innerHTML = tops.map(tp => {
        const isPaid = String(tp.paymentStatus).toLowerCase() === "paid";
        return '<tr><td><code>#' + esc(tp.publicId) + '</code></td><td class="muted">' + esc(String(tp.createdAt || "").slice(0, 16).replace("T", " ")) + '</td>' +
          '<td>' + esc(tp.paymentMethod) + '</td><td><strong>' + fmtRp(tp.amount) + '</strong></td><td class="muted">' + fmtRp(tp.paymentFee) + '</td>' +
          '<td><span class="tag ' + (isPaid ? 'ok' : '') + '">' + esc(tp.paymentStatus) + '</span></td>' +
          '<td>' + (tp.duitkuPaymentUrl ? '<a class="ext" target="_blank" href="' + esc(tp.duitkuPaymentUrl) + '">Duitku ↗</a>' : '-') + '</td></tr>';
      }).join("");
    }
  } catch (err) { toast("err", esc(err.message)); }
}

async function doTopup() {
  const amount = document.getElementById("topupAmt").value;
  const paymentMethodId = document.getElementById("topupPm").value;
  if (!amount || !paymentMethodId) return toast("warn", "Isi nominal & pilih channel Duitku.");
  try {
    const d = await api("/api/coins/topup", { method: "POST", body: JSON.stringify({ amount, paymentMethodId }) });
    const box = document.getElementById("topupRes");
    box.classList.remove("hidden");
    box.innerHTML = '<div style="font-weight:600;margin-bottom:4px;">Invoice Top Up ' + fmtRp(amount) + ' Siap</div><a class="ext" target="_blank" href="' + esc(d.data.paymentUrl) + '">Buka Pembayaran Duitku ↗</a>';
    toast("ok", "Invoice top up berhasil dibuat.");
    loadCoins();
  } catch (err) { toast("err", esc(err.message)); }
}

// ── API Keys, Account & Webhook ──────────────────────────────────────────────
async function loadApiKeys() {
  try {
    const d = await api("/api/apikeys");
    const keys = d.keys || [];
    const tb = document.getElementById("apiKeysTbody");
    if (!keys.length) {
      tb.innerHTML = '<tr><td colspan="3" class="muted" style="text-align:center;padding:14px;">Belum ada API Key di akun ini (0/5).</td></tr>';
      return;
    }
    tb.innerHTML = keys.map(k =>
      '<tr><td><strong>' + esc(k.name || "-") + '</strong></td><td><code>' + esc(k.prefix || k.keyPrefix || k.id) + '</code></td>' +
      '<td><button class="btn btn-danger btn-sm" onclick="revokeKey(\\'' + esc(k.id) + '\\')">Cabut</button></td></tr>'
    ).join("");
  } catch {}
}

async function createKey() {
  try {
    const name = document.getElementById("newKeyName").value.trim() || "RierBux Console";
    await api("/api/apikey/create", { method: "POST", body: JSON.stringify({ name }) });
    document.getElementById("newKeyName").value = "";
    toast("ok", "Official API Key dibuat & otomatis disimpan.");
    loadStatus(true); loadApiKeys();
  } catch (err) { toast("err", esc(err.message)); }
}
async function setKey() {
  try {
    await api("/api/apikey/set", { method: "POST", body: JSON.stringify({ apiKey: document.getElementById("inApiKey").value.trim() }) });
    document.getElementById("inApiKey").value = "";
    toast("ok", "API Key disimpan.");
    loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}
async function revokeKey(keyId) {
  const ok = await askModal({ title: "Cabut API Key", desc: "API Key ini tidak akan bisa digunakan lagi setelah dicabut.", okLabel: "Cabut" });
  if (!ok) return;
  try {
    await api("/api/apikey/revoke", { method: "POST", body: JSON.stringify({ keyId }) });
    toast("warn", "API Key dicabut.");
    loadApiKeys();
  } catch (err) { toast("err", esc(err.message)); }
}

async function loginEmail() {
  try {
    const email = document.getElementById("inEmail").value.trim();
    const password = document.getElementById("inPass").value;
    const d = await api("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
    toast("ok", "Login berhasil: " + esc(d.user?.name || d.user?.email));
    loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}
async function loginCookie() {
  try {
    const cookies = document.getElementById("inCookie").value.trim();
    const d = await api("/api/login-cookie", { method: "POST", body: JSON.stringify({ cookies }) });
    document.getElementById("inCookie").value = "";
    toast("ok", "Cookie aktif: " + esc(d.user?.name || d.user?.email));
    loadStatus(true);
  } catch (err) { toast("err", esc(err.message)); }
}
async function logoutPrompt() {
  const ok = await askModal({ title: "Logout Sesi", desc: "Sesi lokal (.session) akan dihapus dari perangkat ini.", okLabel: "Logout" });
  if (!ok) return;
  await api("/api/logout", { method: "POST", body: "{}" });
  toast("warn", "Logout berhasil.");
  loadStatus(true);
}
async function syncNow() {
  try {
    const d = await api("/api/sync", { method: "POST", body: "{}" });
    toast("ok", "Sync selesai: " + d.total_products + " produk, " + d.total_items + " item.");
    loadProducts();
  } catch (err) { toast("err", esc(err.message)); }
}
async function refreshActions() {
  try {
    const d = await api("/api/refresh-actions", { method: "POST", body: "{}" });
    toast("ok", "Refresh Actions: " + d.foundCount + " action ditemukan.");
  } catch (err) { toast("err", esc(err.message)); }
}
async function pingSheet() {
  try {
    const d = await api("/api/webhook/ping");
    const box = document.getElementById("sheetPingBox");
    box.classList.remove("hidden");
    box.innerHTML = '<div style="color:var(--ok);font-weight:600;">Google Sheet Bridge Terhubung</div><div class="muted" style="margin-top:3px;">Sheet: ' + esc(d.ping?.sheet) + ' · Rows: ' + esc(d.ping?.rows) + (d.meta ? ' · Katalog: ' + esc(d.meta.catalog_rows) : '') + '</div>';
    toast("ok", "Google Sheet Bridge OK.");
  } catch (err) { toast("err", esc(err.message)); }
}

function tickClock() {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).formatToParts(new Date());
  const g = t => (p.find(x => x.type === t) || {}).value || "00";
  document.getElementById("clockWib").textContent = g("day") + "/" + g("month") + " " + g("hour") + ":" + g("minute") + ":" + g("second") + " WIB";
}

function init() {
  applyTheme(localStorage.getItem("rb_theme") || "dark-gray");
  go(activeView);
  loadStatus(true);
  loadProducts();
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(() => loadStatus(false), 25000);
}

if (REQUIRE_SECRET && !dashSecret) {
  document.getElementById("authGate").classList.remove("hidden");
} else {
  init();
}
</script>
</body>
</html>`;
}

module.exports = { buildDashboardHtml };
