// Tujuan      : Supabase data access layer — menggantikan sheets.js untuk orders & checkout_sessions
// Caller      : routes/midtrans.js (create-token, callback), index.js (get order)
// Dependensi  : @supabase/supabase-js, backend config (supabaseAdmin)
// Main Exports: insertOrder, getOrderByOrderId, updateOrderByOrderId, updateCheckoutSessionStatus
// Side Effects: DB write (orders insert/update, checkout_sessions update)

const { supabaseAdmin } = require("../config");

// ── Region helper (sama seperti sheets.js lama) ──────────────────────────────
const JABODETABEK = [
  "JAKARTA", "BOGOR", "DEPOK", "TANGERANG", "BEKASI",
  "KAB. BOGOR", "KAB. TANGERANG", "KAB. BEKASI",
  "KOTA BOGOR", "KOTA DEPOK", "KOTA BEKASI", "KOTA TANGERANG",
];

const JAWA_BALI = [
  "JAWA", "BALI", "YOGYAKARTA", "SURABAYA", "BANDUNG", "SEMARANG",
  "MALANG", "SOLO", "SURAKARTA", "KEDIRI", "MADIUN", "MOJOKERTO",
  "PASURUAN", "PROBOLINGGO", "BLITAR", "JEMBER", "BANYUWANGI",
  "DENPASAR", "BADUNG", "GIANYAR", "TABANAN", "KLUNGKUNG",
  "KARANGASEM", "WONOGIRI", "SRAGEN", "KLATEN", "PURWOKERTO",
  "TEGAL", "PEKALONGAN", "SALATIGA", "KUDUS", "JEPARA",
  "BOYOLALI", "SUKOHARJO", "KARANGANYAR",
];

const hit = (list, ...src) => list.some((kw) => src.some((s) => s.includes(kw)));

function getRegionTag(kabupatenName, provinsiName, address) {
  const kab = (kabupatenName || "").toUpperCase();
  const prov = (provinsiName || "").toUpperCase();
  const addr = (address || "").toUpperCase();

  const tags = [];
  if (hit(JABODETABEK, kab, prov, addr)) tags.push("Jabodetabek");
  if (hit(JAWA_BALI, kab, prov, addr)) tags.push("Jawa-Bali");
  return tags.join(", ") || "Luar Jawa";
}

// ── INSERT order (dipanggil saat create-token) ───────────────────────────────
async function insertOrder(d) {
  const customerName =
    [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
    d.email.split("@")[0];

  const regionTag = getRegionTag(d.kabupatenName, d.provinsiName, d.address);

  const row = {
    order_id: d.orderId,
    customer_name: customerName,
    payment_method: d.paymentMethod || "qris",
    subtotal: d.totalHarga,
    shipping_cost: d.ongkir,
    total_price: d.totalHarga + d.ongkir,
    email: d.email,
    phone: d.phone,
    address: d.address || "",
    postal_code: d.zip || "",
    region_tag: regionTag,
    shipping_courier: d.shippingName || "",
    status: "pending",
    cart_items: d.fullCartItems || d.cartItems || null,
    pdf_url: d.pdfUrl || null,
    product_url: d.productUrl || null,
  };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(row)
    .select("id, order_id")
    .single();

  if (error) {
    console.error("⚠️ Supabase insert order error (non-fatal):", error.message);
    return null;
  }

  console.log(`✅ Supabase order inserted: ${d.orderId} | ${customerName} | region: ${regionTag}`);
  return data;
}

// ── GET order by order_id ────────────────────────────────────────────────────
async function getOrderByOrderId(orderId) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Supabase get order error:", error.message);
    return null;
  }
  return data;
}

// ── UPDATE order status (dipanggil dari webhook callback) ────────────────────
async function updateOrderByOrderId(orderId, updateData) {
  const payload = {};

  if (updateData.status) payload.status = updateData.status;
  if (updateData.tracking_number) payload.tracking_number = updateData.tracking_number;
  if (updateData.shipped_at) payload.shipped_at = updateData.shipped_at;
  if (updateData.pdf_url) payload.pdf_url = updateData.pdf_url;

  const { error } = await supabaseAdmin
    .from("orders")
    .update(payload)
    .eq("order_id", orderId);

  if (error) {
    console.error("⚠️ Supabase update order error:", error.message);
    return;
  }
  console.log(`✅ Supabase order updated: ${orderId} → ${JSON.stringify(payload)}`);
}

// ── UPDATE checkout_session status ───────────────────────────────────────────
async function updateCheckoutSessionStatus(sessionId, status) {
  const { error } = await supabaseAdmin
    .from("checkout_sessions")
    .update({ status })
    .eq("id", sessionId);

  if (error) {
    console.error("⚠️ Supabase checkout session update error:", error.message);
  }
}

module.exports = {
  insertOrder,
  getOrderByOrderId,
  updateOrderByOrderId,
  updateCheckoutSessionStatus,
};
