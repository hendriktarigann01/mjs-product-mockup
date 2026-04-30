// Tujuan      : Inisialisasi semua external service clients
// Caller      : routes/midtrans.js, services/supabase.js, services/email.js, services/whatsapp.js
// Dependensi  : midtrans-client, googleapis, resend, @supabase/supabase-js
// Main Exports: snap, sheets, auth, spreadsheetId, resend, supabaseAdmin, EMAIL_FROM, EMAIL_PABRIK, FONNTE_TOKEN
// Side Effects: Tidak ada — hanya inisialisasi client

const { Snap } = require("midtrans-client");
const { google } = require("googleapis");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

// ── Midtrans ──────────────────────────────────────────────────────────────────
const snap = new Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true", 
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ── Google Sheets (LEGACY — tetap ada untuk backward compat / notify-resi) ───
const sheets = google.sheets("v4");
const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

// ── Supabase (service-role key — full DB access) ─────────────────────────────
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
);

// ── Resend (Email) — opsional, tidak crash jika API key kosong ────────────
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "";
const EMAIL_PABRIK = process.env.EMAIL_PABRIK || "";

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