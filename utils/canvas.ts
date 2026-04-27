/**
 * Utility functions for canvas operations
 */

import type { TextAreaConfig } from "@/types/common";

interface LineComputeResult {
  lines: string[];
  lineHeight: number;
  totalHeight: number;
}

/**
 * Compute wrapped text lines for canvas rendering
 * @param ctx - Canvas 2D context
 * @param text - Text to wrap
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family string
 * @param maxWidth - Maximum width for wrapping
 */
export function computeTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
): LineComputeResult {
  const lineHeight = fontSize * 1.5;
  ctx.font = `${fontSize}px ${fontFamily}`;

  const rawLines = text.split("\n");
  const lines: string[] = [];

  for (const raw of rawLines) {
    if (raw.trim() === "") {
      lines.push("");
      continue;
    }

    const words = raw.split(" ");
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth - 16) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }

  return {
    lines,
    lineHeight,
    totalHeight: lines.length * lineHeight,
  };
}

/**
 * Auto-shrink font until text fits in area
 * @returns final font size
 */
export function getAutoShrinkFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  initialFontSize: number,
  fontFamily: string,
  textAreaWidth: number,
  textAreaHeight: number,
): number {
  let currentSize = initialFontSize;

  while (currentSize >= 10) {
    const { totalHeight } = computeTextLines(
      ctx,
      text,
      currentSize,
      fontFamily,
      textAreaWidth,
    );

    if (totalHeight <= textAreaHeight) break;
    currentSize -= 1;
  }

  return currentSize;
}

/**
 * Render text on canvas with optional clipping
 */
export function renderTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
  textColor: string,
  textArea: TextAreaConfig,
  lines: string[],
): void {
  const { x, y, w, h } = textArea;
  const lineHeight = fontSize * 1.5;
  const totalHeight = lines.length * lineHeight;

  ctx.save();

  // Clip to text area bounds
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Center vertically if space, otherwise top-align
  const startY =
    totalHeight <= h
      ? y + h / 2 - totalHeight / 2 + lineHeight / 2
      : y + lineHeight / 2 + 8;

  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, startY + i * lineHeight);
  });

  ctx.restore();
}
