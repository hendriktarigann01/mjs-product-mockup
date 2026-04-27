/**
 * Order Pending Page Content
 * Test: /order-pending?order_id=ORDER_xxx
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Home, RefreshCw } from "lucide-react";
import { Header } from "@/components/common/Header";
import { useState } from "react";

export default function OrderPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!orderId) return;

    setIsChecking(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const order = await res.json();

      if (order.status === "paid") {
        // Redirect to success
        router.push(
          `/order-success?order_id=${orderId}&status_code=200&transaction_status=settlement`,
        );
      } else if (order.status === "failed") {
        // Redirect to error
        router.push(`/order-error?order_id=${orderId}&reason=pending_failed`);
      }
      // Else stay on pending
    } catch (err) {
      console.error("Error checking status:", err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <Header
          breadcrumb="Home / Cart / Checkout / Pending"
          title="Payment Pending"
        />

        {/* Pending Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-8">
          <div className="flex flex-col items-center text-center">
            {/* Pending Icon */}
            <Clock className="w-16 h-16 text-yellow-600 mb-4 animate-pulse" />

            {/* Title */}
            <h1 className="font-serif text-3xl text-stone-800 mb-2">
              Payment Processing
            </h1>

            {/* Description */}
            <p className="font-mono text-sm text-stone-600 mb-6">
              Your payment is being processed. This usually takes a few moments.
              You will receive a confirmation email once the payment is
              complete.
            </p>

            {/* Order ID */}
            {orderId && (
              <div className="bg-white border border-yellow-200 rounded p-4 mb-6 w-full">
                <p className="font-mono text-xs text-stone-400 mb-1">
                  Order ID
                </p>
                <p className="font-mono text-sm font-semibold text-stone-800 break-all">
                  {orderId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-serif text-lg text-stone-800 mb-4">
            What to Do:
          </h3>
          <div className="space-y-3 font-mono text-sm text-stone-700">
            <p>
              ✓ <strong>Don't close this page</strong> — Payment is still
              processing
            </p>
            <p>
              ✓ <strong>Check your email</strong> — Look for confirmation (check
              spam folder too)
            </p>
            <p>
              ✓ <strong>Check back here</strong> — We'll automatically update
              the status
            </p>
            <p>
              ✓ <strong>Usually completes within</strong> — 5 to 15 minutes
            </p>
          </div>
        </div>

        {/* Status Progress */}
        <div className="bg-stone-100 rounded-lg p-6 mb-8">
          <h3 className="font-serif text-lg text-stone-800 mb-4">Status:</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="font-mono text-sm text-stone-700">
                Order submitted
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                <span className="text-white text-xs animate-pulse">⏳</span>
              </div>
              <span className="font-mono text-sm text-stone-700">
                Payment processing...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-stone-300"></div>
              <span className="font-mono text-sm text-stone-400">
                Payment confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Check Status */}
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 rounded hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isChecking ? "animate-spin" : ""} />
            <span className="font-mono text-xs uppercase tracking-wider">
              {isChecking ? "Checking..." : "Check Status Now"}
            </span>
          </button>

          {/* Home */}
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
          >
            <Home size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">
              Go Home
            </span>
          </Link>
        </div>

        {/* FAQ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-serif text-lg text-stone-800 mb-4">FAQ:</h3>
          <div className="space-y-4 font-mono text-sm">
            <div>
              <p className="font-semibold text-stone-800 mb-1">
                Q: How long does payment take?
              </p>
              <p className="text-stone-600">
                A: Usually 5-15 minutes. If longer, contact support.
              </p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">
                Q: What if I didn't get confirmation email?
              </p>
              <p className="text-stone-600">
                A: Check spam folder. If not there after 30 min, contact
                support.
              </p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">
                Q: Can I close this page?
              </p>
              <p className="text-stone-600">
                A: Yes, payment continues in background. Bookmark this page.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-stone-100 rounded-lg p-6 text-center">
          <p className="font-mono text-xs text-stone-600 mb-2">
            Payment still pending after 30 minutes? Contact us
          </p>
          <p className="font-serif text-sm text-stone-800">
            📧 support@happify.id | 📞 +62-812-3456-7890
          </p>
        </div>
      </div>
    </main>
  );
}
