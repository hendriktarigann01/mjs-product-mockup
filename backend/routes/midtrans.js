// Tujuan      : Route handler Midtrans — buat Snap token dan proses webhook callback
// Caller      : backend/index.js (mounted di /api/midtrans)
// Dependensi  : snap (config), sheets, email, orderCache
// Main Exports: router (Express Router)
// Side Effects: Midtrans Snap API, Google Sheets write, Resend email (hanya setelah paid)
const { Router } = require("express");
const { snap } = require("../config");
const { logOrderToSheets, updateOrderStatus } = require("../services/sheets");
const { sendOrderEmails } = require("../services/email");
const { setOrderCache, getOrderCache, deleteOrderCache } = require("../services/orderCache");

const router = Router();

// ── POST /api/midtrans/create-token ──────────────────────────────────────────
router.post("/create-token", async (req, res) => {
  try {
    console.log("📥 Payload:", JSON.stringify(req.body, null, 2));

    const {
      transactionDetails,
      customerDetails,
      itemDetails = [],
      canvasPdfBase64,
    } = req.body;

    if (!transactionDetails?.orderId || !transactionDetails?.grossAmount) {
      return res.status(400).json({ error: "Missing orderId or grossAmount" });
    }

    const orderId = String(transactionDetails.orderId).trim();
    const grossAmount = parseInt(String(transactionDetails.grossAmount));

    if (isNaN(grossAmount) || grossAmount <= 0) {
      return res.status(400).json({ error: "gross_amount must be positive number" });
    }

    // Validasi sum item_details
    const itemsSum = itemDetails.reduce((sum, item) => {
      const p = parseInt(String(item.price)) * parseInt(String(item.quantity));
      return sum + (isNaN(p) ? 0 : p);
    }, 0);

    if (Math.abs(grossAmount - itemsSum) > 100000) {
      return res.status(400).json({
        error: "gross_amount does not match item_details sum",
        expected: itemsSum,
        received: grossAmount,
        diff: grossAmount - itemsSum,
      });
    }

    console.log(`✅ Validated: ${orderId} | gross=${grossAmount} | items=${itemsSum}`);

    // Midtrans payload
    const midtransPayload = {
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      customer_details: {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName || "",
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      item_details: itemDetails
        .map((item) => ({
          id: String(item.id),
          price: parseInt(String(item.price)),
          quantity: parseInt(String(item.quantity)),
          name: String(item.name),
        }))
        .filter((item) => item.price > 0 && item.quantity > 0),
      callbacks: {
        finish: `${process.env.APP_URL || "http://localhost:3000"}/order-success`,
        error: `${process.env.APP_URL || "http://localhost:3000"}/order-error`,
        pending: `${process.env.APP_URL || "http://localhost:3000"}/order-pending`,
      },
    };

    const transaction = await snap.createTransaction(midtransPayload);
    console.log("✅ Midtrans token created");

    // Ongkir = item dengan id "SHIPPING"
    const shippingItem = itemDetails.find((i) => i.id === "SHIPPING");
    const ongkir = shippingItem ? parseInt(String(shippingItem.price)) : 0;
    const totalHarga = grossAmount - ongkir;

    // Log ke Google Sheets
    await logOrderToSheets({
      orderId,
      firstName: customerDetails.firstName,
      lastName: customerDetails.lastName || "",
      email: customerDetails.email,
      phone: customerDetails.phone,
      totalHarga,
      ongkir,
      address: customerDetails.address || "",
      zip: customerDetails.zip || "",
      kabupatenName: customerDetails.kabupatenName || "",
      provinsiName: customerDetails.provinsiName || "",
      shippingName: customerDetails.shippingName || shippingItem?.name || "",
      paymentMethod: "Midtrans",
    });

    // Kirim email: customer confirmation + pabrik (fire-and-forget)
    const orderSummary = {
      orderId,
      customerName: [customerDetails.firstName, customerDetails.lastName]
        .filter(Boolean)
        .join(" "),
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address || "",
      zip: customerDetails.zip || "",
      items: itemDetails.filter((i) => i.id !== "SHIPPING"),
      ongkir,
      totalHarga,
      grossAmount,
      shippingName: customerDetails.shippingName || "",
    };

    // Simpan order data ke in-memory cache — email dikirim setelah webhook paid masuk
    setOrderCache(orderId, { orderSummary, canvasPdfBase64: canvasPdfBase64 ?? null });

    res.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error("❌ Midtrans error:", error);
    if (error.ApiResponse?.error_messages) {
      return res.status(400).json({
        error: "Midtrans API error",
        error_messages: error.ApiResponse.error_messages,
      });
    }
    res.status(500).json({ error: error.message || "Failed to create transaction token" });
  }
});

// ── POST /api/midtrans/callback (Midtrans webhook) ────────────────────────────────
router.post("/callback", async (req, res) => {
  try {
    const { order_id, transaction_status } = req.body;
    console.log(`📩 Callback: ${order_id} → ${transaction_status}`);

    const statusMap = {
      capture: "paid",
      settlement: "paid",
      pending: "pending",
      deny: "failed",
      cancel: "cancelled",
      expire: "expired",
    };
    const status = statusMap[transaction_status] || transaction_status;

    await updateOrderStatus(order_id, { status });

    if (status === "paid") {
      console.log(`✅ Order ${order_id} paid`);

      // Ambil order data dari cache — kirim email sekarang (setelah payment confirmed)
      const cached = getOrderCache(order_id);
      if (cached) {
        const { orderSummary, canvasPdfBase64 } = cached;
        sendOrderEmails(orderSummary, canvasPdfBase64).catch((e) =>
          console.error("⚠️ Email error (non-fatal):", e.message),
        );
        deleteOrderCache(order_id);
      } else {
        console.warn(`⚠️ [OrderCache] Data not found for: ${order_id} — email skipped`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
