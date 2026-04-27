import type { WilayahValue } from "@/types/checkout";

export const EMPTY_WILAYAH: WilayahValue = {
  provinsiId: "",
  provinsiName: "",
  kabupatenId: "",
  kabupatenName: "",
  kecamatanId: "",
  kecamatanName: "",
  kelurahanId: "",
  kelurahanName: "",
};

export const PAYMENT_METHODS = ["BCA", "GoPay", "+22"] as const;

export const DEFAULT_ORDER = {
  name: "Facebag",
  price: 98000,
  qty: 1,
  sku: "mczr_price_98000",
  color: "Playful Blue",
  pattern: "Sunny Side Up",
  photos: "No Photo",
  notes: "Untitled answer",
  imageSrc: "/products/facebag-preview.png",
} as const;
