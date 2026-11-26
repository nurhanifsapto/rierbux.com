# RIERBUX.COM API Reference & Checkout Flow

Dokumentasi lengkap semua endpoint REST, Official API (`/api/v1`), dan Next.js Server Actions hasil inspeksi live `https://rierbux.com`.

## 1. Autentikasi (BetterAuth — `/api/auth/*`)

Semua endpoint web internal & Next.js Server Actions membutuhkan cookie session `__Secure-rierbux.session_token` (disimpan otomatis di `.session` setelah `node rierbux.js login`).

| Method | Endpoint | Payload | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/sign-in/email` | `{"email":"...","password":"...","rememberMe":true}` | Login email & password → `Set-Cookie: __Secure-rierbux.session_token` |
| `GET` | `/api/auth/get-session` | - | Cek sesi aktif → `{ session, user }` atau `null` |
| `POST` | `/api/auth/sign-out` | `{}` | Logout sesi resmi |

## 2. Official RierBux REST API v1 (`/api/v1/*`, Read-Only Beta)

- Docs: `https://rierbux.com/docs/api` | OpenAPI Spec: `GET /api/v1/openapi.json`
- Auth header: `Authorization: Bearer rb_xxxxxxxx` (maks 5 key per akun di `/settings/api`, bisa dibuat dari CLI: `node rierbux.js apikey create`)
- Rate limit: `120 req / 60s`

| Method | Endpoint | Query / Keterangan |
|---|---|---|
| `GET` | `/api/v1/products` | `page`, `limit` (max 100), `deliveryMethod`, `product` (slug), `search`, `available` |
| `GET` | `/api/v1/riercoins` | Cek saldo RierCoins (`1 RC = Rp 1`) → `{ data: { riercoins } }` |
| `GET` | `/api/v1/riercoins/transactions` | `page`, `limit`, `type`, `createdFrom`, `createdTo` |
| `GET` | `/api/v1/orders` | `page`, `limit`, `paymentStatus`, `itemStatus`, `deliveryMethod`, `search`, `sort` |
| `GET` | `/api/v1/orders/{publicId}` | Detail order `RB-...` lengkap dengan status pengiriman per item |

## 3. Internal Web REST API (`/api/*`)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/products/robux-stock` | Stok real-time semua handler (`robux-manual`, `robux-5d`, `robux-instant`, `robux-transfer`, `private-server`) |
| `GET` | `/api/roblox/check-username?robloxUsername=<u_name>&requireRobloxPlus=false` | Validasi username Roblox → `{ valid, user: { id, username, displayName, avatar }, isRobloxPlus }` |
| `GET` | `/api/roblox/games/search?q=<query>` | Cari game Roblox untuk Private Server (`universeId`, `rootPlaceId`, `name`, `playerCount`) |
| `GET` | `/api/cart/count` | Jumlah item di keranjang (auth cookie) |
| `GET` | `/api/store/notice` | Pengumuman/status toko |
| `GET` | `/api/reviews?productId=<id>&page=1&limit=6` | Review produk |
| `GET` | `/api/orders/status` / `/api/orders/stream` | Polling & SSE status pesanan |
| `GET` | `/api/orders/private-server-users?orderItemId=<id>` | Daftar user whitelist Private Server |

## 4. Next.js Server Actions (Cart, Checkout, Payment, Topup, API Key)

Wire format: `POST https://rierbux.com/<page-path>` dengan header:
- `Accept: text/x-component`
- `Content-Type: text/plain;charset=UTF-8`
- `Next-Action: <action-id>`
- `Origin: https://rierbux.com`
- `Cookie: __Secure-rierbux.session_token=...`
- Body: JSON array `[{ ...input }]`

> **Alur Checkout 2 Tahap**:
> 1. Buat order unpaid (`checkoutProductAction` / `checkoutCartAction` / `checkoutTopupAction` / `checkoutTransferAction` / `checkoutInstantAction`) → server redirect ke `/orders/RB-...` via header `x-action-redirect`.
> 2. Bayar order di `/orders/RB-...` via `payWithBalanceAction` (saldo RierCoins, fee Rp 0) **atau** `createPaymentAction` (Duitku QRIS/VA/E-Wallet → redirect ke `passport.duitku.com`).

> **Auto-Refresh Action ID**: CLI otomatis mendeteksi jika hash `Next-Action` berubah setelah RierBux redeploy, men-scan ulang `/_next/static/chunks/*.js`, dan menyimpannya ke `.action-cache.json`.

## 5. Penggunaan Programmatic (`rierbux.js`)

```js
const { RierBuxBot } = require("./rierbux.js");

async function main() {
  const bot = new RierBuxBot();

  // 1. Cek saldo & stok (auto-login dari .env jika .session kosong/expired)
  const bal = await bot.getBalance();
  const stock = await bot.getStock();
  console.log("Saldo:", bal.riercoins, "RC | Manual stock:", stock.manual.stock);

  // 2. Validasi username Roblox
  const rbx = await bot.checkRobloxUsername("a1dam_9999");
  console.log("Roblox:", rbx.user.username, rbx.user.id);

  // 3. Checkout produk (default dryRun: true agar aman)
  const res = await bot.buyProduct({
    slug: "fish-it",
    itemId: 7710,
    quantity: 1,
    robloxUsername: "a1dam_9999",
    payMethod: "balance", // "balance" (RierCoins) | "duitku" | "unpaid"
    dryRun: true,         // ubah ke false untuk buat & bayar beneran
  });
  console.log(res);
}

main();
```
