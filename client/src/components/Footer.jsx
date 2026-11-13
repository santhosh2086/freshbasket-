import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const year = new Date().getFullYear();

export default function Footer({ minimal = false }) {
  const { setCategory } = useShop();

  const pickAisle = (e, cat) => {
    e.preventDefault();
    setCategory(cat);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const bottom = (
    <div className="footer-bottom">
      <p>© {year} FreshBasket. All rights reserved.</p>
    </div>
  );

  if (minimal) return <footer className="site-footer" id="footer">{bottom}</footer>;

  return (
    <footer className="site-footer" id="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="#top" className="logo"><span className="logo-basket">🧺</span><span className="logo-text">Fresh<em>Basket</em></span></a>
          <p>Fresh groceries delivered with a smile — straight from local farms to your kitchen.</p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <a href="#categories">Categories</a>
          <a href="#products">Products</a>
          <a href="#testimonials">Testimonials</a>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-col">
          <h4>Aisles</h4>
          {["fruits", "vegetables", "dairy", "bakery"].map((c) => (
            <a key={c} href="#products" className="footer-cat" style={{ textTransform: "capitalize" }} onClick={(e) => pickAisle(e, c)}>{c}</a>
          ))}
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <p>📍 Madurai, Tamil Nadu</p>
          <p>📞 +91 98765 43210</p>
          <p>✉️ hello@freshbasket.app</p>
        </div>
      </div>
      {bottom}
    </footer>
  );
}
