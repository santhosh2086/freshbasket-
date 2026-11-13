// npm run seed — resets prices/details of every catalogue product from data/products.js (upsert by id)
import mongoose from "mongoose";
import { env } from "./config/env.js";
import Product from "./models/Product.js";
import { SEED_PRODUCTS } from "./data/products.js";

await mongoose.connect(env.mongoUri);
await Product.bulkWrite(SEED_PRODUCTS.map((p) => ({ updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true } })));
console.log(`Upserted ${SEED_PRODUCTS.length} products`);
await mongoose.disconnect();
