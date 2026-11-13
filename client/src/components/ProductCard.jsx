import { useState } from "react";
import { formatINR } from "../utils";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

export default function ProductCard({ product: p, index }) {
  const { addToCart } = useShop();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(p.id, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="product-card" style={{ animationDelay: index * 0.04 + "s" }}>
      <div className="product-media">
        <span className="product-badge">{p.category}</span>
        <ProductImage product={p} imgClass="product-image" emojiClass="product-emoji" />
      </div>
      <p className="product-name">{p.name}</p>
      <p className="product-unit">{p.unit}</p>
      <p className="product-rating">⭐ {p.rating.toFixed(1)}</p>
      <div className="product-price-row">
        <span className="product-price">{formatINR(p.price)}</span>
        <div className="qty-selector">
          <button type="button" className="qty-minus" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(q - 1, 1))}>−</button>
          <span className="qty-value">{qty}</span>
          <button type="button" className="qty-plus" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(q + 1, 20))}>+</button>
        </div>
      </div>
      <button type="button" className={"add-cart-btn ripple" + (added ? " added" : "")} onClick={handleAdd}>
        {added ? "✓ Added" : "🛒 Add to Cart"}
      </button>
    </article>
  );
}
