import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { computeTotals } from "../src/utils/pricing.js";
import { verifyPaymentSignature, verifyWebhookSignature } from "../src/utils/razorpay.js";
import { parseItems } from "../src/utils/orderService.js";

const P = { deliveryFee: 40, freeDeliveryThreshold: 499, firstOrderDiscountRate: 0.1 };

test("totals: delivery fee under threshold, free above", () => {
  assert.deepEqual(computeTotals([{ price: 65, qty: 1 }], false, P), { subtotal: 65, discount: 0, delivery: 40, total: 105 });
  assert.equal(computeTotals([{ price: 250, qty: 2 }], false, P).delivery, 0);
});

test("totals: 10% first-order discount, rounded", () => {
  assert.deepEqual(computeTotals([{ price: 65, qty: 1 }], true, P), { subtotal: 65, discount: 7, delivery: 40, total: 98 });
});

test("totals: empty cart is zero", () => {
  assert.deepEqual(computeTotals([], true, P), { subtotal: 0, discount: 0, delivery: 0, total: 0 });
});

test("payment signature accepts valid, rejects tampered", () => {
  const secret = "test_secret";
  const sig = crypto.createHmac("sha256", secret).update("order_A|pay_B").digest("hex");
  assert.equal(verifyPaymentSignature({ orderId: "order_A", paymentId: "pay_B", signature: sig }, secret), true);
  assert.equal(verifyPaymentSignature({ orderId: "order_A", paymentId: "pay_X", signature: sig }, secret), false);
  assert.equal(verifyPaymentSignature({ orderId: "order_A", paymentId: "pay_B", signature: "abc" }, secret), false);
  assert.equal(verifyPaymentSignature({ orderId: "order_A", paymentId: "pay_B", signature: sig }, ""), false);
});

test("webhook signature is computed over the raw body", () => {
  const secret = "whsec";
  const body = Buffer.from('{"event":"payment.captured"}');
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, sig, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"x"}'), sig, secret), false);
});

test("cart parsing merges duplicates and rejects bad input", () => {
  assert.deepEqual(parseItems([{ id: 1, qty: 2 }, { id: 1, qty: 3 }, { id: "2", qty: 1 }]), [{ id: 1, qty: 5 }, { id: 2, qty: 1 }]);
  assert.throws(() => parseItems([]));
  assert.throws(() => parseItems([{ id: 1, qty: 0 }]));
  assert.throws(() => parseItems([{ id: 1, qty: 1.5 }]));
  assert.throws(() => parseItems([{ id: { $gt: 0 }, qty: 1 }]));
});
