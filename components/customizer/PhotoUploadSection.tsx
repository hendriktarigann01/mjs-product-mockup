"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useFaceSegmentation } from "@/hooks/useFaceSegmentation";
import { Camera, Loader, Check, X } from "lucide-react";

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

function CameraModal({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        alert("Camera access is required to take a photo.");
        onClose();
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onClose]);

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full relative border border-stone-200">
        <div className="p-4 border-b flex justify-between items-center bg-stone-50">
          <h3 className="font-bold text-stone-800">Take a Photo</h3>
          <button onClick={onClose} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300">
            <X size={20} />
          </button>
        </div>
        <div className="relative aspect-square bg-black flex items-center justify-center">
          {!stream ? (
            <p className="text-white">Starting camera...</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
        </div>
        <div className="p-6 flex justify-center bg-stone-50">
          <button
            onClick={capture}
            disabled={!stream}
            className="w-16 h-16 rounded-full border-4 border-stone-300 bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-stone-800" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PhotoUploadSection({ onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [statuses, setStatuses] = useState<SlotStatus[]>(["idle", "idle", "idle"]);
  const [activeCameraSlot, setActiveCameraSlot] = useState<number | null>(null);
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

  const handleCapture = async (dataUrl: string) => {
    if (activeCameraSlot === null) return;
    const index = activeCameraSlot;
    setActiveCameraSlot(null);

    updateStatus(index, "processing");

    try {
      const faceUrl = await extractFace(dataUrl);
      updatePhoto(index, faceUrl);
      updateStatus(index, "done");
    } catch {
      updatePhoto(index, dataUrl);
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
      {activeCameraSlot !== null && (
        <CameraModal
          onCapture={handleCapture}
          onClose={() => setActiveCameraSlot(null)}
        />
      )}

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
                  <div className="relative w-[90px] h-[90px] rounded-xl overflow-hidden border-2 border-stone-700 bg-stone-100">
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
                      status === "idle" && setActiveCameraSlot(index)
                    }
                    disabled={status === "processing"}
                    className={`
                     w-[90px] h-[90px] rounded-xl border-2 border-dashed
                      flex flex-col items-center justify-center gap-1
                      transition-all duration-200
                      disabled:cursor-not-allowed
                      ${status === "processing"
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
                      <Camera size={16} className="text-stone-300" />
                    )}
                  </button>
                )}

                {/* Done checkmark flash */}
                {status === "done" && isActive && (
                  <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
