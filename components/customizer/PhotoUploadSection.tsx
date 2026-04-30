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
  onClose: () => void;
  onActivity?: () => void;
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
  const [error, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Camera not supported. Please ensure you are using HTTPS and a compatible browser.");
      return;
    }

    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        activeStream = s;
        setStream(s);
      } catch (err: any) {
        console.warn("Failed with facingMode:user, trying basic constraints", err);
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true });
          activeStream = s;
          setStream(s);
        } catch (innerErr: any) {
          console.error("Camera access denied:", innerErr);
          setErrorMessage(`Camera access denied (${innerErr.name}). Please allow permissions.`);
        }
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Separate effect to handle srcObject assignment when stream and ref are ready
  useEffect(() => {
    const video = videoRef.current;
    if (stream && video) {
      // Avoid re-assigning the same stream
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      
      // Use a flag or check if play is already in progress is hard, 
      // so we just catch and filter the specific AbortError
      video.play().catch(e => {
        if (e.name !== "AbortError") {
          console.error("Error playing video:", e);
        }
      });
    }
  }, [stream]);

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
    <div className="flex flex-col w-full">
      <div className="bg-white overflow-hidden relative">
        <div className="p-4 flex justify-between items-center bg-stone-50 border-b border-stone-200">
          <h3 className="font-bold text-stone-800">Take a Photo</h3>
          <button onClick={onClose} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative aspect-square bg-black flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-white text-sm mb-4">{error}</p>
              <button onClick={onClose} className="px-4 py-2 bg-white rounded-lg text-black text-sm">Close</button>
            </div>
          ) : !stream ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-stone-600 border-t-white rounded-full animate-spin" />
              <p className="text-stone-400 font-medium">Starting camera...</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
        </div>
        
        {!error && (
          <div className="p-8 flex justify-center bg-white">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capture();
              }}
              disabled={!stream}
              className="w-20 h-20 rounded-full border-8 border-stone-100 bg-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 group"
            >
              <div className="w-14 h-14 rounded-full bg-stone-800 group-hover:bg-[#2CAAE1] transition-colors shadow-inner" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhotoUploadSection({ onPhotosChange, onClose, onActivity }: Props) {
  const { extractFace } = useFaceSegmentation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Prevent idle timeout during long processing
  useEffect(() => {
    if (isProcessing && onActivity) {
      const interval = setInterval(() => {
        console.log("[PhotoUploadSection] Heartbeat to prevent idle timeout...");
        onActivity();
      }, 5000); // 5 seconds heartbeat
      return () => clearInterval(interval);
    }
  }, [isProcessing, onActivity]);

  const handleCapture = async (dataUrl: string) => {
    setIsProcessing(true);
    try {
      const faceUrl = await extractFace(dataUrl);
      // StepPattern expects an array of 3, we just send one for it to handle
      onPhotosChange([faceUrl, null, null]);
    } catch {
      onPhotosChange([dataUrl, null, null]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div className="relative w-full max-w-[800px] bg-white rounded-[40px] overflow-hidden shadow-2xl">
        <CameraModal
          onCapture={handleCapture}
          onClose={onClose}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-6 z-50">
            <div className="w-24 h-24 border-[6px] border-stone-100 border-t-[#2CAAE1] rounded-full animate-spin" />
            <p className="text-[28px] font-bold text-stone-800 animate-pulse">Processing Face...</p>
            <p className="text-stone-400 text-[18px]">Extracting high quality portrait</p>
          </div>
        )}
      </div>
    </div>
  );
}
