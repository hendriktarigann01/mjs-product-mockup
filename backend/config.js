const { Snap } = require("midtrans-client");
const { google } = require("googleapis");
const { Resend } = require("resend");

// ── Midtrans ──────────────────────────────────────────────────────────────────
const snap = new Snap({
    isProduction: false, // ganti true saat production
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// ── Google Sheets ─────────────────────────────────────────────────────────────
const sheets = google.sheets("v4");
const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

// ── Resend (Email) ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_PABRIK = process.env.EMAIL_PABRIK;

// ── Fonnte (WhatsApp) ─────────────────────────────────────────────────────────
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

module.exports = {
    snap,
    sheets,
    auth,
    spreadsheetId,
    resend,
    EMAIL_FROM,
    EMAIL_PABRIK,
    FONNTE_TOKEN,
};