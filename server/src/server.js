import dns from "node:dns";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

// Some routers/ISPs refuse the SRV lookup that mongodb+srv:// needs
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

try {
  await connectDB();
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  if (err.syscall === "querySrv") {
    console.error("DNS blocked the SRV lookup. Set DNS_SERVERS=8.8.8.8,1.1.1.1 in .env, or use the non-SRV connection string.");
  }
  process.exit(1);
}

createApp().listen(env.port, () => console.log(`FreshBasket API running on http://localhost:${env.port}`));