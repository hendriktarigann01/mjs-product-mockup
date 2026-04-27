import type { CartItem } from "@/types/cart";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { Divider } from "@/components/common/Divider";

interface CartListProps {
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export function CartList({ items, onUpdateQty, onRemove }: CartListProps) {
  return (
    <div className="flex-1">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-3 border-b border-stone-300">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400">
          Product
        </span>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400 w-32 text-center">
          Quantity
        </span>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400 w-28 text-right">
          Total
        </span>
      </div>

      {/* Cart items */}
      <div className="divide-y divide-stone-200">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
