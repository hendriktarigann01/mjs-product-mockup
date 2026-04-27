"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCartCount } from "@/utils/cart-service";

export interface FlyParticle {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseCartBadgeOptions {
  cartIconRef: React.RefObject<HTMLElement | null>;
  addBtnRef: React.RefObject<HTMLElement | null>;
}

export function useCartBadge({ cartIconRef, addBtnRef }: UseCartBadgeOptions) {
  // Selalu mulai dari 0 (SSR-safe) — useEffect yang sync dari localStorage
  const [cartCount, setCartCount] = useState<number>(0);

  const [flyParticles, setFlyParticles] = useState<FlyParticle[]>([]);
  const particleIdRef = useRef(0);

  // Fallback: re-sync via useEffect untuk handle SSR hydration
  useEffect(() => {
    setCartCount(getCartCount());
  }, []);

  /** Spawn partikel terbang dari tombol ke icon keranjang */
  const triggerFlyToCart = useCallback(() => {
    if (!addBtnRef.current || !cartIconRef.current) return;

    const btnRect = addBtnRef.current.getBoundingClientRect();
    const cartRect = cartIconRef.current.getBoundingClientRect();

    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const newParticles: FlyParticle[] = Array.from({ length: 6 }, () => ({
      id: particleIdRef.current++,
      startX: startX + (Math.random() - 0.5) * 24,
      startY: startY + (Math.random() - 0.5) * 12,
      endX,
      endY,
    }));

    setFlyParticles((prev) => [...prev, ...newParticles]);

    // Cleanup setelah animasi selesai (~700ms)
    setTimeout(() => {
      const ids = new Set(newParticles.map((p) => p.id));
      setFlyParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 750);
  }, [cartIconRef, addBtnRef]);

  /** Increment count setelah partikel "tiba" di keranjang */
  const incrementCount = useCallback(() => {
    setCartCount((prev) => prev + 1);
  }, []);

  return { cartCount, flyParticles, triggerFlyToCart, incrementCount };
}
