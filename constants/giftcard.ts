import type { FontOption } from "@/types/giftcard";

export const FONT_OPTIONS: FontOption[] = [
  { label: "Serif", value: "Georgia, serif" },
  { label: "Sans", value: "Arial, sans-serif" },
  { label: "Rounded", value: "Trebuchet MS, sans-serif" },
  { label: "Mono", value: "Courier New, monospace" },
  { label: "Cursive", value: "Comic Sans MS, cursive" },
];

export const TEXT_COLOR_OPTIONS = [
  "#1c1917",
  "#ffffff",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#ec4899",
] as const;

// Default canvas size
export const GIFT_CARD_WIDTH = 1063;
export const GIFT_CARD_HEIGHT = 1276;

// Minimum font size before stopping auto-shrink
export const MIN_FONT_SIZE = 10;

// Default gift card message
export const DEFAULT_MESSAGE = "To: \nFrom: \n\nWith love ❤️";
