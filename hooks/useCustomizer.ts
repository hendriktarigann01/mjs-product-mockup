import { useState, useCallback } from "react";

export function useCustomizer() {
  const [activeDesign, setActiveDesign] = useState<string | null>(null);
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [giftCardUrl, setGiftCardUrl] = useState<string | null>(null);

  const reset = useCallback(() => {
    setActiveDesign(null);
    setShirtColor("#ffffff");
    setPhotos([null, null, null]);
    setGiftCardUrl(null);
  }, []);

  const resetForProductChange = useCallback(() => {
    setActiveDesign(null);
    setPhotos([null, null, null]);
    setGiftCardUrl(null);
  }, []);

  return {
    activeDesign,
    setActiveDesign,
    shirtColor,
    setShirtColor,
    photos,
    setPhotos,
    giftCardUrl,
    setGiftCardUrl,
    reset,
    resetForProductChange,
  };
}
