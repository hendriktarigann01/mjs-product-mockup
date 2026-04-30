"use client";

import { useEffect, useRef, useState } from "react";

// Floating orb config
const ORBS = [
  { cx: "15%",  cy: "20%", r: 320, delay: "0s",    dur: "18s" },
  { cx: "80%",  cy: "70%", r: 280, delay: "4s",    dur: "22s" },
  { cx: "60%",  cy: "10%", r: 200, delay: "8s",    dur: "16s" },
  { cx: "5%",   cy: "75%", r: 240, delay: "2s",    dur: "20s" },
  { cx: "90%",  cy: "25%", r: 180, delay: "12s",   dur: "14s" },
];

export default function IdleScreen({ onTouch }: { onTouch?: () => void }) {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Pulse CTA every 3s
  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Outfit:wght@300;400;600;700&display=swap');

        @keyframes orbFloat {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -40px) scale(1.05); }
          66%      { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.12); opacity: 0.15; }
          100% { transform: scale(1);    opacity: 0.6; }
        }
        @keyframes ctaPulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.04); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        @keyframes lineExpand {
          from { width: 0; }
          to   { width: 64px; }
        }

        .idle-root {
          font-family: 'Outfit', sans-serif;
          background: #f8f8f6;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
          cursor: none;
          user-select: none;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
          animation: orbFloat var(--dur) ease-in-out var(--delay) infinite;
          pointer-events: none;
        }
        .clock-display {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #1a1a1a;
          animation: fadeIn 1s ease 0.2s both;
        }
        .date-display {
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          animation: fadeIn 1s ease 0.4s both;
        }
        .divider-line {
          height: 1px;
          background: #d4d4d4;
          animation: lineExpand 1.2s ease 0.6s both;
          margin: 0 auto;
        }
        .headline {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: #1a1a1a;
          animation: fadeIn 1s ease 0.7s both;
        }
        .subline {
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          color: #999;
          letter-spacing: 0.05em;
          animation: fadeIn 1s ease 0.9s both;
        }
        .cta-ring {
          animation: ringPulse 2.5s ease-in-out infinite;
        }
        .cta-btn {
          animation: fadeIn 1s ease 1.1s both;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          background-size: 400px 100%;
          animation: shimmer 2.5s linear 2s infinite;
        }
        .cta-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }
        .tap-hint {
          animation: fadeIn 1s ease 1.3s both;
        }
        .tap-hint span {
          animation: blink 2s ease-in-out infinite;
        }
        .colon-blink {
          display: inline-block;
          animation: blink 1s step-start infinite;
        }
        .pulse-active {
          animation: ctaPulse 0.7s ease;
        }
        .corner-mark {
          position: absolute;
          width: 32px;
          height: 32px;
          opacity: 0.2;
        }
        .corner-mark.tl { top: 40px; left: 40px; border-top: 1px solid #1a1a1a; border-left: 1px solid #1a1a1a; }
        .corner-mark.tr { top: 40px; right: 40px; border-top: 1px solid #1a1a1a; border-right: 1px solid #1a1a1a; }
        .corner-mark.bl { bottom: 40px; left: 40px; border-bottom: 1px solid #1a1a1a; border-left: 1px solid #1a1a1a; }
        .corner-mark.br { bottom: 40px; right: 40px; border-bottom: 1px solid #1a1a1a; border-right: 1px solid #1a1a1a; }
      `}</style>

      <div className="idle-root" onClick={onTouch}>

        {/* Corner marks */}
        <div className="corner-mark tl" />
        <div className="corner-mark tr" />
        <div className="corner-mark bl" />
        <div className="corner-mark br" />

        {/* Ambient orbs */}
        {ORBS.map((o, i) => (
          <div
            key={i}
            className="orb"
            style={{
              left: o.cx,
              top: o.cy,
              width: o.r * 2,
              height: o.r * 2,
              marginLeft: -o.r,
              marginTop: -o.r,
              "--dur": o.dur,
              "--delay": o.delay,
              background:
                i % 3 === 0
                  ? "radial-gradient(circle, #d1e8ff 0%, transparent 70%)"
                  : i % 3 === 1
                  ? "radial-gradient(circle, #fde8d8 0%, transparent 70%)"
                  : "radial-gradient(circle, #e8f5e9 0%, transparent 70%)",
            } as React.CSSProperties}
          />
        ))}

        {/* Main content — centered */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* Clock */}
          <div className="clock-display" style={{ fontSize: "clamp(80px, 14vw, 160px)" }}>
            {time.split(":")[0]}
            <span className="colon-blink">:</span>
            {time.split(":")[1]}
          </div>

          {/* Date */}
          <div className="date-display" style={{ fontSize: "clamp(13px, 1.4vw, 18px)", marginTop: "8px" }}>
            {date}
          </div>

          {/* Divider */}
          <div className="divider-line" style={{ width: 64, marginTop: 40, marginBottom: 40 }} />

          {/* Headline */}
          <div className="headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", textAlign: "center", lineHeight: 1.15 }}>
            Selamat Datang
          </div>
          <div className="subline" style={{ fontSize: "clamp(13px, 1.4vw, 18px)", marginTop: 12, textAlign: "center" }}>
            Pesan di sini dengan mudah & cepat
          </div>

          {/* Spacer */}
          <div style={{ height: "clamp(32px, 5vh, 56px)" }} />

          {/* CTA with ring */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Pulse ring */}
            <div
              className="cta-ring"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 999,
                border: "1.5px solid #1a1a1a",
                inset: -16,
                margin: "auto",
              }}
            />

            <button
              className={`cta-btn ${pulse ? "pulse-active" : ""}`}
              style={{
                background: "#1a1a1a",
                color: "#f8f8f6",
                border: "none",
                borderRadius: 999,
                padding: "clamp(16px,2.2vh,22px) clamp(48px,6vw,80px)",
                fontSize: "clamp(15px,1.6vw,20px)",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.08em",
                cursor: "none",
              }}
            >
              ORDER HERE
            </button>
          </div>

          {/* Tap hint */}
          <div
            className="tap-hint"
            style={{
              marginTop: "clamp(20px, 3vh, 32px)",
              fontSize: "clamp(11px, 1.1vw, 14px)",
              color: "#bbb",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            <span>Sentuh layar untuk memulai</span>
          </div>
        </div>

        {/* Bottom brand strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #d1e8ff, #fde8d8, #e8f5e9, #d1e8ff)",
            backgroundSize: "400% 100%",
            animation: "shimmer 6s linear infinite",
          }}
        />
      </div>
    </>
  );
}