"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ShippingService } from "./ShippingMethod";


// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  sku: string;
  color: string;
  pattern: string;
  photos: string;
  notes: string;
  imageSrc?: string;
}

interface Props {
  item: OrderItem;
  selectedShipping: ShippingService | null;
  loadingShipping: boolean;
  kecamatanSelected: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")},00`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OrderSummary({
  item,
  selectedShipping,
  loadingShipping,
  kecamatanSelected,
}: Props) {
  const [discountCode, setDiscountCode] = useState("");

  const subtotal = item.price * item.qty;
  const shippingCost = selectedShipping?.price ?? 0;
  const total = subtotal + shippingCost;

  return (
    <div className="lg:w-[420px] bg-stone-100/80 border-l border-stone-200 px-6 py-10 lg:px-10 lg:py-14">
      <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-6">
        Order Summary
      </h2>

      {/* Item */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 bg-[#e0d9cc] rounded overflow-hidden">
            {item.imageSrc && (
              <img
                src={item.imageSrc}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-stone-500 text-white rounded-full font-mono text-[9px] flex items-center justify-center">
            {item.qty}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <p className="font-serif text-sm text-stone-800">{item.name}</p>
            <p className="font-mono text-xs text-stone-700">
              {formatRp(item.price)}
            </p>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="font-mono text-[10px] text-stone-400">{item.sku}</p>
            <p className="font-mono text-[10px] text-stone-400">
              Colors: {item.color}
            </p>
            <p className="font-mono text-[10px] text-stone-400">
              Pattern: {item.pattern}
            </p>
            <p className="font-mono text-[10px] text-stone-400">
              Photos: {item.photos}
            </p>
            <p className="font-mono text-[10px] text-stone-400 leading-relaxed">
              Notes: {item.notes}
            </p>
          </div>
        </div>
      </div>

      {/* Discount */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Discount code"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="flex-1 border border-stone-300 bg-white/70 px-3 py-2.5 font-mono text-xs text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
        />
        <button className="border border-stone-400 px-4 py-2.5 font-mono text-xs text-stone-600 hover:bg-stone-200 transition-colors tracking-widest uppercase">
          Apply
        </button>
      </div>

      {/* Totals */}
      <div className="space-y-3 border-t border-stone-200 pt-4">
        <div className="flex justify-between">
          <span className="font-mono text-xs text-stone-500">Subtotal</span>
          <span className="font-mono text-xs text-stone-700">
            {formatRp(subtotal)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-mono text-xs text-stone-500">Shipping</span>
          {loadingShipping ? (
            <span className="font-mono text-xs text-stone-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Menghitung…
            </span>
          ) : selectedShipping ? (
            <div className="text-right">
              <span className="font-mono text-xs text-stone-700">
                {formatRp(selectedShipping.price)}
              </span>
              <p className="font-mono text-[10px] text-stone-400">
                {selectedShipping.courierName} {selectedShipping.service}
              </p>
            </div>
          ) : (
            <span className="font-mono text-xs text-stone-400 text-right">
              {kecamatanSelected
                ? `Klik "Cek Ongkir"`
                : "Pilih kecamatan tujuan"}
            </span>
          )}
        </div>

        <div className="flex justify-between pt-3 border-t border-stone-200">
          <span className="font-serif text-base text-stone-800">Total</span>
          <div className="text-right">
            <span className="font-mono text-[10px] text-stone-400 mr-1">
              IDR
            </span>
            <span className="font-serif text-lg text-stone-800">
              {formatRp(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
