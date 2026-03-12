"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const COLORS = {
  gold: "#eab308",
  goldLight: "#facc15",
  navy: "#1e3a5f",
  navyDark: "#152d4a",
  navyLight: "#2a5a8f",
  white: "#FFFFFF",
};

/**
 * Full-page Error - Sử dụng cho Next.js error.tsx
 * Hiển thị khi có lỗi xảy ra trong ứng dụng
 */
export function ErrorPage() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "#F8FAFB" }}
    >
      <motion.div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.gold}25`,
          boxShadow: `0 12px 48px ${COLORS.navy}12`,
        }}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Dark header */}
        <div
          className="px-8 py-6 flex items-center justify-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.navy})`,
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertCircle size={28} color={COLORS.gold} />
          </motion.div>
          <span style={{ color: COLORS.white, fontSize: "1.1rem", fontWeight: 600 }}>
            Oops!
          </span>
        </div>

        {/* Body */}
        <div className="px-8 py-10 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 style={{ color: COLORS.navyDark, fontSize: "1.35rem" }}>
              Đã có lỗi xảy ra
            </h3>
            <p className="mt-2" style={{ color: COLORS.navyLight, fontSize: "0.95rem", lineHeight: 1.6 }}>
              Hệ thống đang gặp sự cố tạm thời
            </p>
          </div>

          {/* 2 buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`,
                color: COLORS.white,
                fontSize: "0.95rem",
              }}
            >
              <RefreshCw size={18} />
              <span>Tải lại</span>
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${COLORS.navy}30`,
                color: COLORS.navy,
                backgroundColor: "transparent",
                fontSize: "0.95rem",
              }}
            >
              <Home size={18} />
              <span>Trang chủ</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
