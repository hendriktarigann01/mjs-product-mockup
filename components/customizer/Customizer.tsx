"use client";

// Tujuan      : UI kustomisasi produk kiosk (1080 × 1920 display stand)
// Caller      : app/page.tsx
// Dependensi  : hooks/useCustomizer, hooks/useCartBadge, utils/cart-service, utils/cloudinary
// Main Exports: Customizer
// Side Effects: localStorage (addToCart), Cloudinary upload (design PNG saat add to cart)

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Info,
  X,
} from "lucide-react";

import { useCustomizer, type ProductId } from "@/hooks/useCustomizer";
import { useCartBadge } from "@/hooks/useCartBadge";
import { GiftCardEditor } from "@/components/giftcard/GiftCardEditor";
import { FlyParticles } from "@/components/customizer/FlyParticles";
import Canvas, { type CanvasHandle } from "@/components/customizer/Canvas";
import PhotoUploadSection from "@/components/customizer/PhotoUploadSection";

import {
  PRODUCTS,
  SHIRT_COLORS,
  GIFT_CARD_TEMPLATES,
  PREDEFINED_DESIGNS,
} from "@/constants/mockup";
import { addToCart } from "@/utils/cart-service";
import { formatRp } from "@/utils/format";
import { uploadToCloudinary } from "@/utils/cloudinary";

// ─── Constants ────────────────────────────────────────────────────────────────

const PATTERNS_PER_PAGE = 12;

const FONT_OPTIONS = [
  { label: "Serif", value: "Georgia, serif" },
  { label: "Sans", value: "DM Sans, sans-serif" },
  { label: "Mono", value: "'Courier New', monospace" },
  { label: "Script", value: "Palatino, serif" },
  { label: "Display", value: "'Playfair Display', serif" },
];

const FONT_COLORS = [
  "#1a1a1a",
  "#ffffff",
  "#2CAAE1",
  "#e23a95",
  "#f8ca3f",
  "#73d1ae",
];

const REGULAR_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
const KIDS_SIZES = ["0-1Y", "1-2Y", "3-4Y", "5-6Y", "7-8Y"];

// ─── Size Chart Modal ─────────────────────────────────────────────────────────

function SizeChartModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative bg-white rounded-[28px] p-12 w-[820px] max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-[60px] h-[60px] rounded-full bg-[#2CAAE1] flex items-center justify-center"
        >
          <X size={28} color="white" />
        </button>

        {/* Regular */}
        <p className="text-[22px] font-medium text-[#374151] mb-3 mt-4">
          Size Chart Fajamas Regular
        </p>
        <table className="w-full text-[18px] mb-8 border-collapse">
          <thead>
            <tr>
              {["Size", "Body Length", "Chest Width", "Waist Width"].map(
                (h) => (
                  <th
                    key={h}
                    className="bg-[#2CAAE1] text-white px-4 py-3 text-center font-medium"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {[
              ["XS", 61, 46, 46],
              ["S", 65, 49, 49],
              ["M", 69.5, 52, 52],
              ["L", 73, 55, 55],
              ["XL", 77, 58, 58],
              ["XXL", 81, 61, 61],
              ["3XL", 82, 67, 67],
              ["4XL", 83, 73, 73],
              ["5XL", 84, 76, 76],
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-white" : ""}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2.5 text-center text-[#374151] border-b border-[#D9D9D9]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Kids */}
        <p className="text-[22px] font-medium text-[#374151] mb-3">
          Size Chart Fajamas Kids
        </p>
        <table className="w-full text-[18px] border-collapse">
          <thead>
            <tr>
              {["Size", "Body Length", "Chest Width", "Waist Width"].map(
                (h) => (
                  <th
                    key={h}
                    className="bg-[#2CAAE1] text-white px-4 py-3 text-center font-medium"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {[
              ["0-1Y", 32, 31, 31],
              ["1-2Y", 38, 34, 34],
              ["3-4Y", 44, 37, 37],
              ["5-6Y", 50, 40, 40],
              ["7-8Y", 56, 43, 43],
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-white" : ""}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2.5 text-center text-[#374151] border-b border-[#D9D9D9]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

// ─── Step: Select Color ───────────────────────────────────────────────────────

function StepColor({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(SHIRT_COLORS.length / 12);
  const pageColors = SHIRT_COLORS.slice(page * 12, page * 12 + 12);
  const colorName =
    SHIRT_COLORS.find((c) => c.hex === value)?.name ?? "Snow White";

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-[680px]">
      <p className="text-[28px] font-medium text-[#2CAAE1]">{colorName}</p>

      {/* Container Scroll */}
      <div className="w-full overflow-x-auto pb-6 no-scrollbar">
        <div className="inline-grid grid-rows-2 grid-flow-col gap-6 p-4">
          {pageColors.map((c) => (
            <button
              key={c.hex}
              onClick={() => onChange(c.hex)}
              title={c.name}
              className={`
          w-[90px] h-[90px] rounded-full transition-all duration-200
          ${value === c.hex
                  ? "ring-[4px] ring-white ring-offset-[4px] ring-offset-[#2CAAE1] scale-110"
                  : "hover:scale-105"
                }
          ${c.hex === "#ffffff" ? "border-2 border-[#D9D9D9]" : ""}
        `}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Pagination dots (opsional jika sudah scroll) */}
      <div className="flex gap-3">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === page ? "bg-[#2CAAE1]" : "bg-[#D9D9D9]"
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step: Select Pattern ─────────────────────────────────────────────────────

function StepPattern({
  value,
  onChange,
  photos,
  onPhotosChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
  photos: (string | null)[];
  onPhotosChange: (photos: (string | null)[]) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(PREDEFINED_DESIGNS.length / PATTERNS_PER_PAGE);
  const pageDesigns = PREDEFINED_DESIGNS.slice(
    page * PATTERNS_PER_PAGE,
    page * PATTERNS_PER_PAGE + PATTERNS_PER_PAGE,
  );
  const activeName =
    PREDEFINED_DESIGNS.find((d) => d.id === value)?.name ?? "Choose a design";

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-[680px]">
      {/* Bagian 1: Preset Pattern */}
      <div className="flex flex-col items-center gap-6 w-full">
        <h2 className="text-[28px] font-medium text-[#2CAAE1]">{activeName}</h2>

        <div className="grid grid-cols-6 gap-5 w-full">
          {pageDesigns.map((d) => (
            <button
              key={d.id}
              onClick={() => onChange(d.id)}
              title={d.name}
              className={`
              w-[90px] h-[90px] rounded-full overflow-hidden border-[3px] transition-all duration-200
              ${value === d.id
                  ? "border-[#2CAAE1] ring-[4px] ring-white ring-offset-[3px] ring-offset-[#2CAAE1] scale-110"
                  : "border-transparent hover:border-[#2CAAE1] hover:scale-105"
                }
            `}
            >
              <img
                src={d.src}
                alt={d.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex gap-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === page ? "bg-[#2CAAE1]" : "bg-[#D9D9D9]"
                }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full border-t border-stone-200" />

      {/* Bagian 2: Photo Camera */}
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-[24px] font-medium text-[#2CAAE1]">Upload Photo (Face)</h2>
        <PhotoUploadSection onPhotosChange={onPhotosChange} />
      </div>
    </div>
  );
}

// ─── Step: Select Size ────────────────────────────────────────────────────────

function StepSize({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (size: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[680px]">
      {/* Size Info button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-[20px] text-[#6B7280] self-start"
      >
        Size Info
        <Info size={22} className="text-[#6B7280]" />
      </button>

      {/* Kids */}
      <div className="w-full">
        <p className="text-[22px] font-medium text-[#6B7280] mb-3">Kids</p>
        <div className="flex flex-wrap gap-3">
          {KIDS_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`
                h-[64px] min-w-[100px] px-5 rounded-[16px] border-2 text-[22px] transition-all
                ${value === s
                  ? "bg-[#2CAAE1] border-[#2CAAE1] text-white"
                  : "bg-white border-[#D9D9D9] text-[#374151] hover:border-[#2CAAE1] hover:text-[#2CAAE1]"
                }
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Regular */}
      <div className="w-full mt-2">
        <p className="text-[22px] font-medium text-[#6B7280] mb-3">Regular</p>
        <div className="flex flex-wrap gap-3">
          {REGULAR_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`
                h-[64px] min-w-[100px] px-5 rounded-[16px] border-2 text-[22px] transition-all
                ${value === s
                  ? "bg-[#2CAAE1] border-[#2CAAE1] text-white"
                  : "bg-white border-[#D9D9D9] text-[#374151] hover:border-[#2CAAE1] hover:text-[#2CAAE1]"
                }
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <SizeChartModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── GC Step: Template ────────────────────────────────────────────────────────

function StepGCTemplate({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[680px]">
      <div className="flex gap-5 flex-wrap justify-center">
        {GIFT_CARD_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`
              flex flex-col rounded-[16px] overflow-hidden border-[3px] transition-all
              ${value === t.id
                ? "border-[#2CAAE1] shadow-[0_0_0_3px_#2CAAE1]"
                : "border-[#D9D9D9] hover:border-[#2CAAE1]"
              }
            `}
          >
            <div className="relative w-[140px] h-[180px]">
              <Image src={t.file} alt={t.name} fill className="object-cover" />
              {value === t.id && (
                <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold drop-shadow">
                    ✓
                  </span>
                </div>
              )}
            </div>
            <div
              className={`py-2 text-center text-[14px] font-medium bg-white ${value === t.id ? "text-[#2CAAE1]" : "text-[#6B7280]"
                }`}
            >
              {t.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GC Step: Message ─────────────────────────────────────────────────────────

function StepGCMessage({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full max-w-[680px]">
      <div className="bg-white rounded-[20px] border-2 border-[#D9D9D9] p-8">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          rows={7}
          placeholder={"To:\nFrom:\nWith Love"}
          className="w-full border-none outline-none resize-none text-[26px] text-[#374151] leading-relaxed bg-transparent placeholder:text-[#9CA3AF]"
        />
        <p className="text-right text-[16px] text-[#9CA3AF] mt-2">
          {value.length}/200 characters
        </p>
      </div>
    </div>
  );
}

// ─── GC Step: Font Size ───────────────────────────────────────────────────────

function StepGCFontSize({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="w-full max-w-[680px] flex flex-col gap-4">
      <p className="text-[28px] font-medium text-right text-[#374151]">
        {value}px
      </p>
      <input
        type="range"
        min={12}
        max={48}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[8px] appearance-none rounded-full bg-[#D9D9D9] accent-[#374151]"
        style={{
          background: `linear-gradient(to right, #374151 ${((value - 12) / 36) * 100}%, #D9D9D9 ${((value - 12) / 36) * 100}%)`,
        }}
      />
    </div>
  );
}

// ─── GC Step: Font Style ──────────────────────────────────────────────────────

function StepGCFontStyle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center w-full max-w-[680px]">
      {FONT_OPTIONS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          style={{ fontFamily: f.value }}
          className={`
            h-[72px] px-9 rounded-full border-2 text-[24px] transition-all
            ${value === f.value
              ? "bg-[#2CAAE1] border-[#2CAAE1] text-white"
              : "bg-white border-[#D9D9D9] text-[#374151] hover:border-[#2CAAE1]"
            }
          `}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── GC Step: Font Color ──────────────────────────────────────────────────────

function StepGCFontColor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-6 flex-wrap justify-center w-full max-w-[680px]">
      {FONT_COLORS.map((hex) => (
        <button
          key={hex}
          onClick={() => onChange(hex)}
          title={hex}
          className={`
            w-[80px] h-[80px] rounded-full transition-all
            ${hex === "#ffffff" ? "border-2 border-[#D9D9D9]" : ""}
            ${value === hex
              ? "ring-[4px] ring-white ring-offset-[4px] ring-offset-[#2CAAE1] scale-110"
              : "hover:scale-110"
            }
          `}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

// ─── Step Label Map ───────────────────────────────────────────────────────────

function getStepLabel(product: ProductId, step: number): { title: string } {
  if (product !== "gift-card") {
    if (step === 1) return { title: "Select Your Color" };
    if (step === 2) return { title: "Select Your Pattern" };
    if (step === 3) return { title: "Select Your Size" }; // size step shows "Select Your Pattern" per ref
  } else {
    const labels: Record<number, string> = {
      1: "Select Your Template",
      2: "Select Your Message",
      3: "Setting Your Font Size",
      4: "Select Your Font Style",
      5: "Select Your Text Color",
    };
    return { title: labels[step] ?? "" };
  }
  return { title: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Customizer
// ─────────────────────────────────────────────────────────────────────────────

export function Customizer() {
  const {
    activeProduct,
    step,
    maxStep,
    isGiftCard,
    handleProductChange,
    goNext,
    goPrev,
    shirtColor,
    setShirtColor,
    activeDesign,
    setActiveDesign,
    selectedSize,
    setSelectedSize,
    photos,
    setPhotos,
    gcMessage,
    setGcMessage,
    gcFontSize,
    setGcFontSize,
    gcFontFamily,
    setGcFontFamily,
    gcFontColor,
    setGcFontColor,
    gcTemplate,
    setGcTemplate,
    giftCardUrl,
    setGiftCardUrl,
  } = useCustomizer();

  const cartIconRef = useRef<HTMLAnchorElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { cartCount, flyParticles, triggerFlyToCart, incrementCount } =
    useCartBadge({
      cartIconRef: cartIconRef as React.RefObject<HTMLElement | null>,
      addBtnRef: addBtnRef as React.RefObject<HTMLElement | null>,
    });

  const currentProduct = PRODUCTS.find((p) => p.id === activeProduct)!;

  const isLastStep = step === maxStep;

  // ── Buy / Add to cart action ──────────────────────────────────────────────
  const handleBuy = async () => {
    if (isUploading) return;
    setIsUploading(true);

    // Upload face photos ke Cloudinary jika ada
    let uploadedPhotos: (string | null)[] = [];
    if (!isGiftCard && photos && photos.some(Boolean)) {
      try {
        uploadedPhotos = await Promise.all(
          photos.map(async (p) => {
            if (!p) return null;
            if (p.startsWith("data:")) {
              const res = await uploadToCloudinary(p, "happify/faces");
              return res.secure_url;
            }
            return p;
          })
        );
        console.log("[Faces] Uploaded to Cloudinary:", uploadedPhotos);
      } catch (e) {
        console.warn("[Faces] Cloudinary upload failed (non-fatal):", e);
        uploadedPhotos = photos;
      }
    } else {
      uploadedPhotos = photos || [];
    }

    // Capture canvas PNG → upload ke Cloudinary → simpan URL di cart item
    let designImageUrl: string | undefined;
    if (!isGiftCard) {
      try {
        const dataUrl = canvasRef.current?.toPngDataUrl();
        if (dataUrl) {
          const result = await uploadToCloudinary(dataUrl, "happify/designs");
          designImageUrl = result.secure_url;
          console.log("[Canvas] Uploaded to Cloudinary:", designImageUrl);
        }
      } catch (e) {
        // Non-fatal: lanjut tanpa URL jika upload gagal
        console.warn("[Canvas] Cloudinary upload failed (non-fatal):", e);
      }
    }

    triggerFlyToCart();

    setTimeout(() => {
      addToCart(currentProduct, 1, {
        design: activeDesign,
        color: shirtColor,
        size: selectedSize,
        giftCardUrl,
        designImageUrl,
        photos: uploadedPhotos,
      });
      incrementCount();
      setIsUploading(false);
    }, 480);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleBuy();
    } else {
      goNext();
    }
  };

  const { title: stepTitle } = getStepLabel(activeProduct, step);

  // ── Resolve design src for preview ───────────────────────────────────────
  const activeDesignSrc: string | null = (() => {
    if (!activeDesign) return null;
    if (activeDesign.startsWith("/api/pixabay-image")) return activeDesign;
    return PREDEFINED_DESIGNS.find((d) => d.id === activeDesign)?.src ?? null;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    // Root: 1080 × 1920 kiosk container
    <div className="w-[1080px] min-h-[1920px] mx-auto bg-white">
      {/* Fly particles overlay */}
      <FlyParticles particles={flyParticles} />
      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center pt-14 pb-8 px-16">
        {/* Cart button top-left */}
        <div className="absolute top-14 left-16">
          <a
            ref={cartIconRef}
            href="/cart"
            className="relative w-20 h-20 rounded-full bg-[#D9D9D9] hover:bg-[#2CAAE1] transition-colors flex items-center justify-center group"
          >
            <ShoppingCart
              size={34}
              className="text-[#374151] group-hover:text-white transition-colors"
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#2CAAE1] text-white text-[13px] font-medium flex items-center justify-center shadow-md">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </a>
        </div>

        <h1 className="font-serif text-[52px] font-normal text-[#374151] tracking-tight">
          Design Your Product
        </h1>
        <p className="text-[28px] font-light text-[#6B7280] tracking-wide mt-2">
          {currentProduct.label}
          {isGiftCard ? " — Wonderful Gift Card" : ""}
        </p>
      </div>
      {/* ── MAIN LAYOUT ──────────────────────────────────────────── */}
      <div className="flex flex-1 px-16 gap-0">
        {/* Left: Product Sidebar */}
        <div className="flex flex-col gap-4 pr-12 pt-2 flex-shrink-0">
          <p className="text-[18px] font-medium text-[#6B7280] tracking-wide mb-2">
            Product
          </p>
          {PRODUCTS.map((product) => {
            const isActive = activeProduct === product.id;
            return (
              <motion.button
                key={product.id}
                onClick={() => handleProductChange(product.id as ProductId)}
                animate={{ borderColor: isActive ? "#2CAAE1" : "#D9D9D9" }}
                className={`
                  w-[120px] h-[120px] rounded-[20px] border-[2.5px] flex items-center justify-center
                  relative overflow-hidden transition-colors
                  ${isActive ? "bg-[#EBF7FD] border-[#2CAAE1]" : "bg-white border-[#D9D9D9] hover:border-[#2CAAE1]"}
                `}
              >
                <div className="relative w-20 h-20">
                  <Image
                    src={product.file}
                    alt={product.label}
                    fill
                    className="object-contain"
                  />
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-[11px] font-medium text-[#2CAAE1] bg-white/85">
                    {product.label}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Center: Preview + Step Content */}
        <div className="flex-1 flex flex-col items-center">
          {/* Product Preview */}
          <div className="w-[520px] h-[520px] flex items-center justify-center mb-10">
            {isGiftCard ? (
              <GiftCardEditor
                productFile={currentProduct.file}
                textArea={currentProduct.textArea}
                initialTemplate={GIFT_CARD_TEMPLATES[0]}
                onExport={setGiftCardUrl}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Canvas
                  ref={canvasRef}
                  designSrc={activeDesignSrc}
                  shirtColor={shirtColor}
                  productFile={currentProduct.file}
                  overlayFile={currentProduct.overlayFile}
                  photos={photos}
                />
              </div>
            )}
          </div>

          {/* Step Label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${activeProduct}-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center gap-1 mb-8"
            >
              <h2 className="font-serif text-[38px] font-normal text-[#374151]">
                {stepTitle}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${activeProduct}-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center w-full"
            >
              {/* ── Non-GiftCard steps ── */}
              {!isGiftCard && step === 1 && (
                <StepColor value={shirtColor} onChange={setShirtColor} />
              )}
              {!isGiftCard && step === 2 && (
                <StepPattern
                  value={activeDesign}
                  onChange={setActiveDesign}
                  photos={photos}
                  onPhotosChange={setPhotos}
                />
              )}
              {!isGiftCard && step === 3 && activeProduct === "fajamas" && (
                <StepSize value={selectedSize} onChange={setSelectedSize} />
              )}

              {/* ── GiftCard steps ── */}
              {isGiftCard && step === 1 && (
                <StepGCTemplate value={gcTemplate} onChange={setGcTemplate} />
              )}
              {isGiftCard && step === 2 && (
                <StepGCMessage value={gcMessage} onChange={setGcMessage} />
              )}
              {isGiftCard && step === 3 && (
                <StepGCFontSize value={gcFontSize} onChange={setGcFontSize} />
              )}
              {isGiftCard && step === 4 && (
                <StepGCFontStyle
                  value={gcFontFamily}
                  onChange={setGcFontFamily}
                />
              )}
              {isGiftCard && step === 5 && (
                <StepGCFontColor
                  value={gcFontColor}
                  onChange={setGcFontColor}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* ── BOTTOM NAV ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-16 pt-10 pb-14 mt-auto">
        {/* Prev */}
        <motion.button
          onClick={goPrev}
          disabled={step === 1}
          whileTap={{ scale: 0.96 }}
          className={`
            flex items-center gap-3 h-20 px-12 rounded-full border-[2.5px] text-[24px] font-medium transition-all
            ${step === 1
              ? "invisible"
              : "border-[#2CAAE1] text-[#2CAAE1] bg-white hover:bg-[#EBF7FD]"
            }
          `}
        >
          <ChevronLeft size={28} />
          Prev
        </motion.button>

        {/* Step indicator */}
        <span className="text-[26px] text-[#6B7280]">
          Step {step}/{maxStep}
        </span>

        {/* Next / Buy */}
        <motion.button
          ref={addBtnRef}
          onClick={handleNext}
          disabled={isUploading}
          whileTap={{ scale: 0.96 }}
          className={`
            flex items-center gap-3 h-20 px-12 rounded-full border-[2.5px] text-[24px] font-medium transition-all
            ${isLastStep
              ? "bg-[#2CAAE1] border-[#2CAAE1] text-white hover:bg-[#1a91c8]"
              : "bg-[#2CAAE1] border-[#2CAAE1] text-white hover:bg-[#1a91c8]"
            }
            ${isUploading ? "opacity-75 cursor-not-allowed" : ""}
          `}
        >
          {isLastStep ? (
            <>
              {isUploading ? "Processing..." : "Buy"}
              {!isUploading && <ArrowRight size={28} />}
            </>
          ) : (
            <>
              Next
              <ChevronRight size={28} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
