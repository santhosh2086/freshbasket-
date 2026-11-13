import { useShop } from "../context/ShopContext";

// Rendered OUTSIDE <Header> on purpose: the header uses backdrop-filter, which
// would become the containing block for this position:fixed drawer.
export default function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen, search, setSearch } = useShop();
  const close = () => setMobileNavOpen(false);

  return (
    <>
      <div className={"mobile-nav-overlay" + (mobileNavOpen ? " show" : "")} onClick={close}></div>
      <div className={"mobile-nav" + (mobileNavOpen ? " open" : "")}>
        <div className="mobile-search">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products" />
        </div>
        <a href="#categories" onClick={close}>Categories</a>
        <a href="#products" onClick={close}>Products</a>
        <a href="#testimonials" onClick={close}>Testimonials</a>
        <a href="#footer" onClick={close}>Contact</a>
      </div>
    </>
  );
}
