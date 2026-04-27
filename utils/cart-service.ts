/**
 * Cart Service - Manage cart state & flow across pages
 * Handles: Add item, Remove item, Update quantity, Clear cart
 * Buy Now: item sementara di sessionStorage (tidak masuk cart)
 * Can be replaced with Context API or Zustand if needed
 */

import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";

export interface CartItemWithCustomization extends CartItem {
  customization?: {
    design?: string | null;
    color?: string;
    photos?: (string | null)[];
    giftCardUrl?: string | null;
  };
}

/**
 * Get cart from localStorage
 */
export function getCart(): CartItemWithCustomization[] {
  if (typeof window === "undefined") return [];

  try {
    const cart = localStorage.getItem("happify_cart");
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

/**
 * Save cart to localStorage
 */
function saveCart(items: CartItemWithCustomization[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("happify_cart", JSON.stringify(items));
}

/**
 * Add item to cart
 */
export function addToCart(
  product: Product,
  quantity: number = 1,
  customization?: CartItemWithCustomization["customization"],
): CartItemWithCustomization {
  const cart = getCart();

  // Generate unique ID dengan customization hash
  const customizationHash = customization ? JSON.stringify(customization) : "";
  const cartItemId = `${product.id}_${customizationHash ? Buffer.from(customizationHash).toString("base64").substring(0, 8) : "default"}`;

  // Check if item sudah ada (same product + same customization)
  const existingIndex = cart.findIndex((item) => item.id === cartItemId);

  let cartItem: CartItemWithCustomization;

  if (existingIndex >= 0) {
    // Update quantity jika item sudah ada
    cart[existingIndex].quantity += quantity;
    cartItem = cart[existingIndex];
  } else {
    // Add item baru
    cartItem = {
      id: cartItemId,
      name: product.label,
      price: product.price,
      quantity,
      weight: product.weight,
      color: customization?.color || "Default",
      pattern: "Custom",
      photos: customization?.photos?.length
        ? `${customization.photos.filter(Boolean).length} photos`
        : "No Photo",
      notes: customization?.giftCardUrl ? "Gift Card" : "Design",
      image: product.file,
      sku: `SKU_${product.id}_${Date.now()}`,
      customization,
    };
    cart.push(cartItem);
  }

  saveCart(cart);
  return cartItem;
}

/**
 * Remove item from cart
 */
export function removeFromCart(itemId: string) {
  const cart = getCart();
  const filtered = cart.filter((item) => item.id !== itemId);
  saveCart(filtered);
}

/**
 * Update item quantity
 */
export function updateCartItemQuantity(itemId: string, quantity: number) {
  const cart = getCart();
  const item = cart.find((i) => i.id === itemId);

  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      item.quantity = quantity;
      saveCart(cart);
    }
  }
}

/**
 * Clear entire cart
 */
export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("happify_cart");
}

/**
 * Get cart total
 */
export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Get cart item count
 */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get cart weight (for shipping calculation)
 */
export function getCartWeight(): number {
  return getCart().reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUY NOW — sessionStorage (tidak masuk happify_cart, hilang saat tab tutup)
// ─────────────────────────────────────────────────────────────────────────────
const BUY_NOW_KEY = "buynow_item";

/**
 * Simpan satu item Buy Now ke sessionStorage.
 * Menerima CartItemWithCustomization yang sudah dibentuk di Customizer.
 */
export function setBuyNowItem(item: CartItemWithCustomization): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item));
}

/**
 * Ambil item Buy Now dari sessionStorage.
 * Return null jika tidak ada.
 */
export function getBuyNowItem(): CartItemWithCustomization | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    return raw ? (JSON.parse(raw) as CartItemWithCustomization) : null;
  } catch {
    return null;
  }
}

/**
 * Hapus item Buy Now dari sessionStorage setelah checkout selesai.
 */
export function clearBuyNowItem(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUY_NOW_KEY);
}
