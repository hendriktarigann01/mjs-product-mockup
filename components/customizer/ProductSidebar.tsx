"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/types/product";
import { Card } from "@/components/common/Card";

interface ProductSidebarProps {
  products: Product[];
  active: string;
  onSelect: (id: string) => void;
}

export function ProductSidebar({
  products,
  active,
  onSelect,
}: ProductSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 flex-shrink-0">
      {products.map((product) => {
        const isActive = active === product.id;
        const isHovered = hoveredId === product.id;

        return (
          <div key={product.id} className="relative flex items-center">
            <motion.button
              onClick={() => onSelect(product.id)}
              onHoverStart={() => setHoveredId(product.id)}
              onHoverEnd={() => setHoveredId(null)}
              animate={{
                width: isHovered && !isActive ? 130 : 56,
                backgroundColor: isActive ? "#e0d9cc" : "#ffffff",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative flex items-center overflow-hidden rounded-xl p-2 h-14"
              style={{ minWidth: 56 }}
            >
              {/* Icon placeholder — ganti dengan image/icon sesuai data product */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src={product.file} alt={product.label} fill className="object-contain" />
              </div>

              {/* Label — slides in on hover */}
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-xs tracking-wider uppercase text-stone-600 whitespace-nowrap ml-2"
                  >
                    {product.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
