import { formatINR } from "../utils";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

export default function CartPanel() {
  const { products, cart, totals, cartOpen, setCartOpen, setOrderModalOpen, updateCartQty, removeFromCart, showToast } = useShop();
  const close = () => setCartOpen(false);
  const { subtotal, discount, delivery, total } = totals;

  const checkout = () => {
    if (cart.length === 0) { showToast("Your cart is empty", "⚠️"); return; }
    close();
    setOrderModalOpen(true);
  };

  const startShopping = () => {
    close();
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className={"overlay" + (cartOpen ? " show" : "")} onClick={close}></div>
      <aside className={"cart-panel" + (cartOpen ? " open" : "")} aria-label="Shopping cart">
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="icon-btn" onClick={close} aria-label="Close cart">✕</button>
        </div>

        <div className="cart-items">
          {cart.map((item) => {
            const p = products.find((x) => x.id === item.id);
            if (!p) return null;
            return (
              <div className="cart-item" key={p.id}>
                <div className="cart-item-media">
                  <ProductImage product={p} imgClass="cart-item-image" emojiClass="cart-item-emoji" />
                </div>
                <div className="cart-item-info">
                  <p className="name">{p.name}</p>
                  <p className="price">{formatINR(p.price)} × {item.qty} = {formatINR(p.price * item.qty)}</p>
                </div>
                <div className="cart-item-controls">
                  <button type="button" className="cart-minus" aria-label="Decrease quantity" onClick={() => updateCartQty(p.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button type="button" className="cart-plus" aria-label="Increase quantity" onClick={() => updateCartQty(p.id, 1)}>+</button>
                  <button type="button" className="cart-item-remove" aria-label="Remove item" onClick={() => removeFromCart(p.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-empty" hidden={cart.length > 0}>
          <span>🧺</span>
          <p>Your cart is empty.</p>
          <button className="btn btn-outline" onClick={startShopping}>Start Shopping</button>
        </div>

        <div className="cart-summary" style={{ display: cart.length ? "block" : "none" }}>
          <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="summary-row discount" hidden={discount === 0}><span>First order discount (10%)</span><span>-{formatINR(discount)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : formatINR(delivery)}</span></div>
          <div className="summary-row total"><span>Grand Total</span><span>{formatINR(total)}</span></div>
          <button className="btn btn-primary btn-block ripple" onClick={checkout}>Proceed to Checkout</button>
        </div>
      </aside>
    </>
  );
}
