import { Router } from "express";
import Order from "../models/Order.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { getRazorpay } from "../utils/razorpay.js";
import { env } from "../config/env.js";
import { newTrackingKey, nextOrderId, priceCart, toPublic } from "../utils/orderService.js";

const router = Router();
const SLOTS = ["asap", "morning", "afternoon", "evening"];
const METHODS = ["cod", "online"];

const str = (v) => (typeof v === "string" ? v.trim() : ""); // also blocks NoSQL-operator objects

function validateCustomer(b) {
  const customer = { name: str(b.name), phone: str(b.phone), address: str(b.address) };
  if (customer.name.length < 2 || customer.name.length > 80) throw new HttpError(400, "Please enter your full name.");
  if (!/^\d{10}$/.test(customer.phone)) throw new HttpError(400, "Enter a valid 10-digit phone number.");
  if (customer.address.length < 8 || customer.address.length > 300) throw new HttpError(400, "Please enter a complete delivery address.");
  if (!SLOTS.includes(b.deliveryTime)) throw new HttpError(400, "Please choose a delivery slot.");
  if (!METHODS.includes(b.payment)) throw new HttpError(400, "Please select a payment method.");
  return customer;
}

// POST /api/orders/quote  { items:[{id,qty}], phone? } → authoritative totals
router.post("/quote", asyncHandler(async (req, res) => {
  const { lines, subtotal, discount, delivery, total } = await priceCart(req.body.items, str(req.body.phone));
  res.json({ subtotal, discount, delivery, total, lines: lines.length });
}));

// POST /api/orders  → creates the order (and a Razorpay order for UPI / card)
router.post("/", asyncHandler(async (req, res) => {
  const b = req.body || {};
  const customer = validateCustomer(b);
  const { lines, subtotal, discount, delivery, total } = await priceCart(b.items, customer.phone);
  const online = b.payment !== "cod";

  if (online) getRazorpay(); // fail early (503) if keys are missing, before anything is written

  const order = await Order.create({
    orderId: await nextOrderId(),
    trackingKey: newTrackingKey(),
    customer,
    deliveryTime: b.deliveryTime,
    items: lines,
    subtotal, discount, delivery, total,
    payment: b.payment,
    paymentStatus: online ? "pending" : "cod",
  });

  if (!online) return res.status(201).json({ order: toPublic(order, { withKey: true }) });

  try {
    const rzp = await getRazorpay().orders.create({
      amount: total * 100, // paise
      currency: "INR",
      receipt: order.orderId.replace("#", ""),
      notes: { orderId: order.orderId },
    });
    order.razorpay.orderId = rzp.id;
    await order.save();
    res.status(201).json({
      order: toPublic(order, { withKey: true }),
      razorpay: {
        keyId: env.razorpay.keyId,
        orderId: rzp.id,
        amount: rzp.amount,
        currency: rzp.currency,
        prefill: { name: customer.name, contact: customer.phone },
      },
    });
  } catch (err) {
    order.paymentStatus = "failed";
    await order.save();
    console.error("Razorpay order creation failed:", err?.error?.description || err.message);
    throw new HttpError(502, "Could not start the payment. Please try again.");
  }
}));

// POST /api/orders/lookup  { keys:[trackingKey,…] } → the browser's own orders, newest first
router.post("/lookup", asyncHandler(async (req, res) => {
  const keys = Array.isArray(req.body.keys) ? req.body.keys.slice(0, 100) : [];
  const valid = keys.filter((k) => typeof k === "string" && /^[a-f0-9]{32}$/.test(k));
  if (valid.length === 0) return res.json({ orders: [] });
  const orders = await Order.find({ trackingKey: { $in: valid }, paymentStatus: { $ne: "failed" } }).sort({ createdAt: -1 });
  res.json({ orders: orders.map((o) => toPublic(o)) });
}));

export default router;
