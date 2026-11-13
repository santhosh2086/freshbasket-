import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { HttpError } from "./httpError.js";

let instance = null;
/** Lets tests inject a fake client. */
export function setRazorpayClient(client) { instance = client; }

export function getRazorpay() {
  if (instance) return instance;
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new HttpError(503, "Online payments are not configured on the server (missing Razorpay keys).");
  }
  instance ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return instance;
}

function safeEqualHex(a, b) {
  const x = Buffer.from(String(a), "utf8");
  const y = Buffer.from(String(b), "utf8");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout success signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyPaymentSignature({ orderId, paymentId, signature }, secret = env.razorpay.keySecret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook_secret) */
export function verifyWebhookSignature(rawBody, signature, secret = env.razorpay.webhookSecret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
