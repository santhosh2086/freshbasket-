import { useState } from "react";

/** Shows the photo; falls back to the emoji if the image fails to load. */
export default function ProductImage({ product, imgClass, emojiClass }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={emojiClass}>{product.emoji}</span>;
  return <img className={imgClass} src={product.image} alt={product.name} loading="lazy" onError={() => setFailed(true)} />;
}
