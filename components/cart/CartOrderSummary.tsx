import Link from "next/link";
import { Card } from "@/components/common/Card";
import { formatRp } from "@/utils/format";

interface CartOrderSummaryProps {
  subtotal: number;
  isEmpty: boolean;
}

export function CartOrderSummary({ subtotal, isEmpty }: CartOrderSummaryProps) {
  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <Card background="white" border={true} className="p-6">
        <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-5">
          Order Summary
        </h2>

        <div className="space-y-3 border-b border-stone-200 pb-4 mb-4">
          <div className="flex justify-between">
            <span className="font-mono text-xs text-stone-500">Subtotal</span>
            <span className="font-mono text-xs text-stone-700">
              {formatRp(subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-stone-500">Shipping</span>
            <span className="font-mono text-xs text-stone-400">
              Calculated at checkout
            </span>
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <span className="font-mono text-xs text-stone-800 font-semibold">
            Estimated total
          </span>
          <span className="font-mono text-sm text-stone-800 font-semibold">
            {formatRp(subtotal)} IDR
          </span>
        </div>

        <p className="font-mono text-[10px] text-stone-400 mb-5 leading-relaxed">
          Taxes included. Discounts and shipping calculated at checkout.
        </p>

        <Link
          href="/checkouts"
          className="block w-full bg-stone-800 text-white font-mono text-xs tracking-widest uppercase text-center py-4 hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          Check out
        </Link>
      </Card>
    </div>
  );
}
