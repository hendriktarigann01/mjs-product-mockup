"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GIFT_CARD_TEMPLATES } from "@/constants/mockup";
import type { GiftCardTemplate } from "@/types/giftcard";

interface GiftCardTemplatePickerProps {
  activeId: string;
  onSelect: (template: GiftCardTemplate) => void;
}

export function GiftCardTemplatePicker({
  activeId,
  onSelect,
}: GiftCardTemplatePickerProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-2 flex-wrap">
        {GIFT_CARD_TEMPLATES.map((template) => {
          const isActive = activeId === template.id;
          return (
            <motion.button
              key={template.id}
              onClick={() => onSelect(template)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`
                relative flex flex-col items-center gap-1.5
                rounded-xl overflow-hidden border-2 transition-all duration-200
                ${
                  isActive
                    ? "border-stone-700 shadow-md"
                    : "border-stone-200 hover:border-stone-400"
                }
              `}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-20">
                <Image
                  src={template.file}
                  alt={template.name}
                  fill
                  className="object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-stone-900/15 flex items-center justify-center">
                    <span className="text-white text-sm drop-shadow font-bold">
                      ✓
                    </span>
                  </div>
                )}
              </div>
              {/* Label */}
              <span
                className={`
                  font-mono text-[9px] uppercase tracking-wider pb-1.5
                  ${isActive ? "text-stone-700" : "text-stone-400"}
                `}
              >
                {template.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
