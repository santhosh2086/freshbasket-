import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatINR } from "../utils";
import { useShop } from "../context/ShopContext";
import Footer from "../components/Footer";

const STATUS_STEPS = ["Placed", "Preparing", "Out for delivery", "Delivered"];

// Simulated progress based on minutes elapsed since the order was placed
function computeOrderStatus(order) {
  const mins = (Date.now() - new Date(order.placedAt).getTime()) / 60000;
  if (mins < 1) return 1;
  if (mins < 5) return 2;
  if (mins < 15) return 3;
  return 4;
}

const PAY_LABEL = { cod: "COD", online: "ONLINE" };
const PAY_STATUS = { paid: "PAID", pending: "AWAITING PAYMENT", cod: "PAY ON DELIVERY" };

function OrderEntry({ order: o }) {
  const { reorder, removeOrder, showToast } = useShop();
  const [open, setOpen] = useState(false);
  const step = computeOrderStatus(o);

  const remove = () => {
    if (!window.confirm(`Remove order ${o.id} from this device's history?`)) return;
    removeOrder(o.id);
    showToast("Order removed from history", "🗑");
  };

  return (
    <div className="order-entry">
      <div className="oe-top"><span>{o.id}</span><span>{formatINR(o.total)}</span></div>
      <p className="oe-meta">{o.items.length} item(s) • {PAY_LABEL[o.payment]} • {PAY_STATUS[o.paymentStatus]} • {new Date(o.placedAt).toLocaleString("en-IN")}</p>

      <div className="oe-status">
        {STATUS_STEPS.map((label, i) => (
          <div key={label} className={"status-step" + (o.paymentStatus !== "pending" && i < step ? " done" : "")}>
            <span className="dot"></span><span className="label">{label}</span>
          </div>
        ))}
      </div>

      <button type="button" className="oe-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide items ▴" : "View items ▾"}
      </button>
      <div className="oe-details" hidden={!open}>
        <ul>
          {o.items.map((it) => (
            <li key={it.id}>
              <span className="oi-name">{it.emoji} {it.name} × {it.qty}</span>
              <span>{formatINR(it.price * it.qty)}</span>
            </li>
          ))}
          {o.discount ? <li><span className="oi-name">🎉 First order discount</span><span>-{formatINR(o.discount)}</span></li> : null}
        </ul>
        <p className="oe-address">Deliver to: {o.address}</p>
      </div>

      <div className="oe-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => reorder(o.id)}>Reorder</button>
        <button type="button" className="btn-text" onClick={remove}>Remove</button>
      </div>
    </div>
  );
}

export default function Orders() {
  const { orders, ordersStatus, refreshOrders } = useShop();
  const [filter, setFilter] = useState("");

  // pick up the latest payment status whenever the page opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshOrders(); }, []);

  // the stylesheet scopes some header rules to body.orders-body
  useEffect(() => {
    document.body.classList.add("orders-body");
    return () => document.body.classList.remove("orders-body");
  }, []);

  const q = filter.trim().toLowerCase();
  const visible = q ? orders.filter((o) => o.id.toLowerCase().includes(q)) : orders;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <main id="main">
        <section className="orders-page-hero">
          <div className="container orders-narrow">
            <Link to="/" className="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M11 18l-6-6 6-6"></path></svg>
              Back to shopping
            </Link>
            <h1>My Orders</h1>
            <p>Track deliveries and reorder your favourites.</p>
          </div>
        </section>

        <section className="orders-page-body">
          <div className="container orders-narrow">
            <div className="orders-stats">
              {orders.length > 0 && (
                <>
                  <div className="stat-chip"><strong>{orders.length}</strong><span>Orders placed</span></div>
                  <div className="stat-chip"><strong>{formatINR(totalSpent)}</strong><span>Total spent</span></div>
                </>
              )}
            </div>

            <div className="orders-toolbar" hidden={orders.length === 0}>
              <span className="search-icon">🔍</span>
              <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by Order ID…" aria-label="Search orders" />
            </div>

            <div className="orders-list">
              {orders.length === 0 && ordersStatus === "loading" ? (
                <p className="orders-empty">Loading your orders…</p>
              ) : orders.length === 0 && ordersStatus === "error" ? (
                <p className="orders-empty">Couldn't load your orders. <button type="button" className="btn btn-outline btn-sm" onClick={() => refreshOrders()}>Try again</button></p>
              ) : orders.length === 0 ? (
                <p className="orders-empty">No orders yet. Your placed orders will show up here 🧺<br /><br /><Link className="btn btn-primary" to="/">Start Shopping</Link></p>
              ) : visible.length === 0 ? (
                <p className="orders-empty">No orders match “{filter}”.</p>
              ) : (
                visible.map((o) => <OrderEntry key={o.id} order={o} />)
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer minimal />
    </>
  );
}
