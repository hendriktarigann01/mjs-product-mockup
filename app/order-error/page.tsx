import { Suspense } from "react";
import OrderErrorContent from "./OrderErrorContent";

export default function OrderErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="font-mono text-sm text-stone-500">
            Loading error details...
          </p>
        </div>
      }
    >
      <OrderErrorContent />
    </Suspense>
  );
}
