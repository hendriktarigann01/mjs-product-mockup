"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartList } from "@/components/cart/CartList";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { TrustBadges } from "@/components/cart/TrustBadges";

// Cart service
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  getCartTotal,
} from "@/utils/cart-service";

import type { CartItemWithCustomization } from "@/utils/cart-service";

export default function CartPage() {
  const [items, setItems] = useState<CartItemWithCustomization[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    setIsLoading(true);
    const cartItems = getCart();
    setItems(cartItems);
    setTotal(getCartTotal());
    setIsLoading(false);
  }, []);

  const handleUpdateQty = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const newQuantity = item.quantity + delta;
      updateCartItemQuantity(id, newQuantity);

      // Update local state
      if (newQuantity <= 0) {
        setItems(items.filter((i) => i.id !== id));
      } else {
        setItems(
          items.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)),
        );
      }
      setTotal(getCartTotal());
    }
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    setItems(items.filter((i) => i.id !== id));
    setTotal(getCartTotal());
  };

  const isEmpty = items.length === 0;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <p className="text-center text-stone-500">Loading cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <Header breadcrumb="Home / Cart" title="Your Cart" />

        {isEmpty ? (
          <CartEmptyState />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Cart items list */}
              <CartList
                items={items}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemoveItem}
              />

              {/* Order summary */}
              <CartOrderSummary subtotal={total} isEmpty={isEmpty} />
            </div>

            {/* Trust badges */}
            <TrustBadges show={!isEmpty} />
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}
