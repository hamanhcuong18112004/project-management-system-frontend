"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

const COLORS = {
  gold: "#eab308",
  goldLight: "#facc15",
  navy: "#1e3a5f",
  navyDark: "#152d4a",
  navyLight: "#2a5a8f",
  white: "#FFFFFF",
};

/**
 * Full-page Not Found - Sử dụng cho Next.js not-found.tsx
 * Hiển thị khi không tìm thấy trang (404)
 */
export function NotFoundPage() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        {/* 404 number */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            style={{
              fontSize: "8rem",
              fontWeight: 800,
              color: "transparent",
              WebkitTextStroke: `2px ${COLORS.navy}`,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            404
          </span>
          {/* Glow behind */}
          <div
            className="absolute inset-0 blur-3xl opacity-10"
            style={{ backgroundColor: COLORS.navy }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 style={{ color: COLORS.navyDark, fontSize: "1.5rem", fontWeight: 600 }}>
            Không tìm thấy trang
          </h2>
          <p
            className="mt-2 max-w-sm mx-auto"
            style={{ color: COLORS.navyLight, fontSize: "0.95rem", lineHeight: 1.7 }}
          >
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="rounded-full"
          style={{
            width: 48,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />

        {/* Buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              border: `1.5px solid ${COLORS.navy}25`,
              color: COLORS.navy,
              backgroundColor: "transparent",
              fontSize: "0.95rem",
            }}
          >
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`,
              color: COLORS.white,
              fontSize: "0.95rem",
            }}
          >
            <Home size={18} />
            <span>Trang chủ</span>
          </button>
        </motion.div>

        {/* Mini CHAAX branding */}
        <motion.p
          style={{
            color: COLORS.navyLight,
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            fontFamily: "'Inter', sans-serif",
            opacity: 0.4,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          CHAAX PROJECT MANAGEMENT
        </motion.p>
      </div>
    </div>
  );
}
