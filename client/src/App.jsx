import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ShopProvider } from "./context/ShopContext";
import useRipple from "./hooks/useRipple";
import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";
import Home from "./pages/Home";
import Orders from "./pages/Orders";

function Shell() {
  useRipple();
  const { pathname, hash } = useLocation();

  // new page → start at the top (unless navigating to a #section)
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  useEffect(() => {
    document.title = pathname === "/orders" ? "My Orders — FreshBasket" : "FreshBasket — Fresh Groceries Delivered in Minutes";
  }, [pathname]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  );
}
