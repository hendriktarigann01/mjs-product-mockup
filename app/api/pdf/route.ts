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
    await ensureTempDir();

    const body = await req.json();
    const { orderId, pdfBase64, orderSummary } = body as {
      orderId: string;
      pdfBase64: string | null;
      orderSummary: object;
    };

    if (!orderId || !orderSummary) {
      return NextResponse.json(
        { error: "Missing orderId or orderSummary" },
        { status: 400 }
      );
    }

    // Simpan order summary JSON (selalu ada)
    const jsonPath = path.join(TEMP_DIR, `${orderId}.json`);
    await writeFile(jsonPath, JSON.stringify(orderSummary), "utf-8");

    // Simpan PDF jika ada
    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const pdfPath = path.join(TEMP_DIR, `${orderId}.pdf`);
      await writeFile(pdfPath, pdfBuffer);
      console.log(`[PDF/save] Saved: ${orderId}.pdf + ${orderId}.json`);
    } else {
      console.log(`[PDF/save] Saved: ${orderId}.json (no PDF)`);
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[PDF/save] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
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
