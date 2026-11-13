import { Router } from "express";
import Order from "../models/Order.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { verifyPaymentSignature, verifyWebhookSignature } from "../utils/razorpay.js";
import { markPaid, toPublic } from "../utils/orderService.js";

const router = Router();
const s = (v) => (typeof v === "string" ? v : "");

// POST /api/payments/verify — called by the browser after Razorpay Checkout succeeds
router.post("/verify", asyncHandler(async (req, res) => {
  const orderId = s(req.body.orderId);
  const rzpOrderId = s(req.body.razorpay_order_id);
  const paymentId = s(req.body.razorpay_payment_id);
  const signature = s(req.body.razorpay_signature);

  const order = await Order.findOne({ orderId });
  if (!order || !order.razorpay.orderId || order.razorpay.orderId !== rzpOrderId) {
    throw new HttpError(404, "Order not found.");
  }
  if (!verifyPaymentSignature({ orderId: rzpOrderId, paymentId, signature })) {
    throw new HttpError(400, "Payment verification failed.");
  }
  await markPaid(order, { paymentId, signature });
  res.json({ order: toPublic(order) });
}));

// POST /api/payments/fail — customer closed Checkout / payment failed (needs the order's trackingKey)
router.post("/fail", asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: s(req.body.orderId), trackingKey: s(req.body.trackingKey) });
  if (!order) throw new HttpError(404, "Order not found.");
  if (order.paymentStatus === "pending") {
    order.paymentStatus = "failed";
    await order.save();
  }
  res.json({ ok: true });
}));

// POST /api/payments/webhook — server-to-server safety net (browser closed after paying, etc.)
// Mounted with express.raw() in app.js, so req.body is a Buffer here.
export async function webhookHandler(req, res) {
  const signature = req.get("x-razorpay-signature");
  if (!verifyWebhookSignature(req.body, signature)) return res.status(400).send("Invalid signature");

  try {
    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;
      const order = rzpOrderId && (await Order.findOne({ "razorpay.orderId": rzpOrderId }));
      if (order && payment?.amount === order.total * 100) {
        await markPaid(order, { paymentId: payment.id });
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook handling failed");
  }
}

export default router;
