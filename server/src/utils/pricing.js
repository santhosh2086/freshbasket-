import { PRICING } from "../config/env.js";

/**
 * Pure function: lines = [{ price, qty }]. All amounts are whole rupees.
 * The server is the only place totals are decided; the client just displays them.
 */
export function computeTotals(lines, isFirstOrder, pricing = PRICING) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const discount = subtotal > 0 && isFirstOrder ? Math.round(subtotal * pricing.firstOrderDiscountRate) : 0;
  const delivery = subtotal === 0 || subtotal >= pricing.freeDeliveryThreshold ? 0 : pricing.deliveryFee;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}
