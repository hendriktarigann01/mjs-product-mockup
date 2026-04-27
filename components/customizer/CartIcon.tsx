// Tujuan      : Render icon keranjang belanja dengan badge jumlah item
// Caller      : components/customizer/Customizer.tsx
// Dependensi  : lucide-react (ShoppingCart), next/link
// Main Exports: CartIcon
// Side Effects: none

"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  count: number;
  href?: string;
}

/**
 * CartIcon — link ke halaman keranjang dengan badge angka item.
 * Badge langsung tampil dari count pertama (tidak pakai animasi enter),
 * hanya pop animation saat angka berubah (via CSS transition).
 */
export const CartIcon = forwardRef<HTMLAnchorElement, CartIconProps>(
  function CartIcon({ count, href = "/cart" }, ref) {
    return (
      <Link
        ref={ref}
        href={href}
        title="Lihat Keranjang"
        className="group relative w-16 h-16 bg-[#e0d9cc] rounded-full flex items-center justify-center hover:bg-white transition-colors flex-shrink-0"
      >
        <ShoppingCart className="text-white group-hover:text-stone-800 transition-colors" />

        {/* Badge — selalu di-render, visibility dikontrol via scale CSS */}
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-blue-500 text-white text-[11px] font-bold font-mono rounded-full flex items-center justify-center px-1 shadow-md transition-transform duration-200"
          style={{
            transform: count > 0 ? "scale(1)" : "scale(0)",
            transformOrigin: "center",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      </Link>
    );
  },
);
