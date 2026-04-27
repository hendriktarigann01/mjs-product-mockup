// Brand colors
export const COLORS = {
  bg_primary: "#F5F2ED",
  bg_secondary: "#e0d9cc",
  text_dark: "#1c1917",
  text_light: "#stone-400",
  border: "#d6d3d1",
} as const;

// Input/Select class constants
export const INPUT_CLASS =
  "w-full border border-stone-300 bg-white/70 px-4 py-3 font-mono text-xs text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors";

export const SELECT_CLASS =
  "w-full border border-stone-300 bg-white/70 px-4 py-3 font-mono text-xs text-stone-700 appearance-none focus:outline-none focus:border-stone-500 transition-colors pr-10";

export const BUTTON_PRIMARY_CLASS =
  "w-full bg-stone-800 text-white font-mono text-xs tracking-widest uppercase py-4 hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const BUTTON_SECONDARY_CLASS =
  "font-mono text-xs tracking-widest uppercase text-stone-800 border border-stone-800 px-6 py-3 hover:bg-stone-800 hover:text-white transition-colors";

// Spacing
export const SPACING = {
  xs: "px-6 py-12",
  sm: "px-6 py-8",
  md: "mb-8",
  lg: "gap-6",
} as const;
