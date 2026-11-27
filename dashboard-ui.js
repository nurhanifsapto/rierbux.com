/**
 * RIERBUX.COM — Boltshift Soft-Tonal Neo-Minimalist Web Console UI v3
 * - Soft-Tonal Light SaaS aesthetic (#FAFAFA canvas, #FFFFFF 20px cards, #F8F8F8 recessed pills/headers)
 * - Strict 65 / 25 / 10 color discipline: neutral surfaces, #111312 obsidian typography, #1F76FB cobalt accent
 * - Floating segmented pill top nav bar (64px) with obsidian active capsule
 * - Overview Bento: 4-col KPI grid (1 focal cobalt hero card), 8-col dual-layer hatched bar chart, 4-col 12-segment radial gauge, floating-header recent orders table
 * - Split-circle cobalt primary CTA pills, Plus Jakarta Sans + tabular-nums
 * - 100% fitur RierBux lengkap: Order Cepat (6 kategori + Robux presets + 60 PS + 71 Limiteds), Keranjang, Pesanan (Pagination + Detail Modal + Retry + PS Control + CSV), RierCoins (Top Up + Mutasi + Riwayat Top Up), Katalog & Stok, API & Webhook, Akun & Login
 */

function buildDashboardHtml({ requireSecret = false } = {}) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RierBux — Console</title>
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg-canvas: #FAFAFA;
    --bg-surface: #FFFFFF;
    --bg-recessed: #F8F8F8;
    --bg-muted: #F3F3F3;
    --bg-bar-inactive: #E9E9E9;

    --brand-primary: #1F76FB;
    --brand-mid: #3B8AFD;
    --brand-light: #6BA4FD;
    --brand-sky-soft: #C9DEFD;
    --ink-obsidian: #111312;

    --grad-hero: linear-gradient(135deg, #1E72FA 0%, #267BFC 48%, #6BA4FD 100%);
    --grad-active-bar: repeating-linear-gradient(-45deg, rgba(255,255,255,0.24) 0px, rgba(255,255,255,0.24) 3px, transparent 3px, transparent 7px), linear-gradient(180deg, #3B82F6 0%, #8CB8FA 55%, #DCE8FB 100%);

    --text-primary: #111312;
    --text-secondary: #5C5C5C;
    --text-muted: #7D8187;

    --border-card: rgba(17, 19, 18, 0.048);
    --border-ctrl: rgba(17, 19, 18, 0.075);
    --border-row: #F3F4F6;

    --shadow-card: 0 1px 2px rgba(16, 18, 17, 0.025), 0 4px 12px rgba(16, 18, 17, 0.02);
    --shadow-hero: 0 10px 24px -6px rgba(31, 118, 251, 0.28);
    --shadow-popover: 0 10px 30px -4px rgba(16, 18, 17, 0.09), 0 2px 6px rgba(16, 18, 17, 0.04);

    --badge-pos-bg: #E8ECFE;
    --badge-pos-fg: #4B5698;
    --badge-neg-bg: #FCEDED;
    --badge-neg-fg: #C25E5E;
    --badge-warn-bg: #FEF3C7;
    --badge-warn-fg: #B45309;
    --badge-amber: #F59E0B;
    --viz-violet: #6C5CBD;
    --viz-red: #EF4444;

    --ok: #0F9D68;
    --err: #DC2626;
    --warn: #B45309;

    --radius-card: 20px;
    --radius-subcard: 14px;
    --radius-strip: 12px;
    --radius-pill: 9999px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body {
    background: var(--bg-canvas);
    color: var(--text-primary);
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  .tnum { font-variant-numeric: tabular-nums; }
  .hidden { display: none !important; }

  /* Top Loading Bar */
  .top-loader { position: fixed; top: 0; left: 0; right: 0; height: 2.5px; z-index: 1000; overflow: hidden; }
  .top-loader-bar { width: 34%; height: 100%; background: var(--brand-primary); animation: slide 1s ease-in-out infinite; }
  @keyframes slide { 0% { transform: translateX(-120%); } 100% { transform: translateX(350%); } }

  /* App Shell */
  .app-shell { max-width: 1360px; margin: 0 auto; padding: 18px 28px 40px; }
  @media (max-width: 760px) { .app-shell { padding: 14px 16px 32px; } }

  /* Top Navigation Bar (64px) */
  .topbar {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
  .brand-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-shrink: 0; }
  .brand-badge {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--brand-primary);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(31, 118, 251, 0.22);
    overflow: hidden;
  }
  .brand-badge img { width: 22px; height: 22px; object-fit: contain; filter: brightness(0) invert(1); }
  .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.025em; color: var(--text-primary); }
  .conn-dot {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: var(--radius-pill);
    background: var(--bg-surface); border: 1px solid var(--border-ctrl); color: var(--text-muted);
  }
  .conn-dot .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }
  .conn-dot.ok { background: var(--badge-pos-bg); color: var(--badge-pos-fg); border-color: transparent; }
  .conn-dot.ok .dot { background: var(--brand-primary); }
  .conn-dot.err { background: var(--badge-neg-bg); color: var(--badge-neg-fg); border-color: transparent; }
  .conn-dot.err .dot { background: var(--viz-red); }

  /* Center Floating Segmented Nav Pill */
  .nav-pill {
    display: inline-flex; align-items: center; gap: 2px;
    background: var(--bg-recessed);
    padding: 4px;
    border-radius: var(--radius-pill);
    height: 44px;
    border: 1px solid var(--border-card);
    overflow-x: auto;
    max-width: 100%;
  }
  .nav-pill::-webkit-scrollbar { display: none; }
  .nav-tab {
    border: none; background: transparent; color: var(--text-secondary);
    font-family: inherit; font-size: 13px; font-weight: 500; letter-spacing: -0.005em;
    padding: 8px 16px; border-radius: var(--radius-pill);
    cursor: pointer; white-space: nowrap; transition: background .15s, color .15s;
  }
  .nav-tab:hover { background: #EFEFEF; color: var(--text-primary); }
  .nav-tab.active { background: var(--ink-obsidian); color: #FFFFFF; font-weight: 500; }

  /* Right Utility Cluster */
  .top-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .icon-circle-btn {
    position: relative; width: 40px; height: 40px; border-radius: 50%;
    background: var(--bg-surface); border: 1px solid var(--border-ctrl);
    color: var(--text-primary); display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s, border-color .15s;
  }
  .icon-circle-btn:hover { background: var(--bg-muted); }
  .icon-circle-btn.active { background: var(--ink-obsidian); color: #FFFFFF; border-color: var(--ink-obsidian); }
  .notif-dot {
    position: absolute; top: 8px; right: 9px; width: 6px; height: 6px;
    border-radius: 50%; background: var(--viz-red); border: 1.5px solid #FFFFFF;
  }
  .cart-badge {
    position: absolute; top: -3px; right: -3px; min-width: 17px; height: 17px;
    padding: 0 4px; border-radius: 999px; background: var(--brand-primary); color: #FFFFFF;
    font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
    font-variant-numeric: tabular-nums;
  }

  .profile-chip {
    display: flex; align-items: center; gap: 9px; padding: 4px 10px 4px 4px;
    border-radius: var(--radius-pill); background: var(--bg-surface); border: 1px solid var(--border-ctrl);
    cursor: pointer; transition: background .15s;
  }
  .profile-chip:hover { background: var(--bg-recessed); }
  .avatar-circle {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--ink-obsidian); color: #FFFFFF;
    font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .profile-meta { display: flex; flex-direction: column; line-height: 1.2; max-width: 135px; }
  .profile-name { font-size: 12.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-sub { font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  @media (max-width: 1060px) {
    .topbar { flex-wrap: wrap; height: auto; gap: 10px; }
    .nav-pill { order: 3; width: 100%; justify-content: flex-start; }
  }
  @media (max-width: 580px) {
    .profile-meta { display: none; }
    .profile-chip { padding: 3px; }
  }

  /* Page Header */
  .page-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.25; color: var(--text-primary); }
  .page-sub { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }
  .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* Signature Buttons */
  .btn-pill {
    height: 40px; padding: 0 16px; border-radius: var(--radius-pill);
    background: var(--bg-surface); border: 1px solid var(--border-ctrl);
    color: var(--text-primary); font-family: inherit; font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s;
    white-space: nowrap;
  }
  .btn-pill:hover { background: var(--bg-muted); }
  .btn-pill:disabled { opacity: .45; cursor: not-allowed; }
  .btn-pill.sm { height: 32px; padding: 0 12px; font-size: 12px; }
  .btn-pill.obsidian { background: var(--ink-obsidian); color: #FFFFFF; border-color: var(--ink-obsidian); }
  .btn-pill.obsidian:hover { background: #262928; }
  .btn-pill.danger { color: var(--badge-neg-fg); background: var(--badge-neg-bg); border-color: transparent; }
  .btn-pill.danger:hover { background: #F9DADA; }

  /* Split-Circle Cobalt Primary CTA */
  .btn-cta {
    height: 40px; padding: 4px 18px 4px 4px; border-radius: var(--radius-pill);
    background: var(--brand-primary); border: none; color: #FFFFFF;
    font-family: inherit; font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; gap: 10px;
    cursor: pointer; transition: background .15s, transform .1s;
    box-shadow: 0 4px 14px -2px rgba(31, 118, 251, 0.32);
    white-space: nowrap;
  }
  .btn-cta:hover { background: var(--brand-mid); }
  .btn-cta:active { transform: translateY(1px); }
  .btn-cta .cta-icon {
    width: 32px; height: 32px; border-radius: 50%; background: #FFFFFF; color: var(--brand-primary);
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .btn-cta.full { width: 100%; justify-content: center; position: relative; padding: 4px 18px; }
  .btn-cta.full .cta-icon { position: absolute; left: 4px; }

  /* Bento Cards */
  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-card);
    padding: 20px 22px;
    box-shadow: var(--shadow-card);
  }
  .card + .card { margin-top: 16px; }
  .card-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .card-title { font-size: 17px; font-weight: 600; letter-spacing: -0.015em; color: var(--text-primary); }

  /* 4-Column KPI Grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
  @media (max-width: 1040px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .kpi-grid { grid-template-columns: 1fr; } }

  .kpi-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-card);
    padding: 20px;
    min-height: 132px;
    box-shadow: var(--shadow-card);
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .kpi-card.hero {
    background: var(--grad-hero);
    border-color: transparent;
    color: #FFFFFF;
    box-shadow: var(--shadow-hero);
  }
  .kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .kpi-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
  .kpi-card.hero .kpi-label { color: rgba(255, 255, 255, 0.9); }
  .kpi-icon {
    width: 40px; height: 40px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .kpi-icon.white { background: #FFFFFF; color: var(--brand-primary); }
  .kpi-icon.obsidian { background: #17161B; color: #FFFFFF; }
  .kpi-icon.sky { background: #4598F5; color: #FFFFFF; }
  .kpi-icon.cobalt { background: #2274FB; color: #FFFFFF; }

  .kpi-mid { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; margin-top: 8px; }
  .kpi-val {
    font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }
  .kpi-foot { font-size: 12px; color: var(--text-muted); margin-top: 10px; font-variant-numeric: tabular-nums; }
  .kpi-card.hero .kpi-foot { color: rgba(255, 255, 255, 0.82); }

  /* Trend & Semantic Pills */
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 9px; border-radius: var(--radius-pill);
    font-size: 11px; font-weight: 600; line-height: 1; white-space: nowrap;
    background: var(--bg-recessed); color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
  .pill.ok { background: #E6F7EF; color: #0F8A5B; }
  .pill.pos { background: var(--badge-pos-bg); color: var(--badge-pos-fg); }
  .pill.neg { background: var(--badge-neg-bg); color: var(--badge-neg-fg); }
  .pill.warn { background: var(--badge-warn-bg); color: var(--badge-warn-fg); }
  .pill.neutral { background: #F3F4F6; color: #7D8187; }
  .pill.on-brand { background: rgba(255, 255, 255, 0.22); color: #FFFFFF; }
  .pill.amber { background: var(--badge-amber); color: #FFFFFF; font-size: 10.5px; }
  .pill.dark { background: var(--ink-obsidian); color: #FFFFFF; font-size: 10.5px; }

  /* 8 / 4 Asymmetric Bento Row */
  .bento-8-4 { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: 16px; margin-bottom: 20px; }
  @media (max-width: 1020px) { .bento-8-4 { grid-template-columns: 1fr; } }

  /* Dual-Layer Bar Chart */
  .chart-wrap { position: relative; height: 230px; display: flex; flex-direction: column; justify-content: flex-end; padding-top: 26px; }
  .chart-grid {
    position: absolute; inset: 12px 0 28px 34px;
    display: flex; flex-direction: column; justify-content: space-between; pointer-events: none;
  }
  .chart-grid-line { border-top: 1px dashed #ECEEEF; position: relative; }
  .chart-grid-lbl {
    position: absolute; left: -34px; top: -7px; font-size: 11px; font-weight: 500;
    color: var(--text-muted); font-variant-numeric: tabular-nums;
  }
  .chart-bars {
    position: relative; z-index: 2; display: grid; grid-template-columns: repeat(8, 1fr);
    gap: 12px; height: 174px; margin-left: 38px; align-items: end;
  }
  .bar-col { display: flex; flex-direction: column; align-items: center; height: 100%; cursor: pointer; position: relative; }
  .bar-track {
    width: 100%; max-width: 44px; height: 100%; border-radius: 12px;
    background: var(--bg-recessed); display: flex; align-items: flex-end; padding: 0; overflow: visible; position: relative;
  }
  .bar-fill {
    width: 100%; border-radius: 12px; background: var(--bg-bar-inactive);
    transition: height .35s ease, background .2s; position: relative; min-height: 10px;
  }
  .bar-col:hover .bar-fill { background: #DCDCE0; }
  .bar-col.active .bar-fill { background: var(--grad-active-bar); }
  .bar-node {
    display: none; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
    width: 12px; height: 12px; border-radius: 50%; background: var(--viz-violet);
    border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(108, 92, 189, 0.35);
  }
  .bar-col.active .bar-node { display: block; }
  .bar-lbl { margin-top: 8px; font-size: 11px; font-weight: 500; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .bar-col.active .bar-lbl { color: var(--text-primary); font-weight: 600; }

  .chart-tooltip {
    position: absolute; top: 0; right: 10px; z-index: 5;
    background: #FFFFFF; border: 1px solid rgba(17,19,18,0.06);
    border-radius: var(--radius-subcard); padding: 10px 14px;
    box-shadow: var(--shadow-popover); min-width: 170px;
  }
  .ct-head { font-size: 11.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
  .ct-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; font-size: 11.5px; color: var(--text-secondary); margin-top: 3px; font-variant-numeric: tabular-nums; }
  .ct-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }

  /* 12-Segment Semicircular Gauge */
  .gauge-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 0 12px; position: relative; }
  .gauge-center { position: absolute; bottom: 18px; text-align: center; }
  .gauge-pct { font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .gauge-sub { font-size: 11px; font-weight: 500; color: var(--text-muted); margin-top: 3px; }
  .sub-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
  .sub-kpi {
    background: var(--bg-recessed); border-radius: var(--radius-subcard);
    padding: 13px 14px; display: flex; flex-direction: column; gap: 6px;
  }
  .sub-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .sub-kpi-lbl { font-size: 11.5px; color: var(--text-secondary); font-weight: 500; }
  .sub-kpi-val { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

  /* Floating-Header Data Table */
  .search-pill {
    height: 38px; padding: 0 14px; border-radius: var(--radius-pill);
    background: var(--bg-recessed); border: 1px solid transparent;
    color: var(--text-primary); font-family: inherit; font-size: 12.5px; outline: none;
    transition: background .15s, border-color .15s;
  }
  .search-pill:focus { background: #FFFFFF; border-color: var(--border-ctrl); }
  .select-pill {
    height: 38px; padding: 0 12px; border-radius: var(--radius-pill);
    background: var(--bg-surface); border: 1px solid var(--border-ctrl);
    color: var(--text-primary); font-family: inherit; font-size: 12.5px; font-weight: 500; outline: none; cursor: pointer;
  }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; }
  thead th {
    background: var(--bg-recessed); color: var(--text-muted);
    font-size: 12px; font-weight: 500; text-align: left;
    padding: 12px 14px; white-space: nowrap;
  }
  thead th:first-child { border-radius: 12px 0 0 12px; }
  thead th:last-child { border-radius: 0 12px 12px 0; }
  tbody td {
    padding: 14px; border-bottom: 1px solid var(--border-row);
    vertical-align: middle; font-variant-numeric: tabular-nums;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #FAFAFA; }

  /* Pagination */
  .pager {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding-top: 14px; margin-top: 6px;
    border-top: 1px solid var(--border-row); font-size: 12px; color: var(--text-muted); flex-wrap: wrap;
  }
  .pager-btns { display: flex; gap: 6px; }

  /* Forms & Recessed Inputs */
  .field { margin-bottom: 13px; }
  .field label { display: block; font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
  .inp, textarea.inp, select.inp {
    width: 100%; background: var(--bg-recessed); border: 1px solid transparent;
    border-radius: 12px; padding: 10px 13px; color: var(--text-primary);
    font-family: inherit; font-size: 13px; outline: none; transition: background .15s, border-color .15s;
  }
  .inp:focus, textarea.inp:focus, select.inp:focus { background: #FFFFFF; border-color: var(--brand-primary); }
  textarea.inp { min-height: 92px; resize: vertical; font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
  .input-group { display: flex; gap: 8px; align-items: center; }
  .input-group .inp { flex: 1; }

  /* Category Segmented Bar */
  .seg-bar {
    display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;
    background: var(--bg-recessed); padding: 4px; border-radius: var(--radius-pill);
    margin-bottom: 16px; border: 1px solid var(--border-card);
  }
  .seg-btn {
    border: none; background: transparent; color: var(--text-secondary);
    padding: 8px 15px; border-radius: var(--radius-pill); font-family: inherit;
    font-size: 12.5px; font-weight: 500; cursor: pointer; transition: background .15s, color .15s;
  }
  .seg-btn:hover { background: #EFEFEF; color: var(--text-primary); }
  .seg-btn.active { background: var(--ink-obsidian); color: #FFFFFF; }

  /* Order Cepat 8/4 Layout */
  .order-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 1000px) { .order-grid { grid-template-columns: 1fr; } }
  .sticky-col { position: sticky; top: 18px; }

  /* Game Grid & Item Tiles */
  .game-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 8px; max-height: 220px; overflow-y: auto; margin-top: 10px; padding-right: 2px;
  }
  .game-card {
    display: flex; align-items: center; gap: 9px; padding: 8px 10px;
    border-radius: var(--radius-subcard); border: 1px solid var(--border-card);
    background: var(--bg-recessed); cursor: pointer; text-align: left; color: var(--text-primary);
    font-family: inherit; transition: background .15s, border-color .15s;
  }
  .game-card:hover { background: var(--bg-muted); }
  .game-card.active { background: #FFFFFF; border-color: var(--brand-primary); box-shadow: 0 0 0 2px rgba(31, 118, 251, 0.14); }
  .game-card img { width: 42px; height: 28px; border-radius: 7px; object-fit: cover; flex-shrink: 0; background: #EAEAEA; }
  .game-card .g-info { min-width: 0; }
  .game-card .g-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .game-card .g-sub { font-size: 10.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .var-bar { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0 8px; }
  .var-pill {
    border: 1px solid var(--border-ctrl); background: var(--bg-surface); color: var(--text-secondary);
    padding: 5px 12px; border-radius: var(--radius-pill); font-family: inherit; font-size: 11.5px; font-weight: 500; cursor: pointer;
  }
  .var-pill.active { background: var(--ink-obsidian); color: #FFFFFF; border-color: var(--ink-obsidian); }

  .items-list {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
    gap: 10px; max-height: 410px; overflow-y: auto; padding-right: 2px;
  }
  .item-tile {
    display: flex; align-items: center; gap: 11px; padding: 11px 12px;
    border-radius: var(--radius-subcard); border: 1px solid var(--border-card);
    background: var(--bg-recessed); cursor: pointer; transition: background .15s, border-color .15s;
  }
  .item-tile:hover { background: var(--bg-muted); }
  .item-tile.active { background: #FFFFFF; border-color: var(--brand-primary); box-shadow: 0 0 0 2px rgba(31, 118, 251, 0.14); }
  .item-tile.out { opacity: .45; }
  .item-icon {
    width: 44px; height: 44px; border-radius: 10px; object-fit: contain;
    background: #FFFFFF; border: 1px solid var(--border-card); padding: 3px; flex-shrink: 0;
  }
  .item-icon.cover { object-fit: cover; padding: 0; }
  .item-body { min-width: 0; flex: 1; }
  .it-top { display: flex; justify-content: space-between; gap: 6px; font-size: 10.5px; color: var(--text-muted); }
  .it-name { font-weight: 600; font-size: 12.5px; margin: 2px 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .it-bottom { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; }
  .it-price { font-weight: 700; font-size: 13px; color: var(--text-primary); }
  .it-sub { font-size: 10.5px; color: var(--text-muted); }

  /* Stepper & Payment Selector */
  .stepper { display: inline-flex; align-items: center; border: 1px solid var(--border-ctrl); border-radius: var(--radius-pill); overflow: hidden; background: var(--bg-surface); }
  .stepper button { width: 32px; height: 34px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; font-size: 15px; font-weight: 600; }
  .stepper button:hover { background: var(--bg-recessed); }
  .stepper input { width: 64px; border: none; text-align: center; padding: 6px 2px; background: transparent; font-family: inherit; font-weight: 600; font-size: 13px; outline: none; font-variant-numeric: tabular-nums; }

  .pay-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .pay-opt {
    padding: 10px 8px; border-radius: var(--radius-subcard); border: 1px solid var(--border-card);
    background: var(--bg-recessed); text-align: center; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text-secondary);
  }
  .pay-opt small { display: block; font-size: 10.5px; font-weight: 500; color: var(--text-muted); margin-top: 2px; }
  .pay-opt.active { background: #FFFFFF; border-color: var(--brand-primary); color: var(--text-primary); box-shadow: 0 0 0 2px rgba(31, 118, 251, 0.14); }

  .rbx-chip {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px; margin-top: 8px;
    border-radius: var(--radius-subcard); background: var(--badge-pos-bg); color: var(--badge-pos-fg);
  }
  .rbx-chip img { width: 34px; height: 34px; border-radius: 50%; background: #FFFFFF; }
  .rbx-chip .name { font-weight: 600; font-size: 12.5px; color: var(--text-primary); }
  .rbx-chip .id { font-size: 11px; color: var(--badge-pos-fg); font-variant-numeric: tabular-nums; }

  .summary-box {
    background: var(--bg-recessed); border-radius: var(--radius-subcard);
    padding: 14px 16px; margin: 14px 0;
  }
  .sum-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 12.5px; padding: 3.5px 0; font-variant-numeric: tabular-nums; }
  .sum-row.total { border-top: 1px solid rgba(17,19,18,0.06); margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 15px; }

  /* Stock Strip */
  .stock-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  @media (max-width: 900px) { .stock-grid { grid-template-columns: repeat(2, 1fr); } }
  .stock-tile {
    background: var(--bg-surface); border: 1px solid var(--border-card);
    border-radius: var(--radius-card); padding: 16px 18px; box-shadow: var(--shadow-card);
  }
  .stock-tile .k { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
  .stock-tile .v { font-size: 22px; font-weight: 600; margin-top: 6px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .stock-tile .s { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr; } }

  /* Logs */
  .log-box {
    background: var(--bg-recessed); border-radius: var(--radius-subcard);
    padding: 12px 14px; font-family: ui-monospace, Consolas, monospace; font-size: 11.5px;
    max-height: 240px; overflow-y: auto; line-height: 1.65;
  }
  .log-row { display: flex; gap: 10px; }
  .log-t { color: var(--text-muted); flex-shrink: 0; }
  .log-ok { color: var(--ok); }
  .log-err { color: var(--err); }
  .log-warn { color: var(--warn); }
  .log-ord { color: var(--brand-primary); font-weight: 600; }

  /* Notice Banner */
  .notice-banner {
    background: var(--badge-warn-bg); color: var(--badge-warn-fg);
    border-radius: var(--radius-subcard); padding: 12px 16px; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    font-size: 12.5px; font-weight: 500;
  }

  /* Modals */
  .backdrop {
    position: fixed; inset: 0; background: rgba(17, 19, 18, 0.36);
    display: flex; align-items: center; justify-content: center; z-index: 900; padding: 16px;
  }
  .modal {
    width: 100%; max-width: 460px; max-height: 88vh; overflow-y: auto;
    background: var(--bg-surface); border: 1px solid var(--border-card);
    border-radius: 24px; padding: 24px; box-shadow: var(--shadow-popover);
  }
  .modal.wide { max-width: 680px; }
  .modal h3 { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px; }
  .modal p { font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; }
  .modal-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

  /* Toast */
  .toast-stack { position: fixed; top: 18px; right: 20px; z-index: 950; display: flex; flex-direction: column; gap: 8px; max-width: 360px; }
  .toast {
    background: var(--ink-obsidian); color: #FFFFFF; border-radius: var(--radius-subcard);
    padding: 11px 14px; font-size: 12.5px; box-shadow: var(--shadow-popover);
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .toast.ok { background: #111312; border-left: 4px solid var(--brand-primary); }
  .toast.err { background: #111312; border-left: 4px solid var(--viz-red); }
  .toast.warn { background: #111312; border-left: 4px solid var(--badge-amber); }

  .muted { color: var(--text-muted); font-size: 12px; }
  .btn-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  a.ext { color: var(--brand-primary); font-weight: 500; text-decoration: none; }
  a.ext:hover { text-decoration: underline; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; background: var(--bg-recessed); padding: 2px 6px; border-radius: 6px; }
</style>
</head>
<body>
<div id="topLoader" class="top-loader hidden"><div class="top-loader-bar"></div></div>
<div id="toastStack" class="toast-stack"></div>

<!-- Auth Gate -->
<div id="authGate" class="backdrop hidden">
  <div class="modal">
    <h3>Akses Console Terkunci</h3>
    <p>Masukkan <code>DASHBOARD_SECRET</code> (atau <code>GSHEET_SECRET</code>) untuk membuka RierBux Console.</p>
    <div class="field">
      <label>Dashboard Secret</label>
      <input id="secretInput" class="inp" type="password" placeholder="Masukkan secret..." onkeydown="if(event.key==='Enter')saveSecret()" />
    </div>
    <div class="modal-foot">
      <button class="btn-cta" onclick="saveSecret()">
        <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        Buka Console
      </button>
    </div>
  </div>
</div>

<!-- Confirm Modal -->
<div id="confirmModal" class="backdrop hidden">
  <div class="modal">
    <h3 id="cmTitle">Konfirmasi</h3>
    <p id="cmDesc"></p>
    <div id="cmBody" class="summary-box hidden"></div>
    <div class="modal-foot">
      <button class="btn-pill sm" onclick="closeModal(false)">Batal</button>
      <button id="cmOkBtn" class="btn-pill sm obsidian" onclick="closeModal(true)">Lanjutkan</button>
    </div>
  </div>
</div>

<!-- Order Detail Modal -->
<div id="detailModal" class="backdrop hidden" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="modal wide">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 id="dmTitle" style="margin:0;">Detail Pesanan</h3>
      <button class="btn-pill sm" onclick="document.getElementById('detailModal').classList.add('hidden')">Tutup</button>
    </div>
    <div id="dmContent" class="muted">Memuat detail...</div>
  </div>
</div>

<div class="app-shell">
  <!-- ── TOP NAVIGATION BAR (64px) ── -->
  <header class="topbar">
    <div class="brand-wrap" onclick="go('overview')">
      <div class="brand-badge"><img src="/assets/logo.svg" alt="RierBux" /></div>
      <span class="brand-name">RierBux</span>
      <span id="sessPill" class="conn-dot"><span class="dot"></span><span id="sessText">Memuat</span></span>
    </div>

    <nav class="nav-pill" aria-label="Main navigation">
      <button class="nav-tab active" id="nav-overview" onclick="go('overview')">Overview</button>
      <button class="nav-tab" id="nav-order" onclick="go('order')">Order Cepat</button>
      <button class="nav-tab" id="nav-orders" onclick="go('orders')">Pesanan</button>
      <button class="nav-tab" id="nav-coins" onclick="go('coins')">RierCoins</button>
      <button class="nav-tab" id="nav-stock" onclick="go('stock')">Katalog</button>
      <button class="nav-tab" id="nav-api" onclick="go('api')">API &amp; Hook</button>
    </nav>

    <div class="top-right">
      <button class="icon-circle-btn" id="nav-cart" onclick="go('cart')" title="Keranjang">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <span id="navCartCount" class="cart-badge">0</span>
      </button>
      <button class="icon-circle-btn" id="nav-account" onclick="go('account')" title="Akun & Login">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        <span id="offlineDot" class="notif-dot hidden"></span>
      </button>
      <div class="profile-chip" onclick="go('account')" title="Kelola Akun">
        <div id="avatarInit" class="avatar-circle">RB</div>
        <div class="profile-meta">
          <span id="sideUser" class="profile-name">Belum login</span>
          <span id="clockWib" class="profile-sub">--:-- WIB</span>
        </div>
      </div>
    </div>
  </header>

  <div id="loginNotice" class="notice-banner hidden">
    <span>Sesi RierBux belum aktif. Login email/password atau sync cookie dari Chrome Extension agar bisa transaksi &amp; cek saldo.</span>
    <button class="btn-pill sm obsidian" onclick="go('account')">Login Sekarang</button>
  </div>

  <!-- ════════ 0. OVERVIEW (BOLTSHIFT EXECUTIVE BENTO) ════════ -->
  <section id="view-overview">
    <div class="page-head">
      <div>
        <h1 class="page-title">Sales &amp; Console Overview</h1>
        <p class="page-sub">Ringkasan saldo RierCoins, performa pesanan, dan kesehatan stok real-time.</p>
      </div>
      <div class="toolbar">
        <button class="btn-pill" onclick="loadOverview(true)">Refresh</button>
        <a class="btn-pill" href="/api/orders/csv" target="_blank">Export CSV</a>
        <button class="btn-cta" onclick="syncNow()">
          <span class="cta-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></span>
          Sync Katalog
        </button>
      </div>
    </div>

    <!-- 4-Column KPI Grid (1 Focal Cobalt Hero Card) -->
    <div class="kpi-grid">
      <div class="kpi-card hero">
        <div class="kpi-top">
          <span class="kpi-label">Saldo RierCoins</span>
          <span class="kpi-icon white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
          </span>
        </div>
        <div class="kpi-mid">
          <span id="kpiSaldo" class="kpi-val">-</span>
          <span id="apiV1Tag" class="pill on-brand hidden">API v1</span>
        </div>
        <div id="kpiSaldoSub" class="kpi-foot">Estimasi: -</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Total Pesanan</span>
          <span class="kpi-icon obsidian">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </span>
        </div>
        <div class="kpi-mid">
          <span id="kpiOrders" class="kpi-val">-</span>
          <span id="kpiOrdersPill" class="pill pos">Live</span>
        </div>
        <div id="kpiOrdersSub" class="kpi-foot">Memuat riwayat pesanan...</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Stok Robux Manual</span>
          <span class="kpi-icon sky">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </span>
        </div>
        <div class="kpi-mid">
          <span id="kpiStockManual" class="kpi-val">-</span>
          <span id="kpiStockPill" class="pill pos">Ready</span>
        </div>
        <div id="kpiStockPsSub" class="kpi-foot">Private Server: -</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Katalog Produk</span>
          <span class="kpi-icon cobalt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          </span>
        </div>
        <div class="kpi-mid">
          <span id="kpiCatalog" class="kpi-val">-</span>
          <span class="pill pos">Auto-Sync</span>
        </div>
        <div class="kpi-foot">Game Pass, Robux, PS &amp; Limiteds</div>
      </div>
    </div>

    <!-- Main 8 / 4 Bento Row -->
    <div class="bento-8-4">
      <div class="card">
        <div class="card-head">
          <span class="card-title">Performance Overview</span>
          <span class="pill">8 Hari Terakhir</span>
        </div>
        <div class="chart-wrap">
          <div id="chartTooltip" class="chart-tooltip">
            <div id="ctTitle" class="ct-head">Aktivitas Order</div>
            <div class="ct-row"><span><span class="ct-dot" style="background:var(--brand-primary);"></span>Total Order</span><strong id="ctOrders">0</strong></div>
            <div class="ct-row"><span><span class="ct-dot" style="background:var(--viz-violet);"></span>Total Nominal</span><strong id="ctRev">Rp 0</strong></div>
          </div>
          <div class="chart-grid" id="chartGrid">
            <div class="chart-grid-line"><span class="chart-grid-lbl" id="yLbl3">100%</span></div>
            <div class="chart-grid-line"><span class="chart-grid-lbl" id="yLbl2">66%</span></div>
            <div class="chart-grid-line"><span class="chart-grid-lbl" id="yLbl1">33%</span></div>
            <div class="chart-grid-line"><span class="chart-grid-lbl">0</span></div>
          </div>
          <div id="perfBars" class="chart-bars"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <span class="card-title">Delivery Health</span>
          <button class="btn-pill sm" onclick="go('orders')">Lihat Detail</button>
        </div>
        <div class="gauge-wrap">
          <svg id="radialGauge" width="220" height="122" viewBox="0 0 220 122"></svg>
          <div class="gauge-center">
            <div id="gaugePct" class="gauge-pct">-</div>
            <div class="gauge-sub">Delivery Rate</div>
          </div>
        </div>
        <div class="sub-kpi-grid">
          <div class="sub-kpi">
            <div class="sub-kpi-top">
              <span class="sub-kpi-lbl">Delivered</span>
              <span class="pill amber">OK ↗</span>
            </div>
            <div id="subDelivered" class="sub-kpi-val">0</div>
          </div>
          <div class="sub-kpi">
            <div class="sub-kpi-top">
              <span class="sub-kpi-lbl">Pending / Proses</span>
              <span class="pill dark">Live ↗</span>
            </div>
            <div id="subPending" class="sub-kpi-val">0</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Full-Width Recent Orders Card -->
    <div class="card">
      <div class="card-head">
        <span class="card-title">Pesanan Terbaru</span>
        <div class="toolbar">
          <input id="recentSearch" class="search-pill" placeholder="Cari RB-... atau username..." style="width:220px;" oninput="renderRecentOrders()" />
          <button class="btn-pill sm" onclick="go('orders')">Semua Pesanan →</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Tanggal</th><th>Produk &amp; Item</th><th>Roblox</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="recentOrdersTbody"><tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Memuat pesanan terbaru...</td></tr></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ════════ 1. ORDER CEPAT ════════ -->
  <section id="view-order" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Order Cepat</h1>
        <p class="page-sub">Semua kategori RierBux lengkap: Gift/Item, Robux 5 Hari, Transfer, Instan, Private Server, &amp; Limiteds.</p>
      </div>
      <div class="toolbar">
        <span class="pill pos" id="miniStockManual">Manual: -</span>
        <span class="pill" id="miniStockPs">PS: -</span>
      </div>
    </div>

    <div class="seg-bar">
      <button class="seg-btn active" id="cat-product" onclick="setCat('product')">Game Pass &amp; Item</button>
      <button class="seg-btn" id="cat-robux-5d" onclick="setCat('robux-5d')">Robux 5 Hari</button>
      <button class="seg-btn" id="cat-robux-transfer" onclick="setCat('robux-transfer')">Robux Transfer</button>
      <button class="seg-btn" id="cat-robux-instant" onclick="setCat('robux-instant')">Robux Instan</button>
      <button class="seg-btn" id="cat-private-server" onclick="setCat('private-server')">Private Server</button>
      <button class="seg-btn" id="cat-limited" onclick="setCat('limited')">Item Limiteds</button>
    </div>

    <div class="order-grid">
      <div class="card">
        <div class="card-head">
          <span class="card-title" id="step1Title">1. Pilih Produk &amp; Item</span>
          <span class="pill" id="itemCountTag">0 item</span>
        </div>

        <div id="wrapGameSearch">
          <input id="prodSearch" class="inp" placeholder="Cari dari 165+ game (fish it, blox fruits, evade, dll)..." oninput="renderGameCards()" />
          <div id="gameGrid" class="game-grid"></div>
        </div>

        <div id="wrapPsSearch" class="hidden">
          <div class="input-group">
            <input id="psSearch" class="inp" placeholder="Filter 60 game populer atau Enter cari game Roblox lain..." oninput="renderPsCards()" onkeydown="if(event.key==='Enter')searchPsLive()" />
            <button class="btn-pill" onclick="searchPsLive()">Cari Roblox</button>
          </div>
        </div>

        <div id="wrapLimSearch" class="hidden">
          <input id="limSearch" class="inp" placeholder="Cari item limited (bighead, crown, fedora, dll)..." oninput="renderLimiteds()" />
        </div>

        <div id="wrapRobuxAmount" class="hidden" style="margin-top:4px;">
          <div class="field">
            <label>Masukkan Jumlah Robux (R$) <span id="rbxRangeHint" class="muted"></span></label>
            <div class="input-group">
              <input id="robuxCustomInput" class="inp tnum" type="number" min="10" max="5000" value="100" placeholder="Contoh: 100, 250, 500, 1000..." oninput="onRobuxCustomInput(this.value)" />
              <span class="pill pos" id="robuxRateTag" style="height:38px;padding:0 14px;font-size:12px;">- / R$</span>
            </div>
          </div>
          <div class="muted" style="margin-bottom:8px;font-weight:600;">Atau pilih nominal cepat:</div>
          <div id="robuxPresetGrid" class="items-list" style="max-height:none;"></div>
        </div>

        <div id="varBar" class="var-bar hidden"></div>
        <div id="itemsList" class="items-list" style="margin-top:12px;">
          <div class="muted" style="padding:14px 4px;">Pilih game di atas untuk melihat daftar item beserta icon &amp; harganya.</div>
        </div>
      </div>

      <div class="card sticky-col">
        <div class="card-head">
          <span class="card-title">2. Tujuan &amp; Pembayaran</span>
          <span id="selIdTag" class="pill pos hidden"></span>
        </div>

        <div id="selPreview" class="hidden" style="display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:14px;background:var(--bg-recessed);margin-bottom:14px;">
          <img id="selPrevImg" class="item-icon" src="" alt="" />
          <div style="min-width:0;flex:1;">
            <div id="selPrevName" style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
            <div id="selPrevMeta" class="muted"></div>
          </div>
        </div>

        <div id="wrapRoblox" class="field">
          <label>Username Roblox Tujuan</label>
          <div class="input-group">
            <input id="rbxInput" class="inp" placeholder="Masukkan username Roblox" onkeydown="if(event.key==='Enter')checkRoblox()" />
            <button class="btn-pill" onclick="checkRoblox()">Cek</button>
          </div>
          <div id="rbxChip" class="rbx-chip hidden">
            <img id="rbxImg" src="" alt="" />
            <div>
              <div id="rbxName" class="name"></div>
              <div id="rbxId" class="id"></div>
            </div>
          </div>
        </div>

        <div id="wrapGp" class="field hidden">
          <label>Game Pass ID <span id="gpPriceHint" class="muted"></span></label>
          <div class="input-group">
            <input id="gpInput" class="inp" placeholder="Kosongkan = auto-detect" />
            <button class="btn-pill" onclick="checkGamePassNow()">Cek GP</button>
          </div>
          <div id="gpStatus" class="muted" style="margin-top:4px;"></div>
        </div>

        <div id="wrapPass" class="field hidden">
          <label>Password Akun Roblox (min 8 karakter)</label>
          <input id="passInput" class="inp" type="password" placeholder="Password akun Roblox" />
        </div>

        <div id="wrapLimTrade" class="field hidden">
          <label>Small Limited untuk Trade (wajib punya 1 small limited di akun Roblox)</label>
          <div class="btn-row" style="margin-bottom:8px;">
            <button class="btn-pill sm" onclick="loadRobloxInventory()">Muat Inventory Small Limited</button>
            <label style="margin:0;display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
              <input id="limPreorderChk" type="checkbox" style="width:auto;" onchange="updateSummary()" /> Preorder
            </label>
          </div>
          <select id="smallLimSelect" class="inp"><option value="">-- Cek Roblox &amp; muat inventory dulu --</option></select>
        </div>

        <div id="wrapQty" class="field" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <label id="qtyLabel" style="margin:0;">Jumlah / Quantity</label>
          <div class="stepper">
            <button type="button" onclick="stepQty(-1)">−</button>
            <input id="qtyInput" type="number" value="1" min="1" oninput="syncQtyFromRight()" />
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
          <select id="orderPmSelect" class="inp"><option value="">Memuat channel...</option></select>
        </div>

        <div class="field">
          <label>Kode Promo (opsional)</label>
          <input id="promoInput" class="inp" placeholder="Kosongkan jika tidak ada" />
        </div>

        <div class="summary-box">
          <div class="sum-row"><span class="muted">Produk</span><span id="sumProd">-</span></div>
          <div class="sum-row"><span class="muted">Item</span><span id="sumItem">-</span></div>
          <div class="sum-row total"><span>Total Estimasi</span><span id="sumTotal">Rp 0</span></div>
        </div>

        <div style="margin-bottom:8px;">
          <button class="btn-cta full" onclick="submitOrder(false)">
            <span class="cta-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
            Buat &amp; Bayar Order
          </button>
        </div>
        <div class="btn-row">
          <button class="btn-pill" style="flex:1;" onclick="submitOrder(true)">Preview Dry-Run</button>
          <button class="btn-pill" style="flex:1;" onclick="addCartNow()">+ Keranjang</button>
        </div>

        <div id="orderResult" class="summary-box hidden" style="margin-top:12px;"></div>
      </div>
    </div>
  </section>

  <!-- ════════ 2. KERANJANG ════════ -->
  <section id="view-cart" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Keranjang</h1>
        <p class="page-sub">Checkout banyak item sekaligus dalam 1 transaksi RierCoins.</p>
      </div>
      <div class="toolbar">
        <button class="btn-pill" onclick="loadCart()">Refresh</button>
        <button class="btn-cta" onclick="checkoutCartPrompt()">
          <span class="cta-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>
          Checkout Semua
        </button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Item</th><th>Qty</th><th>Subtotal</th><th>Aksi</th></tr></thead>
          <tbody id="cartTbody"><tr><td colspan="5" class="muted" style="text-align:center;padding:24px;">Memuat keranjang...</td></tr></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ════════ 3. PESANAN ════════ -->
  <section id="view-orders" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Riwayat Pesanan</h1>
        <p class="page-sub">Daftar seluruh pesanan lengkap dengan filter status, pagination, modal detail, &amp; export CSV.</p>
      </div>
      <div class="toolbar">
        <a class="btn-pill" href="/api/orders/csv" target="_blank">Export CSV</a>
        <button class="btn-cta" onclick="loadOrders()">
          <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9"/><polyline points="21 3 21 9 15 9"/></svg></span>
          Muat Ulang
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-title">Daftar Pesanan</span>
        <div class="toolbar">
          <input id="ordSearch" class="search-pill" placeholder="Cari RB-... / username" style="width:200px;" onkeydown="if(event.key==='Enter'){ordPage=1;loadOrders();}" />
          <select id="ordStatus" class="select-pill" onchange="ordPage=1;loadOrders()">
            <option value="">Status Bayar</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
          <select id="ordItemStatus" class="select-pill" onchange="ordPage=1;loadOrders()">
            <option value="">Status Item</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select id="ordLimit" class="select-pill" onchange="ordPage=1;loadOrders()">
            <option value="15">15 / hal</option>
            <option value="25" selected>25 / hal</option>
            <option value="50">50 / hal</option>
            <option value="100">100 / hal</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Tanggal</th><th>Produk &amp; Item</th><th>Roblox</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="ordersTbody"><tr><td colspan="7" class="muted" style="text-align:center;padding:26px;">Memuat pesanan...</td></tr></tbody>
        </table>
      </div>
      <div class="pager">
        <span id="ordPagerInfo">Halaman 1 / 1</span>
        <div class="pager-btns">
          <button class="btn-pill sm" id="ordPrevBtn" onclick="ordPage=Math.max(1,ordPage-1);loadOrders()">← Sebelumnya</button>
          <button class="btn-pill sm" id="ordNextBtn" onclick="ordPage++;loadOrders()">Berikutnya →</button>
        </div>
      </div>
    </div>
  </section>

  <!-- ════════ 4. RIERCOINS ════════ -->
  <section id="view-coins" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">RierCoins &amp; Mutasi Saldo</h1>
        <p class="page-sub">Top up saldo via Duitku, riwayat mutasi keluar/masuk RierCoins, dan riwayat invoice top up.</p>
      </div>
      <div class="toolbar">
        <span id="coinsBalTag" class="pill pos" style="height:36px;padding:0 14px;font-size:12.5px;">- RC</span>
        <button class="btn-pill" onclick="loadCoins()">Refresh</button>
        <a class="btn-pill" href="/api/coins/csv" target="_blank">Export CSV</a>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-title">Top Up RierCoins (Duitku)</span>
        <span class="pill">Bonus otomatis 0,5% (&lt;50k) · 0,7% (≥50k)</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1.6fr auto;gap:12px;align-items:end;">
        <div class="field" style="margin:0;"><label>Nominal (Rp)</label><input id="topupAmt" class="inp tnum" type="number" value="50000" min="10000" step="5000" /></div>
        <div class="field" style="margin:0;"><label>Channel Pembayaran</label><select id="topupPm" class="inp"><option value="">Memuat channel...</option></select></div>
        <button class="btn-cta" onclick="doTopup()">
          <span class="cta-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg></span>
          Buat Invoice
        </button>
      </div>
      <div id="topupRes" class="summary-box hidden" style="margin-top:12px;margin-bottom:0;"></div>
    </div>

    <div class="seg-bar" style="margin-top:16px;">
      <button class="seg-btn active" id="ctab-mutasi" onclick="setCoinTab('mutasi')">Mutasi Saldo RierCoins</button>
      <button class="seg-btn" id="ctab-topup" onclick="setCoinTab('topup')">Riwayat Top Up RierCoins</button>
    </div>

    <div id="cpane-mutasi" class="card">
      <div class="card-head">
        <span class="card-title">Riwayat Mutasi Saldo</span>
        <div class="toolbar">
          <select id="txTypeFilter" class="select-pill" onchange="txPage=1;loadCoins()">
            <option value="">Semua Tipe</option>
            <option value="usage">Pembayaran (usage)</option>
            <option value="topup">Top Up</option>
            <option value="topup_bonus">Bonus Top Up</option>
            <option value="refund">Refund</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select id="txLimit" class="select-pill" onchange="txPage=1;loadCoins()">
            <option value="15">15 / hal</option>
            <option value="25" selected>25 / hal</option>
            <option value="50">50 / hal</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tanggal</th><th>Tipe</th><th>Jumlah</th><th>Deskripsi</th><th>Order ID</th></tr></thead>
          <tbody id="txTbody"><tr><td colspan="5" class="muted" style="text-align:center;padding:24px;">Memuat mutasi...</td></tr></tbody>
        </table>
      </div>
      <div class="pager">
        <span id="txPagerInfo">Halaman 1 / 1</span>
        <div class="pager-btns">
          <button class="btn-pill sm" id="txPrevBtn" onclick="txPage=Math.max(1,txPage-1);loadCoins()">← Sebelumnya</button>
          <button class="btn-pill sm" id="txNextBtn" onclick="txPage++;loadCoins()">Berikutnya →</button>
        </div>
      </div>
    </div>

    <div id="cpane-topup" class="card hidden">
      <div class="card-head"><span class="card-title">Riwayat Top Up</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID Top Up</th><th>Tanggal</th><th>Metode</th><th>Nominal</th><th>Fee</th><th>Status</th><th>Link</th></tr></thead>
          <tbody id="topupTbody"><tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Memuat riwayat top up...</td></tr></tbody>
        </table>
      </div>
      <div class="pager">
        <span id="topupPagerInfo">Halaman 1 / 1</span>
        <div class="pager-btns">
          <button class="btn-pill sm" id="topupPrevBtn" onclick="topupPage=Math.max(1,topupPage-1);loadCoins()">← Sebelumnya</button>
          <button class="btn-pill sm" id="topupNextBtn" onclick="topupPage++;loadCoins()">Berikutnya →</button>
        </div>
      </div>
    </div>
  </section>

  <!-- ════════ 5. STOK & KATALOG ════════ -->
  <section id="view-stock" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Stok &amp; Katalog</h1>
        <p class="page-sub">Monitoring stok handler real-time dan sinkronisasi katalog ke products.json &amp; Google Sheet.</p>
      </div>
      <div class="toolbar">
        <button class="btn-pill" onclick="loadStatus(true)">Cek Stok</button>
        <button class="btn-cta" onclick="syncNow()">
          <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></span>
          Sync Katalog
        </button>
      </div>
    </div>

    <div class="stock-grid">
      <div class="stock-tile"><div class="k">Robux Manual</div><div class="v" id="sk-manual">-</div><div class="s" id="sk-manual-s">-</div></div>
      <div class="stock-tile"><div class="k">Robux 5 Hari</div><div class="v" id="sk-5d">-</div><div class="s" id="sk-5d-s">-</div></div>
      <div class="stock-tile"><div class="k">Robux Instan</div><div class="v" id="sk-inst">-</div><div class="s" id="sk-inst-s">-</div></div>
      <div class="stock-tile"><div class="k">Robux Transfer</div><div class="v" id="sk-trf">-</div><div class="s" id="sk-trf-s">-</div></div>
      <div class="stock-tile"><div class="k">Private Server</div><div class="v" id="sk-ps">-</div><div class="s" id="sk-ps-s">-</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-title">Daftar Produk Aktif</span>
        <div class="toolbar">
          <input id="catFilter" class="search-pill" placeholder="Filter produk..." style="width:220px;" oninput="renderCatalogTable()" />
          <span class="pill pos" id="catCountTag">0 produk</span>
        </div>
      </div>
      <div class="table-wrap" style="max-height:460px;">
        <table>
          <thead><tr><th>#</th><th>Produk</th><th>Slug</th><th>Terjual</th><th>Aksi</th></tr></thead>
          <tbody id="catTbody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ════════ 6. PENGATURAN API & WEBHOOK ════════ -->
  <section id="view-api" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Pengaturan API &amp; Webhook</h1>
        <p class="page-sub">Kelola Official RierBux API Key (/api/v1), Google Sheet Bridge v3, Direct HTTP Webhook, &amp; Action Hash.</p>
      </div>
      <button class="btn-pill" onclick="loadApiKeys()">Refresh Keys</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <span class="card-title">Official API Key (/api/v1)</span>
          <span id="apiActiveTag" class="pill">Belum Aktif</span>
        </div>
        <p class="muted" style="margin-bottom:12px;">Gunakan API Key <code>rb_...</code> untuk akses JSON resmi (saldo, mutasi, katalog, pesanan) dengan rate limit 120 req/menit.</p>
        <div class="input-group" style="margin-bottom:8px;">
          <input id="newKeyName" class="inp" placeholder="Nama API Key baru (default: RierBux Console)" />
          <button class="btn-pill obsidian" onclick="createKey()">Buat Key</button>
        </div>
        <div class="input-group" style="margin-bottom:14px;">
          <input id="inApiKey" class="inp" placeholder="Atau paste rb_xxxxxxxx yang sudah ada..." />
          <button class="btn-pill" onclick="setKey()">Simpan</button>
        </div>
        <div class="table-wrap" style="max-height:220px;">
          <table>
            <thead><tr><th>Nama</th><th>Prefix / ID</th><th>Aksi</th></tr></thead>
            <tbody id="apiKeysTbody"><tr><td colspan="3" class="muted" style="text-align:center;padding:14px;">Klik Refresh Keys (butuh login).</td></tr></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><span class="card-title">Webhook &amp; Google Sheet Bridge v3</span></div>
        <p class="muted" style="margin-bottom:12px;">Protokol 100% kompatibel dengan GerbangAPI ↔ IDV.CO.ID (<code>google-apps-script.gs</code>).</p>
        <div class="summary-box" style="margin-top:0;">
          <div class="sum-row"><span class="muted">Direct Order</span><code>POST /webhook/order</code></div>
          <div class="sum-row"><span class="muted">Remote Session</span><code>POST /session</code></div>
          <div class="sum-row"><span class="muted">Sync Katalog</span><code>POST /sync-catalog</code></div>
          <div class="sum-row"><span class="muted">Health Check</span><code>GET /health</code></div>
        </div>
        <div class="btn-row">
          <button class="btn-cta" style="flex:1;justify-content:center;" onclick="pingSheet()">
            <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>
            Test Google Sheet
          </button>
          <button class="btn-pill" style="flex:1;" onclick="refreshActions()">Refresh Action Hash</button>
        </div>
        <div id="sheetPingBox" class="summary-box hidden" style="margin-top:12px;margin-bottom:0;"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Live Activity Log</span></div>
      <div id="logBox" class="log-box">Menunggu aktivitas...</div>
    </div>
  </section>

  <!-- ════════ 7. AKUN & LOGIN ════════ -->
  <section id="view-account" class="hidden">
    <div class="page-head">
      <div>
        <h1 class="page-title">Akun &amp; Login</h1>
        <p class="page-sub">Kelola autentikasi akun RierBux (Email/Password atau Cookie Chrome Extension untuk Google OAuth).</p>
      </div>
      <button class="btn-pill danger" onclick="logoutPrompt()">Logout Sesi</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><span class="card-title">Login Email &amp; Password</span></div>
        <div class="field"><label>Email RierBux</label><input id="inEmail" class="inp" type="email" placeholder="email@gmail.com" /></div>
        <div class="field"><label>Password</label><input id="inPass" class="inp" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')loginEmail()" /></div>
        <button class="btn-cta full" onclick="loginEmail()">
          <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          Login
        </button>
      </div>

      <div class="card">
        <div class="card-head"><span class="card-title">Paste Cookie / Copy as cURL (Google OAuth)</span></div>
        <p class="muted" style="margin-bottom:10px;">Buka <code>rierbux.com</code> di Chrome → <code>F12</code> → Network → klik kanan <code>get-session</code> → <strong>Copy as cURL</strong> → paste di bawah.</p>
        <div class="field"><textarea id="inCookie" class="inp" placeholder="Paste header cookie: atau Copy as cURL..."></textarea></div>
        <button class="btn-cta full" onclick="loginCookie()">
          <span class="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>
          Verifikasi &amp; Aktifkan Sesi
        </button>
      </div>
    </div>
  </section>
</div>

<script>
const REQUIRE_SECRET = ${requireSecret ? "true" : "false"};
let dashSecret = localStorage.getItem("rb_dash_secret") || "";
let activeView = localStorage.getItem("rb_view") || "overview";
let activeCat = "product";
let payMode = "balance";

let allProducts = [];
let allPsGames = [];
let allLimiteds = [];
let limTags = [];
let activeLimTag = "ALL";
let verifiedRbxUser = null;
let smallLimList = [];
let recentOrdersCache = [];
let perfBuckets = [];
let activeBarIdx = 7;

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
  el.innerHTML = '<span>' + text + '</span><button style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:13px;" onclick="this.parentElement.remove()">✕</button>';
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
  const valid = ["overview", "order", "cart", "orders", "coins", "stock", "api", "account"];
  if (!valid.includes(view)) view = "overview";
  activeView = view;
  localStorage.setItem("rb_view", view);
  for (const v of valid) {
    const navEl = document.getElementById("nav-" + v);
    if (navEl) navEl.classList.toggle("active", v === view);
    const viewEl = document.getElementById("view-" + v);
    if (viewEl) viewEl.classList.toggle("hidden", v !== view);
  }
  if (view === "overview") loadOverview(false);
  if (view === "cart") loadCart();
  if (view === "orders") loadOrders();
  if (view === "coins") loadCoins();
  if (view === "stock") renderCatalogTable();
  if (view === "api") loadApiKeys();
}

// ── 12-Segment Semicircular Radial Gauge (Boltshift Signature) ───────────────
function renderRadialGauge(pct) {
  const svg = document.getElementById("radialGauge");
  if (!svg) return;
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const filledCount = Math.round((clamped / 100) * 12);
  const ramp = [
    "#2073F3", "#2073F3", "#2073F3", "#2073F3", "#2073F3",
    "#4B91FA", "#6BA4FD", "#8BB9FE", "#A9CBFE", "#C9DEFD", "#DCEBFE", "#EAF2FF"
  ];
  const cx = 110, cy = 112, rOut = 96, rIn = 64;
  const totalSpan = 180;
  const gapDeg = 3.2;
  const segDeg = (totalSpan - gapDeg * 11) / 12;

  let paths = "";
  for (let i = 0; i < 12; i++) {
    const a1 = (180 + i * (segDeg + gapDeg)) * (Math.PI / 180);
    const a2 = (180 + i * (segDeg + gapDeg) + segDeg) * (Math.PI / 180);
    const x1 = cx + rOut * Math.cos(a1), y1 = cy + rOut * Math.sin(a1);
    const x2 = cx + rOut * Math.cos(a2), y2 = cy + rOut * Math.sin(a2);
    const x3 = cx + rIn * Math.cos(a2),  y3 = cy + rIn * Math.sin(a2);
    const x4 = cx + rIn * Math.cos(a1),  y4 = cy + rIn * Math.sin(a1);
    const color = i < filledCount ? ramp[i] : "#F2F3F5";
    paths += '<path d="M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' A ' + rOut + ' ' + rOut + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
      ' L ' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
      ' A ' + rIn + ' ' + rIn + ' 0 0 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) +
      ' Z" fill="' + color + '" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" />';
  }
  svg.innerHTML = paths;
  document.getElementById("gaugePct").textContent = clamped.toFixed(1) + "%";
}

// ── Dual-Layer Hatched Bar Chart (Boltshift Signature) ───────────────────────
function renderPerfChart(orders) {
  const days = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const lbl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    days.push({ key, lbl, count: 0, rev: 0 });
  }
  for (const o of orders || []) {
    const k = String(o.createdAt || "").slice(0, 10);
    const b = days.find(x => x.key === k);
    if (b) {
      b.count += 1;
      b.rev += Number(o.total || 0);
    }
  }
  perfBuckets = days;
  let maxVal = Math.max(...days.map(d => d.rev), 0);
  if (maxVal === 0) maxVal = 10000;
  // Auto-select peak bar if available
  let peakIdx = 7;
  let best = -1;
  days.forEach((d, idx) => { if (d.rev >= best) { best = d.rev; peakIdx = idx; } });
  activeBarIdx = peakIdx;

  document.getElementById("yLbl3").textContent = maxVal >= 1000 ? Math.round(maxVal / 1000) + "k" : String(maxVal);
  document.getElementById("yLbl2").textContent = maxVal >= 1000 ? Math.round((maxVal * 0.66) / 1000) + "k" : String(Math.round(maxVal * 0.66));
  document.getElementById("yLbl1").textContent = maxVal >= 1000 ? Math.round((maxVal * 0.33) / 1000) + "k" : String(Math.round(maxVal * 0.33));

  paintPerfBars(maxVal);
}

function paintPerfBars(maxVal) {
  const mx = maxVal || Math.max(...perfBuckets.map(d => d.rev), 10000);
  const el = document.getElementById("perfBars");
  if (!el) return;
  el.innerHTML = perfBuckets.map((d, idx) => {
    const pct = d.rev > 0 ? Math.max(14, Math.round((d.rev / mx) * 100)) : 8;
    return '<div class="bar-col ' + (idx === activeBarIdx ? 'active' : '') + '" onclick="selectPerfBar(' + idx + ')">' +
      '<div class="bar-track"><div class="bar-fill" style="height:' + pct + '%;"><span class="bar-node"></span></div></div>' +
      '<span class="bar-lbl">' + esc(d.lbl) + '</span></div>';
  }).join("");
  const cur = perfBuckets[activeBarIdx] || { lbl: "-", count: 0, rev: 0 };
  document.getElementById("ctTitle").textContent = cur.lbl + " (" + cur.key + ")";
  document.getElementById("ctOrders").textContent = fmtNum(cur.count) + " order";
  document.getElementById("ctRev").textContent = fmtRp(cur.rev);
}
function selectPerfBar(idx) { activeBarIdx = idx; paintPerfBars(); }

function classifyItemStatus(rawStatus, paymentStatus) {
  const s = String(rawStatus || "").trim().toLowerCase();
  const p = String(paymentStatus || "").trim().toLowerCase();
  if (!s || s === "-") {
    if (p.includes("batal") || p.includes("cancel") || p.includes("expir") || p.includes("gagal") || p.includes("fail")) {
      return { kind: "canceled", cls: "neutral" };
    }
    return { kind: "other", cls: "neutral" };
  }
  if (s === "delivered" || s.includes("terkirim") || s.includes("selesai") || s === "completed" || s === "success") {
    return { kind: "delivered", cls: "ok" };
  }
  if (s === "pending" || s === "processing" || s.includes("nunggu") || s.includes("proses") || s.includes("antri")) {
    return { kind: "pending", cls: "warn" };
  }
  if (s.includes("fail") || s.includes("gagal") || s.includes("cancel") || s.includes("batal") || s.includes("void") || s.includes("refund")) {
    return { kind: "failed", cls: "neg" };
  }
  return { kind: "other", cls: "neutral" };
}

function classifyPayStatus(paymentStatus) {
  const s = String(paymentStatus || "").trim().toLowerCase();
  if (s === "paid" || s.includes("dibayar") || s.includes("lunas") || s.includes("success")) {
    return { kind: "paid", cls: "ok" };
  }
  if (s === "unpaid" || s.includes("belum") || s.includes("pending") || s.includes("nunggu")) {
    return { kind: "unpaid", cls: "warn" };
  }
  return { kind: "failed", cls: "neg" };
}

async function loadOverview(fresh = false) {
  if (fresh) await loadStatus(true);
  try {
    const d = await api("/api/orders?page=1&limit=50");
    recentOrdersCache = d.orders || [];
    const total = d.pagination?.totalItems ?? recentOrdersCache.length;
    document.getElementById("kpiOrders").textContent = fmtNum(total);

    let delivered = 0, pending = 0, failed = 0;
    for (const o of recentOrdersCache) {
      for (const it of (o.items || [])) {
        const c = classifyItemStatus(it.status, o.paymentStatus);
        if (c.kind === "delivered") delivered++;
        else if (c.kind === "pending") pending++;
        else if (c.kind === "failed") failed++;
      }
    }
    const denom = delivered + pending + failed;
    const rate = denom > 0 ? (delivered / denom) * 100 : 100;
    renderRadialGauge(rate);
    document.getElementById("subDelivered").textContent = fmtNum(delivered);
    document.getElementById("subPending").textContent = fmtNum(pending);
    const ordPill = document.getElementById("kpiOrdersPill");
    ordPill.textContent = pending > 0 ? (pending + " diproses") : (delivered + " terkirim");
    ordPill.className = "pill " + (pending > 0 ? "warn" : "ok");
    document.getElementById("kpiOrdersSub").textContent = "50 order terakhir · " + delivered + " terkirim, " + pending + " proses, " + failed + " gagal";

    renderPerfChart(recentOrdersCache);
    renderRecentOrders();
  } catch {
    renderRadialGauge(0);
    renderPerfChart([]);
  }
}

function renderRecentOrders() {
  const q = (document.getElementById("recentSearch")?.value || "").toLowerCase().trim();
  const list = (recentOrdersCache || []).filter(o => {
    if (!q) return true;
    const id = String(o.id || o.publicId || "").toLowerCase();
    const rbx = (o.items || []).map(it => it.inputs?.robloxUsername || "").join(" ").toLowerCase();
    const prod = (o.items || []).map(it => (it.product || "") + " " + (it.item || "")).join(" ").toLowerCase();
    return id.includes(q) || rbx.includes(q) || prod.includes(q);
  }).slice(0, 8);
  const tb = document.getElementById("recentOrdersTbody");
  if (!tb) return;
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Belum ada pesanan.</td></tr>';
    return;
  }
  tb.innerHTML = list.map(o => renderOrderRowHtml(o)).join("");
}

function renderOrderRowHtml(o) {
  const id = o.id || o.publicId;
  const pay = classifyPayStatus(o.paymentStatus);
  const isUnpaid = pay.kind === "unpaid";
  const itemsHtml = (o.items || []).map(it => {
    const c = classifyItemStatus(it.status, o.paymentStatus);
    return esc(it.product) + ' · ' + esc(it.item) + ' ×' + (it.quantity || 1) + ' <span class="pill ' + c.cls + '">' + esc(it.status || "-") + '</span>';
  }).join("<br>");
  const rbx = (o.items || []).map(it => it.inputs?.robloxUsername || "").filter(Boolean).join(", ") || "-";
  const act = '<div class="btn-row">' +
    '<button class="btn-pill sm" onclick="openOrderDetail(\\'' + esc(id) + '\\')">Detail</button>' +
    (isUnpaid ? '<button class="btn-pill sm obsidian" onclick="ordAct(\\'pay_balance\\',\\'' + esc(id) + '\\')">Bayar</button><button class="btn-pill sm danger" onclick="ordAct(\\'cancel\\',\\'' + esc(id) + '\\')">Batal</button>' : '') +
    '</div>';
  return '<tr><td><code>#' + esc(id) + '</code></td><td class="muted">' + esc(String(o.createdAt || "").slice(0, 16).replace("T", " ")) + '</td><td>' + itemsHtml + '</td><td>' + esc(rbx) + '</td><td><strong>' + fmtRp(o.total) + '</strong></td><td><span class="pill ' + pay.cls + '">' + esc(o.paymentStatus) + '</span></td><td>' + act + '</td></tr>';
}

async function loadStatus(fresh = false) {
  try {
    const d = await api("/api/status" + (fresh ? "?fresh=1" : ""));
    const pill = document.getElementById("sessPill");
    pill.className = "conn-dot " + (d.loggedIn ? "ok" : "err");
    document.getElementById("sessText").textContent = d.loggedIn ? "Online" : "Offline";
    document.getElementById("offlineDot").classList.toggle("hidden", d.loggedIn);
    document.getElementById("loginNotice").classList.toggle("hidden", d.loggedIn);
    document.getElementById("apiV1Tag").classList.toggle("hidden", !d.hasApiKey);

    const apiTag = document.getElementById("apiActiveTag");
    apiTag.textContent = d.hasApiKey ? ("Aktif · " + (d.apiKeyPreview || "rb_...")) : "Belum Aktif";
    apiTag.className = "pill " + (d.hasApiKey ? "pos" : "");

    const balStr = d.balance !== null ? fmtNum(d.balance) + " RC" : "-";
    document.getElementById("kpiSaldo").textContent = balStr;
    document.getElementById("kpiSaldoSub").textContent = d.balance !== null ? ("Estimasi nilai: " + fmtRp(d.balance)) : "Login untuk melihat saldo";

    const uName = d.loggedIn && d.user ? (d.user.name || d.user.email) : "Belum login";
    document.getElementById("sideUser").textContent = uName;
    document.getElementById("avatarInit").textContent = String(uName).slice(0, 2).toUpperCase();
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

      const man = byId["robux-manual"];
      const ps = byId["private-server"];
      document.getElementById("kpiStockManual").textContent = man ? fmtNum(man.stock) : "-";
      document.getElementById("kpiStockPill").textContent = man ? man.status.toUpperCase() : "-";
      document.getElementById("kpiStockPsSub").textContent = "Private Server: " + (ps ? fmtNum(ps.stock) : "-");
      document.getElementById("miniStockManual").textContent = "Manual: " + (man ? fmtNum(man.stock) : "-");
      document.getElementById("miniStockPs").textContent = "PS: " + (ps ? fmtNum(ps.stock) : "-");
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
    document.getElementById("kpiCatalog").textContent = fmtNum(allProducts.length);
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
    '<tr><td>' + (i + 1) + '</td><td><div style="display:flex;align-items:center;gap:10px;">' +
    (p.thumbnailUrl ? '<img src="' + esc(p.thumbnailUrl) + '" style="width:40px;height:26px;border-radius:6px;object-fit:cover;" loading="lazy" />' : '') +
    '<strong>' + esc(p.name) + '</strong></div></td><td><code>' + esc(p.slug) + '</code></td><td class="muted">' + (p.totalSold ? fmtNum(p.totalSold) : '-') + '</td>' +
    '<td><button class="btn-pill sm" onclick="openFromCatalog(\\'' + esc(p.slug) + '\\')">Pilih</button></td></tr>'
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
  const isRobuxAmt = cat === "robux-transfer" || cat === "robux-5d";
  document.getElementById("wrapGameSearch").classList.toggle("hidden", cat !== "product");
  document.getElementById("wrapPsSearch").classList.toggle("hidden", cat !== "private-server");
  document.getElementById("wrapLimSearch").classList.toggle("hidden", cat !== "limited");
  document.getElementById("wrapRobuxAmount").classList.toggle("hidden", !isRobuxAmt);
  document.getElementById("itemsList").classList.toggle("hidden", isRobuxAmt);
  document.getElementById("wrapRoblox").classList.toggle("hidden", cat === "private-server");
  document.getElementById("wrapGp").classList.toggle("hidden", cat !== "robux-5d");
  document.getElementById("wrapPass").classList.toggle("hidden", cat !== "robux-instant");
  document.getElementById("wrapLimTrade").classList.toggle("hidden", cat !== "limited");
  document.getElementById("wrapQty").classList.toggle("hidden", cat === "limited" || cat === "private-server");
  document.getElementById("qtyLabel").textContent = isRobuxAmt ? "Jumlah Robux (R$)" : "Jumlah / Quantity";
  document.getElementById("step1Title").textContent = isRobuxAmt ? "1. Masukkan Jumlah Robux" : "1. Pilih Produk & Item";
  document.getElementById("varBar").classList.add("hidden");

  if (cat === "robux-5d") await pickSlug("robux-5-hari");
  else if (cat === "robux-transfer") await pickSlug("robux-transfer");
  else if (cat === "robux-instant") await pickSlug("robux-instan");
  else if (cat === "private-server") await loadPopularPrivateServers();
  else if (cat === "limited") await loadLimiteds();
  else {
    document.getElementById("itemsList").innerHTML = '<div class="muted" style="padding:14px 4px;">Pilih game di atas untuk melihat item beserta icon &amp; harga.</div>';
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
    el.innerHTML = '<div class="muted" style="padding:14px 4px;">Tidak ada di 60 game populer. Klik tombol <strong>Cari Roblox</strong>.</div>';
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
    if (activeCat === "robux-transfer" || activeCat === "robux-5d") {
      const def = Math.max(selItem.minQuantity || 1, 100);
      qEl.value = def;
      const cEl = document.getElementById("robuxCustomInput");
      cEl.min = selItem.minQuantity || 1;
      cEl.max = selItem.maxQuantity || 5000;
      cEl.value = def;
      renderRobuxPresets();
    } else if (Number(qEl.value) < (selItem.minQuantity || 1)) {
      qEl.value = selItem.minQuantity || 1;
    }
  }
  renderItems();
  updateSummary();
}
function renderRobuxPresets() {
  if (!selItem) return;
  const unit = Number(selItem.price ?? selItem.unitPrice) || 0;
  const minQ = selItem.minQuantity || 1;
  const maxQ = selItem.maxQuantity || 5000;
  const curQ = Number(document.getElementById("qtyInput").value) || minQ;
  document.getElementById("rbxRangeHint").textContent = "(Min " + fmtNum(minQ) + " – Maks " + fmtNum(maxQ) + " R$)";
  document.getElementById("robuxRateTag").textContent = fmtRp(unit) + " / R$";
  const presets = [50, 100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000].filter(n => n >= minQ && n <= maxQ);
  document.getElementById("robuxPresetGrid").innerHTML = presets.map(n =>
    '<div class="item-tile ' + (curQ === n ? 'active' : '') + '" onclick="pickRobuxPreset(' + n + ')">' +
    (selItem.imageUrl ? '<img class="item-icon" src="' + esc(selItem.imageUrl) + '" alt="" />' : '') +
    '<div class="item-body"><div class="it-name">' + fmtNum(n) + ' Robux</div>' +
    '<div class="it-bottom"><span class="it-price">' + fmtRp(unit * n) + '</span><span class="it-sub">' + (activeCat === 'robux-5d' ? 'GP ' + Math.ceil(n / 0.7) + ' R$' : 'Tanpa Pajak') + '</span></div></div></div>'
  ).join("");
}
function pickRobuxPreset(n) {
  document.getElementById("qtyInput").value = n;
  document.getElementById("robuxCustomInput").value = n;
  renderRobuxPresets();
  updateSummary();
}
function onRobuxCustomInput(val) {
  const n = Math.max(1, parseInt(val, 10) || 1);
  document.getElementById("qtyInput").value = n;
  renderRobuxPresets();
  updateSummary();
}
function syncQtyFromRight() {
  if (activeCat === "robux-transfer" || activeCat === "robux-5d") {
    document.getElementById("robuxCustomInput").value = document.getElementById("qtyInput").value;
    renderRobuxPresets();
  }
  updateSummary();
}
function stepQty(delta) {
  const el = document.getElementById("qtyInput");
  const step = (activeCat === "robux-transfer" || activeCat === "robux-5d") ? delta * 10 : delta;
  el.value = Math.max(Number(el.min) || 1, (Number(el.value) || 1) + step);
  syncQtyFromRight();
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
  if (activeCat === "limited") {
    const idx = document.getElementById("smallLimSelect").value;
    const small = smallLimList[Number(idx)];
    if (!small) return toast("warn", "Muat & pilih Small Limited dari inventory Roblox dulu.");
    const isPreorder = Boolean(document.getElementById("limPreorderChk").checked);
    const total = isPreorder && selItem.preorderPrice ? selItem.preorderPrice : selItem.unitPrice;
    if (dryRun) return toast("ok", "Preview Limited: " + selItem.name + " (" + fmtRp(total) + ") trade dg " + (small.name || small.assetName));
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
          slug: selItem.slug, robloxUsername: document.getElementById("rbxInput").value.trim(),
          smallAssetId: small.assetId || small.id, smallUaid: small.userAssetId || small.uaid,
          smallName: small.name || small.assetName, isPreorder, expectedTotal: total, payMethod: payMode,
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
      return '<tr><td><code>#' + cid + '</code></td><td>' + esc(it.itemName || it.name || ('Item #' + it.productItemId)) + '</td><td>' + (it.quantity || 1) + '</td><td><strong>' + fmtRp(it.totalPrice ?? it.unitPrice) + '</strong></td><td><button class="btn-pill sm danger" onclick="delCart(' + cid + ')">Hapus</button></td></tr>';
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
    tb.innerHTML = list.map(o => renderOrderRowHtml(o)).join("");
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

    const payCls = classifyPayStatus(o.paymentStatus).cls;
    let html = '<div class="summary-box" style="margin-top:0;">' +
      '<div class="sum-row"><span class="muted">Status Bayar</span><span class="pill ' + payCls + '">' + esc(o.paymentStatus || "-") + '</span></div>' +
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
      html += '<div class="btn-row" style="margin-bottom:12px;"><button class="btn-pill sm obsidian" onclick="ordAct(\\'pay_balance\\',\\'' + esc(publicId) + '\\')">Bayar RierCoins</button><button class="btn-pill sm danger" onclick="ordAct(\\'cancel\\',\\'' + esc(publicId) + '\\')">Batalkan Order</button></div>';
    }

    if (items.length) {
      html += '<div style="font-weight:600;margin-bottom:8px;">Items (' + items.length + ')</div>';
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
            delivHtml += '<div class="btn-row" style="margin-top:8px;">' +
              '<button class="btn-pill sm" onclick="psControl(\\'regenerate\\',\\'' + esc(publicId) + '\\',' + it.id + ')">Regenerate Link</button>' +
              '<button class="btn-pill sm danger" onclick="psControl(\\'shutdown\\',\\'' + esc(publicId) + '\\',' + it.id + ')">Shutdown PS</button></div>';
          }
        } else if (it.handler === "robux-5d" && (deliv?.deliveredAt || it.deliveredAt)) {
          delivHtml += '<div class="sum-row"><span class="muted">Robux Pending</span><a class="ext" target="_blank" href="https://www.roblox.com/transactions">Cek Transactions Roblox ↗</a></div>';
        } else if (deliv?.approvalDeadline) {
          delivHtml += '<div class="sum-row"><span class="muted">Batas Izin Ortu</span><span>' + esc(String(deliv.approvalDeadline).slice(0, 16).replace("T", " ")) + '</span></div>';
        }

        return '<div class="summary-box" style="margin:8px 0;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
          (it.imageUrl ? '<img class="item-icon" src="' + esc(it.imageUrl) + '" style="width:38px;height:38px;" />' : '') +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:12.5px;">' + esc(it.product || it.productName) + ' · ' + esc(it.item || it.itemName) + ' ×' + (it.quantity || 1) + '</div>' +
          '<div class="muted">' + esc(it.handler || it.deliveryMethod || "") + (it.deliveredAt ? ' · Dikirim ' + esc(String(it.deliveredAt).slice(0, 16).replace("T", " ")) : '') + '</div></div>' +
          '<span class="pill ' + classifyItemStatus(it.status, o.paymentStatus).cls + '">' + esc(it.status || "-") + '</span></div>' +
          (inp.robloxUsername ? '<div class="sum-row"><span class="muted">Roblox</span><span>' + (rbxProfile ? '<a class="ext" target="_blank" href="' + rbxProfile + '">@' + esc(inp.robloxUsername) + ' ↗</a>' : '@' + esc(inp.robloxUsername)) + '</span></div>' : '') +
          (inp.smallName ? '<div class="sum-row"><span class="muted">Tumbal Limited</span><span>' + esc(inp.smallName) + ' (UAID ' + esc(inp.smallUaid || "-") + ')</span></div>' : '') +
          '<div class="sum-row"><span class="muted">Harga Bersih</span><strong>' + fmtRp(it.netPrice ?? it.totalPrice) + '</strong></div>' +
          delivHtml +
          (it.failureReason ? '<div style="color:var(--err);font-size:12px;margin-top:4px;">Error: ' + esc(it.failureReason) + '</div>' : '') +
          (failed && it.id ? '<div class="btn-row" style="margin-top:8px;"><button class="btn-pill sm" onclick="retryItem(\\'' + esc(publicId) + '\\',' + it.id + ')">Retry Pengiriman</button></div>' : '') +
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
        return '<tr><td class="muted">' + esc(String(t.createdAt || "").slice(0, 16).replace("T", " ")) + '</td><td><span class="pill">' + esc(t.type) + '</span></td>' +
          '<td style="font-weight:700;color:' + (pos ? 'var(--ok)' : 'var(--err)') + ';">' + (pos ? '+' : '') + fmtNum(t.amount) + ' RC</td>' +
          '<td>' + esc(t.description) + '</td><td>' + oid + '</td></tr>';
      }).join("");
    }

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
          '<td><span class="pill ' + (isPaid ? 'pos' : 'warn') + '">' + esc(tp.paymentStatus) + '</span></td>' +
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
      '<td><button class="btn-pill sm danger" onclick="revokeKey(\\'' + esc(k.id) + '\\')">Cabut</button></td></tr>'
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
  document.getElementById("clockWib").textContent = g("hour") + ":" + g("minute") + ":" + g("second") + " WIB";
}

function init() {
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
