"use client";

import { useEffect, useRef } from "react";
import { DESIGN_PAIRS } from "@/constants/mockup";

interface Props {
  designSrc: string | null;
  shirtColor: string;
  productFile: string;
  overlayFile?: string;
  photos: (string | null)[];
}

// ─── FIX: crossOrigin = "anonymous" agar Pixabay tidak CORS error ───────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // ← INI YANG KURANG DI CANVAS LAMA
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

function buildTintedShirt(
  shirtImg: HTMLImageElement,
  color: string,
  size: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(shirtImg, 0, 0, size, size);
  if (color !== "#ffffff") {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(shirtImg, 0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
  }
  return c;
}

async function buildPhotoPattern(
  photoImgs: HTMLImageElement[],
  size: number,
): Promise<HTMLCanvasElement> {
  const pat = document.createElement("canvas");
  pat.width = size;
  pat.height = size;
  const ctx = pat.getContext("2d")!;
  const count = photoImgs.length;

  const TILE = 30;
  const GAP = 50;
  const cellW = TILE + GAP;
  const cellH = TILE + GAP;
  const cols = Math.ceil(size / cellW) + 2;
  const rows = Math.ceil(size / cellH) + 2;

  if (count === 1) {
    const img = photoImgs[0];
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const ax = col * cellW;
        const ay = row * cellH;
        ctx.drawImage(img, ax, ay, TILE, TILE);
        ctx.drawImage(img, ax + cellW / 2, ay + cellH / 2, TILE, TILE);
      }
    }
    return pat;
  }

  if (count === 2) {
    const [p1, p2] = photoImgs;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const ax = col * cellW;
        const ay = row * cellH;
        ctx.drawImage(p1, ax, ay, TILE, TILE);
        ctx.drawImage(p2, ax + cellW / 2, ay + cellH / 2, TILE, TILE);
      }
    }
    return pat;
  }

  if (count >= 3) {
    for (let row = -1; row < rows; row++) {
      const img = photoImgs[Math.abs(row) % 3];
      const offsetX = row % 2 !== 0 ? cellW / 2 : 0;
      for (let col = -1; col < cols; col++) {
        const ax = col * cellW + offsetX;
        const ay = row * cellH;
        ctx.drawImage(img, ax, ay, TILE, TILE);
      }
    }
    return pat;
  }

  return pat;
}

export default function Canvas({
  designSrc,
  shirtColor,
  productFile,
  overlayFile,
  photos,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SIZE = 500;

  const activePhotos = photos.filter(Boolean) as string[];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = async () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const shirtImg = await loadImage(productFile);
      const tintedShirt = buildTintedShirt(shirtImg, shirtColor, SIZE);

      const usePhotos = activePhotos.length > 0;

      if (!designSrc && !usePhotos) {
        ctx.drawImage(tintedShirt, 0, 0);
        if (overlayFile) {
          const ov = await loadImage(overlayFile);
          ctx.drawImage(ov, 0, 0, SIZE, SIZE);
        }
        return;
      }

      let patCanvas: HTMLCanvasElement;

      if (usePhotos) {
        const photoImgs = await Promise.all(activePhotos.map(loadImage));
        patCanvas = await buildPhotoPattern(photoImgs, SIZE);
      } else {
        // ─── FIX: Pixabay URL tetap di-load, hanya bedain apakah ada PAIR-nya ─
        const pairSrc = DESIGN_PAIRS[designSrc!] ?? null;
        const [designImg, pairImg] = await Promise.all([
          loadImage(designSrc!),
          pairSrc ? loadImage(pairSrc) : Promise.resolve(null),
        ]);

        const TILE = 30;
        const GAP = 50;
        const cellW = TILE + GAP;
        const cellH = TILE + GAP;

        patCanvas = document.createElement("canvas");
        patCanvas.width = SIZE;
        patCanvas.height = SIZE;
        const pCtx = patCanvas.getContext("2d")!;

        const cols = Math.ceil(SIZE / cellW) + 2;
        const rows = Math.ceil(SIZE / cellH) + 2;

        for (let row = -1; row < rows; row++) {
          for (let col = -1; col < cols; col++) {
            const ax = col * cellW;
            const ay = row * cellH;
            pCtx.drawImage(designImg, ax, ay, TILE, TILE);
            pCtx.drawImage(
              pairImg ?? designImg,
              ax + cellW / 2,
              ay + cellH / 2,
              TILE,
              TILE,
            );
          }
        }
      }

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(tintedShirt, 0, 0);

      ctx.globalCompositeOperation = "source-atop";
      ctx.drawImage(patCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      ctx.globalAlpha = 0.15;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(shirtImg, 0, 0, SIZE, SIZE);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (overlayFile) {
        const ov = await loadImage(overlayFile);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(ov, 0, 0, SIZE, SIZE);
      }
    };

    render().catch(console.error);
  }, [designSrc, shirtColor, productFile, overlayFile, activePhotos.join(",")]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      className="w-full max-w-sm"
      style={{ imageRendering: "crisp-edges" }}
    />
  );
}
