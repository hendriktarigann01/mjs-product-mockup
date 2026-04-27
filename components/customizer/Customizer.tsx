// Tujuan      : Orchestrator UI kustomisasi produk (pilih produk, desain, warna, foto, add to cart)
// Caller      : app/page.tsx
// Dependensi  : useCustomizer, useCartBadge, cart-service, constants/mockup
// Main Exports: Customizer
// Side Effects: localStorage (cart via addToCart), sessionStorage (buynow via setBuyNowItem)
"use client";

import React, { useRef } from "react";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

// Hooks
import { useCustomizer } from "@/hooks/useCustomizer";
import { useCartBadge } from "@/hooks/useCartBadge";

// Components
import { ProductSidebar } from "@/components/customizer/ProductSidebar";
import { DesignPicker } from "@/components/customizer/DesignPicker";
import { ColorPicker } from "@/components/customizer/ColorPicker";
import Canvas from "@/components/customizer/Canvas";
import PhotoUploadSection from "@/components/customizer/PhotoUploadSection";
import { GiftCardEditor } from "@/components/giftcard/GiftCardEditor";
import { CartIcon } from "@/components/customizer/CartIcon";
import { FlyParticles } from "@/components/customizer/FlyParticles";

// Constants
import {
  PRODUCTS,
  SHIRT_COLORS,
  GIFT_CARD_TEMPLATES,
} from "@/constants/mockup";

import { useState } from "react";
import { addToCart, setBuyNowItem } from "@/utils/cart-service";
import { formatRp } from "@/utils/format";
import { PREDEFINED_DESIGNS } from "@/constants/mockup";

interface CustomizerProps {
  onAddToCart?: (product: (typeof PRODUCTS)[0], customization: unknown) => void;
}

export function Customizer({ onAddToCart }: CustomizerProps) {
  // ── Customizer state ───────────────────────────────────────────────────────
  const {
    activeDesign,
    setActiveDesign,
    shirtColor,
    setShirtColor,
    photos,
    setPhotos,
    giftCardUrl,
    setGiftCardUrl,
    resetForProductChange,
  } = useCustomizer();

  const [activeProduct, setActiveProduct] = useState(PRODUCTS[0].id);
  const currentProduct = PRODUCTS.find((p) => p.id === activeProduct)!;
  const isGiftCard = currentProduct.isGiftCard;

  const handleProductChange = (id: string) => {
    setActiveProduct(id);
    resetForProductChange();
  };

  // ── Refs untuk animasi fly-to-cart ─────────────────────────────────────────
  const cartIconRef    = useRef<HTMLAnchorElement>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  // ── Cart badge & fly particles ─────────────────────────────────────────────
  const { cartCount, flyParticles, triggerFlyToCart, incrementCount } =
    useCartBadge({ cartIconRef, addBtnRef: addToCartBtnRef });

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Add To Cart: simpan ke cart, animasi partikel, badge +1 */
  const handleAddToCart = () => {
    triggerFlyToCart();

    // Delay update badge sampai partikel hampir tiba (~480ms)
    setTimeout(() => {
      addToCart(currentProduct, 1, {
        design: activeDesign,
        color: shirtColor,
        photos,
        giftCardUrl,
      });
      incrementCount();
    }, 480);

    onAddToCart?.(currentProduct, { design: activeDesign, color: shirtColor, photos, giftCardUrl });
  };

  /** Buy Now: simpan ke sessionStorage, navigate ke checkout */
  const handleBuyNow = () => {
    const customization = { design: activeDesign, color: shirtColor, photos, giftCardUrl };
    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(customization)))).substring(0, 8);

    setBuyNowItem({
      id: `${currentProduct.id}_${hash}`,
      name: currentProduct.label,
      price: currentProduct.price,
      quantity: 1,
      weight: currentProduct.weight,
      color: shirtColor,
      pattern: "Custom",
      photos: photos?.filter(Boolean).length
        ? `${photos.filter(Boolean).length} photos`
        : "No Photo",
      notes: giftCardUrl ? "Gift Card" : "Design",
      image: currentProduct.file,
      sku: `SKU_${currentProduct.id}_${Date.now()}`,
      customization,
    });

    window.location.href = "/checkouts";
  };

  // ── Resolve active design src ──────────────────────────────────────────────
  const activeDesignSrc: string | null = (() => {
    if (!activeDesign) return null;
    if (activeDesign.startsWith("/api/pixabay-image")) return activeDesign;
    return PREDEFINED_DESIGNS.find((d) => d.id === activeDesign)?.src ?? null;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl">
      {/* Fly-to-cart particles — fixed overlay */}
      <FlyParticles particles={flyParticles} />

      {/* Header — cart icon dengan badge */}
      <div className="mb-8">
        <CartIcon ref={cartIconRef} count={cartCount} />
      </div>

      <div className="flex flex-row gap-6 items-start">
        {/* Sidebar - Product Selector */}
        <ProductSidebar
          products={PRODUCTS}
          active={activeProduct}
          onSelect={handleProductChange}
        />

        {/* Preview & Pricing Section */}
        <div className="flex flex-col items-center flex-shrink-0">
          {!isGiftCard ? (
            <>
              {/* Canvas Preview */}
              <Canvas
                designSrc={activeDesignSrc}
                shirtColor={shirtColor}
                productFile={currentProduct.file}
                overlayFile={currentProduct.overlayFile}
                photos={photos}
              />

              {/* Clear Design Button */}
              {activeDesign && (
                <button
                  onClick={() => setActiveDesign(null)}
                  className="mt-3 font-mono text-xs text-stone-400 hover:text-red-400 transition-colors tracking-widest uppercase"
                >
                  ✕ Clear design
                </button>
              )}

              {/* Pricing */}
              <div className="mt-4">
                <p className="font-mono text-xs text-stone-400 mb-1">Price</p>
                <p className="text-2xl font-serif text-stone-800">
                  {formatRp(currentProduct.price)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between w-full mt-6 h-14 gap-4">
                <motion.button
                  ref={addToCartBtnRef}
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center justify-center gap-2 px-6 w-44 h-full bg-stone-800 hover:bg-stone-700 transition-colors text-white"
                >
                  <span className="font-mono text-xs tracking-widest uppercase">Add To Cart</span>
                </motion.button>

                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 px-6 w-44 h-full bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-white"
                >
                  
                  <span className="font-mono text-xs tracking-widest uppercase">Buy Now</span>
                </button>
              </div>
            </>
          ) : (
            /* Gift Card Preview */
            <div className="w-full max-w-sm">
              <GiftCardEditor
                productFile={currentProduct.file}
                textArea={currentProduct.textArea}
                initialTemplate={GIFT_CARD_TEMPLATES[0]}
                onExport={setGiftCardUrl}
              />

              {/* Pricing for Gift Card */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-stone-400 mb-1">Price</p>
                  <p className="text-2xl font-serif text-stone-800">
                    {formatRp(currentProduct.price)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    ref={addToCartBtnRef}
                    onClick={handleAddToCart}
                    whileTap={{ scale: 0.93 }}
                    className="flex items-center justify-center gap-2 px-5 h-14 bg-stone-800 hover:bg-stone-700 transition-colors text-white"
                  >
                    <span className="font-mono text-xs tracking-widest uppercase">Add To Cart</span>
                  </motion.button>

                  <button
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 px-5 h-14 bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-white"
                  >
                    
                    <span className="font-mono text-xs tracking-widest uppercase">Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls - Right Sidebar */}
        <div className="flex-1 flex flex-col gap-6 overflow-auto max-h-[85vh] no-scrollbar pb-8">
          {isGiftCard ? (
            <div className="text-center">
              <p className="font-mono text-xs text-stone-400 tracking-wider">
                Design your gift card message using the editor above
              </p>
            </div>
          ) : (
            <>
              {/* 01 - Upload Photos */}
              <div>
                <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-4">
                  01 — Upload photos
                </h2>
                <PhotoUploadSection onPhotosChange={setPhotos} />
              </div>

              <div className="border-t border-stone-200" />

              {/* 02 - Choose Design */}
              <div>
                <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-4">
                  02 — Choose a preset
                </h2>
                <DesignPicker
                  designs={PREDEFINED_DESIGNS}
                  active={activeDesign}
                  onSelect={setActiveDesign}
                />
              </div>

              <div className="border-t border-stone-200" />

              {/* 03 - Choose Color */}
              <div>
                <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-2">
                  03 — {currentProduct.label} color
                </h2>
                <p className="font-mono text-xs text-stone-400 mb-3">
                  {SHIRT_COLORS.find((c) => c.hex === shirtColor)?.name ?? "Snow White"}
                </p>
                <ColorPicker
                  colors={SHIRT_COLORS}
                  active={shirtColor}
                  onSelect={setShirtColor}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}