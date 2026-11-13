import { useEffect, useRef, useState } from "react";
import { useShop } from "../context/ShopContext";

function Counter({ target }) {
  const ref = useRef(null);
  const [text, setText] = useState("0");

  useEffect(() => {
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) { setText(Math.floor(eased * target).toLocaleString("en-IN")); raf = requestAnimationFrame(tick); }
        else setText(target.toLocaleString("en-IN") + (target >= 1000 ? "+" : ""));
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);

  return <span className="stat-number" ref={ref}>{text}</span>;
}

export default function Hero() {
  const { search, setSearch } = useShop();
  const onSubmit = (e) => {
    e.preventDefault();
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="hero" id="top">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow fade-up">Farm to doorstep</p>
          <h1 className="hero-heading fade-up" style={{ animationDelay: ".05s" }}>
            Groceries, curated<br />for a <span className="highlight">better table.</span>
          </h1>
          <p className="hero-sub fade-up" style={{ animationDelay: ".1s" }}>
            Thoughtfully sourced produce, dairy and pantry staples — arranged with care, delivered with quiet efficiency.
          </p>

          <form className="hero-search fade-up" onSubmit={onSubmit} style={{ animationDelay: ".15s" }}>
            <span className="search-icon">🔍</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search “strawberries”, “milk”, “sourdough”…" aria-label="Search products" />
            <button type="submit" className="btn btn-primary ripple">Order Now</button>
          </form>

          <div className="hero-stats fade-up" style={{ animationDelay: ".2s" }}>
            <div className="stat"><Counter target={12000} /><span className="stat-label">Happy customers</span></div>
            <div className="stat"><Counter target={500} /><span className="stat-label">Fresh products</span></div>
            <div className="stat"><Counter target={30} /><span className="stat-label">Min. delivery</span></div>
          </div>
        </div>

        <div className="hero-visual fade-up" style={{ animationDelay: ".25s" }} aria-hidden="true">
          <span className="visual-ring"></span>
          <div className="visual-card">
            <p className="visual-label">Today's basket</p>
            <ul className="visual-list">
              <li><span className="v-emoji">🍓</span>Fresh Strawberries</li>
              <li><span className="v-emoji">🥐</span>Butter Croissants</li>
              <li><span className="v-emoji">🥛</span>Farm Fresh Milk</li>
              <li><span className="v-emoji">☕</span>Roasted Coffee</li>
            </ul>
            <div className="visual-divider"></div>
            <p className="visual-quote">&ldquo;Quality you can taste, delivered with care.&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  );
}
