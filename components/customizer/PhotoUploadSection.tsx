"use client";

import { useRef, useState, ChangeEvent } from "react";
import Image from "next/image";
import { useFaceSegmentation } from "@/hooks/useFaceSegmentation";
import { ArrowUp, Loader, Check, X } from "lucide-react";

interface PhotoSlot {
  id: number;
  label: string;
}

const SLOTS: PhotoSlot[] = [
  { id: 1, label: "Photo 1" },
  { id: 2, label: "Photo 2" },
  { id: 3, label: "Photo 3" },
];

interface Props {
  onPhotosChange: (photos: (string | null)[]) => void;
}

type SlotStatus = "idle" | "processing" | "done" | "error";

export default function PhotoUploadSection({ onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [statuses, setStatuses] = useState<SlotStatus[]>([
    "idle",
    "idle",
    "idle",
  ]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const { extractFace } = useFaceSegmentation();

  const updatePhoto = (index: number, url: string | null) => {
    const next = [...photos];
    next[index] = url;
    setPhotos(next);
    onPhotosChange(next);
  };

  const updateStatus = (index: number, status: SlotStatus) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[index] = status;
      return next;
    });
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const rawUrl = URL.createObjectURL(file);
    updateStatus(index, "processing");

    try {
      const faceUrl = await extractFace(rawUrl);
      URL.revokeObjectURL(rawUrl);
      updatePhoto(index, faceUrl);
      updateStatus(index, "done");
    } catch {
      updatePhoto(index, rawUrl);
      updateStatus(index, "error");
    }

    setTimeout(() => updateStatus(index, "done"), 2000);
  };

  const clearPhoto = (index: number) => {
    updatePhoto(index, null);
    updateStatus(index, "idle");
  };

  // Hitung berapa foto yang aktif
  const activeCount = photos.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Info layout */}
      {activeCount >= 2 && (
        <p className="font-mono text-[10px] text-stone-300 tracking-wider">
          {activeCount === 2
            ? "2-photo alternating pattern"
            : "3-photo row pattern"}
        </p>
      )}

      {/* Slot upload */}
      <div className="flex gap-3">
        {SLOTS.map(({ id, label }, index) => {
          const photo = photos[index];
          const status = statuses[index];
          const isActive = !!photo;

          return (
            <div key={id} className="flex-1 flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-300 text-center">
                {label}
              </span>

              <div className="relative">
                {/* Preview jika sudah ada foto */}
                {isActive ? (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-stone-700 bg-stone-100">
                    <Image
                      src={photo!}
                      alt={label}
                      fill
                      className="object-contain"
                    />
                    {/* Clear button */}
                    <button
                      onClick={() => clearPhoto(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stone-800/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  /* Upload slot */
                  <button
                    onClick={() =>
                      status === "idle" && inputRefs[index].current?.click()
                    }
                    disabled={status === "processing"}
                    className={`
                      w-full aspect-square rounded-xl border-2 border-dashed
                      flex flex-col items-center justify-center gap-1
                      transition-all duration-200
                      disabled:cursor-not-allowed
                      ${
                        status === "processing"
                          ? "border-blue-300 bg-blue-50 animate-pulse"
                          : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                      }
                    `}
                  >
                    {status === "processing" ? (
                      <Loader
                        size={16}
                        className="text-blue-400 animate-spin"
                      />
                    ) : (
                      <ArrowUp size={16} className="text-stone-300" />
                    )}
                    <span className="font-mono text-[8px] uppercase tracking-wider text-stone-300">
                      {status === "processing" ? "Processing..." : "Upload"}
                    </span>
                  </button>
                )}

                {/* Done checkmark flash */}
                {status === "done" && isActive && (
                  <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </div>

              <input
                ref={inputRefs[index]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
