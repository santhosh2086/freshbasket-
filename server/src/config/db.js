import mongoose from "mongoose";
import { env } from "./env.js";
import Product from "../models/Product.js";
import { SEED_PRODUCTS } from "../data/products.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected:", mongoose.connection.host);

  // first run: fill the catalogue so the shop is never empty
  if ((await Product.estimatedDocumentCount()) === 0) {
    await Product.insertMany(SEED_PRODUCTS);
    console.log(`Seeded ${SEED_PRODUCTS.length} products`);
  }
}
