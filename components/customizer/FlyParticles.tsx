"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FlyParticle } from "@/hooks/useCartBadge";

interface FlyParticlesProps {
  particles: FlyParticle[];
}

export function FlyParticles({ particles }: FlyParticlesProps) {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.startX, y: p.startY, scale: 1, opacity: 1 }}
          animate={{ x: p.endX, y: p.endY, scale: 0.3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-300" />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
