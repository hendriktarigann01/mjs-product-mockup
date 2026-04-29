"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartList } from "@/components/cart/CartList";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { TrustBadges } from "@/components/cart/TrustBadges";
import { QRCheckoutModal } from "@/components/cart/QRCheckoutModal";
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
  const [showQRModal, setShowQRModal] = useState(false);

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

  if (isLoading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-2xl">
        Loading...
      </div>
    );

  return (
    /* Gunakan min-h-screen dan overflow-y-auto agar bisa di-scroll di kiosk */
    <main className="min-h-screen bg-white overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center py-10 px-10">
      <div className="w-full h-full max-w-7xl flex flex-col">
        <h1 className="text-5xl text-center text-[#4A5568] mb-16">Your Cart</h1>
        <Link
          href="/"
          className="text-stone-500 underline mb-10 text-2xl self-start inline-block"
        >
          Continue Shopping
        </Link>
        {items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="space-y-12">
            <CartList
              items={items}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemoveItem}
            />

            <div className="flex justify-between items-center pb-3 border-b border-stone-300 pt-10">
              <span className="font-mono text-2xl tracking-[0.25em] uppercase text-stone-400">
                Total
              </span>
              <span className="font-mono text-2xl tracking-[0.25em] uppercase text-stone-400">
                Rp {total.toLocaleString("id-ID")},00
              </span>
            </div>

            {/* Kontainer Putih sesuai foto */}
            <div className="bg-white p-12 space-y-10 border border-[#9CA3AF33]">
              <h3 className="text-3xl text-stone-800">Order Summary</h3>

              <div className="space-y-6">
                <div className="flex justify-between text-2xl text-stone-600">
                  <span>Sub Total</span>
                  <span>Rp {total.toLocaleString("id-ID")},00</span>
                </div>
                <div className="flex justify-between text-2xl text-stone-400">
                  <span>Shipping</span>
                  <span>Calculated at Checkout</span>
                </div>
              </div>

              <div className="border-t border-[#D9D9D9] pt-10 flex justify-between items-center">
                <span className="text-3xl">Estimated Total</span>
                <span className="text-3xl">
                  Rp {total.toLocaleString("id-ID")},00 IRD
                </span>
              </div>

              {/* <button
                onClick={() => (window.location.href = "/checkouts")}
                className="w-full bg-[#2CAAE1] text-white py-10 rounded-2xl text-4xl shadow-lg transition-transform active:scale-95"
              >
                Check out
              </button> */}

              {/* Cross-device QR checkout */}
              <button
                onClick={() => setShowQRModal(true)}
                className="w-full border-2 border-[#2CAAE1] text-[#2CAAE1] py-6 rounded-2xl text-2xl font-semibold hover:bg-[#2CAAE1]/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="5" height="5" x="3" y="3" rx="1" />
                  <rect width="5" height="5" x="16" y="3" rx="1" />
                  <rect width="5" height="5" x="3" y="16" rx="1" />
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                  <path d="M21 21v.01" />
                  <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  <path d="M3 12h.01" />
                  <path d="M12 3h.01" />
                  <path d="M12 16v.01" />
                  <path d="M16 12h1" />
                  <path d="M21 12v.01" />
                  <path d="M12 21v-1" />
                </svg>
                Continue on Mobile
              </button>
            </div>

            <TrustBadges show={true} />
          </div>
        )}

        <p className="text-center text-stone-400 mt-10 text-xl font-mono uppercase tracking-widest">
          All right reserved Happify Indonesia
        </p>
      </div>

      {/* QR Checkout Modal */}
      <QRCheckoutModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        cartItems={items}
      />
    </main>
  );
}
