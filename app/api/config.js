// Tujuan      : Inisialisasi semua external service clients
// Caller      : routes/midtrans.js, services/supabase.js, services/email.js, services/whatsapp.js
// Dependensi  : midtrans-client, googleapis, resend, @supabase/supabase-js
// Main Exports: snap, sheets, auth, spreadsheetId, resend, supabaseAdmin, EMAIL_FROM, EMAIL_PABRIK, FONNTE_TOKEN
// Side Effects: Tidak ada — hanya inisialisasi client

const midtransClient = require("midtrans-client");
const { google } = require("googleapis");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// ── Midtrans ──────────────────────────────────────────────────────────────────
let snap;
try {
    snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true", 
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });
} catch (e) {
    console.error("❌ Midtrans init error:", e.message);
}

// ── Google Sheets (LEGACY) ────────────────────────────────────────────────────
let sheets = null;
let auth = null;
try {
    sheets = google.sheets("v4");
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON 
        ? path.resolve(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
        : null;

    auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
} catch (e) {
    console.error("❌ Google Auth init error:", e.message);
}
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

// ── Supabase ──────────────────────────────────────────────────────────────────
let supabaseAdmin = null;
try {
    supabaseAdmin = createClient(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_KEY || "",
    );
} catch (e) {
    console.error("❌ Supabase init error:", e.message);
}

// ── Resend (Email) ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY || "no-key");
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_PABRIK = process.env.EMAIL_PABRIK;

// ── Fonnte (WhatsApp) ─────────────────────────────────────────────────────────
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

module.exports = {
    snap,
    sheets,
    auth,
    spreadsheetId,
    supabaseAdmin,
    resend,
    EMAIL_FROM,
    EMAIL_PABRIK,
    FONNTE_TOKEN,
};