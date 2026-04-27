/**
 * Order Success Page
 * Auto-redirect ke home setelah 10 detik
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, Download } from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { clearCart } from "@/utils/cart-service";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Get order ID dari URL
    const orderId = searchParams.get("order_id");
    const statusCode = searchParams.get("status_code");
    const transactionStatus = searchParams.get("transaction_status");

    console.log("Order Success:", { orderId, statusCode, transactionStatus });

    // Get order data dari localStorage
    const currentOrder = localStorage.getItem("currentOrder");
    if (currentOrder) {
      const order = JSON.parse(currentOrder);
      setOrderData({
        ...order,
        orderId,
        transactionStatus,
      });
    }

    // Clear cart
    clearCart();
    localStorage.removeItem("currentOrder");
  }, [searchParams]);

  // Auto-redirect setelah 10 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <Header
          breadcrumb="Home / Cart / Checkout / Success"
          title="Payment Success!"
        />

        {/* Success Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <div className="flex flex-col items-center text-center">
            {/* Success Icon */}
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />

            {/* Title */}
            <h1 className="font-serif text-3xl text-stone-800 mb-2">
              Payment Confirmed!
            </h1>

            {/* Description */}
            <p className="font-mono text-sm text-stone-600 mb-6">
              Thank you for your purchase. Your order is being prepared and will
              be shipped soon.
            </p>

            {/* Order ID */}
            {orderData?.orderId && (
              <div className="bg-white border border-green-200 rounded p-4 mb-6 w-full">
                <p className="font-mono text-xs text-stone-400 mb-1">
                  Order ID
                </p>
                <p className="font-mono text-lg font-semibold text-stone-800 break-all">
                  {orderData.orderId}
                </p>
              </div>
            )}

            {/* Countdown */}
            <p className="font-mono text-xs text-stone-500 mb-4">
              Redirecting to home in{" "}
              <span className="font-semibold text-green-600">{countdown}s</span>
              ...
            </p>
          </div>
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8">
            <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-stone-400 mb-6">
              Order Summary
            </h2>

            {/* Customer Info */}
            <div className="mb-6 pb-6 border-b border-stone-200">
              <h3 className="font-mono text-xs uppercase text-stone-400 mb-3">
                Shipping To
              </h3>
              <div className="space-y-2">
                <p className="font-serif text-sm text-stone-700">
                  {orderData.customerEmail}
                </p>
                <p className="font-mono text-xs text-stone-600">
                  {orderData.shippingAddress}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6 pb-6 border-b border-stone-200">
              <h3 className="font-mono text-xs uppercase text-stone-400 mb-3">
                Items Ordered
              </h3>
              <div className="space-y-2">
                {orderData.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-xs font-mono"
                  >
                    <span className="text-stone-600">{item.name}</span>
                    <span className="text-stone-700">x {item.quantity}</span>
                    <span className="text-stone-800">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      ,00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="text-stone-700">
                    Rp{" "}
                    {(
                      orderData.items?.reduce(
                        (sum: number, item: any) =>
                          sum + item.price * item.quantity,
                        0,
                      ) || 0
                    ).toLocaleString("id-ID")}
                    ,00
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-500">Shipping</span>
                  <span className="text-stone-700">
                    Rp {(orderData.shippingCost || 0).toLocaleString("id-ID")}
                    ,00
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3">
                <span className="font-mono text-sm font-semibold text-stone-800">
                  Total
                </span>
                <span className="font-mono text-lg font-semibold text-stone-800">
                  Rp{" "}
                  {(
                    (orderData.items?.reduce(
                      (sum: number, item: any) =>
                        sum + item.price * item.quantity,
                      0,
                    ) || 0) + (orderData.shippingCost || 0)
                  ).toLocaleString("id-ID")}
                  ,00
                </span>
              </div>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-serif text-lg text-stone-800 mb-4">
            What's Next?
          </h3>
          <ul className="space-y-3 font-mono text-sm text-stone-700">
            <li>
              ✓ <strong>1-2 hours:</strong> Order confirmation email
            </li>
            <li>
              ✓ <strong>1-3 days:</strong> Item being prepared
            </li>
            <li>
              ✓ <strong>3-5 days:</strong> Item shipped with tracking
            </li>
            <li>
              ✓ <strong>5-7 days:</strong> Delivered to your address
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 rounded hover:bg-stone-50 transition-colors">
            <Download size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">
              Download Receipt
            </span>
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
          >
            <Home size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">
              Back to Home
            </span>
          </Link>
        </div>

        {/* Support */}
        <div className="bg-stone-100 rounded-lg p-6 text-center">
          <p className="font-mono text-xs text-stone-600 mb-2">
            Need help? Contact our support
          </p>
          <p className="font-serif text-sm text-stone-800">
            📧 support@happify.id | 📞 +62-812-3456-7890
          </p>
        </div>

        <Footer />
      </div>
    </main>
  );
}
