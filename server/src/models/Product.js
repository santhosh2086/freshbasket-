import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true }, // stable numeric id used by the cart
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["fruits", "vegetables", "dairy", "bakery", "snacks", "beverages"], index: true },
    price: { type: Number, required: true, min: 0 }, // whole rupees
    unit: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 4 },
    emoji: { type: String, default: "🛒" },
    image: { type: String, default: "" },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
