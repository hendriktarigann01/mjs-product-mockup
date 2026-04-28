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

const PIECES = [
  // ── Kolom A (Sleeves/Yokes) ────────
  { id: 1, label: "1", x: 8, y: 10, w: 75, h: 60 },
  { id: 2, label: "2", x: 8, y: 75, w: 75, h: 60 },
  { id: 3, label: "3", x: 8, y: 140, w: 75, h: 60 },

  // ── Kolom B (Badan Depan - Lebar) ──
  // w: 148 adalah angka kunci agar h: 195 tidak menciutkan gambar 2236px
  { id: 4, label: "4", x: 88, y: 10, w: 148, h: 195 },
  // Piece 7 (Pocket/Small) diletakkan di bawah piece 4
  { id: 7, label: "7", x: 88, y: 210, w: 60, h: 65 },

  // ── Kolom C (Badan Belakang L/R) ───
  // w: 88 adalah angka kunci agar h: 195 pas untuk gambar 1280px
  // Piece 5 dan 6 diletakkan berdampingan (side-by-side)
  { id: 5, label: "5", x: 242, y: 10, w: 86, h: 195 },
  { id: 6, label: "6", x: 330, y: 10, w: 86, h: 195 },
] as const;

// Dynamic base path for piece images based on product label
function getPieceBase(productLabel: string): string {
  return `/products/piece/${productLabel}/`;
}

// ─── Konstanta pattern — HARUS identik dengan Canvas.tsx ───────────────────
const TILE = 30;
const GAP = 50;
const CELL = TILE + GAP; // = cellW = cellH di Canvas.tsx

// Pattern canvas size — sama dengan SIZE di Canvas.tsx agar density match
const PATTERN_SIZE = 500;

// ─── Image loader dengan CORS support ──────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// ─── Build pattern canvas — IDENTIK dengan logic di Canvas.tsx ─────────────
//
// Canvas.tsx pakai SIZE=500 sebagai ukuran canvas pattern.
// PDF pakai PATTERN_SIZE=500 yang sama agar tile density persis match.
//
// Loop structure, TILE, GAP, offset semua disamakan 1:1 dengan Canvas.tsx.
async function buildPatternCanvas(
  designSrc: string | null,
  photos: (string | null)[],
): Promise<HTMLCanvasElement | null> {
  const activePhotos = photos.filter(Boolean) as string[];
  const usePhotos = activePhotos.length > 0;

  if (!designSrc && !usePhotos) return null;

  const size = PATTERN_SIZE;
  const cols = Math.ceil(size / CELL) + 2;
  const rows = Math.ceil(size / CELL) + 2;

  const pat = document.createElement("canvas");
  pat.width = size;
  pat.height = size;
  const ctx = pat.getContext("2d")!;

  if (usePhotos) {
    // ── Sama persis dengan buildPhotoPattern di Canvas.tsx ──────────────
    const photoImgs = await Promise.all(activePhotos.map(loadImage));
    const count = photoImgs.length;

    if (count === 1) {
      const img = photoImgs[0];
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const ax = col * CELL;
          const ay = row * CELL;
          ctx.drawImage(img, ax, ay, TILE, TILE);
          ctx.drawImage(img, ax + CELL / 2, ay + CELL / 2, TILE, TILE);
        }
      }
    } else if (count === 2) {
      const [p1, p2] = photoImgs;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const ax = col * CELL;
          const ay = row * CELL;
          ctx.drawImage(p1, ax, ay, TILE, TILE);
          ctx.drawImage(p2, ax + CELL / 2, ay + CELL / 2, TILE, TILE);
        }
      }
    } else {
      // count >= 3
      for (let row = -1; row < rows; row++) {
        const img = photoImgs[Math.abs(row) % 3];
        const offsetX = row % 2 !== 0 ? CELL / 2 : 0;
        for (let col = -1; col < cols; col++) {
          const ax = col * CELL + offsetX;
          const ay = row * CELL;
          ctx.drawImage(img, ax, ay, TILE, TILE);
        }
      }
    }
  } else if (designSrc) {
    // ── Sama persis dengan design branch di Canvas.tsx ──────────────────
    const pairSrc = DESIGN_PAIRS[designSrc] ?? null;
    const [designImg, pairImg] = await Promise.all([
      loadImage(designSrc),
      pairSrc ? loadImage(pairSrc) : Promise.resolve(null),
    ]);

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const ax = col * CELL;
        const ay = row * CELL;
        ctx.drawImage(designImg, ax, ay, TILE, TILE);
        ctx.drawImage(
          pairImg ?? designImg,
          ax + CELL / 2,
          ay + CELL / 2,
          TILE,
          TILE,
        );
      }
    }
  }

  return pat;
}

// ─── Render 1 piece ke offscreen canvas dengan pattern masked ──────────────
async function renderPiece(
  pieceImg: HTMLImageElement,
  patCanvas: HTMLCanvasElement | null,
  pxW: number,
  pxH: number,
): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = pxW;
  c.height = pxH;
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
    ctx.drawImage(pieceImg, 0, 0, pxW, pxH);
  }

  return c;
}

// ─── Main: generate PDF dan return base64 string ───────────────────────────
export async function generatePatternPDF(params: {
  designSrc: string | null;
  photos: (string | null)[];
  productLabel: string;
  orderId?: string;
}): Promise<string> {
  const { designSrc, photos, productLabel, orderId } = params;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const PW = pdf.internal.pageSize.getWidth(); // 420
  const PH = pdf.internal.pageSize.getHeight(); // 297

  // Build pattern canvas sekali, pakai ulang untuk semua pieces
  // PATTERN_SIZE=500 agar density sama dengan Canvas.tsx (SIZE=500)
  const patCanvas = await buildPatternCanvas(designSrc, photos);

  // Tentukan layout pieces berdasarkan productLabel
  const isSinglePiece = productLabel === "socks" || productLabel === "totebag";
  const targetPieces = isSinglePiece
    ? [{ id: 1, label: "Full Piece", x: 8, y: 8, w: 404, h: 281 }]
    : PIECES;

  // Load piece images paralel
  const pieceImgs = await Promise.all(
    targetPieces.map((p) => {
      const src = `${getPieceBase(productLabel)}${p.id}.png`;
      return loadImage(src).catch(() => null);
    }),
  );

  // Render setiap piece dan tambahkan ke PDF
  for (let i = 0; i < targetPieces.length; i++) {
    const piece = targetPieces[i];
    const pieceImg = pieceImgs[i];
    if (!pieceImg) {
      console.warn(`[PDF] Missing image for piece ${piece.id}`);
      continue;
    }

    const MAX_PX = 500;
    let pxW = pieceImg.width;
    let pxH = pieceImg.height;
    if (pxW > MAX_PX || pxH > MAX_PX) {
      const scale = Math.min(MAX_PX / pxW, MAX_PX / pxH);
      pxW = Math.round(pxW * scale);
      pxH = Math.round(pxH * scale);
    }

    const pieceCanvas = await renderPiece(pieceImg, patCanvas, pxW, pxH);
    const dataUrl = pieceCanvas.toDataURL("image/png");

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
  designSrc: string | null;
  photos: (string | null)[];
  productLabel: string;
  orderId?: string;
  timeoutMs?: number;
}): Promise<string | null> {
  const { timeoutMs = 8000, ...pdfParams } = params;

  const hasDesign = pdfParams.designSrc || pdfParams.photos.some(Boolean);
  if (!hasDesign) {
    console.log("[PDF] No design/photo — skipping PDF");
    return null;
  }

  const pdfPromise = generatePatternPDF(pdfParams)
    .then((b64) => {
      console.log("[PDF] Generated OK");
      return b64;
    })
    .catch((err) => {
      console.error("[PDF] Generation failed:", err.message);
      return null;
    });

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => {
      console.warn(
        `[PDF] Timeout after ${timeoutMs}ms — skipping PDF attachment`,
      );
      resolve(null);
    }, timeoutMs),
  );

  return Promise.race([pdfPromise, timeoutPromise]);
}