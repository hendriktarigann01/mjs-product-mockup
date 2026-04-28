"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/common/Button";
import { ContactSection } from "@/components/checkouts/ContactSection";
import { DeliverySection } from "@/components/checkouts/DeliverySection";
import { ShippingSection } from "@/components/checkouts/ShippingSection";
import { PaymentSection } from "@/components/checkouts/PaymentSection";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
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

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItemWithCustomization[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const buyNowItem = getBuyNowItem();
    const items = buyNowItem ? [buyNowItem] : getCart();
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    setCartItems(items);
    setCartTotal(total);

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (clientKey) initMidtrans(clientKey, "sandbox");
  }, []);

  const isFormValid = selectedShipping && addressComplete && email && phone;

  const handleCheckout = async () => {
    if (!isFormValid || cartItems.length === 0 || cartTotal === 0) {
      setError("Cart is empty or invalid total");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
      const subtotal = Math.floor(cartTotal);
      const shippingCost = Math.floor(selectedShipping?.price || 0);
      const grossAmount = subtotal + shippingCost;

      if (grossAmount <= 0) throw new Error("Invalid order total");

      const firstItem = cartItems[0];
      const customization = firstItem?.customization as
        | { design?: string | null; photos?: (string | null)[] }
        | undefined;

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

      // Resolve product folder id ("fajamas") dari nama item ("T-Shirt")
      const productId =
        PRODUCTS.find((p) => p.label === firstItem?.name)?.id ??
        firstItem?.name ??
        "product";

      console.log("[PDF] designSrc resolved:", designSrc);
      console.log(
        "[PDF] photos count:",
        customization?.photos?.filter(Boolean).length ?? 0,
      );
      console.log("[PDF] productId resolved:", productId);

      const canvasPdfBase64 = await generatePatternPDFSafe({
        designSrc,
        photos: customization?.photos ?? [],
        productLabel: productId,
        orderId,
        timeoutMs: 15000,
      });

      // ── Simpan PDF + orderSummary ke public/temp via /api/pdf ──────────────
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

      let hasTempFile = false;
      try {
        const saveRes = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            pdfBase64: canvasPdfBase64 ?? null,
            orderSummary: orderSummaryForTemp,
          }),
        });
        if (saveRes.ok) {
          hasTempFile = true;
          console.log("[PDF/temp] Saved to public/temp");
        } else {
          console.warn("[PDF/temp] Save failed:", await saveRes.text());
        }
      } catch (e) {
        console.warn("[PDF/temp] Save exception:", e);
      }

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
        // Kirim hanya orderId sebagai referensi file temp — backend baca dari disk
        pdfTempFilename: hasTempFile ? orderId : null,
      };

      console.log("[PDF] canvasPdfBase64 generated:", !!canvasPdfBase64);
      console.log("[PDF] hasTempFile:", hasTempFile);
      console.log(
        "🛒 Checkout paymentData:",
        JSON.stringify({ ...paymentData }, null, 2),
      );

      const snapToken = await createTransactionToken(paymentData);

      openMidtransPayment(snapToken, {
        onSuccess: async (result: any) => {
          console.log("payment success", result);
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
          window.location.href = "/order-success";
        },
        onPending: () => {
          window.location.href = "/order-pending";
        },
        onError: () => {
          window.location.href = "/order-error";
        },
        onClose: () => {
          console.log(
            "Customer closed the popup without finishing the payment",
          );
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
        err instanceof Error
          ? err.message
          : "Failed to process payment. Please try again.",
      );
      console.error("Checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cartWeight = cartItems.reduce(
    (sum, i) => sum + i.weight * i.quantity,
    0,
  );
  const shippingCost = selectedShipping?.price || 0;
  const finalTotal = cartTotal + shippingCost;

  return (
    <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row min-h-screen">
        {/* Left — Form */}
        <div className="flex-1 px-6 max-w-2xl mx-auto w-full lg:mx-0">
          <Header
            breadcrumb="Home / Cart / Checkout"
            title="Happify Indonesia"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-mono text-xs text-red-600">{error}</p>
            </div>
          )}

          <ContactSection
            email={email}
            onEmailChange={setEmail}
            newsletter={newsletter}
            onNewsletterChange={setNewsletter}
          />

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

          <ShippingSection
            kecamatanId={wilayah.kecamatanId}
            kecamatanName={wilayah.kecamatanName}
            kabupatenName={wilayah.kabupatenName}
            selectedShipping={selectedShipping as any}
            onSelect={(service) => setSelectedShipping(service as any)}
          />

          <PaymentSection />

          <Button
            variant="primary"
            size="lg"
            disabled={!isFormValid || isProcessing}
            onClick={handleCheckout}
            className="mb-8"
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </Button>

          <p className="font-mono text-[10px] text-stone-400 text-center mb-8">
            You will be redirected to Midtrans to complete payment securely.
          </p>

          <Footer />
        </div>

        {/* Right — Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0 px-4">
          <div className="bg-white/70 border border-stone-200 rounded-lg p-6 sticky top-20">
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-5">
              Order Summary
            </h2>

            <div className="space-y-2 mb-4 max-h-48 overflow-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="font-mono text-stone-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-mono text-stone-700">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")},00
                  </span>
                </div>
              ))}
            </div>

            <div className="border-b border-stone-200 pb-3 mb-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-stone-500">
                  Subtotal
                </span>
                <span className="font-mono text-xs text-stone-700">
                  Rp {cartTotal.toLocaleString("id-ID")},00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-stone-500">Weight</span>
                <span className="font-mono text-xs text-stone-700">
                  {cartWeight} grams
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-stone-500">
                  Shipping
                </span>
                <span className="font-mono text-xs text-stone-700">
                  {selectedShipping
                    ? `Rp ${shippingCost.toLocaleString("id-ID")},00`
                    : "Select shipping method"}
                </span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="font-mono text-xs text-stone-800 font-semibold">
                Total
              </span>
              <span className="font-mono text-lg text-stone-800 font-semibold">
                Rp {finalTotal.toLocaleString("id-ID")},00
              </span>
            </div>

            <p className="font-mono text-[10px] text-stone-400 leading-relaxed">
              Taxes included. Your payment is secured by Midtrans encryption.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
