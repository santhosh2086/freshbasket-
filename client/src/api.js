const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export const api = {
  getProducts: () => request("/products"),
  quote: (items, phone) => request("/orders/quote", { method: "POST", body: { items, phone } }),
  createOrder: (body) => request("/orders", { method: "POST", body }),
  lookupOrders: (keys) => request("/orders/lookup", { method: "POST", body: { keys } }),
  verifyPayment: (body) => request("/payments/verify", { method: "POST", body }),
  paymentFailed: (orderId, trackingKey) => request("/payments/fail", { method: "POST", body: { orderId, trackingKey } }),
};
