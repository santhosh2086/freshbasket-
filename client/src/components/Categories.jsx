import { CATEGORIES } from "../data/products";
import { useShop } from "../context/ShopContext";

export default function Categories() {
  const { category, setCategory } = useShop();
  return (
    <section className="categories" id="categories">
      <div className="container">
        <div className="section-head fade-up">
          <p className="eyebrow">Shop by aisle</p>
          <h2>Everything on your list</h2>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={"category-card fade-up" + (category === c.id ? " active" : "")}
              onClick={() => {
                setCategory(c.id);
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="cat-emoji">{c.emoji}</span><span className="cat-name">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
