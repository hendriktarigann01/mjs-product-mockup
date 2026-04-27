"use client";

import { useRef, useCallback } from "react";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Crop canvas mengikuti bounding box pixel non-transparan (tight crop ke siluet)
function tightCrop(
  src: HTMLCanvasElement,
  outlineColor = "#ffffff",
  outlineWidth = 6,
): HTMLCanvasElement {
  const ctx = src.getContext("2d")!;
  const data = ctx.getImageData(0, 0, src.width, src.height);
  const pixels = data.data;

  let minX = src.width,
    minY = src.height,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const alpha = pixels[(y * src.width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const PAD = outlineWidth + 6; // padding cukup untuk outline
  const cx = Math.max(0, minX - PAD);
  const cy = Math.max(0, minY - PAD);
  const cw = Math.min(src.width - cx, maxX - minX + PAD * 2);
  const ch = Math.min(src.height - cy, maxY - minY + PAD * 2);

  // Canvas output dengan ruang untuk outline
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d")!;

  // ── Gambar outline dengan shadow trick ────────────────────────
  // Cara: gambar image berkali-kali dengan offset ke semua arah
  // menggunakan warna solid → efeknya jadi outline
  octx.save();
  octx.globalCompositeOperation = "source-over";

  // Render outline — gambar di 8 arah + diagonal dengan offset = outlineWidth
  const offsets: [number, number][] = [];
  for (let angle = 0; angle < 360; angle += 20) {
    const rad = (angle * Math.PI) / 180;
    offsets.push([
      Math.round(Math.cos(rad) * outlineWidth),
      Math.round(Math.sin(rad) * outlineWidth),
    ]);
  }

  // Gambar siluet berwarna di setiap offset (jadi outline)
  for (const [dx, dy] of offsets) {
    octx.save();
    octx.globalCompositeOperation = "source-over";

    // Tint jadi warna outline
    octx.filter = "opacity(1)";
    octx.drawImage(src, cx, cy, cw, ch, dx, dy, cw, ch);

    // Overlay warna outline di atas
    octx.globalCompositeOperation = "source-atop";
    octx.fillStyle = outlineColor;
    octx.fillRect(dx, dy, cw, ch);

    octx.restore();
  }

  // Reset composite sebelum gambar asli di atas outline
  octx.globalCompositeOperation = "source-over";

  // ── Gambar gambar asli di tengah (di atas outline) ─────────────
  octx.drawImage(src, cx, cy, cw, ch, 0, 0, cw, ch);

  octx.restore();
  return out;
}

export function useFaceSegmentation() {
  const faceApiReady = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

  const ensureReady = useCallback((): Promise<void> => {
    if (faceApiReady.current) return Promise.resolve();
    if (initPromise.current) return initPromise.current;

    initPromise.current = (async () => {
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
      faceApiReady.current = true;
      console.log("✅ face-api ready");
    })();

    return initPromise.current;
  }, []);

  const extractFace = useCallback(
    async (imageSrc: string): Promise<string> => {
      await ensureReady();

      // ── Step 1: Remove background pakai @imgly/background-removal ──
      const { removeBackground } = await import("@imgly/background-removal");

      const blob = await fetch(imageSrc).then((r) => r.blob());
      const removedBlob = await removeBackground(blob, {
        output: {
          format: "image/png",
          quality: 1,
        },
      });

      const removedUrl = await blobToDataUrl(removedBlob);
      const cleanImg = await loadImage(removedUrl);

      // ── Step 2: Detect wajah untuk menentukan area crop ────────────
      const faceapi = await import("face-api.js");
      const detection = await faceapi
        .detectSingleFace(
          cleanImg,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }),
        )
        .withFaceLandmarks();

      // Kalau wajah tidak terdeteksi → langsung tight crop dari siluet
      if (!detection) {
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = cleanImg.width;
        fallbackCanvas.height = cleanImg.height;
        fallbackCanvas.getContext("2d")!.drawImage(cleanImg, 0, 0);
        return tightCrop(fallbackCanvas).toDataURL("image/png");
      }

      // ── Step 3: Landmark-based crop area ───────────────────────────
      const landmarks = detection.landmarks.positions;

      // Titik paling ekstrem dari landmark (mengikuti kontur wajah asli)
      const topY = Math.min(...landmarks.map((p) => p.y));
      const bottomY = Math.max(...landmarks.map((p) => p.y));
      const leftX = Math.min(...landmarks.map((p) => p.x));
      const rightX = Math.max(...landmarks.map((p) => p.x));
      const faceH = bottomY - topY;
      const faceW = rightX - leftX;

      // Padding mengikuti proporsi wajah
      const PAD_TOP = faceH * 0.7; // ruang rambut
      const PAD_SIDE = faceW * 0.35;
      const PAD_BOTTOM = faceH * 0.08; // tepat di bawah dagu

      const cropX = Math.max(0, Math.floor(leftX - PAD_SIDE));
      const cropY = Math.max(0, Math.floor(topY - PAD_TOP));
      const cropW = Math.min(
        cleanImg.width - cropX,
        Math.ceil(faceW + PAD_SIDE * 2),
      );
      const cropH = Math.min(
        cleanImg.height - cropY,
        Math.ceil(faceH + PAD_TOP + PAD_BOTTOM),
      );

      // ── Step 4: Crop dari gambar yang sudah clean (no background) ──
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      cropCanvas
        .getContext("2d")!
        .drawImage(cleanImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // ── Step 5: Tight crop mengikuti siluet aktual (rambut & dagu) ─
      // Ini yang bikin hasil tidak kotak — crop mengikuti pixel transparan
    const tight = tightCrop(cropCanvas, "#ffffff", 15);
      return tight.toDataURL("image/png");
    },
    [ensureReady],
  );

  return { extractFace };
}
