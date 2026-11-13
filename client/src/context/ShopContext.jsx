import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { openCheckout } from "../razorpay";
import { loadJSON, saveJSON } from "../utils";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

// Used only until /api/products answers (the server is the source of truth for pricing rules)
const DEFAULT_PRICING = { deliveryFee: 40, freeDeliveryThreshold: 499, firstOrderDiscountRate: 0.1 };

export function ShopProvider({ children }) {
  /* ---------- catalogue (from the API) ---------- */
  const [products, setProducts] = useState([]);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [productsStatus, setProductsStatus] = useState("loading"); // loading | ready | error

  const loadProducts = useCallback(async () => {
    setProductsStatus("loading");
    try {
      const data = await api.getProducts();
      setProducts(data.products);
      setPricing(data.pricing);
      setProductsStatus("ready");
    } catch {
      setProductsStatus("error");
    }
  }, []);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ---------- local state ---------- */
  const [cart, setCart] = useState(() => loadJSON("freshbasket_cart", []));            // [{id, qty}]
  const [orderRefs, setOrderRefs] = useState(() => loadJSON("freshbasket_order_refs", [])); // [{id, key}] — this browser's orders
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState(orderRefs.length ? "loading" : "ready");
  const [theme, setTheme] = useState(() => localStorage.getItem("freshbasket_theme") || "light");
  const [toasts, setToasts] = useState([]);

  // product browsing (shared by header / hero / toolbar / footer links)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");

  // UI overlays
  const [cartOpen, setCartOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* ---------- persistence ---------- */
  useEffect(() => saveJSON("freshbasket_cart", cart), [cart]);
  useEffect(() => saveJSON("freshbasket_order_refs", orderRefs), [orderRefs]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("freshbasket_theme", theme);
  }, [theme]);

  const anyOverlay = cartOpen || orderModalOpen || !!successOrderId || mobileNavOpen;
  useEffect(() => {
    document.body.classList.toggle("no-scroll", anyOverlay);
    return () => document.body.classList.remove("no-scroll");
  }, [anyOverlay]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (successOrderId) setSuccessOrderId(null);
      else if (orderModalOpen) setOrderModalOpen(false);
      else if (cartOpen) setCartOpen(false);
      else if (mobileNavOpen) setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [successOrderId, orderModalOpen, cartOpen, mobileNavOpen]);

  /* ---------- toasts ---------- */
  const showToast = useCallback((message, icon = "✅") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /* ---------- cart ---------- */
  const [badgePop, setBadgePop] = useState(0);

  const addToCart = useCallback((id, qty) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === id);
      return existing ? c.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i)) : [...c, { id, qty }];
    });
    setBadgePop((n) => n + 1);
    const p = products.find((x) => x.id === id);
    if (p) showToast(`${p.name} added to cart`, "🛒");
  }, [products, showToast]);

  const updateCartQty = useCallback((id, delta) => {
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  }, []);
  const removeFromCart = useCallback((id) => setCart((c) => c.filter((i) => i.id !== id)), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Display-only estimate. The server recomputes the real total when the order is placed.
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const p = products.find((x) => x.id === item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
    const discount = subtotal > 0 && orderRefs.length === 0 ? Math.round(subtotal * pricing.firstOrderDiscountRate) : 0;
    const delivery = subtotal === 0 || subtotal >= pricing.freeDeliveryThreshold ? 0 : pricing.deliveryFee;
    return { subtotal, discount, delivery, total: subtotal - discount + delivery };
  }, [cart, products, pricing, orderRefs.length]);

  /* ---------- orders ---------- */
  const refreshOrders = useCallback(async (refs = orderRefs) => {
    if (refs.length === 0) { setOrders([]); setOrdersStatus("ready"); return; }
    try {
      const { orders: list } = await api.lookupOrders(refs.map((r) => r.key));
      setOrders(list);
      // drop refs the server no longer returns (e.g. failed payments)
      const known = new Set(list.map((o) => o.id));
      setOrderRefs((prev) => (prev.every((r) => known.has(r.id)) ? prev : prev.filter((r) => known.has(r.id))));
      setOrdersStatus("ready");
    } catch {
      setOrdersStatus("error");
    }
  }, [orderRefs]);

  // load this browser's orders once on startup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshOrders(); }, []);

  const finalizeOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    setCart([]);
    setOrderModalOpen(false);
    setSuccessOrderId(order.id);
  }, []);

  /**
   * COD:    server creates the order → done.
   * Online: server creates the order + Razorpay order → Checkout opens → we send the
   *         signature to the server, which verifies it before marking the order paid.
   * Throws on failure/cancel so the modal can show a message; the cart is kept.
   */
  const placeOrder = useCallback(async (details) => {
    const items = cart.map(({ id, qty }) => ({ id, qty }));
    const { order, razorpay } = await api.createOrder({ ...details, items });

    // remember this order on this device (the key is what lets us read it back later)
    setOrderRefs((prev) => [{ id: order.id, key: order.trackingKey }, ...prev]);
    const { trackingKey, ...publicOrder } = order;

    if (!razorpay) { finalizeOrder(publicOrder); return; }

    let payment;
    try {
      payment = await openCheckout({ razorpay, description: `Order ${order.id}` });
    } catch (err) {
      api.paymentFailed(order.id, trackingKey).catch(() => {});
      setOrderRefs((prev) => prev.filter((r) => r.id !== order.id));
      throw new Error(err.message === "cancelled" ? "Payment cancelled — your cart is still saved." : err.message);
    }

    try {
      const { order: verified } = await api.verifyPayment({ orderId: order.id, ...payment });
      finalizeOrder(verified);
    } catch (err) {
      // money has left the customer's account but we couldn't confirm yet; the webhook will settle it
      setCart([]);
      setOrderModalOpen(false);
      refreshOrders();
      showToast("Payment received — we're confirming it. Check My Orders shortly; don't pay again.", "⏳");
    }
  }, [cart, finalizeOrder, refreshOrders, showToast]);

  // "Remove" only forgets the order on this device; the record stays on the server
  const removeOrder = useCallback((id) => {
    setOrderRefs((prev) => prev.filter((r) => r.id !== id));
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const reorder = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setCart((c) => {
      const next = c.map((i) => ({ ...i }));
      order.items.forEach((it) => {
        const ex = next.find((x) => x.id === it.id);
        if (ex) ex.qty += it.qty; else next.push({ id: it.id, qty: it.qty });
      });
      return next;
    });
    showToast("Order items added to your cart — head to Continue Shopping to check out", "🛒");
  }, [orders, showToast]);

  const value = {
    products, productsStatus, loadProducts, pricing,
    cart, cartCount, totals, addToCart, updateCartQty, removeFromCart, badgePop,
    orders, ordersStatus, refreshOrders, placeOrder, removeOrder, reorder,
    theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    toasts, showToast,
    search, setSearch, category, setCategory, sort, setSort,
    cartOpen, setCartOpen, orderModalOpen, setOrderModalOpen,
    successOrderId, setSuccessOrderId, mobileNavOpen, setMobileNavOpen,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
