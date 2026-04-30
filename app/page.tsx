"use client";

import { useState, useEffect, useRef } from "react";
import { Customizer } from "@/components/customizer/Customizer";
import IdleScreen from "@/components/IdleScreen";

const IDLE_TIMEOUT_MS = 30000; // 30 seconds

export default function Home() {
  const [isIdle, setIsIdle] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the idle timer
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only set timeout if we are NOT in idle mode
    if (!isIdle) {
      timeoutRef.current = setTimeout(() => {
        console.log("Idle timeout reached. Returning to IdleScreen...");
        setIsIdle(true);
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleUserActivity = () => {
      resetTimer();
    };

    if (!isIdle) {
      // Add listeners when the user starts interacting (Customizer is shown)
      activityEvents.forEach((event) =>
        window.addEventListener(event, handleUserActivity, { passive: true })
      );
      
      // Initialize the first timer
      resetTimer();
    }

    return () => {
      // Cleanup listeners and timer
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleUserActivity)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isIdle]);

  if (isIdle) {
    return <IdleScreen onTouch={() => setIsIdle(false)} />;
  }

  return (
    <main className="relative h-screen bg-white overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Customizer onActivity={resetTimer} />
      </div>
    </main>
  );
}
