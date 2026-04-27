import type { CartItem } from "@/types/cart";

export const INITIAL_CART: CartItem[] = [
  {
    id: "item-1",
    name: "Facebag",
    price: 98000,
    quantity: 1,
    sku: "mczr_price_98000",
    color: "Playful Blue",
    pattern: "Sunny Side Up",
    photos: "No Photo",
    notes: "Untitled answer",
    image: "/products/facebag-preview.png",
  },
];

// Trust badges shown in cart
export const TRUST_BADGES = [
  { title: "Free Shipping", sub: "For Java-Bali" },
  { title: "Soft, Comfy", sub: "and Durable" },
  { title: "Specially Made", sub: "We Do Our Best" },
  { title: "30 Days", sub: "Happy Guarantee" },
] as const;
