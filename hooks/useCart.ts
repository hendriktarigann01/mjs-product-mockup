import { useState, useCallback } from "react";
import type { CartItem } from "@/types/cart";

export function useCart(initialItems: CartItem[]) {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const isEmpty = items.length === 0;

  return {
    items,
    updateQty,
    removeItem,
    total,
    isEmpty,
    setItems,
  };
}
