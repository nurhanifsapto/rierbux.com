/**
 * Google Apps Script — Jembatan GerbangAPI ↔ Bot RIERBUX.COM lewat satu Google Spreadsheet
 *
 * Versi 3 (Kompatibel 100% dengan protokol Jembatan IDV.CO.ID ↔ GerbangAPI):
 *
 *   GerbangAPI   → action "order"       : tulis baris PENDING (ref, order_ref, product_id, item_code, user_id, zone_id)
 *   Bot RierBux  → action "pending"     : ambil baris PENDING (boleh menyertakan "saldo" → disimpan di tab Meta)
 *   Bot RierBux  → action "claim"       : tandai PROCESSING (compare-and-set, aman untuk multi-worker)
 *   Bot RierBux  → action "result"      : isi hasil beli di baris yang sama (SUCCESS + Order ID RB-... | FAILED)
 *   Bot RierBux  → action "catalog"     : unggah katalog RierBux ke tab Katalog
 *   GerbangAPI   → action "results"     : baris ber-ref yang sudah final dan belum di-ack (+ saldo RierCoins)
 *   GerbangAPI   → action "ack"         : tandai "Diterima GerbangAPI" supaya tidak dibaca lagi
 *   GerbangAPI   → action "meta"        : saldo RierCoins terakhir & jumlah katalog
 *   GerbangAPI   → action "catalog_get" : katalog untuk diimpor jadi produk di GerbangAPI
 *   Siapa saja   → action "ping"        : cek secret + sheet
 *
 * Mapping field RierBux:
 *   - product_id : slug RierBux (mis. "fish-it", "blox-fruits", "robux-5-hari", "robux-transfer", "robux-instan", "private-server")
 *   - item_code  : "<itemId>" atau "<slug>__<itemId>" (mis. "fish-it__7710" atau "7710")
 *   - user_id    : Username Roblox tujuan (atau rootPlaceId untuk private-server)
 *   - zone_id    : Opsional — quantity (default 1) / Game Pass ID (Robux 5 Hari) / Password Roblox (Robux Instan)
 *
 * Semua request: POST JSON { "secret": "...", "action": "...", ...field }.
 * Semua jawaban: { "ok": true, ... } atau { "ok": false, "error": "..." }.
 */

const SECRET = "GANTI-DENGAN-SECRET-PANJANG-ACAK"; // ← wajib diganti; samakan dengan GSHEET_SECRET di .env & GerbangAPI
const SHEET_NAME = "Orders";
const META_SHEET = "Meta";       // saldo RierCoins terakhir (key/value), diisi bot
const KATALOG_SHEET = "Katalog"; // katalog RierBux (satu baris per item), diisi bot
const VERSION = 3;

const KATALOG_HEADERS = ["product_id", "Produk", "item_code", "Item", "Harga", "Jenis", "Diperbarui"];

const HEADERS = [
  "Tanggal",
  "Ref GerbangAPI",
  "Order Channel",
  "product_id",
  "item_code",
  "Player ID",
  "Zone ID",
  "Status",
  "Order ID",
  "TRX ID",
  "Produk",
  "Item",
  "Voucher",
  "Kode Voucher",
  "SN",
  "Harga",
  "Sisa Saldo",
  "Link Order",
  "Error",
  "Diterima GerbangAPI",
];

function aktifkanIzin() {
  const sheet = getSheet_();
  getMetaSheet_();
  getKatalogSheet_();
  Logger.log("OK! Tab aktif: " + sheet.getName() + ", " + META_SHEET + ", " + KATALOG_SHEET);
}

// ── Util sheet ────────────────────────────────────────────────────────────────────────────────

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const ada = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((v) => String(v).trim());
  let col = lastCol;
  HEADERS.forEach((h) => {
    if (ada.indexOf(h) === -1) {
      col += 1;
      const cell = sheet.getRange(1, col);
      cell.setValue(h);
      cell.setFontWeight("bold");
    }
  });
}

function kolom_(sheet) {
  const lastCol = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  header.forEach((h, i) => { map[String(h).trim()] = i + 1; });
  return map;
}

function parseBarisValues_(v, k, rowNo) {
  const get = (nama) => (k[nama] ? v[k[nama] - 1] : "");
  const teks = (x) => (x === null || x === undefined ? "" : String(x).replace(/^'/, "").trim());
  return {
    row: rowNo,
    ref: teks(get("Ref GerbangAPI")),
    order_ref: teks(get("Order Channel")),
    product_id: teks(get("product_id")),
    item_code: teks(get("item_code")),
    user_id: teks(get("Player ID")),
    zone_id: teks(get("Zone ID")),
    status: teks(get("Status")).toUpperCase(),
    t_id: teks(get("Order ID")),
    trx_id: teks(get("TRX ID")),
    product: teks(get("Produk")),
    item: teks(get("Item")),
    player_id: teks(get("Player ID")),
    voucher: teks(get("Voucher")),
    kode_voucher: teks(get("Kode Voucher")),
    sn: teks(get("SN")),
    amount: teks(get("Harga")),
    ending_balance: teks(get("Sisa Saldo")),
    order_url: teks(get("Link Order")),
    trx_date: teks(get("Tanggal")),
    error: teks(get("Error")),
    acked: teks(get("Diterima GerbangAPI")),
  };
}

function bacaBaris_(sheet, k, rowNo) {
  const lastCol = sheet.getLastColumn();
  const v = sheet.getRange(rowNo, 1, 1, lastCol).getValues()[0];
  return parseBarisValues_(v, k, rowNo);
}

function bacaSemuaBaris_(sheet, k) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const lastCol = sheet.getLastColumn();
  const rows = sheet.getRange(2, 1, last - 1, lastCol).getValues();
  return rows.map((v, idx) => parseBarisValues_(v, k, idx + 2));
}

function cariBarisRef_(sheet, k, ref) {
  if (!ref || !k["Ref GerbangAPI"]) return 0;
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const vals = sheet.getRange(2, k["Ref GerbangAPI"], last - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).replace(/^'/, "").trim() === ref) return i + 2;
  }
  return 0;
}

function tulisSel_(sheet, k, rowNo, nama, nilai) {
  if (!k[nama] || nilai === undefined || nilai === null) return;
  sheet.getRange(rowNo, k[nama]).setValue(nilai);
}

function asText_(v) {
  return v ? "'" + String(v) : "";
}

function sekarang_() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");
}

// ── Tab Meta (saldo & stok) ──────────────────────────────────────────────────────────────────

function getMetaSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(META_SHEET);
  if (!sh) {
    sh = ss.insertSheet(META_SHEET);
    sh.appendRow(["Kunci", "Nilai", "Diperbarui"]);
    sh.getRange(1, 1, 1, 3).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function setMeta_(kunci, nilai) {
  const sh = getMetaSheet_();
  const last = sh.getLastRow();
  const valStr = String(nilai);
  if (last >= 2) {
    const rows = sh.getRange(2, 1, last - 1, 3).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === kunci) {
        sh.getRange(i + 2, 2, 1, 2).setValues([[valStr, sekarang_()]]);
        return;
      }
    }
  }
  sh.appendRow([kunci, valStr, sekarang_()]);
}

function getMeta_(kunci) {
  const sh = getMetaSheet_();
  const last = sh.getLastRow();
  if (last >= 2) {
    const rows = sh.getRange(2, 1, last - 1, 3).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === kunci) {
        return { nilai: String(rows[i][1]).trim(), diperbarui: String(rows[i][2]).trim() };
      }
    }
  }
  return { nilai: "", diperbarui: "" };
}

// ── Tab Katalog ───────────────────────────────────────────────────────────────────────────────

function getKatalogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(KATALOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(KATALOG_SHEET);
    sh.appendRow(KATALOG_HEADERS);
    sh.getRange(1, 1, 1, KATALOG_HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function tulisKatalog_(data) {
  const baris = [];
  const waktu = sekarang_();
  const items = data.items;
  if (Array.isArray(items)) {
    items.forEach((it) => {
      if (!it || !it.item_code) return;
      baris.push([
        it.product_id || "",
        it.product_name || "",
        asText_(it.item_code),
        it.name || it.item || "",
        it.amount || 0,
        it.kind || "topup",
        waktu,
      ]);
    });
  } else {
    const products = data.products || [];
    products.forEach((p) => {
      const denoms = (p && (p.items || p.denoms)) || [];
      denoms.forEach((d) => {
        if (!d) return;
        const code = d.item_code || (p.slug ? p.slug + "__" + d.id : String(d.id || ""));
        if (!code) return;
        baris.push([
          p.slug || p.product_id || "",
          p.name || p.product_name || "",
          asText_(code),
          (d.variation && d.variation !== "Default" ? "[" + d.variation + "] " : "") + (d.name || ""),
          d.price || d.unitPrice || d.amount || 0,
          "topup",
          waktu,
        ]);
      });
    });
  }
  const sh = getKatalogSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, KATALOG_HEADERS.length).clearContent();
  if (baris.length) sh.getRange(2, 1, baris.length, KATALOG_HEADERS.length).setValues(baris);
  setMeta_("katalog_jumlah", baris.length);
  return baris.length;
}

function bacaKatalog_() {
  const sh = getKatalogSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, KATALOG_HEADERS.length).getValues();
  const out = [];
  vals.forEach((v) => {
    const item_code = String(v[2]).replace(/^'/, "").trim();
    if (!item_code) return;
    out.push({
      product_id: String(v[0]).trim(),
      product_name: String(v[1]).trim(),
      item_code: item_code,
      name: String(v[3]).trim(),
      amount: v[4],
      kind: String(v[5]).trim().toLowerCase() || "topup",
    });
  });
  return out;
}

// ── Actions ───────────────────────────────────────────────────────────────────────────────────

function jawab_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jawab_({ ok: true, message: "Jembatan Google Sheet RierBux aktif (POST JSON {secret, action})", version: VERSION });
}

function doPost(e) {
  let lock = null;
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (!SECRET || SECRET.indexOf("GANTI-DENGAN") === 0) return jawab_({ ok: false, error: "SECRET di Apps Script belum diganti" });
    if (String(data.secret || "") !== SECRET) return jawab_({ ok: false, error: "secret salah" });

    const action = String(data.action || (data.trx_id || data.t_id ? "result" : "")).toLowerCase();
    const hasSaldoWrite = action === "pending" && data.saldo !== undefined && data.saldo !== null && String(data.saldo).trim() !== "";
    const needsWriteLock = hasSaldoWrite || ["order", "claim", "result", "ack", "catalog"].indexOf(action) !== -1;
    if (needsWriteLock) {
      lock = LockService.getScriptLock();
      lock.waitLock(20000);
    }

    const sheet = getSheet_();
    const k = kolom_(sheet);

    switch (action) {
      case "ping":
        return jawab_({ ok: true, sheet: sheet.getName(), rows: Math.max(sheet.getLastRow() - 1, 0), version: VERSION });

      case "order": {
        const ref = String(data.ref || "").trim();
        if (!ref) return jawab_({ ok: false, error: "ref wajib" });
        const ada = cariBarisRef_(sheet, k, ref);
        if (ada) return jawab_({ ok: true, row: ada, created: false });
        const baris = HEADERS.map(() => "");
        const set = (nama, v) => { if (k[nama]) baris[k[nama] - 1] = v; };
        set("Tanggal", sekarang_());
        set("Ref GerbangAPI", ref);
        set("Order Channel", data.order_ref || "");
        set("product_id", data.product_id || "");
        set("item_code", asText_(data.item_code || ""));
        set("Player ID", asText_(data.user_id || ""));
        set("Zone ID", asText_(data.zone_id || ""));
        set("Status", "PENDING");
        set("Produk", data.product || "");
        set("Item", data.item || "");
        sheet.appendRow(baris.slice(0, Math.max(sheet.getLastColumn(), HEADERS.length)));
        return jawab_({ ok: true, row: sheet.getLastRow(), created: true });
      }

      case "pending": {
        if (data.saldo !== undefined && data.saldo !== null && String(data.saldo).trim() !== "") {
          setMeta_("saldo", String(data.saldo).trim());
        }
        if (data.stock_summary) {
          setMeta_("stock", String(data.stock_summary));
        }
        const out = bacaSemuaBaris_(sheet, k).filter((b) => b.ref && b.status === "PENDING");
        return jawab_({ ok: true, data: out });
      }

      case "processing": {
        const out = bacaSemuaBaris_(sheet, k).filter((b) => b.ref && b.status === "PROCESSING" && b.t_id);
        return jawab_({ ok: true, data: out });
      }

      case "claim": {
        const ref = String(data.ref || "").trim();
        const r = cariBarisRef_(sheet, k, ref);
        if (!r) return jawab_({ ok: false, error: "ref tidak ditemukan" });
        const b = bacaBaris_(sheet, k, r);
        if (b.status !== "PENDING") return jawab_({ ok: true, claimed: false, status: b.status, row: r });
        tulisSel_(sheet, k, r, "Status", "PROCESSING");
        return jawab_({ ok: true, claimed: true, row: r });
      }

      case "result": {
        const ref = String(data.ref || "").trim();
        let r = ref ? cariBarisRef_(sheet, k, ref) : 0;
        if (ref && !r) return jawab_({ ok: false, error: "ref tidak ditemukan di sheet" });
        if (!r) {
          sheet.appendRow(HEADERS.map(() => ""));
          r = sheet.getLastRow();
          tulisSel_(sheet, k, r, "Tanggal", data.trx_date || sekarang_());
        }
        const sudah = bacaBaris_(sheet, k, r);
        if (ref && (sudah.status === "SUCCESS" || sudah.status === "FAILED" || sudah.status === "REFUNDED") && sudah.acked) {
          return jawab_({ ok: true, row: r, message: "baris sudah final dan sudah diterima GerbangAPI; tidak diubah" });
        }
        const ALLOWED_STATUS = { PENDING: 1, PROCESSING: 1, SUCCESS: 1, FAILED: 1, REFUNDED: 1 };
        const rawStatus = String(data.status || "SUCCESS").toUpperCase();
        const status = ALLOWED_STATUS[rawStatus] ? rawStatus : "SUCCESS";
        if (data.trx_date) tulisSel_(sheet, k, r, "Tanggal", data.trx_date);
        tulisSel_(sheet, k, r, "Status", status);
        if (data.t_id || data.publicId) tulisSel_(sheet, k, r, "Order ID", data.t_id || data.publicId);
        if (data.trx_id || data.t_id) tulisSel_(sheet, k, r, "TRX ID", data.trx_id || data.t_id);
        if (data.product) tulisSel_(sheet, k, r, "Produk", data.product);
        if (data.item) tulisSel_(sheet, k, r, "Item", data.item);
        if (data.player_id) tulisSel_(sheet, k, r, "Player ID", asText_(data.player_id));
        if (data.voucher_code || data.voucher) tulisSel_(sheet, k, r, "Voucher", data.voucher_code || data.voucher);
        if (data.kode_voucher) tulisSel_(sheet, k, r, "Kode Voucher", data.kode_voucher);
        if (data.sn) tulisSel_(sheet, k, r, "SN", asText_(data.sn));
        if (data.amount !== undefined && data.amount !== "") tulisSel_(sheet, k, r, "Harga", data.amount);
        if (data.ending_balance !== undefined && data.ending_balance !== "") {
          tulisSel_(sheet, k, r, "Sisa Saldo", data.ending_balance);
          setMeta_("saldo", String(data.ending_balance).trim());
        }
        if (data.order_url) tulisSel_(sheet, k, r, "Link Order", data.order_url);
        tulisSel_(sheet, k, r, "Error", (status === "FAILED" || status === "REFUNDED") ? (data.error || data.reason || "") : "");
        return jawab_({ ok: true, row: r, status: status });
      }

      case "results": {
        const out = bacaSemuaBaris_(sheet, k)
          .filter((b) => b.ref && !b.acked && (b.status === "SUCCESS" || b.status === "FAILED" || b.status === "REFUNDED"))
          .map((b) => { delete b.acked; return b; });
        const saldoR = getMeta_("saldo");
        return jawab_({ ok: true, data: out, saldo: saldoR.nilai, saldo_updated_at: saldoR.diperbarui });
      }

      case "ack": {
        const ref = String(data.ref || "").trim();
        const r = cariBarisRef_(sheet, k, ref);
        if (!r) return jawab_({ ok: true, row: 0 });
        tulisSel_(sheet, k, r, "Diterima GerbangAPI", sekarang_() + (data.note ? " — " + data.note : ""));
        return jawab_({ ok: true, row: r });
      }

      case "catalog": {
        const n = tulisKatalog_(data);
        if (data.saldo_topup !== undefined && data.saldo_topup !== null && String(data.saldo_topup).trim() !== "") {
          setMeta_("saldo", String(data.saldo_topup).trim());
        }
        return jawab_({ ok: true, rows: n });
      }

      case "catalog_get": {
        const items = bacaKatalog_();
        return jawab_({ ok: true, data: items, updated_at: getMeta_("katalog_jumlah").diperbarui });
      }

      case "meta": {
        const saldo = getMeta_("saldo");
        const stock = getMeta_("stock");
        return jawab_({
          ok: true,
          saldo: saldo.nilai,
          saldo_updated_at: saldo.diperbarui,
          stock: stock.nilai,
          catalog_rows: Number(getMeta_("katalog_jumlah").nilai || 0),
          version: VERSION,
        });
      }

      default:
        return jawab_({ ok: false, error: "action tidak dikenal: " + action });
    }
  } catch (err) {
    return jawab_({ ok: false, error: err.message });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (e2) {}
    }
  }
}
