import { useMemo } from "react";
import { CATEGORIES } from "../data/products";
import { useShop } from "../context/ShopContext";
import ProductCard from "./ProductCard";

export default function Products() {
  const { products, productsStatus, loadProducts, search, setSearch, category, setCategory, sort, setSort } = useShop();

  const list = useMemo(() => {
    let l = [...products];
    if (category !== "all") l = l.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) l = l.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q));
    if (sort === "price-asc") l.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") l.sort((a, b) => b.price - a.price);
    else if (sort === "rating-desc") l.sort((a, b) => b.rating - a.rating);
    return l;
  }, [products, search, category, sort]);

  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-head fade-up">
          <p className="eyebrow">Picked fresh today</p>
          <h2>Featured products</h2>
        </div>

        <div className="products-toolbar fade-up">
          <div className="toolbar-search">
            <span className="search-icon">🔍</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products" />
          </div>

          <div className="toolbar-chips">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={"chip" + (category === c.id ? " active" : "")} onClick={() => setCategory(c.id)}>
                {c.id === "all" ? "All" : c.label}
              </button>
            ))}
          </div>

          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="default">Sort: Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Rating: High to Low</option>
          </select>
        </div>

        {productsStatus === "loading" && <p className="no-results">Loading fresh products…</p>}
        {productsStatus === "error" && (
          <p className="no-results">
            Couldn't load products. <button type="button" className="btn btn-outline btn-sm" onClick={loadProducts}>Try again</button>
          </p>
        )}
        {productsStatus === "ready" && list.length === 0 && <p className="no-results">No products match your search. Try a different keyword 🙂</p>}

        <div className="product-grid">
          {/* key includes sort/category so the staggered entrance replays on change, like the original re-render */}
          {list.map((p, i) => <ProductCard key={`${category}-${sort}-${p.id}`} product={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}
