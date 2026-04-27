// Tujuan      : In-memory cache untuk data order pending (antara token creation → webhook paid)
// Caller      : backend/routes/midtrans.js
// Dependensi  : -
// Main Exports: setOrderCache, getOrderCache, deleteOrderCache
// Side Effects: Memory (cleared setelah TTL 2 jam atau setelah diambil)

const TTL_MS = 2 * 60 * 60 * 1000; // 2 jam

/** @type {Map<string, { data: object, timer: ReturnType<typeof setTimeout> }>} */
const cache = new Map();

/**
 * Simpan data order ke cache.
 * @param {string} orderId
 * @param {{ orderSummary: object, canvasPdfBase64: string | null }} data
 */
function setOrderCache(orderId, data) {
  // Clear timer lama jika ada
  if (cache.has(orderId)) {
    clearTimeout(cache.get(orderId).timer);
  }

  const timer = setTimeout(() => {
    cache.delete(orderId);
    console.log(`[OrderCache] TTL expired, removed: ${orderId}`);
  }, TTL_MS);

  cache.set(orderId, { data, timer });
  console.log(`[OrderCache] Stored: ${orderId} (TTL: 2h)`);
}

/**
 * Ambil data order dari cache.
 * @param {string} orderId
 * @returns {{ orderSummary: object, canvasPdfBase64: string | null } | null}
 */
function getOrderCache(orderId) {
  return cache.get(orderId)?.data ?? null;
}

/**
 * Hapus data order dari cache (setelah email berhasil dikirim).
 * @param {string} orderId
 */
function deleteOrderCache(orderId) {
  const entry = cache.get(orderId);
  if (entry) {
    clearTimeout(entry.timer);
    cache.delete(orderId);
    console.log(`[OrderCache] Deleted: ${orderId}`);
  }
}

module.exports = { setOrderCache, getOrderCache, deleteOrderCache };
