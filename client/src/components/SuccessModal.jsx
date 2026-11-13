import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const COLORS = ["#B15E3D", "#74815F", "#A6832E", "#F2ECE1", "#4B6B4F"];

export default function SuccessModal() {
  const { successOrderId, setSuccessOrderId } = useShop();
  const open = !!successOrderId;
  const modalRef = useRef(null);
  const canvasRef = useRef(null);
  const close = () => setSuccessOrderId(null);

  // confetti burst whenever the modal opens
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const modal = modalRef.current;
    canvas.width = modal.offsetWidth;
    canvas.height = modal.offsetHeight;
    const ctx = canvas.getContext("2d");

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speedY: 2 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    let frame = 0, raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speedY; p.x += p.speedX; p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
      });
      if (++frame < 150) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const continueShopping = () => {
    close();
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className={"overlay" + (open ? " show" : "")} onClick={close}></div>
      <div ref={modalRef} className={"modal success-modal" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="successTitle">
        <canvas id="confettiCanvas" ref={canvasRef}></canvas>
        <div className="success-check">
          <svg viewBox="0 0 52 52">
            <circle className="check-circle" cx="26" cy="26" r="24" fill="none" />
            <path className="check-mark" fill="none" d="M14 27l7 7 16-16" />
          </svg>
        </div>
        <h3 id="successTitle">🎉 Order Placed Successfully!</h3>
        <p className="success-msg">
          Thank you for shopping with FreshBasket.<br />
          Your groceries will arrive in approximately 30 minutes.
        </p>
        <p className="order-id">Order ID: <strong>{successOrderId}</strong></p>
        <div className="success-actions">
          <button className="btn btn-outline" onClick={continueShopping}>Continue Shopping</button>
          <Link className="btn btn-primary" to="/orders" onClick={close}>View Orders</Link>
        </div>
      </div>
    </>
  );
}
