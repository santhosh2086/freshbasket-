import { useEffect, useRef, useState } from "react";

const REVIEWS = [
  { stars: "⭐⭐⭐⭐⭐", quote: "FreshBasket is ridiculously fast. My groceries showed up before I finished making the list!", author: "Aishwarya R." },
  { stars: "⭐⭐⭐⭐⭐", quote: "The vegetables are always crisp and fresh. Way better than my usual store.", author: "Karthik S." },
  { stars: "⭐⭐⭐⭐", quote: "Clean app, easy checkout, and the delivery partners are super polite.", author: "Meena V." },
  { stars: "⭐⭐⭐⭐⭐", quote: "I love the dark mode and how simple it is to reorder my weekly basket.", author: "Dharshan P." },
];

export default function Testimonials() {
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = cardRefs.current.indexOf(entry.target);
        if (entry.isIntersecting && idx > -1) setActive(idx);
      });
    }, { root: trackRef.current, threshold: 0.6 });
    cardRefs.current.forEach((c) => c && io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-head fade-up">
          <p className="eyebrow">Loved by Madurai &amp; beyond</p>
          <h2>What our customers say</h2>
        </div>

        <div className="testimonial-track" ref={trackRef}>
          {REVIEWS.map((r, i) => (
            <article className="testimonial-card fade-up" key={r.author} ref={(el) => (cardRefs.current[i] = el)}>
              <p className="stars">{r.stars}</p>
              <p className="quote">"{r.quote}"</p>
              <p className="author">— {r.author}</p>
            </article>
          ))}
        </div>

        <div className="testimonial-dots">
          {REVIEWS.map((r, i) => (
            <span
              key={r.author}
              className={i === active ? "active" : ""}
              onClick={() => cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
