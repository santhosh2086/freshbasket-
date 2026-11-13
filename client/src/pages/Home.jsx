import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import Products from "../components/Products";
import TrustStrip from "../components/TrustStrip";
import Testimonials from "../components/Testimonials";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";
import CartPanel from "../components/CartPanel";
import OrderModal from "../components/OrderModal";
import SuccessModal from "../components/SuccessModal";

export default function Home() {
  useScrollReveal();
  const { hash } = useLocation();

  // jump to #section when arriving with a hash from another route
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <MobileNav />
      <a className="skip-link" href="#main">Skip to content</a>
      <main id="main">
        <Hero />
        <Categories />
        <Products />
        <TrustStrip />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
      <CartPanel />
      <OrderModal />
      <SuccessModal />
    </>
  );
}
