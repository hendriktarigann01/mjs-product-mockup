/**
 * Gift Card Editor - Refactored
 * Uses useGiftCardEditor hook and canvas utilities
 */

"use client";

import {
  FONT_OPTIONS,
  TEXT_COLOR_OPTIONS,
  GIFT_CARD_WIDTH,
  GIFT_CARD_HEIGHT,
} from "@/constants/giftcard";
import { useGiftCardEditor } from "@/hooks/useGiftCardEditor";
import type { GiftCardTemplate } from "@/types/giftcard";
import { GiftCardTemplatePicker } from "@/components/giftcard/GiftCardTemplatePicker";

interface GiftCardEditorProps {
  productFile: string;
  textArea?: { x: number; y: number; w: number; h: number };
  initialTemplate: GiftCardTemplate;
  onExport: (dataUrl: string) => void;
}

export function GiftCardEditor({
  productFile,
  textArea,
  initialTemplate,
  onExport,
}: GiftCardEditorProps) {
  const {
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
  } = useGiftCardEditor({
    initialTemplate,
    initialFile: productFile,
    initialTextArea: textArea,
    canvasSizeWidth: GIFT_CARD_WIDTH,
    canvasSizeHeight: GIFT_CARD_HEIGHT
  });

  // Auto-export when canvas updates
  const handleExport = () => {
    const dataUrl = exportAsImage();
    if (dataUrl) {
      onExport(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Canvas Preview */}
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={GIFT_CARD_WIDTH}
          height={GIFT_CARD_HEIGHT}
          className="w-full max-w-sm rounded-lg shadow-md border border-stone-200"
          style={{ imageRendering: "crisp-edges" }}
        />
        <button
          onClick={handleExport}
          className="mt-3 font-mono text-xs text-stone-400 hover:text-stone-600 transition-colors tracking-widest uppercase"
        >
          ↓ Preview
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 max-h-[50vh] overflow-auto no-scrollbar">
        {/* Template Picker */}
        <div>
          <h3 className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-3">
            Template
          </h3>
          <GiftCardTemplatePicker
            activeId={activeTemplate.id}
            onSelect={setActiveTemplate}
          />
        </div>

        <div className="border-t border-stone-200" />

        {/* Message Input */}
        <div>
          <label className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-2 block">
            Message
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={200}
            className="w-full rounded-lg border border-stone-200 px-3 py-2
            font-mono text-sm text-stone-700 resize-none
            focus:outline-none focus:border-stone-400 transition-colors"
            placeholder="Tulis pesan di sini..."
          />
          <p className="font-mono text-[10px] text-stone-400 mt-1">
            {text.length}/200 characters
          </p>
        </div>

        <div className="border-t border-stone-200" />

        {/* Font Size */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="font-mono text-xs uppercase tracking-wider text-stone-400">
              Font size
            </label>
            <span className="font-mono text-xs text-stone-400">
              {fontSize}px
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={48}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-stone-700"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-stone-400 mb-2 block">
            Font style
          </label>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFontFamily(value)}
                className={`
                px-3 py-1.5 rounded-lg text-xs border transition-all
                ${
                  fontFamily === value
                    ? "bg-stone-800 text-white border-stone-800"
                    : "border-stone-200 text-stone-500 hover:border-stone-400"
                }
              `}
                style={{ fontFamily: value }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-stone-400 mb-2 block">
            Text color
          </label>
          <div className="flex gap-2 flex-wrap">
            {TEXT_COLOR_OPTIONS.map((hex) => (
              <button
                key={hex}
                onClick={() => setTextColor(hex)}
                className={`
                w-7 h-7 rounded-full transition-all
                ${hex === "#ffffff" ? "border border-stone-300" : ""}
                ${
                  textColor === hex
                    ? "ring-2 ring-offset-2 ring-stone-600 scale-110"
                    : "hover:scale-110"
                }
              `}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
