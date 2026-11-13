// HTTP-level tests with in-memory stand-ins for the Mongoose models (no MongoDB needed).
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "wh_secret";

import test, { before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const { createApp } = await import("../src/app.js");
const { default: Order } = await import("../src/models/Order.js");
const { default: Product } = await import("../src/models/Product.js");
const { default: Counter } = await import("../src/models/Counter.js");
const { setRazorpayClient } = await import("../src/utils/razorpay.js");
const { SEED_PRODUCTS } = await import("../src/data/products.js");

let server, base, orders, seq, rzpCreated;
const get = (o, path) => path.split(".").reduce((x, k) => x?.[k], o);
const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");

before(async () => {
  mock.method(Product, "find", () => {
    const p = Promise.resolve(SEED_PRODUCTS);
    return { lean: async () => SEED_PRODUCTS, sort: () => ({ lean: async () => SEED_PRODUCTS }) };
  });
  mock.method(Counter, "findOneAndUpdate", async () => ({ seq: ++seq }));
  mock.method(Order, "create", async (doc) => {
    const o = { ...doc, razorpay: {}, discount: doc.discount ?? 0, createdAt: new Date(), async save() { return this; } };
    orders.push(o);
    return o;
  });
  mock.method(Order, "findOne", async (q) => orders.find((o) => Object.entries(q).every(([k, v]) => get(o, k) === v)) || null);
  mock.method(Order, "countDocuments", async (q) =>
    orders.filter((o) => o.customer.phone === q["customer.phone"] && q.paymentStatus.$in.includes(o.paymentStatus)).length);
  mock.method(Order, "find", (q) => ({
    sort: async () => orders.filter((o) => q.trackingKey.$in.includes(o.trackingKey) && o.paymentStatus !== "failed").reverse(),
  }));
  setRazorpayClient({ orders: { create: async (p) => { rzpCreated = p; return { id: "order_TEST" + orders.length, amount: p.amount, currency: p.currency }; } } });

  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => { orders = []; seq = 0; rzpCreated = null; });

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

const customer = { name: "Sandy K", phone: "9876543210", address: "12 Main Street, Madurai", deliveryTime: "asap" };
const milk = { id: 9, qty: 1 }; // ₹65

test("GET /api/products returns the catalogue and pricing rules", async () => {
  const body = await (await fetch(base + "/api/products")).json();
  assert.equal(body.products.length, 18);
  assert.equal(body.pricing.deliveryFee, 40);
});

test("quote applies first-order discount server-side", async () => {
  const q = await (await post("/api/orders/quote", { items: [milk], phone: "9876543210" })).json();
  assert.deepEqual([q.subtotal, q.discount, q.delivery, q.total], [65, 7, 40, 98]);
});

test("COD order: totals come from DB prices, client-sent price is ignored", async () => {
  const res = await post("/api/orders", { ...customer, payment: "cod", items: [{ ...milk, price: 1 }] });
  assert.equal(res.status, 201);
  const { order, razorpay } = await res.json();
  assert.equal(order.id, "#FB2026001");
  assert.equal(order.total, 98);
  assert.equal(order.paymentStatus, "cod");
  assert.match(order.trackingKey, /^[a-f0-9]{32}$/);
  assert.equal(razorpay, undefined);
});

test("second order from same phone gets no discount", async () => {
  await post("/api/orders", { ...customer, payment: "cod", items: [milk] });
  const { order } = await (await post("/api/orders", { ...customer, payment: "cod", items: [milk] })).json();
  assert.equal(order.discount, 0);
  assert.equal(order.total, 105);
});

test("online order creates a Razorpay order in paise and starts as pending", async () => {
  const { order, razorpay } = await (await post("/api/orders", { ...customer, payment: "online", items: [milk] })).json();
  assert.equal(order.paymentStatus, "pending");
  assert.equal(rzpCreated.amount, 9800);
  assert.equal(razorpay.amount, 9800);
  assert.equal(razorpay.keyId, "rzp_test_key");
  assert.equal(razorpay.currency, "INR");
});

test("verify: rejects a bad signature, accepts a good one, is idempotent", async () => {
  const { order, razorpay } = await (await post("/api/orders", { ...customer, payment: "online", items: [milk] })).json();
  const bad = await post("/api/payments/verify", { orderId: order.id, razorpay_order_id: razorpay.orderId, razorpay_payment_id: "pay_1", razorpay_signature: "deadbeef" });
  assert.equal(bad.status, 400);
  assert.equal(orders[0].paymentStatus, "pending");

  const sig = hmac("key_secret", `${razorpay.orderId}|pay_1`);
  const good = { orderId: order.id, razorpay_order_id: razorpay.orderId, razorpay_payment_id: "pay_1", razorpay_signature: sig };
  assert.equal((await post("/api/payments/verify", good)).status, 200);
  assert.equal(orders[0].paymentStatus, "paid");
  assert.equal((await post("/api/payments/verify", good)).status, 200);

  // signature for a different Razorpay order id must not mark this order paid
  const other = await post("/api/payments/verify", { ...good, razorpay_order_id: "order_OTHER" });
  assert.equal(other.status, 404);
});

test("webhook: bad signature rejected; valid payment.captured marks paid (amount checked)", async () => {
  const { razorpay } = await (await post("/api/orders", { ...customer, payment: "online", items: [milk] })).json();
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_W", order_id: razorpay.orderId, amount: 9800 } } } });

  assert.equal((await post("/api/payments/webhook", body, { "x-razorpay-signature": "nope" })).status, 400);
  assert.equal(orders[0].paymentStatus, "pending");

  assert.equal((await post("/api/payments/webhook", body, { "x-razorpay-signature": hmac("wh_secret", body) })).status, 200);
  assert.equal(orders[0].paymentStatus, "paid");
});

test("webhook with a mismatched amount does not mark paid", async () => {
  const { razorpay } = await (await post("/api/orders", { ...customer, payment: "online", items: [milk] })).json();
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_W", order_id: razorpay.orderId, amount: 100 } } } });
  await post("/api/payments/webhook", body, { "x-razorpay-signature": hmac("wh_secret", body) });
  assert.equal(orders[0].paymentStatus, "pending");
});

test("fail endpoint needs the trackingKey; failed orders disappear from lookup", async () => {
  const { order } = await (await post("/api/orders", { ...customer, payment: "online", items: [milk] })).json();
  assert.equal((await post("/api/payments/fail", { orderId: order.id, trackingKey: "x".repeat(32) })).status, 404);
  assert.equal((await post("/api/payments/fail", { orderId: order.id, trackingKey: order.trackingKey })).status, 200);
  assert.equal(orders[0].paymentStatus, "failed");
  const { orders: found } = await (await post("/api/orders/lookup", { keys: [order.trackingKey] })).json();
  assert.equal(found.length, 0);
});

test("lookup returns only orders whose key is supplied, without leaking the key", async () => {
  const a = (await (await post("/api/orders", { ...customer, payment: "cod", items: [milk] })).json()).order;
  await post("/api/orders", { ...customer, phone: "9123456780", payment: "cod", items: [milk] });
  const { orders: found } = await (await post("/api/orders/lookup", { keys: [a.trackingKey, { $ne: null }] })).json();
  assert.equal(found.length, 1);
  assert.equal(found[0].id, a.id);
  assert.equal(found[0].trackingKey, undefined);
});

test("validation: bad phone, operator-injection, empty cart, unknown product", async () => {
  assert.equal((await post("/api/orders", { ...customer, phone: "123", payment: "cod", items: [milk] })).status, 400);
  assert.equal((await post("/api/orders", { ...customer, name: { $gt: "" }, payment: "cod", items: [milk] })).status, 400);
  assert.equal((await post("/api/orders", { ...customer, payment: "cod", items: [] })).status, 400);
  assert.equal((await post("/api/orders", { ...customer, payment: "cod", items: [{ id: 9999, qty: 1 }] })).status, 400);
  assert.equal((await post("/api/orders", { ...customer, payment: "bitcoin", items: [milk] })).status, 400);
});
