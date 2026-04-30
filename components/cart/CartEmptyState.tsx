import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[600px] text-center">
      <ShoppingBag size={48} className="text-[#4B5563] mb-6" />
      <p className=" text-2xl text-[#4B5563] mb-2">
        Your cart is empty
      </p>
      <p className="font-mono text-xs text-[#4B5563] mb-8">
        Go back and customize something beautiful.
      </p >
      <Link
        href="/"
        className="font-mono text-xs tracking-widest uppercase text-[#4B5563] border border-stone-800 px-6 py-3 hover:bg-stone-800 hover:text-white transition-colors"
      >
        Back to Happify
      </Link>
    </div>
  );
}
