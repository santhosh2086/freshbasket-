import { Router } from "express";
import Product from "../models/Product.js";
import { PRICING } from "../config/env.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// GET /api/products  → { products, pricing }
router.get("/", asyncHandler(async (_req, res) => {
  const products = await Product.find({}, "-_id -__v -createdAt -updatedAt").sort({ id: 1 }).lean();
  res.json({ products, pricing: PRICING });
}));

export default router;
