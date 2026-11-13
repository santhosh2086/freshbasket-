import { useShop } from "../context/ShopContext";

export default function ToastContainer() {
  const { toasts } = useShop();
  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((t) => (
        <div className="toast" key={t.id}><span>{t.icon}</span><span>{t.message}</span></div>
      ))}
    </div>
  );
}
