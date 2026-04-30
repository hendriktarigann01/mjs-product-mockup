import { Lock } from "lucide-react";
import { PAYMENT_METHODS } from "@/constants/checkout";

export function PaymentSection() {
  return (
    <section className="mb-8">
      <h2 className=" text-xl text-stone-800 mb-1">Payment</h2>
      <p className="font-mono text-[10px] text-stone-400 mb-4 flex items-center gap-1">
        <Lock size={9} /> All transactions are secure and encrypted.
      </p>
      <div className="border border-stone-300 bg-white/70">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <span className="font-mono text-xs text-stone-700">
            Payments via Midtrans
          </span>
          <div className="flex items-center gap-1.5">
            {PAYMENT_METHODS.map((label) => (
              <span
                key={label}
                className="font-mono text-[9px] text-stone-400 border border-stone-300 px-1.5 py-0.5"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] text-stone-500">
            You'll be redirected to Payments via Midtrans to complete your
            purchase.
          </p>
        </div>
      </div>
    </section>
  );
}
