"use client";

import Image from "next/image";

export default function IdleScreen({ onTouch }: { onTouch?: () => void }) {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"

    >
      {/* Background */}
      <Image
        src="/background.webp"
        alt="background"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
        <h1 className="text-white text-7xl font-semibold tracking-wider">
          HAPPIFY
        </h1>

        <p className="text-white text-2xl font-medium">
          Customize Your Store Here
        </p>

        <button className="mt-6 bg-sky-500 text-white text-lg font-bold px-12 py-5 rounded-2xl active:scale-95 transition-transform" onClick={onTouch}>
          Touch Here
        </button>
      </div>
    </div>
  );
}