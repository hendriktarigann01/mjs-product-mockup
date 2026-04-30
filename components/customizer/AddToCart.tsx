"use client";

import { useEffect } from "react";
import { ShoppingCart, X } from "lucide-react";

interface AddToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewCart: () => void;
}

export default function AddToCartModal({
    isOpen,
    onClose,
    onViewCart,
}: AddToCartModalProps) {
    // Close on ESC
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalPop {
          0%   { opacity: 0; transform: scale(0.85) translateY(16px); }
          70%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes circlePop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .atc-backdrop {
          animation: backdropIn 0.2s ease forwards;
        }
        .atc-modal {
          animation: modalPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          font-family: 'DM Sans', sans-serif;
        }
        .atc-check-circle {
          animation: circlePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }
        .atc-check-svg {
          animation: checkDraw 0.35s ease 0.35s both;
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
        }
        .atc-title {
          animation: fadeUp 0.35s ease 0.3s both;
          font-family: 'Nunito', sans-serif;
        }
        .atc-subtitle {
          animation: fadeUp 0.35s ease 0.4s both;
        }
        .atc-btn {
          animation: fadeUp 0.35s ease 0.5s both;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .atc-btn:active {
          transform: translateY(0);
        }
        .atc-close {
          transition: background 0.15s, transform 0.15s;
        }
        .atc-close:hover {
          background: #f1f5f9;
          transform: rotate(90deg);
        }
      `}</style>

            {/* Backdrop */}
            <div
                className="atc-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="atc-modal relative w-full max-w-sm rounded-3xl bg-white px-8 py-10 text-center shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="atc-close absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400"
                    >
                        <X size={16} />
                    </button>

                    {/* Check icon */}
                    <div className="mb-6 flex justify-center">
                        <div
                            className="atc-check-circle flex h-20 w-20 items-center justify-center rounded-full"
                            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
                        >
                            <svg
                                className="atc-check-svg"
                                width="36"
                                height="36"
                                viewBox="0 0 36 36"
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6,18 14,26 30,10" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h2
                        className="atc-title mb-3 text-2xl font-extrabold leading-tight"
                        style={{ color: "#1e293b" }}
                    >
                        The product has been
                        <br />
                        successfully added
                    </h2>

                    {/* Subtitle */}
                    <p
                        className="atc-subtitle mb-8 text-sm font-medium leading-relaxed"
                        style={{ color: "#64748b" }}
                    >
                        The item has been added to your cart. Continue to complete your
                        <br />
                        purchase.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="atc-btn flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-slate-600 border border-slate-200 bg-slate-50" 
                        >
                            Shop More
                        </button>
                        <button
                            onClick={onViewCart}
                            className="atc-btn flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg shadow-sky-200"
                            style={{ background: "#38bdf8" }}
                        >
                            <ShoppingCart size={18} />
                            View Cart
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}