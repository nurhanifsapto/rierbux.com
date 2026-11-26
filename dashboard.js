/**
 * RIERBUX.COM Web Console / Dashboard (Dark UI bergaya IDV Worker Console)
 *
 * Fitur lengkap lewat browser:
 *  - Topbar + Jam WIB Live + 5 Kartu Status (Saldo RC, Stok Manual, Stok 5D/Transfer/Instan, Stok PS, Katalog/API v1)
 *  - Tab 1: Order / Beli Produk (165+ Game Pass/Item, Robux 5 Hari, Robux Transfer, Robux Instan, Private Server)
 *           + Cek Username Roblox (Avatar & User ID) + Preview Dry-Run + Bayar RierCoins / Duitku + Keranjang Multi-Item
 *  - Tab 2: Riwayat Pesanan & Live Log (Filter status, Detail, Bayar Unpaid, Cancel, Retry Failed, Transaksi Lokal)
 *  - Tab 3: Saldo RierCoins, Mutasi & Top Up Duitku
 *  - Tab 4: Login Email/Password, Paste Cookie/cURL, Official API Key (rb_...), Sync Katalog & Refresh Action Hash
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { buildDashboardHtml } = require("./dashboard-ui.js");

function createDashboardServer(bot, { port = 3030, host = "127.0.0.1", secret = "", workerState = null, parseOrderSpec = null, reportResultToSheet = null } = {}) {
  const logs = [];
  const pushLog = (level, msg) => {
    const entry = {
      time: new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()),
      level,
      msg: String(msg),
    };
    logs.unshift(entry);
    if (logs.length > 200) logs.length = 200;
    console.log(`[${entry.time} WIB] ${msg}`);
  };

  // Cache katalog & payment methods di memori agar UI super responsif
  const cache = {
    products: null,
    productsAt: 0,
    stock: null,
    stockAt: 0,
    paymentMethods: null,
  };

  const readJsonBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
        if (raw.length > 1_000_000) {
          req.destroy();
          reject(new Error("Payload terlalu besar"));
        }
      });
      req.on("end", () => {
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("JSON tidak valid"));
        }
      });
      req.on("error", reject);
    });

  const CORS_HEADERS = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-api-key",
  };

  const sendJson = (res, status, obj) => {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS });
    res.end(JSON.stringify(obj));
  };

  const checkAuth = (req, res, bodySecret = "") => {
    if (!secret) return true;
    const provided = req.headers["x-api-key"] || bodySecret || "";
    if (provided === secret) return true;
    sendJson(res, 401, { ok: false, error: "DASHBOARD_SECRET salah atau belum diisi." });
    return false;
  };

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://${host}:${port}`);
    const pathname = u.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    try {
      // Serve HTML Dashboard
      if (req.method === "GET" && pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(buildDashboardHtml({ requireSecret: Boolean(secret) }));
        return;
      }

      // Serve Logo RierBux SVG
      if (req.method === "GET" && pathname === "/assets/logo.svg") {
        const logoPath = path.resolve(__dirname, "assets", "logo-rierbux.svg");
        if (fs.existsSync(logoPath)) {
          res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" });
          res.end(fs.readFileSync(logoPath));
          return;
        }
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      if (req.method === "GET" && pathname === "/health") {
        return sendJson(res, 200, { ok: true, service: "rierbux-dashboard", uptimeSec: Math.floor(process.uptime()) });
      }

      // ── GET /api/status ─────────────────────────────────────────────────
      if (req.method === "GET" && pathname === "/api/status") {
        if (!checkAuth(req, res)) return;
        const fresh = u.searchParams.get("fresh") === "1";

        let stock = cache.stock;
        if (fresh || !stock || Date.now() - cache.stockAt > 15_000) {
          try {
            stock = await bot.getStock();
            cache.stock = stock;
            cache.stockAt = Date.now();
          } catch {}
        }

        let session = null;
        let loggedIn = false;
        if (bot.jar.size() > 0) {
          try {
            session = await bot.getSession();
            loggedIn = Boolean(session?.user);
            if (loggedIn) {
              bot.saveSession({ user: session.user, sessionExpiresAt: session.session?.expiresAt || null });
            }
          } catch {}
        }

        let balance = null;
        let balanceSource = null;
        if (loggedIn || bot.apiKey) {
          try {
            const b = await bot.getBalance();
            balance = b.riercoins;
            balanceSource = b.source;
            if (b.paymentMethods?.length) cache.paymentMethods = b.paymentMethods;
          } catch {}
        }

        let cartCount = 0;
        if (loggedIn) {
          try {
            cartCount = await bot.getCartCount();
          } catch {}
        }

        return sendJson(res, 200, {
          ok: true,
          serverEpochMs: Date.now(),
          loggedIn,
          user: session?.user || bot.session?.user || null,
          sessionExpiresAt: session?.session?.expiresAt || bot.session?.sessionExpiresAt || null,
          hasApiKey: Boolean(bot.apiKey),
          apiKeyPreview: bot.apiKey ? bot.apiKey.slice(0, 10) + "..." : null,
          balance,
          balanceSource,
          cartCount,
          stock,
          productsCount: cache.products ? cache.products.length : 165,
          logs: logs.slice(0, 80),
        });
      }

      // ── Auth: Login Email, Paste Cookie, Logout ─────────────────────────
      if (req.method === "POST" && pathname === "/api/login") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        pushLog("info", `🔑 Login email: ${body.email || bot.email || "(env)"}...`);
        const saved = await bot.loginWithEmail(body.email || bot.email, body.password || bot.password);
        pushLog("ok", `✅ Login berhasil: ${saved.user?.name || saved.user?.email}`);
        return sendJson(res, 200, { ok: true, user: saved.user, sessionExpiresAt: saved.sessionExpiresAt });
      }

      if (req.method === "POST" && pathname === "/api/login-cookie") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        pushLog("info", "📋 Memverifikasi cookie / cURL yang di-paste...");
        const saved = await bot.loginWithCookie(body.cookies);
        pushLog("ok", `✅ Cookie valid! User: ${saved.user?.name || saved.user?.email}`);
        return sendJson(res, 200, { ok: true, user: saved.user, sessionExpiresAt: saved.sessionExpiresAt });
      }

      if (req.method === "POST" && pathname === "/api/logout") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        await bot.logout();
        pushLog("warn", "🚪 Logout berhasil & .session dihapus.");
        return sendJson(res, 200, { ok: true });
      }

      // ── Official API Key & Action Refresh ───────────────────────────────
      if (req.method === "POST" && pathname === "/api/apikey/create") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const out = await bot.createApiKey(body.name || "RierBux Dashboard");
        pushLog("ok", `🔑 Official API Key dibuat & disimpan!`);
        return sendJson(res, 200, { ok: true, data: out });
      }

      if (req.method === "POST" && pathname === "/api/apikey/set") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const k = String(body.apiKey || "").trim();
        if (!k.startsWith("rb_")) throw new Error("API Key harus diawali 'rb_'.");
        bot.saveSession({ apiKey: k });
        pushLog("ok", `🔑 Official API Key (${k.slice(0, 10)}...) disimpan!`);
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === "POST" && pathname === "/api/refresh-actions") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        pushLog("info", "🔄 Scanning Next.js JS chunks untuk refresh Action IDs...");
        const out = await bot.refreshActionIds();
        pushLog("ok", `✅ Refresh Actions selesai (${out.foundCount} action dari ${out.scannedChunks} chunks).`);
        return sendJson(res, 200, { ok: true, ...out });
      }

      // ── Catalog: Products List, Items, Private Server Search/Detail ─────
      if (req.method === "GET" && pathname === "/api/products") {
        if (!checkAuth(req, res)) return;
        const fresh = u.searchParams.get("fresh") === "1";
        if (fresh || !cache.products || Date.now() - cache.productsAt > 5 * 60_000) {
          cache.products = await bot.getStoreProductsList();
          cache.productsAt = Date.now();
        }
        const q = String(u.searchParams.get("q") || "").toLowerCase().trim();
        const filtered = q
          ? cache.products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
          : cache.products;
        return sendJson(res, 200, { ok: true, total: cache.products.length, products: filtered });
      }

      if (req.method === "GET" && pathname === "/api/items") {
        if (!checkAuth(req, res)) return;
        const slug = u.searchParams.get("slug");
        if (!slug) throw new Error("Parameter slug wajib diisi.");
        const detail = await bot.getProductDetail(slug);
        return sendJson(res, 200, { ok: true, detail });
      }

      if (req.method === "GET" && pathname === "/api/apikeys") {
        if (!checkAuth(req, res)) return;
        const keys = await bot.listApiKeys();
        return sendJson(res, 200, { ok: true, keys });
      }

      if (req.method === "POST" && pathname === "/api/apikey/revoke") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        await bot.revokeApiKey(body.keyId);
        pushLog("warn", `🔑 Official API Key #${body.keyId} dicabut.`);
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === "GET" && pathname === "/api/private-servers") {
        if (!checkAuth(req, res)) return;
        const fresh = u.searchParams.get("fresh") === "1";
        if (fresh || !cache.privateServers || Date.now() - (cache.psAt || 0) > 5 * 60_000) {
          cache.privateServers = await bot.getPopularPrivateServers();
          cache.psAt = Date.now();
        }
        const q = String(u.searchParams.get("q") || "").toLowerCase().trim();
        const games = q
          ? cache.privateServers.filter((g) => g.name.toLowerCase().includes(q) || g.rootPlaceId.includes(q))
          : cache.privateServers;
        return sendJson(res, 200, { ok: true, total: cache.privateServers.length, games });
      }

      if (req.method === "GET" && pathname === "/api/limiteds") {
        if (!checkAuth(req, res)) return;
        const fresh = u.searchParams.get("fresh") === "1";
        if (fresh || !cache.limiteds || Date.now() - (cache.limAt || 0) > 5 * 60_000) {
          cache.limiteds = await bot.getLimitedsList();
          cache.limAt = Date.now();
        }
        return sendJson(res, 200, { ok: true, ...cache.limiteds });
      }

      if (req.method === "GET" && pathname === "/api/limited-detail") {
        if (!checkAuth(req, res)) return;
        const slug = u.searchParams.get("slug");
        const detail = await bot.getLimitedDetail(slug);
        return sendJson(res, 200, { ok: true, detail });
      }

      if (req.method === "GET" && pathname === "/api/roblox/inventory") {
        if (!checkAuth(req, res)) return;
        const userId = u.searchParams.get("userId");
        const data = await bot.getRobloxInventory(userId);
        return sendJson(res, 200, { ok: true, data });
      }

      if (req.method === "POST" && pathname === "/api/limited/buy") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const chk = await bot.checkRobloxUsername(body.robloxUsername);
        if (!chk.valid || !chk.user) throw new Error(`Username Roblox '${body.robloxUsername}' tidak ditemukan.`);

        if (body.addToCart) {
          const out = await bot.addLimitedToCart({
            slug: body.slug,
            robloxUsername: chk.user.username,
            robloxUserId: chk.user.id,
            robloxDisplayName: chk.user.displayName,
            smallAssetId: body.smallAssetId,
            smallUaid: body.smallUaid,
            smallName: body.smallName,
            isPreorder: Boolean(body.isPreorder),
          });
          pushLog("ok", `🛍️ Limited '${body.slug}' masuk keranjang!`);
          return sendJson(res, 200, { ok: true, data: out });
        }

        const created = await bot.checkoutLimited({
          slug: body.slug,
          robloxUsername: chk.user.username,
          robloxUserId: chk.user.id,
          robloxDisplayName: chk.user.displayName,
          smallAssetId: body.smallAssetId,
          smallUaid: body.smallUaid,
          smallName: body.smallName,
          isPreorder: Boolean(body.isPreorder),
          expectedTotal: Number(body.expectedTotal),
        });
        let paymentUrl = null;
        if (created.publicId && (body.payMethod || "balance") === "balance") {
          await bot.payWithBalance(created.publicId, body.promoCode);
        } else if (created.publicId && body.payMethod === "duitku") {
          const p = await bot.createDuitkuPayment(created.publicId, body.paymentMethodId, body.promoCode);
          paymentUrl = p.paymentUrl;
        }
        pushLog("ok", `🎉 Order Limited #${created.publicId} berhasil!`);
        return sendJson(res, 200, {
          ok: true,
          order: {
            publicId: created.publicId,
            paymentStatus: body.payMethod === "balance" ? "paid" : "unpaid",
            orderUrl: `${bot.baseUrl}/orders/${created.publicId}`,
            paymentUrl,
          },
        });
      }

      if (req.method === "GET" && pathname === "/api/roblox/check-gamepass") {
        if (!checkAuth(req, res)) return;
        const qty = Number(u.searchParams.get("qty") || 1);
        const expectedPrice = Math.ceil(qty / 0.7);
        const gpId = u.searchParams.get("gamePassId");
        let data;
        if (gpId) {
          data = await bot.checkGamePassById({ gamePassId: Number(gpId), expectedPrice });
        } else {
          data = await bot.checkGamePass({
            robloxUserId: Number(u.searchParams.get("userId")),
            robloxUsername: u.searchParams.get("username"),
            expectedPrice,
          });
        }
        return sendJson(res, 200, { ok: true, expectedPrice, data });
      }

      if (req.method === "GET" && pathname === "/api/games/search") {
        if (!checkAuth(req, res)) return;
        const q = u.searchParams.get("q") || "";
        const games = await bot.searchPrivateServerGames(q);
        return sendJson(res, 200, { ok: true, games });
      }

      if (req.method === "GET" && pathname === "/api/private-server") {
        if (!checkAuth(req, res)) return;
        const placeId = u.searchParams.get("placeId");
        const ps = await bot.getPrivateServerDetail(placeId);
        return sendJson(res, 200, { ok: true, ps });
      }

      if (req.method === "POST" && pathname === "/api/sync") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const { syncCatalog } = require("./rierbux.js");
        pushLog("info", "🔄 Menyinkronkan katalog RierBux ke products.json...");
        const cat = await syncCatalog(bot, { fetchAllDetails: Boolean(body.all) });
        cache.products = cat.products;
        cache.productsAt = Date.now();
        pushLog("ok", `✅ Sync selesai: ${cat.total_products} produk, ${cat.total_items} item (${cat.source}).`);
        return sendJson(res, 200, { ok: true, total_products: cat.total_products, total_items: cat.total_items, source: cat.source });
      }

      // ── Roblox Lookup & Game Pass Verification ──────────────────────────
      if (req.method === "GET" && pathname === "/api/roblox/check") {
        if (!checkAuth(req, res)) return;
        const username = u.searchParams.get("username");
        const data = await bot.checkRobloxUsername(username);
        return sendJson(res, 200, { ok: true, data });
      }

      // ── Payment Methods, Coins, Topup & Mutasi (Paginated) ─────────────
      if (req.method === "GET" && pathname === "/api/coins") {
        if (!checkAuth(req, res)) return;
        const topupPage = parseInt(u.searchParams.get("topupPage") || "1", 10) || 1;
        const txPage = parseInt(u.searchParams.get("txPage") || "1", 10) || 1;
        const txLimit = parseInt(u.searchParams.get("txLimit") || "20", 10) || 20;
        const txType = u.searchParams.get("txType") || undefined;

        const page = await bot.getCoinsPageData({ topupPage });
        cache.paymentMethods = page.paymentMethods;
        let tx = { transactions: [], pagination: { page: 1, limit: txLimit, totalItems: 0, totalPages: 1 }, source: "none" };
        try {
          tx = await bot.getCoinTransactions({ page: txPage, limit: txLimit, type: txType });
        } catch {}
        return sendJson(res, 200, {
          ok: true,
          riercoins: page.riercoins,
          paymentMethods: page.paymentMethods,
          topups: page.topups,
          topupPagination: page.topupPagination,
          transactions: tx.transactions,
          txPagination: tx.pagination,
          txSource: tx.source,
        });
      }

      if (req.method === "GET" && pathname === "/api/coins/csv") {
        if (!checkAuth(req, res)) return;
        const tx = await bot.getCoinTransactions({ page: 1, limit: 100 });
        const csv = tx.csv || [
          "Tanggal,Tipe,Jumlah,Deskripsi,ID Pesanan",
          ...(tx.transactions || []).map((t) => `"${t.createdAt}","${t.type}",${t.amount},"${String(t.description || "").replace(/"/g, '""')}","${t.orderId || ""}"`),
        ].join("\n");
        res.writeHead(200, {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="riercoins-mutasi.csv"`,
        });
        res.end(csv);
        return;
      }

      if (req.method === "POST" && pathname === "/api/coins/topup") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        pushLog("ord", `💰 Membuat invoice topup RierCoins Rp ${body.amount} (PM #${body.paymentMethodId})...`);
        const out = await bot.topupCoins({ amount: body.amount, paymentMethodId: body.paymentMethodId });
        pushLog("ok", `✅ Invoice Top Up dibuat! ${out.paymentUrl || ""}`);
        return sendJson(res, 200, { ok: true, data: out });
      }

      // ── Buy / Checkout (Dry-Run or Live) ────────────────────────────────
      if (req.method === "POST" && pathname === "/api/buy") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const isDry = body.dryRun !== false;
        pushLog(isDry ? "info" : "ord", `🛒 ${isDry ? "Preview (Dry-Run)" : "EKSEKUSI ORDER"}: ${body.slug || body.type} item=#${body.itemId} x${body.quantity || 1} (${body.robloxUsername || body.placeId || "-"})`);
        const out = await bot.buyProduct({
          type: body.type || "product",
          slug: body.slug,
          placeId: body.placeId,
          itemId: body.itemId ? Number(body.itemId) : undefined,
          quantity: Number(body.quantity || 1),
          robloxUsername: body.robloxUsername,
          robloxPassword: body.robloxPassword,
          gamePassId: body.gamePassId ? Number(body.gamePassId) : undefined,
          payMethod: body.payMethod || "balance",
          paymentMethodId: body.paymentMethodId ? Number(body.paymentMethodId) : undefined,
          promoCode: body.promoCode || undefined,
          dryRun: isDry,
        });
        if (!isDry) {
          pushLog("ok", `🎉 Order #${out.order.publicId} selesai! Status: ${out.order.paymentStatus}`);
        }
        return sendJson(res, 200, { ok: true, ...out });
      }

      // ── Cart ────────────────────────────────────────────────────────────
      if (req.method === "GET" && pathname === "/api/cart") {
        if (!checkAuth(req, res)) return;
        const cart = await bot.getCart();
        return sendJson(res, 200, { ok: true, cart });
      }

      if (req.method === "POST" && pathname === "/api/cart/add") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        let orderInputs = body.orderInputs || {};
        if (body.robloxUsername && !orderInputs.robloxUserId) {
          const chk = await bot.checkRobloxUsername(body.robloxUsername);
          if (!chk.valid) throw new Error(`Username Roblox '${body.robloxUsername}' tidak ditemukan.`);
          orderInputs = {
            robloxUsername: chk.user.username,
            robloxUserId: chk.user.id,
            robloxDisplayName: chk.user.displayName,
            ...(body.gamePassId ? { gamePassId: Number(body.gamePassId) } : {}),
          };
        }
        const out = await bot.addToCart({
          pagePath: body.pagePath || (body.placeId ? `/private-servers/${body.placeId}` : `/products/${body.slug || "fish-it"}`),
          productItemId: Number(body.itemId),
          quantity: Number(body.quantity || 1),
          orderInputs,
        });
        pushLog("ok", `🛍️ Ditambahkan ke keranjang: item=#${body.itemId} x${body.quantity || 1}`);
        return sendJson(res, 200, { ok: true, data: out });
      }

      if (req.method === "POST" && pathname === "/api/cart/remove") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        if (Array.isArray(body.cartItemIds)) {
          await bot.removeMultipleFromCart(body.cartItemIds);
          pushLog("info", `🗑️ ${body.cartItemIds.length} item dihapus dari keranjang.`);
        } else {
          await bot.removeFromCart(Number(body.cartItemId));
          pushLog("info", `🗑️ Cart item #${body.cartItemId} dihapus.`);
        }
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === "POST" && pathname === "/api/cart/checkout") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const cart = await bot.getCart();
        if (!cart.items.length) throw new Error("Keranjang kosong.");
        const ids = cart.items.map((it) => it.cartItemId ?? it.id);
        const total = cart.items.reduce((s, it) => s + Number(it.totalPrice ?? (it.unitPrice || 0) * (it.quantity || 1)), 0);
        pushLog("ord", `🛍️ Checkout keranjang (${ids.length} item, total Rp ${total})...`);
        const out = await bot.checkoutCart({ selectedItems: ids, expectedTotal: total });
        let payRes = null;
        if (out.publicId && (body.payMethod || "balance") === "balance") {
          payRes = await bot.payWithBalance(out.publicId, body.promoCode);
          pushLog("ok", `✅ Order Cart #${out.publicId} dibayar pakai RierCoins!`);
        } else if (out.publicId && body.payMethod === "duitku") {
          payRes = await bot.createDuitkuPayment(out.publicId, body.paymentMethodId, body.promoCode);
          pushLog("ok", `💳 Order Cart #${out.publicId} link Duitku dibuat!`);
        }
        return sendJson(res, 200, { ok: true, publicId: out.publicId, paymentUrl: payRes?.paymentUrl || null, orderUrl: `${bot.baseUrl}/orders/${out.publicId}` });
      }

      // ── Orders & Order Actions (Paginated + Detail + CSV + PS Controls) ──
      if (req.method === "GET" && pathname === "/api/orders") {
        if (!checkAuth(req, res)) return;
        const page = parseInt(u.searchParams.get("page") || "1", 10) || 1;
        const limit = parseInt(u.searchParams.get("limit") || "25", 10) || 25;
        const status = u.searchParams.get("status") || undefined;
        const itemStatus = u.searchParams.get("itemStatus") || undefined;
        const search = u.searchParams.get("search") || undefined;
        const sort = u.searchParams.get("sort") || "newest";
        const resOrd = await bot.getOrders({ page, limit, paymentStatus: status, itemStatus, search, sort });

        let localTx = [];
        const txPath = path.resolve(path.dirname(bot.sessionPath), "transactions.json");
        if (fs.existsSync(txPath)) {
          try {
            localTx = JSON.parse(fs.readFileSync(txPath, "utf-8")).slice(0, 30);
          } catch {}
        }
        return sendJson(res, 200, { ok: true, orders: resOrd.orders, pagination: resOrd.pagination, source: resOrd.source, localTx });
      }

      if (req.method === "GET" && pathname === "/api/orders/csv") {
        if (!checkAuth(req, res)) return;
        const resOrd = await bot.getOrders({ page: 1, limit: 100 });
        const csv = resOrd.csv || [
          "Order ID,Tanggal,Status Bayar,Total",
          ...(resOrd.orders || []).map((o) => `"${o.id}","${o.createdAt}","${o.paymentStatus}",${o.total}`),
        ].join("\n");
        res.writeHead(200, {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="rierbux-orders.csv"`,
        });
        res.end(csv);
        return;
      }

      if (req.method === "POST" && pathname === "/api/ps-action") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const { action, publicId, orderItemId, robloxUsername, robloxUserId } = body;
        if (action === "users") {
          return sendJson(res, 200, { ok: true, users: await bot.getPrivateServerUsers(orderItemId) });
        }
        if (action === "add_user") {
          const out = await bot.addPrivateServerUser(publicId, orderItemId, robloxUsername);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "remove_user") {
          const out = await bot.removePrivateServerUser(publicId, orderItemId, robloxUserId);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "regenerate") {
          const out = await bot.regeneratePrivateServerLink(publicId, orderItemId);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "shutdown") {
          const out = await bot.shutdownPrivateServer(publicId, orderItemId);
          return sendJson(res, 200, { ok: true, data: out });
        }
        throw new Error(`PS action tidak dikenal: ${action}`);
      }

      if (req.method === "GET" && pathname === "/api/order-detail") {
        if (!checkAuth(req, res)) return;
        const id = u.searchParams.get("id");
        const det = await bot.getOrderDetail(id);
        return sendJson(res, 200, { ok: true, ...det });
      }

      if (req.method === "POST" && pathname === "/api/order-action") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const { action, publicId, orderItemId, paymentMethodId, promoCode } = body;
        if (action === "pay_balance") {
          const out = await bot.payWithBalance(publicId, promoCode);
          pushLog("ok", `✅ Order #${publicId} dibayar pakai RierCoins!`);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "pay_duitku") {
          const out = await bot.createDuitkuPayment(publicId, paymentMethodId, promoCode);
          pushLog("ok", `💳 Link Duitku #${publicId}: ${out.paymentUrl}`);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "cancel") {
          const out = await bot.cancelUnpaidOrder(publicId);
          pushLog("warn", `❌ Order unpaid #${publicId} dibatalkan.`);
          return sendJson(res, 200, { ok: true, data: out });
        }
        if (action === "retry") {
          const out = await bot.retryFailedItem(publicId, orderItemId);
          pushLog("info", `🔁 Retry item #${orderItemId} di order #${publicId}.`);
          return sendJson(res, 200, { ok: true, data: out });
        }
        throw new Error(`Action tidak dikenal: ${action}`);
      }

      // ── Direct HTTP Webhook & Remote Admin (Kompatibel IDV / Dokploy) ───
      if (req.method === "POST" && pathname === "/webhook/order") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const wh = require("./webhook.js");
        const parser = parseOrderSpec || wh.parseOrderSpec;
        const reporter = reportResultToSheet || wh.reportResultToSheet;
        const spec = parser(body);
        if (body.dryRun === true) spec.dryRun = true;

        pushLog("ord", `🔗 [WEBHOOK ORDER] ref=${body.ref || "-"} | ${spec.slug || spec.type} item=${spec.itemId || "auto"} x${spec.quantity} (${spec.robloxUsername || spec.placeId || "-"})`);
        try {
          const result = await bot.buyProduct(spec);
          let endingBal = null;
          if (!result.dryRun) {
            try {
              const b = await bot.getBalance();
              endingBal = b.riercoins;
            } catch {}
            if (body.ref) {
              await reporter({ ref: body.ref, status: "SUCCESS", order: result.order, endingBalance: endingBal });
            }
            pushLog("ok", `✅ [WEBHOOK SUCCESS] ref=${body.ref || "-"} | #${result.order.publicId}`);
          }
          return sendJson(res, 200, { ok: true, ref: body.ref || null, ending_balance: endingBal, ...result });
        } catch (err) {
          pushLog("err", `❌ [WEBHOOK FAILED] ref=${body.ref || "-"} → ${err.message}`);
          if (body.ref && !spec.dryRun) {
            await reporter({
              ref: body.ref,
              status: "FAILED",
              order: { product: body.product_id || spec.slug || spec.type, itemName: body.item_code || "", roblox: { username: body.user_id || "" } },
              error: err.message,
            });
          }
          return sendJson(400, { ok: false, ref: body.ref || null, error: err.message });
        }
      }

      if (req.method === "POST" && pathname === "/session") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        if (!body.cookies) throw new Error("cookies wajib diisi");
        const saved = await bot.loginWithCookie(body.cookies);
        if (body.apiKey) bot.saveSession({ apiKey: body.apiKey });
        let balance = null;
        try {
          const b = await bot.getBalance();
          balance = b.riercoins;
        } catch {}
        pushLog("ok", `🔑 [EXTENSION/REMOTE] Session diperbarui (${saved.user?.email || "-"}${balance !== null ? ` · ${balance} RC` : ""})`);
        return sendJson(res, 200, { ok: true, user: saved.user, balance, sessionExpiresAt: saved.sessionExpiresAt });
      }

      if (req.method === "POST" && pathname === "/sync-catalog") {
        const body = await readJsonBody(req);
        if (!checkAuth(req, res, body.secret)) return;
        const { syncCatalog } = require("./rierbux.js");
        const { uploadCatalogToSheet } = require("./webhook.js");
        const cat = await syncCatalog(bot, { fetchAllDetails: Boolean(body.all) });
        const sheetRows = await uploadCatalogToSheet(cat).catch(() => null);
        pushLog("ok", `📦 [SYNC CATALOG] ${cat.total_products} produk, ${cat.total_items} item${sheetRows !== null ? ` → Sheet: ${sheetRows} baris` : ""}`);
        return sendJson(res, 200, { ok: true, total_products: cat.total_products, total_items: cat.total_items, sheet_rows: sheetRows });
      }

      if (req.method === "GET" && pathname === "/api/webhook/ping") {
        if (!checkAuth(req, res)) return;
        const { callSheetBridge } = require("./webhook.js");
        const ping = await callSheetBridge("ping");
        const meta = await callSheetBridge("meta").catch(() => null);
        return sendJson(res, 200, { ok: true, ping, meta });
      }

      sendJson(res, 404, { ok: false, error: "Endpoint tidak ditemukan" });
    } catch (err) {
      pushLog("err", `❌ [${pathname}] ${err.message}`);
      sendJson(res, 400, { ok: false, error: err.message });
    }
  });

  return {
    server,
    start: () =>
      new Promise((resolve) => {
        server.listen(port, host, () => {
          pushLog("ok", `🚀 RierBux Web Console aktif di http://${host}:${port}`);
          resolve({ host, port, url: `http://${host}:${port}` });
        });
      }),
  };
}


module.exports = { createDashboardServer };
