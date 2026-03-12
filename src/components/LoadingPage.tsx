"use client";

import React from "react";
import { motion } from "framer-motion";

const COLORS = {
  gold: "#eab308",
  goldLight: "#facc15",
  navy: "#1e3a5f",
  navyDark: "#152d4a",
  white: "#FFFFFF",
};

/**
 * Full-page Loading - Circular Orbit với CHAAX logo ở giữa
 * Hiển thị animated spinner với logo và text "ĐANG TẢI..."
 */
export function LoadingPage() {
  const logoScale = 0.52;
  const fontSize = 50 * logoScale;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Track rings */}
        <svg width={200} height={200} viewBox="0 0 200 200" className="absolute">
          <circle cx={100} cy={100} r={80} fill="none" stroke={COLORS.navy} strokeWidth={1} opacity={0.08} />
          <circle cx={100} cy={100} r={56} fill="none" stroke={COLORS.gold} strokeWidth={1} opacity={0.1} />
        </svg>

        {/* Outer arc */}
        <motion.svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={COLORS.navy}
            strokeWidth={3}
            strokeDasharray="100 402"
            strokeLinecap="round"
            opacity={0.6}
          />
        </motion.svg>

        {/* Inner arc (opposite) */}
        <motion.svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx={100}
            cy={100}
            r={56}
            fill="none"
            stroke={COLORS.gold}
            strokeWidth={2.5}
            strokeDasharray="60 292"
            strokeLinecap="round"
          />
        </motion.svg>

        {/* Orbiting dot */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            backgroundColor: COLORS.gold,
            boxShadow: `0 0 14px ${COLORS.gold}60`,
          }}
          animate={{
            x: [80, 0, -80, 0, 80],
            y: [0, -80, 0, 80, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Center — mini CHAAX logo */}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: 72,
            height: 56,
            backgroundColor: COLORS.navy,
            border: `1.5px solid rgba(255,255,255,0.15)`,
            boxShadow: `0 0 30px ${COLORS.navy}80`,
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="relative"
            style={{
              width: 99 * logoScale,
              height: 81 * logoScale,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span className="absolute select-none" style={letterStyle(8 * logoScale, 10 * logoScale, fontSize, "white")}>
              C
            </span>
            <span className="absolute select-none" style={letterStyle(21 * logoScale, 10 * logoScale, fontSize, "white")}>
              H
            </span>
            <span className="absolute select-none" style={letterStyle(54 * logoScale, 10 * logoScale, fontSize, COLORS.gold)}>
              A
            </span>
            <div
              className="absolute flex items-center justify-center select-none"
              style={{ left: 53.3 * logoScale, top: 10.6 * logoScale }}
            >
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: 700,
                  color: COLORS.gold,
                  lineHeight: "normal",
                  transform: "rotate(180deg)",
                  display: "block",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                A
              </span>
            </div>
            <span className="absolute select-none" style={letterStyle(54.7 * logoScale, 10 * logoScale, fontSize, "white")}>
              X
            </span>
          </div>
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.p
        className="mt-10"
        style={{
          color: COLORS.navy,
          fontSize: "0.85rem",
          letterSpacing: "0.3em",
          fontFamily: "'Inter', sans-serif",
          opacity: 0.4,
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        ĐANG TẢI...
      </motion.p>
    </div>
  );
}

function letterStyle(left: number, top: number, fontSize: number, color: string): React.CSSProperties {
  return {
    left,
    top,
    fontSize: `${fontSize}px`,
    fontWeight: 700,
    color,
    lineHeight: "normal",
    fontFamily: "'Inter', sans-serif",
  };
}
