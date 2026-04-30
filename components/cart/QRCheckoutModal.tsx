// Tujuan      : Modal form (nama, email, phone) + QR code untuk cross-device checkout
// Caller      : app/cart/page.tsx
// Dependensi  : @supabase/supabase-js (via lib/supabase), react-qr-code, utils/cart-service
// Main Exports: QRCheckoutModal
// Side Effects: Supabase insert (checkout_sessions)

"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabase";
import { getCart, clearCart } from "@/utils/cart-service";
import type { CartItemWithCustomization } from "@/utils/cart-service";

interface QRCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemWithCustomization[];
}

export function QRCheckoutModal({ isOpen, onClose, cartItems }: QRCheckoutModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isValid = name.trim() && email.trim() && phone.trim();

  const handleGenerate = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);

    try {
      // Ambil cart terbaru dari localStorage
      const currentCart = cartItems.length > 0 ? cartItems : getCart();

      if (currentCart.length === 0) {
        setError("Cart is empty");
        return;
      }

      const { data, error: dbError } = await supabase
        .from("checkout_sessions")
        .insert({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          cart_items: currentCart,
          status: "pending",
        })
        .select("id")
        .single();

      if (dbError) throw new Error(dbError.message);

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${baseUrl}/checkouts?session_id=${data.id}`;
      setQrUrl(url);

      // Real-time listener: Tutup modal jika status berubah (berarti sudah di-scan & diproses)
      const channel = supabase
        .channel(`checkout-${data.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "checkout_sessions",
            filter: `id=eq.${data.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === "paid" || newStatus === "waiting_payment") {
              console.log("✅ Checkout session used, closing modal...");
              handleClose();
              // Opsional: window.location.href = "/order-success"; 
              // Tapi biasanya biarkan user di desktop lihat ini tutup sendiri
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (qrUrl) {
      clearCart();
      window.location.href = "/";
      return;
    }
    setQrUrl(null);
    setName("");
    setEmail("");
    setPhone("");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-[#2CAAE1] to-[#1B8DC4] px-6 py-5 sm:px-8 sm:py-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Continue on Mobile</h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            Fill in your info, then scan the QR code on your phone
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-5">
          {!qrUrl ? (
            <>
              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base focus:ring-2 focus:ring-[#2CAAE1] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base focus:ring-2 focus:ring-[#2CAAE1] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base focus:ring-2 focus:ring-[#2CAAE1] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!isValid || isLoading}
                className="w-full bg-[#2CAAE1] text-white py-3.5 rounded-2xl text-lg font-semibold shadow-lg hover:bg-[#1B8DC4] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating session..." : "Generate QR Code"}
              </button>
            </>
          ) : (
            <>
              {/* QR Code display */}
              <div className="flex flex-col items-center space-y-5">
                <div className="bg-white p-4 rounded-2xl shadow-inner border border-stone-100">
                  <QRCode
                    value={qrUrl}
                    size={200}
                    level="H"
                    style={{ width: "100%", maxWidth: 200, height: "auto" }}
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-stone-800 font-semibold text-base">
                    Scan with your phone camera
                  </p>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    The checkout page will open on your mobile device with your cart items pre-loaded
                  </p>
                </div>


                <div className="w-full bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <p className="text-[10px] text-stone-400 break-all font-mono select-all">
                    {qrUrl}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Close button */}
        <div className="px-6 pb-5 sm:px-8 sm:pb-6">
          <button
            onClick={handleClose}
            className="w-full py-3 text-stone-500 text-base font-medium hover:text-stone-800 transition-colors"
          >
            {qrUrl ? "Done / Reset" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
