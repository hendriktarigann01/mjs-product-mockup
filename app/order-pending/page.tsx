import { Suspense } from "react";
import OrderPendingContent from "./OrderPendingContent";

export default function OrderPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="font-mono text-sm text-stone-500">
            Loading pending order...
          </p>
        </div>
      }
    >
      <OrderPendingContent />
    </Suspense>
  );
}
