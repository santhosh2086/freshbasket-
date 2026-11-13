// Single place that reads environment variables.
export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/freshbasket",
  clientOrigins: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
};

// Pricing rules live on the server — the client only displays them.
export const PRICING = {
  deliveryFee: 40,
  freeDeliveryThreshold: 499,
  firstOrderDiscountRate: 0.1,
};
