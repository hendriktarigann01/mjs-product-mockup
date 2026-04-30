/**
 * Order Error Page Content
 * Test cases: /order-error?reason=declined
 */

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

const ERROR_CASES: Record<
  string,
  { title: string; message: string; reason: string }
> = {
  declined: {
    title: "Card Declined",
    message:
      "Your payment card was declined. Please try a different card or contact your bank.",
    reason: "Payment method was rejected by your bank",
  },
  insufficient_funds: {
    title: "Insufficient Funds",
    message:
      "Your account does not have enough balance to complete this transaction.",
    reason: "Your account balance is too low",
  },
  expired: {
    title: "Card Expired",
    message: "Your payment card has expired. Please use a valid card.",
    reason: "The card used is no longer valid",
  },
  invalid: {
    title: "Invalid Payment Method",
    message: "The payment method information is invalid or incomplete.",
    reason: "Payment details are incorrect or missing",
  },
  cancelled: {
    title: "Payment Cancelled",
    message: "You cancelled the payment. Please try again.",
    reason: "Transaction was cancelled by the user",
  },
  network: {
    title: "Network Error",
    message:
      "A network error occurred during payment processing. Please try again.",
    reason: "Connection error to payment gateway",
  },
  timeout: {
    title: "Request Timeout",
    message: "The payment request timed out. Please try again.",
    reason: "Payment processing took too long",
  },
  fraud: {
    title: "Suspected Fraud",
    message:
      "Your transaction was flagged as potentially fraudulent. Please contact support.",
    reason: "Transaction flagged for security reasons",
  },
};

export default function OrderErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "unknown";
  const orderId = searchParams.get("order_id");

  const errorInfo = ERROR_CASES[reason] || {
    title: "Payment Failed",
    message:
      "An error occurred while processing your payment. Please try again.",
    reason: "Unknown error",
  };

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <Header
          breadcrumb="Home / Cart / Checkout / Error"
          title={errorInfo.title}
        />

        {/* Error Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8">
          <div className="flex flex-col items-center text-center">
            {/* Error Icon */}
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />

            {/* Title */}
            <h1 className=" text-3xl text-stone-800 mb-2">
              {errorInfo.title}
            </h1>

            {/* Description */}
            <p className="font-mono text-sm text-stone-600 mb-6">
              {errorInfo.message}
            </p>

            {/* Reason */}
            <div className="bg-white border border-red-200 rounded p-4 mb-6 w-full">
              <p className="font-mono text-xs text-stone-400 mb-1">Reason</p>
              <p className="font-mono text-sm font-semibold text-stone-800">
                {errorInfo.reason}
              </p>
            </div>

            {/* Order ID if available */}
            {orderId && (
              <div className="bg-white border border-red-100 rounded p-3 mb-4 w-full">
                <p className="font-mono text-[10px] text-stone-400">Order ID</p>
                <p className="font-mono text-xs text-stone-600 break-all">
                  {orderId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className=" text-lg text-stone-800 mb-4">
            What You Can Try:
          </h3>
          <ul className="space-y-2 font-mono text-sm text-stone-700">
            <li>• Check your card number, expiry date, and CVV</li>
            <li>• Try a different payment method</li>
            <li>• Ensure sufficient balance in your account</li>
            <li>• Wait a few minutes and try again</li>
            <li>• Check with your bank if your card is blocked</li>
            <li>• Use a different browser or device</li>
          </ul>
        </div>

        {/* Test Cases Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className=" text-lg text-stone-800 mb-4">
            Testing Payment Errors:
          </h3>
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {Object.entries(ERROR_CASES).map(([key, error]) => (
              <Link
                key={key}
                href={`/order-error?reason=${key}`}
                className="p-3 rounded border border-blue-200 hover:bg-blue-100 transition-colors text-stone-700 hover:text-stone-900"
              >
                {error.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/checkout"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 rounded hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">
              Back to Checkout
            </span>
          </Link>

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

        {/* Support */}
        <div className="bg-stone-100 rounded-lg p-6 text-center">
          <p className="font-mono text-xs text-stone-600 mb-2">
            Still having issues? Contact our support team
          </p>
          <p className=" text-sm text-stone-800">
            📞 +62-851-5800-4568
          </p>
        </div>

        <Footer />
      </div>
    </main>
  );
}
