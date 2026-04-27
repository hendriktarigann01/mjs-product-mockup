import { useState, useCallback, useRef, useEffect } from "react";
import type { GiftCardTemplate } from "@/types/giftcard";
import type { TextAreaConfig } from "@/types/common";
import { DEFAULT_MESSAGE } from "@/constants/giftcard";
import {
  computeTextLines,
  getAutoShrinkFontSize,
  renderTextOnCanvas,
} from "@/utils/canvas";

interface UseGiftCardEditorProps {
  initialTemplate: GiftCardTemplate;
  initialFile: string;
  initialTextArea?: TextAreaConfig;
  canvasSizeWidth: number;
  canvasSizeHeight: number;
}

export function useGiftCardEditor({
  initialTemplate,
  initialFile,
  initialTextArea,
  canvasSizeWidth,
  canvasSizeHeight,
}: UseGiftCardEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTemplate, setActiveTemplate] = useState(initialTemplate);
  const [text, setText] = useState(DEFAULT_MESSAGE);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Georgia, serif");
  const [textColor, setTextColor] = useState("#1c1917");

  const productFile = activeTemplate.file ?? initialFile;
  const textArea = activeTemplate.textArea ??
    initialTextArea ?? {
      x: 85,
      y: 22,
      w: 385,
      h: 400,
    };

  /**
   * Draw gift card on canvas
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = productFile;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasSizeWidth, canvasSizeHeight);
      ctx.drawImage(img, 0, 0, canvasSizeWidth, canvasSizeHeight);

      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(textArea.x, textArea.y, textArea.w, textArea.h);
      ctx.restore();

      if (!text.trim()) return;

      const { w: areaW, h: areaH } = textArea;

      // Auto-shrink font to fit
      let currentSize = fontSize;
      let lines = computeTextLines(ctx, text, currentSize, fontFamily, areaW);
      let totalHeight = lines.totalHeight;

      // Shrink until text fits or reaches minimum
      while (currentSize >= 10 && totalHeight > areaH) {
        currentSize -= 1;
        lines = computeTextLines(ctx, text, currentSize, fontFamily, areaW);
        totalHeight = lines.totalHeight;
      }

      // Render text on canvas
      renderTextOnCanvas(
        ctx,
        text,
        currentSize,
        fontFamily,
        textColor,
        textArea,
        lines.lines,
      );
    };
  }, [
    productFile,
    text,
    fontSize,
    fontFamily,
    textColor,
    textArea,
    canvasSizeWidth,
    canvasSizeHeight,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  /**
   * Export canvas as data URL
   */
  const exportAsImage = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  }, []);

  return {
    canvasRef,
    activeTemplate,
    setActiveTemplate,
    text,
    setText,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    textColor,
    setTextColor,
    exportAsImage,
  };
}
