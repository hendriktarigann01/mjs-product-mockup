// Tujuan      : Halaman checkout — form alamat, shipping, payment + integrasi Midtrans Snap
//               Mendukung cross-device via session_id (QR flow) dan localStorage flow (existing)
// Caller      : app router (/checkouts), QR scan dari cart
// Dependensi  : hooks/useCheckoutForm, utils/cart-service, utils/midtrans-service,
//               utils/generate-pdf, lib/supabase, components/checkouts/*
// Main Exports: CheckoutPage (default)
// Side Effects: Midtrans Snap popup, localStorage read/write, Supabase checkout_sessions read

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { ContactSection } from "@/components/checkouts/ContactSection";
import { DeliverySection } from "@/components/checkouts/DeliverySection";
import { ShippingSection } from "@/components/checkouts/ShippingSection";
import { PaymentSection } from "@/components/checkouts/PaymentSection";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";

// Logika Backend & Integrasi - JANGAN DIHAPUS
import {
  clearCart,
  getCart,
  getBuyNowItem,
  clearBuyNowItem,
} from "@/utils/cart-service";
import {
  initMidtrans,
  createTransactionToken,
  openMidtransPayment,
} from "@/utils/midtrans-service";
import { generatePatternPDFSafe } from "@/utils/generate-pdf";
import { PREDEFINED_DESIGNS, PRODUCTS } from "@/constants/mockup";
import type { CartItemWithCustomization } from "@/utils/cart-service";
import { supabase } from "@/lib/supabase";

// Wrapper karena useSearchParams butuh Suspense boundary
function CheckoutContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [cartItems, setCartItems] = useState<CartItemWithCustomization[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!!sessionId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    email,
    setEmail,
    newsletter,
    setNewsletter,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    address,
    setAddress,
    zip,
    setZip,
    phone,
    setPhone,
    wilayah,
    handleWilayahChange,
    selectedShipping,
    setSelectedShipping,
    addressComplete,
  } = useCheckoutForm();

  // ── Load cart: dari session (QR) ATAU localStorage (existing) ──────────────
  useEffect(() => {
    const loadData = async () => {
      if (sessionId) {
        // Cross-device flow: fetch session dari Supabase
        setSessionLoading(true);
        try {
          const { data, error: dbError } = await supabase
            .from("checkout_sessions")
            .select("name, email, phone, cart_items, status")
            .eq("id", sessionId)
            .maybeSingle();

          if (dbError || !data) {
            setError("Session not found or expired. Please try again.");
            setSessionLoading(false);
            return;
          }

          if (data.status === "paid") {
            setError("This session has already been paid.");
            setSessionLoading(false);
            return;
          }

          // Prefill form dari session
          const nameParts = (data.name || "").split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");

          // Set cart dari session
          const items = data.cart_items as CartItemWithCustomization[];
          setCartItems(items);
          setCartTotal(
            items.reduce((sum, i) => sum + i.price * i.quantity, 0),
          );
        } catch {
          setError("Failed to load session data.");
        } finally {
          setSessionLoading(false);
        }
      } else {
        // Existing localStorage flow (same-device)
        const buyNowItem = getBuyNowItem();
        const items = buyNowItem ? [buyNowItem] : getCart();
        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        setCartItems(items);
        setCartTotal(total);
      }

      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
      if (clientKey) {
        initMidtrans(clientKey, isProduction ? "production" : "sandbox");
      }
    };

    loadData();
  }, [sessionId, setFirstName, setLastName, setEmail, setPhone]);

  const isFormValid = selectedShipping && addressComplete && email && phone;

  const handleCheckout = async (method: "midtrans" | "cashier") => {
    setShowPaymentModal(false);
    if (!isFormValid || cartItems.length === 0 || cartTotal === 0) {
      setError("Cart is empty or invalid total");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format");
      setIsProcessing(false);
      return;
    }

    try {
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_order_id");
      let rawId = (seqData as string) || "";
      if (seqError || !rawId) {
        console.error("Gagal mendapatkan urutan order ID, menggunakan fallback:", seqError);
        rawId = `H${Math.floor(17000 + Math.random() * 1000)}`;
      }

      const cleanNumber = rawId.replace(/^#+/, "").replace(/^H/, "");
      const orderId = `#H${cleanNumber}`;
      const subtotal = Math.floor(cartTotal);
      const shippingCost = Math.floor(selectedShipping?.price || 0);
      const grossAmount = subtotal + shippingCost;

      const firstItem = cartItems[0];
      const customization = firstItem?.customization as any;

      const designSrc = (() => {
        const d = customization?.design;
        if (!d) return null;
        if (
          d.startsWith("/api/pixabay-image") ||
          d.startsWith("/mockup/") ||
          d.startsWith("/products/")
        )
          return d;
        return PREDEFINED_DESIGNS.find((item) => item.id === d)?.src ?? null;
      })();

      const productId =
        PRODUCTS.find((p) => p.label === firstItem?.name)?.id ??
        firstItem?.name ??
        "product";

      /* 
      const canvasPdfBase64 = await generatePatternPDFSafe({
        designSrc,
        photos: customization?.photos ?? [],
        productLabel: productId,
        orderId,
        timeoutMs: 15000,
      });
      */
      const canvasPdfBase64 = null;

      const orderSummaryForTemp = {
        orderId,
        customerName: [firstName, lastName].filter(Boolean).join(" "),
        email: String(email).trim(),
        phone: String(phone || "").trim(),
        address: String(address || "").trim(),
        zip: String(zip || "").trim(),
        items: cartItems.map((item) => ({
          id: String(item.id),
          price: Math.floor(item.price),
          quantity: Math.floor(item.quantity),
          name: String(item.name),
        })),
        ongkir: shippingCost,
        totalHarga: subtotal,
        grossAmount,
        shippingName: selectedShipping?.name || "",
      };

      // Simpan data order di Supabase sudah dilakukan di backend/routes/midtrans.js
      // Tidak perlu lagi menyimpan file JSON/PDF sementara di public/temp karena Vercel read-only
      let hasTempFile = false;

      const paymentData = {
        transactionDetails: { orderId, grossAmount },
        customerDetails: {
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
          email: String(email).trim(),
          phone: String(phone || "").trim(),
          address: String(address || "").trim(),
          zip: String(zip || "").trim(),
          kabupatenName: wilayah.kabupatenName || "",
          provinsiName: wilayah.provinsiName || "",
          shippingPrice: shippingCost,
          shippingName: selectedShipping?.name || "",
        },
        itemDetails: [
          ...cartItems.map((item) => ({
            id: String(item.id),
            price: Math.floor(item.price),
            quantity: Math.floor(item.quantity),
            name: String(item.name),
          })),
          {
            id: "SHIPPING",
            price: shippingCost,
            quantity: 1,
            name: `Shipping (${wilayah.kabupatenName || "Indonesia"})`,
          },
        ],
        fullCartItems: cartItems,
        pdfTempFilename: hasTempFile ? orderId : null,
        designImageUrl: customization?.designImageUrl || null,
        productUrl: (customization?.photos || []).filter(Boolean)[0] || null,
        paymentMethod: method,
      };

      // Kirim ke Backend (Express)
      console.log("📥 Mengirim data checkout ke backend...");
      const response = await createTransactionToken(paymentData);
      console.log("✅ Respons backend diterima:", response);

      if (response.isCashier) {
        console.log("🏪 Alur pembayaran kasir terdeteksi, mengalihkan...");
        localStorage.setItem(
          "currentOrder",
          JSON.stringify({
            orderId,
            items: cartItems,
            customerEmail: email,
            shippingAddress: address,
            shippingCost,
          }),
        );
        clearCart();
        clearBuyNowItem();
        
        // SOLUSI SIMPEL: Pakai orderId langsung dari frontend agar tidak kosong
        const successUrl = `/order-success?order_id=${encodeURIComponent(orderId)}`;
        console.log("🚀 Redirecting to:", successUrl);
        window.location.href = successUrl;
        return;
      }

      // FLOW MIDTRANS (Hanya untuk Online Payment)
      openMidtransPayment(response.token, {
        onSuccess: async (result: any) => {
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || ""}/api/midtrans/callback`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  order_id: result.order_id,
                  transaction_status: "settlement",
                }),
              },
            );
          } catch (e) {
            console.error("Failed to trigger callback", e);
          }

          // Update checkout session status jika dari QR flow
          if (sessionId) {
            try {
              await supabase
                .from("checkout_sessions")
                .update({ status: "paid" })
                .eq("id", sessionId);
            } catch { }
          }

          window.location.href = `/order-success?order_id=${encodeURIComponent(result.order_id || orderId)}`;
        },
        onPending: () => {
          // Update checkout session → waiting_payment jika dari QR flow
          if (sessionId) {
            supabase
              .from("checkout_sessions")
              .update({ status: "waiting_payment" })
              .eq("id", sessionId)
              .then(() => { });
          }
          window.location.href = `/order-pending?order_id=${encodeURIComponent(orderId)}`;
        },
        onError: () => {
          window.location.href = `/order-error?order_id=${encodeURIComponent(orderId)}`;
        },
        onClose: () => {
          console.log("Customer closed the popup");
        },
      });

      localStorage.setItem(
        "currentOrder",
        JSON.stringify({
          orderId,
          items: cartItems,
          customerEmail: email,
          shippingAddress: address,
          shippingCost,
        }),
      );
      clearCart();
      clearBuyNowItem();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process payment.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const cartWeight = cartItems.reduce(
    (sum, i) => sum + (i.weight || 0) * i.quantity,
    0,
  );
  const shippingCost = selectedShipping?.price || 0;
  const finalTotal = cartTotal + shippingCost;

  // Loading state untuk session fetch
  if (sessionLoading) {
    return (
      <main className="min-h-screen bg-brand-gray-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#2CAAE1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-500 text-lg">Loading checkout session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-gray-primary px-4 sm:px-8 py-10 sm:py-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-[850px] flex flex-col items-center">
        {/* Title Header */}
        <h1 className="text-3xl sm:text-5xl font-medium text-[#4A5568] mb-10 sm:mb-20 text-center">
          Happify Indonesia
        </h1>

        {/* Session badge (QR flow indicator) */}
        {sessionId && (
          <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm sm:text-base flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            <span>Checkout session loaded from QR code</span>
          </div>
        )}

        {error && (
          <div className="w-full mb-6 sm:mb-8 p-4 sm:p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-base sm:text-xl">
            {error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="w-full bg-white rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 shadow-sm space-y-10 sm:space-y-16 border border-brand-gray-secondary">
          <section>
            <ContactSection
              email={email}
              onEmailChange={setEmail}
              newsletter={newsletter}
              onNewsletterChange={setNewsletter}
            />
          </section>

          <section>

            <DeliverySection
              firstName={firstName}
              onFirstNameChange={setFirstName}
              lastName={lastName}
              onLastNameChange={setLastName}
              address={address}
              onAddressChange={setAddress}
              zip={zip}
              onZipChange={setZip}
              phone={phone}
              onPhoneChange={setPhone}
              wilayah={wilayah}
              onWilayahChange={handleWilayahChange}
            />
          </section>

          <section>

            <ShippingSection
              kecamatanId={wilayah.kecamatanId}
              kecamatanName={wilayah.kecamatanName}
              kabupatenName={wilayah.kabupatenName}
              selectedShipping={selectedShipping as any}
              onSelect={(service) => setSelectedShipping(service as any)}
            />
          </section>

          <section className="bg-brand-gray-primary/40 p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-brand-gray-secondary">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-stone-800 uppercase tracking-wide">
              Payment
            </h2>
            <p className="text-stone-500 mb-6 sm:mb-8 text-base sm:text-xl">
              All transactions are secure and encrypted.
            </p>
            <PaymentSection />
          </section>

          {/* Action Button */}

          {/* Order Summary at Bottom (Sesuai Foto) */}
          <div className="pt-10 sm:pt-16 border-t-2 border-dashed border-brand-gray-tertiary">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 text-stone-800">
              Order Summary
            </h2>

            <div className="space-y-6 sm:space-y-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-lg sm:text-2xl">
                  <span className="text-stone-600 font-medium">
                    {item.name}
                  </span>
                  <span className="text-stone-900">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")},00
                  </span>
                </div>
              ))}

              <div className="pt-6 sm:pt-10 space-y-4 sm:space-y-6 border-t border-brand-gray-tertiary">
                <div className="flex justify-between text-base sm:text-xl text-stone-500">
                  <span>Subtotal</span>
                  <span>Rp {cartTotal.toLocaleString("id-ID")},00</span>
                </div>
                <div className="flex justify-between text-base sm:text-xl text-stone-500">
                  <span>Weight</span>
                  <span>{cartWeight} grams</span>
                </div>
                <div className="flex justify-between text-base sm:text-xl text-stone-500">
                  <span>Shipping</span>
                  <span>
                    {selectedShipping
                      ? `Rp ${shippingCost.toLocaleString("id-ID")},00`
                      : "Select shipping method"}
                  </span>
                </div>

                <div className="flex justify-between pt-6 sm:pt-8 items-center border-t border-brand-gray-tertiary">
                  <span className="text-2xl sm:text-3xl font-bold text-stone-800">
                    Total
                  </span>
                  <span className="text-2xl sm:text-4xl font-bold text-brand-primary">
                    Rp {finalTotal.toLocaleString("id-ID")},00
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-stone-400 mt-10 sm:mt-16 text-base sm:text-xl">
              You will be redirected to Midtrans to complete payment securely
            </p>
          </div>

          <button
            disabled={!isFormValid || isProcessing}
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-brand-primary text-white py-6 sm:py-10 rounded-[16px] sm:rounded-[24px] text-2xl sm:text-4xl font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Check out"}
          </button>
        </div>

        <Footer className="mt-12 sm:mt-20 opacity-40" />
      </div>

      {/* Modal Pilihan Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-stone-800 mb-2">Pilih Metode Pembayaran</h3>
            <p className="text-stone-500 mb-6">Silakan pilih metode pembayaran yang Anda inginkan untuk menyelesaikan pesanan.</p>

            <div className="space-y-4">
              <button
                onClick={() => handleCheckout("midtrans")}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-stone-200 hover:border-[#2CAAE1] hover:bg-[#2CAAE1]/5 transition-all text-left group"
              >
                <div>
                  <div className="font-bold text-stone-800 group-hover:text-[#2CAAE1]">Midtrans (Online)</div>
                  <div className="text-sm text-stone-500">QRIS, GoPay, Transfer Bank</div>
                </div>
                <div className="text-[#2CAAE1]">→</div>
              </button>

              <button
                onClick={() => handleCheckout("cashier")}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div>
                  <div className="font-bold text-stone-800 group-hover:text-emerald-600">Payment at Cashier</div>
                  <div className="text-sm text-stone-500">Bayar langsung di kasir / EDC</div>
                </div>
                <div className="text-emerald-500">→</div>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="mt-6 w-full py-3 text-stone-500 font-medium hover:text-stone-800 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Default export dengan Suspense boundary (required by useSearchParams)
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-brand-gray-primary flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#2CAAE1] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
