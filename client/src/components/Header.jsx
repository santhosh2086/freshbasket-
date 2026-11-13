import { Link, useLocation } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export default function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { search, setSearch, theme, toggleTheme, cartCount, badgePop, setCartOpen, mobileNavOpen, setMobileNavOpen } = useShop();

  return (
    <header className="site-header" id="siteHeader">
      <div className="header-inner container">
        <Link to="/" className="logo" aria-label="FreshBasket home">
          <span className="logo-basket">🧺</span>
          <span className="logo-text">Fresh<em>Basket</em></span>
        </Link>

        {isHome && (
          <>
            <nav className="main-nav" id="mainNav" aria-label="Primary">
              <a href="#categories">Categories</a>
              <a href="#products">Products</a>
              <Link to="/orders">Order</Link>
              <a href="#footer">Contact</a>
            </nav>

            <div className="header-search">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for fruits, milk, bread…"
                aria-label="Search products"
              />
              <span className="search-icon">🔍</span>
            </div>
          </>
        )}

        <div className="header-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode" aria-label="Toggle dark mode">
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          {isHome ? (
            <>
              <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
                🛒
                {/* key restarts the pop animation on every add */}
                <span key={badgePop} className={"cart-badge" + (badgePop ? " pop" : "")}>{cartCount}</span>
              </button>
              <button
                className="icon-btn menu-toggle"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-label="Open menu"
                aria-expanded={mobileNavOpen}
              >
                <span className="burger"></span>
              </button>
            </>
          ) : (
            <Link to="/" className="btn btn-outline btn-sm continue-shopping-btn" aria-label="Continue shopping">
              <svg className="csb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span className="btn-label">Continue Shopping</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
