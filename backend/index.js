require("dotenv").config();

const express = require("express");
const cors = require("cors");

const midtransRouter = require("./routes/midtrans");
const { getOrderByOrderId } = require("./services/supabase");
const { sendWAResi } = require("./services/whatsapp");

const app = express();
app.use(cors());
app.use(express.json({ limit: "150mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/midtrans", midtransRouter);

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/notify-resi
// Dipanggil oleh Google Apps Script saat admin input resi di Sheets
// Body: { phone, customerName, orderId, resi, ekspedisi }
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/notify-resi", async (req, res) => {
  try {
    const { phone, customerName, orderId, resi, ekspedisi } = req.body;

    if (!phone || !resi) {
      return res.status(400).json({ error: "Missing phone or resi" });
    }

    await sendWAResi({ phone, customerName, orderId, resi, ekspedisi });
    res.json({ success: true });
  } catch (error) {
    console.error("Notify resi error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/:orderId
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const order = await getOrderByOrderId(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});