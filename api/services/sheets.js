const { auth, sheets, spreadsheetId } = require("../config");

// COLUMN STRUCTURE (A-O = 15 kolom):
// A: Tanggal       B: No Order       C: Nama Pembeli   D: Payment Method
// E: Total Harga   F: Ongkir         G: Email          H: Nomor Telp
// I: Alamat        J: Kode Pos       K: Jabodetabek    L: Jawa-Bali
// M: Tanggal Kirim (admin)           N: Resi (admin)   O: Ekspedisi

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

async function logOrderToSheets(d) {
  try {
    const authClient = await auth.getClient();

    // Region detection — pakai kabupatenName/provinsiName (dari WilayahSelect, akurat)
    const kab = (d.kabupatenName || "").toUpperCase();
    const prov = (d.provinsiName || "").toUpperCase();
    const addr = (d.address || "").toUpperCase();

    const jabodetabek = hit(JABODETABEK, kab, prov, addr) ? "Yes" : "No";
    const jawaBali = hit(JAWA_BALI, kab, prov, addr) ? "Yes" : "No";

    const namaPembeli =
      [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
      d.email.split("@")[0];

    const values = [
      [
        new Date().toLocaleDateString("id-ID"), // A: Tanggal
        d.orderId,                              // B: No Order
        namaPembeli,                            // C: Nama Pembeli
        "Midtrans",                             // D: Payment Method
        d.totalHarga,                           // E: Total Harga (tanpa ongkir)
        d.ongkir,                               // F: Ongkir
        d.email,                                // G: Email
        d.phone,                                // H: Nomor Telp
        d.address || "-",                       // I: Alamat
        d.zip || "-",                           // J: Kode Pos
        jabodetabek,                            // K: Jabodetabek
        jawaBali,                               // L: Jawa-Bali
        "",                                     // M: Tanggal Kirim (admin)
        "",                                     // N: Resi (admin → trigger WA)
        d.shippingName || "",                   // O: Ekspedisi (auto)
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Orders!A:O",
      valueInputOption: "USER_ENTERED",
      resource: { values },
      auth: authClient,
    });

    console.log(
      `✅ Sheets: ${d.orderId} | ${namaPembeli} | Jabodeta:${jabodetabek} | JawaBali:${jawaBali}`,
    );
  } catch (error) {
    console.error("⚠️ Sheets log error (non-fatal):", error.message);
  }
}

async function getOrderFromSheets(orderId) {
  try {
    const authClient = await auth.getClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Orders!A:O",
      auth: authClient,
    });
    const rows = response.data.values || [];
    const row = rows.find((r) => r[1] === orderId);
    if (!row) return null;
    return {
      tanggal: row[0],
      orderId: row[1],
      namaPembeli: row[2],
      paymentMethod: row[3],
      totalHarga: row[4],
      ongkir: row[5],
      email: row[6],
      nomorTelp: row[7],
      alamat: row[8],
      kodePOS: row[9],
      jabodetabek: row[10],
      jawaBali: row[11],
      tanggalKirim: row[12],
      resi: row[13],
      ekspedisi: row[14],
    };
  } catch (error) {
    console.error("Sheets get error:", error.message);
    return null;
  }
}

async function updateOrderStatus(orderId, updateData) {
  try {
    const authClient = await auth.getClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Orders!A:O",
      auth: authClient,
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((r) => r[1] === orderId);
    if (rowIndex === -1) return;

    const updatedRow = [...rows[rowIndex]];
    if (updateData.status === "paid") {
      updatedRow[12] = new Date().toLocaleDateString("id-ID"); // M: Tanggal Kirim
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Orders!A${rowIndex + 1}:O${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [updatedRow] },
      auth: authClient,
    });
    console.log(`✅ Updated: ${orderId}`);
  } catch (error) {
    console.error("⚠️ Sheets update error:", error.message);
  }
}

module.exports = { logOrderToSheets, getOrderFromSheets, updateOrderStatus };
