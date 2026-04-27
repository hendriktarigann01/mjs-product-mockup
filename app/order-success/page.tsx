import { Suspense } from "react";
import OrderSuccessContent from "./OrderSuccessContent";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
          <p className="font-mono text-sm text-stone-500">
            Loading order details...
          </p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
