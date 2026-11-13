# FreshBasket — React + Express + MongoDB + Razorpay

```
freshbasket/
├── client/   React (Vite) storefront
└── server/   Express API · MongoDB (Mongoose) · Razorpay
```

## 1. Setup

```bash
npm run install:all
cp server/.env.example server/.env      # then fill it in (below)
npm run dev                             # API → :5000, site → :5173
```

`server/.env`
| Variable | What |
|---|---|
| `MONGODB_URI` | Local (`mongodb://127.0.0.1:27017/freshbasket`) or a MongoDB Atlas string |
| `CLIENT_URL` | Allowed front-end origin(s), comma separated (CORS) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys (**Test Mode** while developing) |
| `RAZORPAY_WEBHOOK_SECRET` | Any long random string; you paste the same value into the Razorpay webhook form |

The first start seeds the 18 products into MongoDB automatically. `npm run seed --prefix server` re-applies catalogue edits from `server/src/data/products.js`.

In dev, Vite proxies `/api` → `localhost:5000`, so the client needs no config.

## 2. How an order works

| Step | Cash on Delivery | Pay Online (UPI / card / netbanking) |
|---|---|---|
| 1 | `POST /api/orders` — server re-prices the cart from MongoDB, applies delivery fee + first-order discount, saves order | same, plus server creates a **Razorpay order** for the exact total (in paise) |
| 2 | Order saved as `paymentStatus: "cod"` — done | Browser opens **Razorpay Checkout** |
| 3 | – | On success the browser sends the signature to `POST /api/payments/verify`; server checks `HMAC_SHA256(order_id|payment_id, key_secret)` and only then marks the order `paid` |
| 4 | – | Safety net: Razorpay calls `POST /api/payments/webhook` (signature + amount checked), so an order is still marked paid if the customer closes the tab right after paying |

Closing the Checkout window marks the order `failed` and keeps the cart so the customer can retry.

### Razorpay webhook
Dashboard → Settings → Webhooks → Add: URL `https://<your-api>/api/payments/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events **payment.captured** and **order.paid**. For local testing expose port 5000 with a tunnel (e.g. `ngrok http 5000`).

### Test payments
In Test Mode use card `4111 1111 1111 1111` (any future expiry, any CVV, any OTP) or UPI id `success@razorpay`.

## 3. API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | Catalogue + pricing rules |
| POST | `/api/orders/quote` | Authoritative totals for a cart + phone |
| POST | `/api/orders` | Create order (COD or online) |
| POST | `/api/orders/lookup` | This browser's orders, by tracking keys |
| POST | `/api/payments/verify` | Verify Razorpay signature, mark paid |
| POST | `/api/payments/fail` | Customer cancelled / payment failed |
| POST | `/api/payments/webhook` | Razorpay → server events |

## 4. Design notes
- **Prices are never trusted from the browser.** Only `{id, qty}` is sent; the server loads prices from MongoDB.
- **No login yet.** Each order gets a random `trackingKey` that the browser stores; "My Orders" reads orders back with those keys (`freshbasket_order_refs` in localStorage). Clearing browser data loses the history on that device. Adding user accounts (OTP login) is the natural next step.
- "First order" discount is per **phone number**, decided on the server.
- Order history that lived only in the old localStorage (before the backend) is not migrated.
- `cd server && npm test` runs 17 tests (pricing, signature checks, HTTP flow with in-memory model stand-ins).

## 5. Deploying
- **Client** (Vercel): root dir `client`, Framework **Vite**, env `VITE_API_URL=https://<your-api>/api`.
- **Server** (Render / Railway / Fly …): root dir `server`, start `npm start`, set the env vars above (`CLIENT_URL` = your Vercel URL), use MongoDB Atlas, and switch Razorpay to **Live** keys only after KYC.
