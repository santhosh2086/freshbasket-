import { useEffect, useState } from "react";
import { api } from "../api";
import { formatINR } from "../utils";
import { useShop } from "../context/ShopContext";

const EMPTY = { name: "", phone: "", address: "", deliveryTime: "", payment: "" };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^\d{10}$/.test(f.phone.trim())) e.phone = "Enter a valid 10-digit phone number.";
  if (f.address.trim().length < 8) e.address = "Please enter a complete delivery address.";
  if (!f.deliveryTime) e.deliveryTime = "Please choose a delivery slot.";
  if (!f.payment) e.payment = "Please select a payment method.";
  return e;
}

export default function OrderModal() {
  const { orderModalOpen, setOrderModalOpen, cart, totals: estimate, placeOrder, showToast } = useShop();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState(null); // authoritative totals from the server
  const close = () => { if (!submitting) setOrderModalOpen(false); };

  // Once the phone number is complete, ask the server for the real total
  // (the first-order discount depends on the phone number).
  useEffect(() => {
    if (!orderModalOpen || !/^\d{10}$/.test(form.phone.trim()) || cart.length === 0) { setQuote(null); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      api.quote(cart.map(({ id, qty }) => ({ id, qty })), form.phone.trim())
        .then((q) => { if (!cancelled) setQuote(q); })
        .catch(() => { if (!cancelled) setQuote(null); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [orderModalOpen, form.phone, cart]);

  const totals = quote || estimate;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const row = (key) => "form-row" + (errors[key] ? " invalid" : "");

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) { showToast("Please fix the highlighted fields", "⚠️"); return; }

    setSubmitting(true);
    try {
      await placeOrder({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        deliveryTime: form.deliveryTime,
        payment: form.payment,
      });
      setForm(EMPTY);
    } catch (err) {
      showToast(err.message || "Something went wrong. Please try again.", "❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={"overlay" + (orderModalOpen ? " show" : "")} onClick={close}></div>
      <div className={"modal order-modal" + (orderModalOpen ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="orderModalTitle">
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        <h3 id="orderModalTitle">Delivery Details</h3>
        <p className="modal-sub">Tell us where to bring your groceries.</p>

        <form onSubmit={onSubmit} noValidate>
          <div className={row("name")}>
            <label htmlFor="custName">Full Name</label>
            <input type="text" id="custName" value={form.name} onChange={set("name")} placeholder="e.g. Santhosh Kumar" autoComplete="name" />
            <span className="field-error">{errors.name}</span>
          </div>

          <div className={row("phone")}>
            <label htmlFor="custPhone">Phone Number</label>
            <input type="tel" id="custPhone" value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number" autoComplete="tel" />
            <span className="field-error">{errors.phone}</span>
          </div>

          <div className={row("address")}>
            <label htmlFor="custAddress">Delivery Address</label>
            <textarea id="custAddress" rows="2" value={form.address} onChange={set("address")} placeholder="House no., street, area, city"></textarea>
            <span className="field-error">{errors.address}</span>
          </div>

          <div className={row("deliveryTime")}>
            <label htmlFor="deliveryTime">Delivery Time</label>
            <select id="deliveryTime" value={form.deliveryTime} onChange={set("deliveryTime")}>
              <option value="">Select a slot</option>
              <option value="asap">As soon as possible (30 min)</option>
              <option value="morning">Tomorrow Morning (8AM–11AM)</option>
              <option value="afternoon">Tomorrow Afternoon (12PM–3PM)</option>
              <option value="evening">Tomorrow Evening (5PM–8PM)</option>
            </select>
            <span className="field-error">{errors.deliveryTime}</span>
          </div>

          <div className={row("payment")}>
            <label>Payment Method</label>
            <div className="payment-options">
              {[["cod", "💵 Cash on Delivery"], ["online", "💳 Pay Online (UPI / Card)"]].map(([val, text]) => (
                <label className="payment-pill" key={val}>
                  <input type="radio" name="payment" value={val} checked={form.payment === val} onChange={set("payment")} />
                  <span>{text}</span>
                </label>
              ))}
            </div>
            <span className="field-error">{errors.payment}</span>
          </div>

          <div className="order-modal-summary discount-row" hidden={totals.discount === 0}>
            <span>🎉 First order discount (10%)</span>
            <strong>-{formatINR(totals.discount)}</strong>
          </div>
          <div className="order-modal-summary">
            <span>Grand Total</span>
            <strong>{formatINR(totals.total)}</strong>
          </div>

          <button type="submit" className="btn btn-primary btn-block ripple" disabled={submitting}>
            <span>
              {submitting ? "Please wait…" : form.payment === "online" ? `Pay ${formatINR(totals.total)}` : "Place Order"}
            </span>
            <span className="spinner" hidden={!submitting}></span>
          </button>
          <p className="processing-text" hidden={!submitting}>{form.payment === "online" ? "Complete the payment in the secure Razorpay window…" : "Placing your order…"}</p>
        </form>
      </div>
    </>
  );
}
