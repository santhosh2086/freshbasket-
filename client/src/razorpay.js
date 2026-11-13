const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading = null;

function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = resolve;
    s.onerror = () => { loading = null; reject(new Error("Could not load the payment window. Check your connection.")); };
    document.body.appendChild(s);
  });
  return loading;
}

/**
 * Opens Razorpay Checkout for an order created by our server.
 * Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature } on success,
 * rejects with Error("cancelled") if the customer closes the window.
 */
export async function openCheckout({ razorpay, description }) {
  await loadScript();
  return new Promise((resolve, reject) => {
    let settled = false;
    const rzp = new window.Razorpay({
      key: razorpay.keyId,
      order_id: razorpay.orderId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: "FreshBasket",
      description,
      prefill: razorpay.prefill,
      theme: { color: "#B15E3D" },
      handler: (response) => { settled = true; resolve(response); },
      modal: { ondismiss: () => { if (!settled) reject(new Error("cancelled")); } },
    });
    // failed attempts stay inside the modal so the customer can retry; nothing to do here
    rzp.open();
  });
}
