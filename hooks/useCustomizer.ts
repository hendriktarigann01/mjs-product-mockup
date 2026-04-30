import { useState, useCallback } from "react";

export type ProductId = "fajamas" | "socks" | "totebag" | "gift-card";

export function useCustomizer() {
  // ── Product & Step ─────────────────────────────────────────────────────────
  const [activeProduct, setActiveProduct] = useState<ProductId>("fajamas");
  const [step, setStep] = useState(1);

  // ── Shared product state ───────────────────────────────────────────────────
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);

  // ── Gift card state ────────────────────────────────────────────────────────
  const [giftCardUrl, setGiftCardUrl] = useState<string | null>(null);
  const [gcMessage, setGcMessage] = useState("");
  const [gcFontSize, setGcFontSize] = useState(24);
  const [gcFontFamily, setGcFontFamily] = useState("Georgia, serif");
  const [gcFontColor, setGcFontColor] = useState("#1a1a1a");
  const [gcTemplate, setGcTemplate] = useState("gift-card-birthday");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isGiftCard = activeProduct === "gift-card";

  /** fajamas: 3 steps (color → pattern → size)
   *  socks/totebag: 2 steps (color → pattern)  — step 3 = buy action
   *  gift-card: 5 steps (template → message → fontSize → fontStyle → fontColor)
   */
  const maxStep = isGiftCard ? 5 : activeProduct === "fajamas" ? 3 : 2;

  const handleProductChange = useCallback(
    (id: ProductId) => {
      setActiveProduct(id);
      setStep(1);
      setSelectedSize(null);
      setPhotos([null, null, null]);
      setGiftCardUrl(null);
      setGcMessage("");
    },
    []
  );

  const goNext = useCallback(() => {
    if (step < maxStep) setStep((s) => s + 1);
  }, [step, maxStep]);

  const goPrev = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const reset = useCallback(() => {
    setShirtColor("#ffffff");
    setSelectedSize(null);
    setPhotos([null, null, null]);
    setGiftCardUrl(null);
    setGcMessage("");
    setGcFontSize(24);
    setGcFontFamily("Georgia, serif");
    setGcFontColor("#1a1a1a");
    setGcTemplate("gift-card-birthday");
  }, []);

  return {
    // product & step
    activeProduct,
    step,
    maxStep,
    isGiftCard,
    handleProductChange,
    goNext,
    goPrev,
    // shared
    shirtColor,
    setShirtColor,
    selectedSize,
    setSelectedSize,
    photos,
    setPhotos,
    // gift card
    giftCardUrl,
    setGiftCardUrl,
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
    reset,
  };
}