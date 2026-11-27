/**
 * RIERBUX.COM Google Sheet Bridge v3 + Direct Webhook + 24/7 Queue Worker
 * (Protokol 100% kompatibel dengan IDV.CO.ID ↔ GerbangAPI)
 */

const https = require("https");
const http = require("http");

function postJsonFollow(urlStr, payload, hops = 0) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const isHttp = u.protocol === "http:";
    const mod = isHttp ? http : https;
    const body = hops === 0 ? JSON.stringify(payload) : null;
    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (isHttp ? 80 : 443),
        path: u.pathname + u.search,
        method: hops === 0 ? "POST" : "GET",
        family: 4,
        timeout: 45000,
        headers: body
          ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) }
          : {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops < 5) {
            return resolve(postJsonFollow(res.headers.location, payload, hops + 1));
          }
          resolve({ status: res.statusCode, text: data });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Webhook request timeout (25s)")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function callSheetBridge(action, extra = {}) {
  const url = (process.env.GSHEET_WEBHOOK_URL || "").trim();
  const secret = (process.env.GSHEET_SECRET || "").trim();
  if (!url) throw new Error("GSHEET_WEBHOOK_URL belum diisi di .env");
  if (!secret) throw new Error("GSHEET_SECRET belum diisi di .env");

  const r = await postJsonFollow(url, { secret, action, ...extra });
  let parsed = null;
  try {
    parsed = JSON.parse(r.text);
  } catch {}
  if (!parsed || parsed.ok === false) {
    throw new Error(`Sheet bridge '${action}' gagal (HTTP ${r.status}): ${parsed?.error || r.text.slice(0, 200)}`);
  }
  return parsed;
}

/** Kirim notifikasi callback HTTP opsional (WEBHOOK_CALLBACK_URL) */
async function sendOutboundWebhook(eventPayload) {
  const cbUrl = (process.env.WEBHOOK_CALLBACK_URL || "").trim();
  if (!cbUrl) return null;
  const secret = (process.env.GSHEET_SECRET || "").trim();
  try {
    return await postJsonFollow(cbUrl, { secret, ...eventPayload });
  } catch (err) {
    console.error(`⚠️  [WEBHOOK CALLBACK] Gagal kirim ke ${cbUrl}: ${err.message}`);
    return null;
  }
}

/**
 * Parse baris order dari Google Sheet / Webhook menjadi parameter `bot.buyProduct(...)`:
 *   - product_id : slug RierBux ("fish-it", "robux-5-hari", "robux-transfer", "robux-instan", "private-server")
 *   - item_code  : "<itemId>" atau "<slug>__<itemId>" (contoh: "fish-it__7710" atau "7710")
 *                  atau "robux-transfer__100" (qty 100)
 *   - user_id    : username Roblox tujuan (atau rootPlaceId untuk private-server)
 *   - zone_id    : opsional (quantity, atau gamePassId untuk robux-5-hari, atau password untuk robux-instan)
 */
function parseOrderSpec(order) {
  let slug = String(order.product_id || order.slug || "").trim().toLowerCase();
  const rawCode = String(order.item_code || order.itemId || "").trim();
  let itemId = undefined;
  let qty = Number(order.quantity || 0) || 1;
  let type = String(order.type || "").trim().toLowerCase();

  // Support format "slug__itemId" atau "slug__itemId__qty"
  if (rawCode.includes("__")) {
    const parts = rawCode.split("__");
    if (!slug) slug = parts[0].toLowerCase();
    if (/^\d+$/.test(parts[1])) itemId = Number(parts[1]);
    if (parts[2] && /^\d+$/.test(parts[2])) qty = Number(parts[2]);
  } else if (/^\d+$/.test(rawCode)) {
    itemId = Number(rawCode);
  }

  if (!type) {
    if (slug === "robux-5-hari" || slug === "robux-5d") type = "robux-5d";
    else if (slug === "robux-transfer") type = "robux-transfer";
    else if (slug === "robux-instan" || slug === "robux-instant") type = "robux-instant";
    else if (slug === "private-server" || slug === "private-servers") type = "private-server";
    else type = "product";
  }

  const userId = String(order.user_id || order.robloxUsername || "").trim();
  const zoneId = String(order.zone_id || "").trim();

  const spec = {
    type,
    slug: type === "product" ? slug : undefined,
    placeId: type === "private-server" ? userId || order.placeId : undefined,
    itemId,
    quantity: qty,
    robloxUsername: type !== "private-server" ? userId : undefined,
    payMethod: order.payMethod || "balance",
    paymentMethodId: order.paymentMethodId ? Number(order.paymentMethodId) : undefined,
    promoCode: order.promoCode || undefined,
    dryRun: false,
  };

  // Interpretasi zone_id tergantung tipe produk
  if (zoneId) {
    if (type === "robux-instant") {
      spec.robloxPassword = zoneId;
    } else if (type === "robux-5d") {
      // Bisa "qty:gamePassId" atau cuma angka (jika > 100000 dianggap gamePassId, selain itu qty)
      if (zoneId.includes(":")) {
        const [qPart, gpPart] = zoneId.split(":");
        if (Number(qPart) > 0) spec.quantity = Number(qPart);
        if (Number(gpPart) > 0) spec.gamePassId = Number(gpPart);
      } else if (/^\d+$/.test(zoneId)) {
        const n = Number(zoneId);
        if (n > 100000) spec.gamePassId = n;
        else spec.quantity = n;
      }
    } else if (/^\d+$/.test(zoneId) && !order.quantity) {
      spec.quantity = Number(zoneId);
    }
  }

  // Untuk robux-5d / robux-transfer, itemId 1 / 6083 bisa di-resolve otomatis dari halaman jika kosong
  if ((type === "robux-5d" || type === "robux-transfer") && itemId && itemId !== 1 && itemId !== 6083 && !order.quantity && !zoneId) {
    // Jika user menaruh jumlah robux di item_code (mis. product_id="robux-transfer", item_code="100")
    spec.quantity = itemId;
    spec.itemId = undefined;
  }

  return spec;
}

/** Upload katalog RierBux ke tab "Katalog" Google Sheet v3 */
async function uploadCatalogToSheet(catalog) {
  if (!process.env.GSHEET_WEBHOOK_URL || !process.env.GSHEET_SECRET) return null;
  const rows = [];
  for (const p of catalog.products || []) {
    for (const it of p.items || []) {
      rows.push({
        product_id: p.slug,
        product_name: p.name,
        item_code: `${p.slug}__${it.id}`,
        name: `${it.variation && it.variation !== "Default" ? `[${it.variation}] ` : ""}${it.name}`,
        amount: Number(it.price ?? it.unitPrice ?? 0),
        kind: "topup",
      });
    }
  }
  const up = await callSheetBridge("catalog", {
    items: rows,
    saldo_topup: catalog.riercoins !== null && catalog.riercoins !== undefined ? String(catalog.riercoins) : undefined,
  });
  return up.rows ?? rows.length;
}

/**
 * Klasifikasikan response dari GET /api/orders/status?publicId=...
 * Contoh: { paymentStatus: "paid", itemStatuses: ["pending"|"delivered"|"failed"|"canceled"|"void"], refundedAmount: 0 }
 * Mengembalikan { status: "PROCESSING"|"SUCCESS"|"FAILED", final: boolean, reason: string }
 */
function classifyDeliveryStatus(st) {
  if (!st || typeof st !== "object") {
    return { status: "PROCESSING", final: false, reason: "" };
  }
  const payStatus = String(st.paymentStatus || "").toLowerCase();
  const refunded = Number(st.refundedAmount || 0);
  const items = Array.isArray(st.itemStatuses)
    ? st.itemStatuses.map((s) => String(s || "").toLowerCase())
    : [];

  if (refunded > 0) {
    return {
      status: "FAILED",
      final: true,
      reason: `Order di-refund ke RierCoins (+${refunded} RC)`,
    };
  }
  if (["failed", "canceled", "cancelled", "expired"].includes(payStatus)) {
    return {
      status: "FAILED",
      final: true,
      reason: `Pembayaran ${payStatus}`,
    };
  }
  if (items.length > 0 && items.every((s) => s === "delivered" || s === "completed" || s === "success")) {
    return { status: "SUCCESS", final: true, reason: "" };
  }
  const badItem = items.find((s) => ["failed", "canceled", "cancelled", "void", "refunded"].includes(s));
  if (badItem) {
    return {
      status: "FAILED",
      final: true,
      reason: `Status item di RierBux: ${badItem}`,
    };
  }
  return { status: "PROCESSING", final: false, reason: "" };
}

/** Kirim hasil transaksi ke tab "Orders" Google Sheet v3 + optional outbound callback */
async function reportResultToSheet({ ref, status, order, endingBalance, error }) {
  const payload = {
    ref: ref || "",
    status: status || "SUCCESS",
    t_id: order?.publicId || "",
    trx_id: order?.publicId || "",
    product: order?.product || "",
    item: order?.itemName ? `${order.itemName}${order.quantity > 1 ? ` x${order.quantity}` : ""}` : "",
    player_id: order?.roblox?.username || order?.placeId || "",
    amount: order?.expectedTotal !== undefined && order?.expectedTotal !== "" ? String(order.expectedTotal) : "",
    ending_balance: endingBalance !== undefined && endingBalance !== null ? String(endingBalance) : "",
    order_url: order?.orderUrl || "",
    error: error || "",
  };

  let sheetRes = null;
  if (process.env.GSHEET_WEBHOOK_URL && process.env.GSHEET_SECRET) {
    try {
      sheetRes = await callSheetBridge("result", payload);
    } catch (err) {
      console.error(`⚠️  [GSHEET RESULT] Gagal kirim result ref=${ref}: ${err.message}`);
    }
  }
  await sendOutboundWebhook({
    event: payload.status === "PROCESSING" ? "order.processing" : "order.result",
    ...payload,
  });
  return sheetRes;
}

/** Jalankan 24/7 Queue Worker + Web Dashboard Console (persis kayak `node idv.js worker`!) */
async function runWorker(bot, { createDashboardServer, syncCatalog, fmtWIB }) {
  const pollMs = Math.max(2000, parseInt(process.env.POLL_INTERVAL_MS || "5000", 10) || 5000);
  const deliveryPollMs = Math.max(5000, parseInt(process.env.DELIVERY_POLL_MS || "15000", 10) || 15000);
  const port = parseInt(process.env.HEALTH_PORT || process.env.PORT || "3030", 10) || 3030;
  const host = process.env.DASHBOARD_HOST || "0.0.0.0";
  const secret = (process.env.DASHBOARD_SECRET || process.env.GSHEET_SECRET || "").trim();
  const hasSheet = Boolean(process.env.GSHEET_WEBHOOK_URL && process.env.GSHEET_SECRET);

  const workerState = {
    running: true,
    busy: false,
    processed: 0,
    processing: 0,
    failed: 0,
    lastPollAt: null,
    lastSaldo: null,
    lastStockStr: null,
    catalogRows: 0,
    lastCatalogSyncAt: 0,
    lastDeliveryPollAt: 0,
  };

  // Start Web Dashboard + Direct Webhook HTTP server
  const dash = createDashboardServer(bot, { port, host, secret, workerState, parseOrderSpec, reportResultToSheet });
  await dash.start();

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("  ⚡ RIERBUX.COM 24/7 WORKER + WEB CONSOLE");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  🌐 Dashboard    : http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
  console.log(`  🔗 Direct Hook  : POST http://${host === "0.0.0.0" ? "localhost" : host}:${port}/webhook/order`);
  console.log(`  📊 Google Sheet : ${hasSheet ? "AKTIF (poll tiap " + pollMs / 1000 + "d)" : "Belum diset (isi GSHEET_WEBHOOK_URL & GSHEET_SECRET di .env)"}`);
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const shutdown = (sig) => {
    console.log(`\n🛑 Menerima ${sig}, berhenti dengan aman...`);
    workerState.running = false;
    dash.server.close();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  if (!hasSheet) {
    console.log("ℹ️  Mode Dashboard + Direct Webhook aktif (Google Sheet polling standby sampai .env diisi).\n");
    return;
  }

  // Initial catalog sync ke Google Sheet jika tersedia (ambil semua 165+ game + PS + Limiteds!)
  try {
    const cat = await syncCatalog(bot, { fetchAllDetails: true });
    if (cat.total_items > 0) {
      workerState.catalogRows = (await uploadCatalogToSheet(cat)) || 0;
      workerState.lastCatalogSyncAt = Date.now();
      console.log(`📦 Katalog awal diunggah ke Google Sheet (${workerState.catalogRows} item).`);
    }
  } catch (err) {
    console.log(`⚠️  Sync katalog awal dilewati: ${err.message}`);
  }

  console.log("⏳ Menunggu antrean PENDING dari Google Sheet...\n");

  while (workerState.running) {
    try {
      // Refresh saldo & stok berkala
      try {
        const [bal, st] = await Promise.all([
          bot.getBalance().catch(() => null),
          bot.getStock().catch(() => null),
        ]);
        if (bal && bal.riercoins !== null && bal.riercoins !== undefined) {
          workerState.lastSaldo = String(bal.riercoins);
        }
        if (st?.manual) {
          workerState.lastStockStr = `manual=${st.manual.stock}`;
        }
      } catch {}

      // Auto-sync katalog tiap 30 menit
      if (Date.now() - workerState.lastCatalogSyncAt > 30 * 60_000) {
        try {
          const cat = await syncCatalog(bot, { fetchAllDetails: true });
          if (cat.total_items > 0) {
            workerState.catalogRows = (await uploadCatalogToSheet(cat)) || 0;
          }
          workerState.lastCatalogSyncAt = Date.now();
        } catch {}
      }

      workerState.lastPollAt = fmtWIB();
      const pendingRes = await callSheetBridge("pending", {
        ...(workerState.lastSaldo ? { saldo: workerState.lastSaldo } : {}),
        ...(workerState.lastStockStr ? { stock_summary: workerState.lastStockStr } : {}),
      });
      const orders = Array.isArray(pendingRes.data) ? pendingRes.data : [];

      for (const order of orders) {
        if (!workerState.running) break;
        if (!order.ref) continue;

        const claimRes = await callSheetBridge("claim", { ref: order.ref });
        if (!claimRes.claimed) {
          console.log(`⏭️  Skip ref=${order.ref} (sudah diklaim, status=${claimRes.status})`);
          continue;
        }

        workerState.busy = true;
        console.log(`\n⚡ [ORDER] ref=${order.ref} | ${order.product_id}/${order.item_code} | target=${order.user_id}`);
        try {
          const spec = parseOrderSpec(order);
          const result = await bot.buyProduct(spec);
          let endingBal = null;
          try {
            const bAfter = await bot.getBalance();
            endingBal = bAfter.riercoins;
            if (endingBal !== null) workerState.lastSaldo = String(endingBal);
          } catch {}

          let initialStatus = "PROCESSING";
          let initialReason = "";
          try {
            const st = await bot.getOrderStatus(result.order.publicId);
            const classified = classifyDeliveryStatus(st);
            initialStatus = classified.status;
            initialReason = classified.reason;
          } catch {}

          if (initialStatus === "SUCCESS") {
            workerState.processed += 1;
            await reportResultToSheet({
              ref: order.ref,
              status: "SUCCESS",
              order: result.order,
              endingBalance: endingBal,
            });
            console.log(`✅ [SUCCESS] ref=${order.ref} | OrderID=#${result.order.publicId} | Sisa Saldo=${endingBal ?? "-"} RC`);
          } else if (initialStatus === "FAILED") {
            workerState.failed += 1;
            await reportResultToSheet({
              ref: order.ref,
              status: "FAILED",
              order: result.order,
              endingBalance: endingBal,
              error: initialReason || "Order gagal diproses di RierBux",
            });
            console.error(`❌ [FAILED] ref=${order.ref} | OrderID=#${result.order.publicId} → ${initialReason}`);
          } else {
            await reportResultToSheet({
              ref: order.ref,
              status: "PROCESSING",
              order: result.order,
              endingBalance: endingBal,
            });
            console.log(`⏳ [PROCESSING] ref=${order.ref} | OrderID=#${result.order.publicId} (paid, menunggu delivered di RierBux) | Sisa Saldo=${endingBal ?? "-"} RC`);
          }
        } catch (err) {
          workerState.failed += 1;
          const cleanErr = String(err.message || err).replace(/\s+/g, " ").slice(0, 300);
          console.error(`❌ [FAILED] ref=${order.ref} → ${cleanErr}`);
          await reportResultToSheet({
            ref: order.ref,
            status: "FAILED",
            order: {
              product: order.product || order.product_id,
              itemName: order.item || order.item_code,
              roblox: { username: order.user_id || "" },
            },
            error: cleanErr,
          });
        } finally {
          workerState.busy = false;
        }
      }

      // Poll status delivery untuk semua order yang masih PROCESSING di Google Sheet (bertahan meski container restart!)
      if (workerState.running && Date.now() - workerState.lastDeliveryPollAt >= deliveryPollMs) {
        workerState.lastDeliveryPollAt = Date.now();
        try {
          const procRes = await callSheetBridge("processing");
          const procRows = Array.isArray(procRes.data) ? procRes.data : [];
          workerState.processing = procRows.length;

          for (const row of procRows) {
            if (!workerState.running) break;
            if (!row.ref || !row.t_id) continue;
            try {
              const st = await bot.getOrderStatus(row.t_id);
              const classified = classifyDeliveryStatus(st);
              if (!classified.final) continue;

              let endingBal = null;
              try {
                const bNow = await bot.getBalance();
                endingBal = bNow.riercoins;
                if (endingBal !== null) workerState.lastSaldo = String(endingBal);
              } catch {}

              if (classified.status === "SUCCESS") {
                workerState.processed += 1;
                await reportResultToSheet({
                  ref: row.ref,
                  status: "SUCCESS",
                  order: {
                    publicId: row.t_id,
                    product: row.product,
                    itemName: row.item,
                    roblox: { username: row.player_id },
                    expectedTotal: row.amount || undefined,
                    orderUrl: row.order_url,
                  },
                  endingBalance: endingBal,
                });
                console.log(`✅ [DELIVERED] ref=${row.ref} | OrderID=#${row.t_id} → SUCCESS`);
              } else {
                let failReason = classified.reason || "Order gagal dikirim di RierBux";
                try {
                  const det = await bot.getOrderDetail(row.t_id);
                  const itemErr = (det?.items || []).map((i) => i.failureReason).filter(Boolean).join("; ");
                  if (itemErr) failReason = `${failReason} — ${itemErr}`.slice(0, 300);
                } catch {}
                workerState.failed += 1;
                await reportResultToSheet({
                  ref: row.ref,
                  status: "FAILED",
                  order: {
                    publicId: row.t_id,
                    product: row.product,
                    itemName: row.item,
                    roblox: { username: row.player_id },
                    expectedTotal: row.amount || undefined,
                    orderUrl: row.order_url,
                  },
                  endingBalance: endingBal,
                  error: failReason,
                });
                console.error(`❌ [DELIVERY FAILED] ref=${row.ref} | OrderID=#${row.t_id} → ${failReason}`);
              }
            } catch (err) {
              console.error(`⚠️  [DELIVERY CHECK] ref=${row.ref} (#${row.t_id}): ${err.message}`);
            }
          }
        } catch (err) {
          // Jika Apps Script belum di-update dengan action "processing", tampilkan warning tanpa mengganggu antrean
          if (!String(err.message || "").includes("action tidak dikenal")) {
            console.error(`⚠️  [DELIVERY POLL ERROR] ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.error(`⚠️  [POLL ERROR] ${err.message}`);
    }

    if (workerState.running) await new Promise((r) => setTimeout(r, pollMs));
  }
}

module.exports = {
  callSheetBridge,
  sendOutboundWebhook,
  parseOrderSpec,
  classifyDeliveryStatus,
  uploadCatalogToSheet,
  reportResultToSheet,
  runWorker,
};
