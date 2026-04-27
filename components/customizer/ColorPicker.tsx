import type { ShirtColor } from "@/types/product";

interface ColorPickerProps {
  colors: ShirtColor[];
  active: string;
  onSelect: (hex: string) => void;
}

export function ColorPicker({ colors, active, onSelect }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">    
      {colors.map((color) => (
        <button
          key={color.hex}
          onClick={() => onSelect(color.hex)}
          className={`
            w-full aspect-square rounded-lg border-2 transition-all
            flex items-center justify-center text-xs font-mono
            ${
              active === color.hex
                ? "border-stone-800 ring-2 ring-stone-800 ring-offset-2"
                : "border-stone-200 hover:border-stone-400"
            }
          `}
          title={color.name}
          style={{ backgroundColor: color.hex }}
        ></button>
      ))}
    </div>
  );
}
