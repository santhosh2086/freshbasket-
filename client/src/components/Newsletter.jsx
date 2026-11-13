import { useShop } from "../context/ShopContext";

export default function Newsletter() {
  const { showToast } = useShop();
  const onSubmit = (e) => {
    e.preventDefault();
    showToast("Subscribed! Check your inbox for 10% off 🎉", "📩");
    e.target.reset();
  };
  return (
    <section className="newsletter">
      <div className="container newsletter-inner fade-up">
        <div>
          <h3>Get 10% off your first order</h3>
          <p>Join our list for fresh deals every week. No spam, just groceries.</p>
        </div>
        <form className="newsletter-form" onSubmit={onSubmit}>
          <input type="email" placeholder="you@example.com" required aria-label="Email address" />
          <button type="submit" className="btn btn-secondary ripple">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
