/**
 * generatePatternPDF.ts
 * Tujuan      : Generate PDF pola jahit (7 pieces) dengan pattern user di-apply ke tiap piece.
 * Caller      : app/checkouts/page.tsx — dipanggil di handleCheckout saat "Proceed to Payment"
 * Dependensi  : jspdf, constants/mockup (DESIGN_PAIRS)
 * Main Exports: generatePatternPDF, generatePatternPDFSafe
 * Side Effects: Canvas API (browser only) — tidak ada storage/network
 *
 * Layout PDF — A3 landscape (420 × 297 mm):
 *
 *  ┌─────────────┬──────────────┬──────────────────────┐
 *  │  Col A      │  Col B       │  Col C (split 2)     │
 *  │  (~125mm)   │  (~120mm)    │  5 (~70mm) │6(~90mm) │
 *  │             │              │            │          │
 *  │  1 (yoke)   │              │  5 (back   │ 6 (back  │
 *  │             │  4           │   body L)  │  body R) │
 *  │  2 (yoke)   │  (front body)│            │          │
 *  │             │              │            │          │
 *  │  3 (collar) │  7 (small)   │            │          │
 *  └─────────────┴──────────────┴────────────┴──────────┘
 *
 * x, y, w, h dalam mm.
 */

import { jsPDF } from "jspdf";
import { DESIGN_PAIRS } from "@/constants/mockup";

// ─── Config pieces ─────────────────────────────────────────────────────────
// A3 landscape = 420 × 297 mm | margin: 8mm | gap antar kolom: 5mm
//
// Col A (kiri)     : x=8,   w=120  → pieces 1, 2, 3 bertumpuk vertikal
// Col B (tengah)   : x=133, w=115  → piece 4 (penuh) + piece 7 (bawah)
// Col C-kiri       : x=253, w=70   → piece 5 (back body kiri)
// Col C-kanan      : x=328, w=85   → piece 6 (back body kanan)
//
// Baris body  : y=8,  h=185mm
// Baris bawah : y=198

const PIECES = [
  // ── Col A: 1 (yoke atas) + 2 (yoke bawah) + 3 (collar) ────────
  { id: 1, label: "1", x: 8,   y: 8,   w: 120, h: 75  },
  { id: 2, label: "2", x: 8,   y: 88,  w: 120, h: 70  },
  { id: 3, label: "3", x: 8,   y: 163, w: 120, h: 90  },

  // ── Col B: Front Body (penuh) + piece 7 (bawah) ────────────────
  { id: 4, label: "4", x: 133, y: 8,   w: 115, h: 185 },
  { id: 7, label: "7", x: 133, y: 198, w: 65,  h: 60  },

  // ── Col C: Back Body split — 5 (kiri) dan 6 (kanan) side-by-side
  { id: 5, label: "5", x: 253, y: 8,   w: 70,  h: 245 },
  { id: 6, label: "6", x: 328, y: 8,   w: 85,  h: 245 },
] as const;

// Dynamic base path for piece images based on product label
function getPieceBase(productLabel: string): string {
  // Assumes pieces are stored under public/products/piece/<label>/
  return `/products/piece/${productLabel}/`; // e.g., /products/piece/fajamas/
}

const TILE = 200; // larger tile for full‑size piece image
const GAP = 0; // no gap – pieces flush together
const CELL = TILE + GAP;

// ─── Image loader dengan CORS support ──────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// ─── Build pattern canvas (sama persis dengan Canvas.tsx) ──────────────────
async function buildPatternCanvas(
  designSrc: string | null,
  photos: (string | null)[],
  size: number,
): Promise<HTMLCanvasElement | null> {
  const activePhotos = photos.filter(Boolean) as string[];
  const usePhotos    = activePhotos.length > 0;

  if (!designSrc && !usePhotos) return null;

  const pat    = document.createElement("canvas");
  pat.width    = size;
  pat.height   = size;
  const ctx    = pat.getContext("2d")!;
  const cols   = Math.ceil(size / CELL) + 2;
  const rows   = Math.ceil(size / CELL) + 2;

  if (usePhotos) {
    const imgs = await Promise.all(activePhotos.map(loadImage));
    const count = imgs.length;

    if (count === 1) {
      for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++) {
        ctx.drawImage(imgs[0], c * CELL,               r * CELL,               TILE, TILE);
        ctx.drawImage(imgs[0], c * CELL + CELL / 2,    r * CELL + CELL / 2,    TILE, TILE);
      }
    } else if (count === 2) {
      for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++) {
        ctx.drawImage(imgs[0], c * CELL,            r * CELL,            TILE, TILE);
        ctx.drawImage(imgs[1], c * CELL + CELL / 2, r * CELL + CELL / 2, TILE, TILE);
      }
    } else {
      for (let r = -1; r < rows; r++) {
        const img     = imgs[Math.abs(r) % 3];
        const offsetX = r % 2 !== 0 ? CELL / 2 : 0;
        for (let c = -1; c < cols; c++)
          ctx.drawImage(img, c * CELL + offsetX, r * CELL, TILE, TILE);
      }
    }
  } else if (designSrc) {
    const pairSrc = DESIGN_PAIRS[designSrc] ?? null;
    const [dImg, pImg] = await Promise.all([
      loadImage(designSrc),
      pairSrc ? loadImage(pairSrc) : Promise.resolve(null),
    ]);
    for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++) {
      ctx.drawImage(dImg,         c * CELL,            r * CELL,            TILE, TILE);
      ctx.drawImage(pImg ?? dImg, c * CELL + CELL / 2, r * CELL + CELL / 2, TILE, TILE);
    }
  }

  return pat;
}

// ─── Render 1 piece ke offscreen canvas dengan pattern masked ──────────────
async function renderPiece(
  pieceImg:   HTMLImageElement,
  patCanvas:  HTMLCanvasElement | null,
  pxW: number,
  pxH: number,
): Promise<HTMLCanvasElement> {
  const c   = document.createElement("canvas");
  c.width   = pxW;
  c.height  = pxH;
  const ctx = c.getContext("2d")!;

  if (patCanvas) {
    // 1. Draw piece sebagai mask
    ctx.drawImage(pieceImg, 0, 0, pxW, pxH);

    // 2. Apply pattern hanya di area piece (source-atop)
    ctx.globalCompositeOperation = "source-atop";
    const pattern = ctx.createPattern(patCanvas, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, pxW, pxH);
    } else {
      ctx.drawImage(patCanvas, 0, 0, pxW, pxH);
    }
    ctx.globalCompositeOperation = "source-over";

    // 3. Multiply texture piece di atas (subtle shadow/fold)
    ctx.globalAlpha = 0.12;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(pieceImg, 0, 0, pxW, pxH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // 4. Outline piece tetap terlihat — draw lagi dengan multiply ringan
    ctx.globalAlpha = 0.4;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(pieceImg, 0, 0, pxW, pxH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  } else {
    // Tanpa pattern — render piece plain
    ctx.drawImage(pieceImg, 0, 0, pxW, pxH);
  }

  return c;
}

// ─── Main: generate PDF dan return base64 string ───────────────────────────
export async function generatePatternPDF(params: {
  designSrc:    string | null;
  photos:       (string | null)[];
  productLabel: string;
  orderId?:     string;
}): Promise<string> {
  const { designSrc, photos, productLabel, orderId } = params;

  // A3 landscape (mm)
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const PW  = pdf.internal.pageSize.getWidth();   // 420
  const PH  = pdf.internal.pageSize.getHeight();  // 297

  // DPI untuk convert mm → px (96dpi)
  const MM_TO_PX = 96 / 25.4;

  // Build pattern canvas sekali, pakai ulang untuk semua pieces
  // Pakai size 1000px agar pattern cukup dense
  const PATTERN_SIZE = 1000;
  const patCanvas = await buildPatternCanvas(designSrc, photos, PATTERN_SIZE);

  // Tentukan layout pieces berdasarkan productLabel
  const isSinglePiece = productLabel === "socks" || productLabel === "totebag";
  const targetPieces = isSinglePiece 
    ? [{ id: 1, label: "Full Piece", x: 8, y: 8, w: 404, h: 281 }] 
    : PIECES;

  // Load piece images paralel
  const pieceImgs = await Promise.all(
    targetPieces.map((p) =>
      loadImage(`${getPieceBase(productLabel)}${p.id}.png`).catch(() => null)
    )
  );

  // Render setiap piece dan tambahkan ke PDF
  for (let i = 0; i < targetPieces.length; i++) {
    const piece  = targetPieces[i];
    const pieceImg = pieceImgs[i];
    if (!pieceImg) {
      console.warn(`[PDF] Missing image for piece ${piece.id}`);
      continue;
    }

    // Gunakan ukuran pixel asli gambar untuk render agar resolusi maksimal
    const pxW = pieceImg.width;
    const pxH = pieceImg.height;

    const pieceCanvas = await renderPiece(pieceImg, patCanvas, pxW, pxH);
    const dataUrl     = pieceCanvas.toDataURL("image/png");

    // Contain logic: draw image proportionally within piece bounding box
    const imgAspect = pxW / pxH;
    const boxAspect = piece.w / piece.h;
    let drawW = piece.w;
    let drawH = piece.h;

    if (imgAspect > boxAspect) {
      drawH = piece.w / imgAspect;
    } else {
      drawW = piece.h * imgAspect;
    }

    const drawX = piece.x + (piece.w - drawW) / 2;
    const drawY = piece.y + (piece.h - drawH) / 2;

    pdf.addImage(dataUrl, "PNG", drawX, drawY, drawW, drawH);

    // Label kecil di bawah piece (hanya jika bukan single piece)
    if (!isSinglePiece) {
      pdf.setFontSize(6);
      pdf.setTextColor(150);
      pdf.text(piece.label, piece.x + 1, piece.y + piece.h + 3);
    }
  }

  // Header info
  pdf.setFontSize(9);
  pdf.setTextColor(50);
  pdf.text(`${productLabel} — Pattern Order`, 10, PH - 10);
  if (orderId) {
    pdf.setFontSize(7);
    pdf.setTextColor(150);
    pdf.text(orderId, PW - 10, PH - 10, { align: "right" });
  }

  // Return sebagai base64 string (tanpa prefix "data:application/pdf;base64,")
  return pdf.output("datauristring").split(",")[1];
}

/**
 * generatePatternPDFSafe — wrapper dengan timeout race.
 *
 * Dipakai di handleCheckout: generate PDF langsung (tanpa storage),
 * race vs timeout. Jika timeout atau tidak ada design → return null.
 * Payment tidak pernah diblokir oleh kegagalan PDF.
 *
 * @param timeoutMs - batas waktu generate, default 8000ms
 */
export async function generatePatternPDFSafe(params: {
  designSrc:    string | null;
  photos:       (string | null)[];
  productLabel: string;
  orderId?:     string;
  timeoutMs?:   number;
}): Promise<string | null> {
  const { timeoutMs = 8000, ...pdfParams } = params;

  const hasDesign = pdfParams.designSrc || pdfParams.photos.some(Boolean);
  if (!hasDesign) {
    console.log("[PDF] No design/photo — skipping PDF");
    return null;
  }

  const pdfPromise = generatePatternPDF(pdfParams)
    .then((b64) => { console.log("[PDF] Generated OK"); return b64; })
    .catch((err) => { console.error("[PDF] Generation failed:", err.message); return null; });

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => {
      console.warn(`[PDF] Timeout after ${timeoutMs}ms — skipping PDF attachment`);
      resolve(null);
    }, timeoutMs)
  );

  return Promise.race([pdfPromise, timeoutPromise]);
}