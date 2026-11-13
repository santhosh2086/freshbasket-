import mongoose from "mongoose";

// Atomic counter → sequential, collision-free order numbers (#FB2026001, …)
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export default mongoose.model("Counter", counterSchema);
