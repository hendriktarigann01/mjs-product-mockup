import { Trash2, Plus, Minus } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { formatRp } from "@/utils/format";

interface CartItemProps {
  item: CartItem;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemProps) {
  const { id, name, price, quantity, color, pattern, photos, notes, image } =
    item;

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-6 items-start">
      {/* Product info */}
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-56 h-56 bg-white rounded flex-shrink-0 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1">
          <p className="font-serif text-2xl text-stone-800">{name}</p>
          <div className="mt-1 space-y-0.5 text-lg">
            <p className="font-mono text-stone-400">Colors: {color}</p>
            <p className="font-mono text-stone-400">Pattern: {pattern}</p>
            <p className="font-mono text-stone-400">Photos: {photos}</p>
            <p className="font-mono text-stone-400 max-w-[200px] leading-relaxed">
              Notes: {notes}
            </p>
          </div>
        </div>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 w-32 justify-center">
        <button
          onClick={() => onUpdateQty(id, -1)}
          className="w-7 h-7 border border-stone-300 flex items-center justify-center hover:bg-stone-200 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus size={10} />
        </button>
        <span className="font-mono text-sm text-stone-700 w-6 text-center">
          {quantity}
        </span>
        <button
          onClick={() => onUpdateQty(id, 1)}
          className="w-7 h-7 border border-stone-300 flex items-center justify-center hover:bg-stone-200 transition-colors"
          aria-label="Increase quantity"
        >
          <Plus size={10} />
        </button>
        <button
          onClick={() => onRemove(id)}
          className="w-7 h-7 ml-1 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
