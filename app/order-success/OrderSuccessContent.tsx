/**
 * Order Success Page Content
 * Tujuan      : Menampilkan detail pesanan setelah checkout (Midtrans atau Cashier)
 * Caller      : app/order-success/page.tsx
 * Dependensi  : @/lib/supabase, utils/cart-service
 * Main Exports: OrderSuccessContent
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, Download, CreditCard, ShoppingBag, Clock } from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { clearCart } from "@/utils/cart-service";
import { supabase } from "@/lib/supabase";

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = searchParams.get("order_id");

    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setOrderData(data);
        } else {
          setError("Order not found");
        }
      } catch (err: any) {
        console.error("Error fetching order:", err.message);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Clear cart and local storage regardless
    clearCart();
    localStorage.removeItem("currentOrder");

    // Real-time subscription for order updates
    if (orderId) {
      const channel = supabase
        .channel(`order-updates-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `order_id=eq.${orderId}`,
          },
          (payload: { new: any }) => {
            console.log("Order updated in real-time:", payload.new);
            setOrderData(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
          <p className="font-mono text-sm text-stone-500 uppercase tracking-widest">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className=" text-3xl text-stone-800 mb-4">Oops!</h2>
        <p className="font-mono text-sm text-stone-500 mb-8">{error || "No order details found."}</p>
        <Link href="/" className="px-8 py-3 bg-stone-900 text-white rounded-full font-mono text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const isCashier = orderData.payment_method?.toLowerCase() === "cashier";
  const isPaid = orderData.status?.toLowerCase() === "paid";
  const showPaidUI = isPaid || (!isCashier);

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <Header
          breadcrumb="Home / Cart / Checkout / Success"
          title={showPaidUI ? "Thanks for Shipping!" : "Order Placed!"}
        />

        {/* Status Card */}
        <div className={`rounded-2xl border p-8 mb-8 ${showPaidUI ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex flex-col items-center text-center">
            {showPaidUI ? (
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
            ) : (
              <Clock className="w-16 h-16 text-amber-500 mb-4" />
            )}

            <h2 className={` text-2xl mb-2 ${showPaidUI ? "text-emerald-900" : "text-amber-900"}`}>
              {showPaidUI ? "Payment Confirmed" : "Complete Your Payment"}
            </h2>

            <p className="font-mono text-sm text-stone-600 mb-6 max-w-md mx-auto">
              {showPaidUI
                ? "Pembayaran Anda telah dikonfirmasi. Pesanan kini masuk dalam tahap produksi dan pengiriman."
                : "Silakan lakukan pembayaran di kasir atau mesin EDC kami untuk memproses pesanan Anda."
              }
            </p>

            <div className="bg-white/80 backdrop-blur-sm border rounded-xl p-4 mb-2 w-full shadow-sm">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-stone-400 mb-1">
                Order Reference Number
              </p>
              <p className="font-mono text-5xl font-bold text-stone-800 break-all">
                {orderData.order_id}
              </p>
            </div>

            {isCashier && (
              <p className="font-mono text-[0.65rem] text-amber-700 mt-2 uppercase font-semibold">
                Tunjukkan nomor di atas kepada petugas kasir kami
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h2 className="font-mono text-[0.7rem] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <ShoppingBag size={14} /> Order Summary
            </h2>
            <span className="font-mono text-[0.6rem] px-2 py-0.5 bg-stone-200 rounded text-stone-600 uppercase font-bold">
              {orderData.status || "Pending"}
            </span>
          </div>

          <div className="p-6">
            {/* Customer & Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-dashed border-stone-200">
              <div>
                <h3 className="font-mono text-[0.65rem] uppercase text-stone-400 mb-2 font-bold tracking-tighter">Shipping Address</h3>
                <p className=" text-sm text-stone-800 font-bold mb-1">{orderData.customer_name}</p>
                <p className="font-mono text-[0.75rem] text-stone-600 leading-relaxed">
                  {orderData.address}<br />
                  {orderData.postal_code}
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[0.65rem] uppercase text-stone-400 mb-2 font-bold tracking-tighter">Contact Info</h3>
                <p className="font-mono text-[0.75rem] text-stone-600 mb-1">{orderData.email}</p>
                <p className="font-mono text-[0.75rem] text-stone-600">{orderData.phone}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-8">
              <h3 className="font-mono text-[0.65rem] uppercase text-stone-400 mb-4 font-bold tracking-tighter">Items Ordered</h3>
              <div className="space-y-4">
                {(orderData.cart_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-mono text-[0.75rem] text-stone-800 font-bold">{item.name}</p>
                      <p className="font-mono text-[0.65rem] text-stone-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-mono text-[0.75rem] text-stone-800">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-2 border border-stone-100">
              <div className="flex justify-between text-[0.75rem] font-mono text-stone-500">
                <span>Subtotal</span>
                <span>Rp {(orderData.subtotal || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-[0.75rem] font-mono text-stone-500">
                <span>Shipping ({orderData.shipping_courier || "Standard"})</span>
                <span>Rp {(orderData.shipping_cost || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200 pt-3 mt-1">
                <span className="font-mono text-sm font-bold text-stone-800 uppercase tracking-widest">Total</span>
                <span className="font-mono text-xl font-bold text-stone-900">
                  Rp {(orderData.total_price || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions / Next Steps */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {isCashier ? (
            <div className="bg-stone-900 text-stone-100 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CreditCard size={120} />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className=" text-2xl mb-2">Instruksi Pembayaran</h3>
                <p className="font-mono text-xs text-stone-400 mb-6 uppercase tracking-widest">Langkah selanjutnya di Kasir</p>
                <ul className="space-y-4 font-mono text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Tunjukkan **Nomor Order** di atas kepada kasir kami.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Lakukan pembayaran menggunakan Tunai, Kartu Debit, atau Kartu Kredit (EDC).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center flex-shrink-0 font-bold">3</span>
                    <span>Kasir akan memproses pesanan Anda setelah pembayaran diterima.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100 border border-stone-200 rounded-2xl p-8 shadow-sm">
              <h3 className=" text-2xl text-stone-800 mb-6">What's Next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-stone-100">
                    <ShoppingBag size={20} className="text-stone-700" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-stone-800 mb-1">Preparation</h4>
                    <p className="font-mono text-[0.7rem] text-stone-500 leading-relaxed">Pesanan Anda akan mulai disiapkan dalam 1-2 hari kerja.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-stone-100">
                    <Download size={20} className="text-stone-700" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-stone-800 mb-1">Update</h4>
                    <p className="font-mono text-[0.7rem] text-stone-500 leading-relaxed">Nomor resi akan dikirimkan otomatis melalui WhatsApp/Email Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support & Actions */}
        {/* <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="font-mono text-[0.6rem] text-stone-400 uppercase tracking-[0.3em] mb-3 font-bold">Need assistance?</p>
            <p className="font-mono text-sm text-stone-800 bg-white px-6 py-2 rounded-full border border-stone-200 shadow-sm">
              📞 +62-851-5800-4568
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-10 py-4 bg-stone-900 text-white rounded-full font-mono text-[0.7rem] uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95"
            >
              <Home size={16} /> Home
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-10 py-4 bg-white border border-stone-300 text-stone-700 rounded-full font-mono text-[0.7rem] uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95"
            >
              <Download size={16} /> Save Receipt
            </button>
          </div>
        </div> */}

        <Footer />
      </div>
    </main>
  );
}