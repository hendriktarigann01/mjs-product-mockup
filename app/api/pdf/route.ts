// Tujuan      : API route untuk simpan file PDF + order summary ke public/temp/ dan menghapusnya
// Caller      : app/checkouts/page.tsx (POST), backend/routes/midtrans.js (DELETE via internal cleanup)
// Dependensi  : fs/promises, path (Node.js built-in)
// Main Exports: POST (simpan), DELETE (hapus)
// Side Effects: File write/delete ke public/temp/ — file bersifat sementara (per order)

import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const TEMP_DIR = path.join(process.cwd(), "public", "temp");

// ── Pastikan direktori temp ada ──────────────────────────────────────────────
async function ensureTempDir() {
  await mkdir(TEMP_DIR, { recursive: true });
}

// ── POST /api/pdf — Simpan PDF dan order summary ke public/temp/ ─────────────
export async function POST(req: NextRequest) {
  try {
    // Fitur simpan ke disk dimatikan sementara karena Vercel read-only
    // Data order sudah aman di Supabase via backend
    return NextResponse.json({ success: true, message: "PDF saving is temporarily disabled" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/pdf — Hapus file sementara setelah email terkirim ─────────────
export async function DELETE(req: NextRequest) {
  try {
    const { orderId } = await req.json() as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const pdfPath = path.join(TEMP_DIR, `${orderId}.pdf`);
    const jsonPath = path.join(TEMP_DIR, `${orderId}.json`);

    const results: string[] = [];

    for (const [label, filePath] of [
      ["pdf", pdfPath],
      ["json", jsonPath],
    ] as [string, string][]) {
      try {
        await unlink(filePath);
        results.push(`${label} deleted`);
      } catch {
        results.push(`${label} not found (skip)`);
      }
    }

    console.log(`[PDF/delete] ${orderId}: ${results.join(", ")}`);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[PDF/delete] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
