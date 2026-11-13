import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    // snapshot of the product at purchase time, so later price edits don't rewrite history
    name: String,
    emoji: String,
    image: String,
    unit: String,
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // "#FB2026001"
    trackingKey: { type: String, required: true, unique: true }, // secret the browser keeps to read/modify this order
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      address: { type: String, required: true },
    },
    deliveryTime: { type: String, enum: ["asap", "morning", "afternoon", "evening"], required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    total: { type: Number, required: true },

    payment: { type: String, enum: ["cod", "online"], required: true },
    // cod → "cod" (collected on delivery) · online (Razorpay: UPI / card / netbanking) → pending → paid | failed
    paymentStatus: { type: String, enum: ["cod", "pending", "paid", "failed"], required: true },
    razorpay: {
      orderId: { type: String, index: true, sparse: true },
      paymentId: String,
      signature: String,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
