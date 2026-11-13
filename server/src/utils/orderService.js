import crypto from "node:crypto";
import Counter from "../models/Counter.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { HttpError } from "./httpError.js";
import { computeTotals } from "./pricing.js";

const MAX_LINES = 50;
const MAX_QTY = 99;

/** Validates the cart payload and merges duplicate product ids. */
export function parseItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, "Your cart is empty.");
  if (raw.length > MAX_LINES) throw new HttpError(400, "Too many items in the cart.");
  const merged = new Map();
  for (const it of raw) {
    const id = Number(it?.id);
    const qty = Number(it?.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      throw new HttpError(400, "Invalid item in the cart.");
    }
    merged.set(id, Math.min((merged.get(id) || 0) + qty, MAX_QTY));
  }
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

/** Loads real prices from MongoDB — client-sent prices are never trusted. */
export async function priceCart(rawItems, phone) {
  const wanted = parseItems(rawItems);
  const products = await Product.find({ id: { $in: wanted.map((w) => w.id) } }).lean();
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = wanted.map(({ id, qty }) => {
    const p = byId.get(id);
    if (!p) throw new HttpError(400, `Product #${id} no longer exists.`);
    if (p.inStock === false) throw new HttpError(409, `${p.name} is out of stock.`);
    return { productId: p.id, name: p.name, emoji: p.emoji, image: p.image, unit: p.unit, price: p.price, qty };
  });

  const isFirst = await isFirstOrder(phone);
  return { lines, ...computeTotals(lines, isFirst) };
}

// "First order" = this phone number has no paid / COD order yet
export async function isFirstOrder(phone) {
  if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) return true; // not known yet → show the discount optimistically
  const n = await Order.countDocuments({ "customer.phone": phone, paymentStatus: { $in: ["paid", "cod"] } });
  return n === 0;
}

export async function nextOrderId() {
  const c = await Counter.findOneAndUpdate({ _id: "order" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return "#FB2026" + String(c.seq).padStart(3, "0");
}

export const newTrackingKey = () => crypto.randomBytes(16).toString("hex");

/** Shape sent to the browser. The trackingKey is only included right after creation. */
export function toPublic(o, { withKey = false } = {}) {
  return {
    id: o.orderId,
    ...(withKey ? { trackingKey: o.trackingKey } : {}),
    name: o.customer.name,
    address: o.customer.address,
    deliveryTime: o.deliveryTime,
    items: o.items.map((i) => ({ id: i.productId, name: i.name, emoji: i.emoji, image: i.image, unit: i.unit, price: i.price, qty: i.qty })),
    subtotal: o.subtotal,
    discount: o.discount,
    delivery: o.delivery,
    total: o.total,
    payment: o.payment,
    paymentStatus: o.paymentStatus,
    placedAt: o.createdAt,
  };
}

export async function markPaid(order, { paymentId, signature }) {
  if (order.paymentStatus === "paid") return order; // idempotent: verify + webhook may both arrive
  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.razorpay.paymentId = paymentId;
  if (signature) order.razorpay.signature = signature;
  return order.save();
}
