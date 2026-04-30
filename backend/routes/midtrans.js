// Tujuan      : Route handler Midtrans — buat Snap token (QRIS only) dan proses webhook callback
// Caller      : backend/index.js (mounted di /api/midtrans)
// Dependensi  : snap (config), supabase service, email service
// Main Exports: router (Express Router)
// Side Effects: Midtrans Snap API, Supabase orders write/update, Resend email customer (pabrik HOLD)
//               File read/delete dari public/temp/{orderId}.pdf dan {orderId}.json

const path = require("path");
const fs = require("fs");
const { Router } = require("express");
const { snap } = require("../config");
const { insertOrder, updateOrderByOrderId } = require("../services/supabase");
const { sendOrderEmails, sendOrderEmailCustomerOnly } = require("../services/email");

const router = Router();

// Direktori temp Next.js (public/temp) — diakses langsung dari filesystem
// Karena backend dan Next.js berjalan di mesin yang sama
const TEMP_DIR = path.resolve(__dirname, "../../public/temp");

/**
 * Baca file dari public/temp/{orderId}.pdf dan {orderId}.json
 * @param {string} orderId
 * @returns {{ orderSummary: object|null, pdfBase64: string|null }}
 */
function readTempOrderFiles(orderId) {
  const jsonPath = path.join(TEMP_DIR, `${orderId}.json`);
  const pdfPath = path.join(TEMP_DIR, `${orderId}.pdf`);

  let orderSummary = null;
  let pdfBase64 = null;

  try {
    if (fs.existsSync(jsonPath)) {
      orderSummary = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      console.log(`[TempFile] JSON read: ${orderId}.json`);
    } else {
      console.warn(`[TempFile] JSON not found: ${orderId}.json`);
    }
  } catch (e) {
    console.error(`[TempFile] JSON read error:`, e.message);
  }

  try {
    if (fs.existsSync(pdfPath)) {
      pdfBase64 = fs.readFileSync(pdfPath).toString("base64");
      console.log(`[TempFile] PDF read: ${orderId}.pdf`);
    } else {
      console.log(`[TempFile] No PDF for: ${orderId}`);
    }
  } catch (e) {
    console.error(`[TempFile] PDF read error:`, e.message);
  }

  return { orderSummary, pdfBase64 };
}

/**
 * Hapus file temp setelah email terkirim
 * @param {string} orderId
 */
function deleteTempOrderFiles(orderId) {
  const jsonPath = path.join(TEMP_DIR, `${orderId}.json`);
  const pdfPath = path.join(TEMP_DIR, `${orderId}.pdf`);

  for (const [label, filePath] of [
    ["json", jsonPath],
    ["pdf", pdfPath],
  ]) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[TempFile] Deleted: ${orderId}.${label}`);
      }
    } catch (e) {
      console.error(`[TempFile] Delete error (${label}):`, e.message);
    }
  }
}

// ── POST /api/midtrans/create-token ──────────────────────────────────────────
router.post("/create-token", async (req, res) => {
  try {
    console.log("📥 Payload:", JSON.stringify(req.body, null, 2));

    const {
      transactionDetails,
      customerDetails,
      itemDetails = [],
      pdfTempFilename,   // orderId sebagai referensi file temp
      designImageUrl,    // Cloudinary URL hasil capture canvas PNG (opsional)
    } = req.body;

    if (!transactionDetails?.orderId || !transactionDetails?.grossAmount) {
      return res.status(400).json({ error: "Missing orderId or grossAmount" });
    }

    const orderId = String(transactionDetails.orderId).trim();
    const grossAmount = parseInt(String(transactionDetails.grossAmount));

    if (isNaN(grossAmount) || grossAmount <= 0) {
      return res
        .status(400)
        .json({ error: "gross_amount must be positive number" });
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

    console.log(
      `✅ Validated: ${orderId} | gross=${grossAmount} | items=${itemsSum}`,
    );

    const isCashier = req.body.paymentMethod === "cashier";

    // Insert ke Supabase orders (dilakukan sebelum Midtrans / lsg return jika cashier)
    const fullCartItems = req.body.fullCartItems || null;
    const productUrl = req.body.productUrl || null;

    const shippingItem = itemDetails.find((i) => i.id === "SHIPPING");
    const ongkir = shippingItem ? parseInt(String(shippingItem.price)) : 0;
    const totalHarga = grossAmount - ongkir;

    await insertOrder({
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
      paymentMethod: isCashier ? "Cashier" : "QRIS",
      cartItems: itemDetails,
      fullCartItems,
      pdfUrl: designImageUrl || null,
      productUrl,
    });

    if (designImageUrl) {
      console.log(`[Cloudinary] Design image saved: ${designImageUrl}`);
    }
    console.log(`[TempFile] pdfTempFilename received: ${pdfTempFilename ?? "none"}`);

    if (isCashier) {
      console.log("✅ Order created (Payment at Cashier)");
      return res.json({
        token: null,
        redirectUrl: `${process.env.APP_URL || "https://happify.id"}/order-success?order_id=${orderId}`,
        isCashier: true,
      });
    }

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
        finish: `${process.env.APP_URL || "https://happify.id"}/order-success`,
        error: `${process.env.APP_URL || "https://happify.id"}/order-error`,
        pending: `${process.env.APP_URL || "https://happify.id"}/order-pending`,
      },
    };

    const transaction = await snap.createTransaction(midtransPayload);
    console.log("✅ Midtrans token created (QRIS only)");

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
    res
      .status(500)
      .json({ error: error.message || "Failed to create transaction token" });
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

    await updateOrderByOrderId(order_id, { status });

    if (status === "paid") {
      console.log(`✅ Order ${order_id} paid`);

      // Baca file temp dari disk (untuk data order summary & kirim email customer)
      const { orderSummary, pdfBase64 } = readTempOrderFiles(order_id);

      if (orderSummary) {
        // ── Email customer konfirmasi (TETAP AKTIF) ────────────────────────
        // ── Email pabrik (HOLD — ganti dengan Cloudinary PNG, skip PDF) ───
        sendOrderEmailCustomerOnly(orderSummary).catch((e) =>
          console.error("⚠️ Email customer error (non-fatal):", e.message),
        );
        // Hapus file temp
        deleteTempOrderFiles(order_id);
      } else {
        console.warn(
          `⚠️ [TempFile] Order data not found for: ${order_id} — email skipped`,
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
