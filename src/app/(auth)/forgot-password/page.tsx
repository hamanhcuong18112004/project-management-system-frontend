"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập địa chỉ email.");
      return;
    }
    try {
      setIsLoading(true);
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success("Email đặt lại mật khẩu đã được gửi!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        /* ── Success ── */
        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"

          >
            <CheckCircle size={40} className="text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
          <p className="text-gray-400 text-sm mb-2">Liên kết đặt lại mật khẩu đã gửi đến</p>
          <p className="text-[#1e3a64] font-bold text-sm mb-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 inline-block">
            {email}
          </p>
          <p className="text-gray-400 text-xs mb-7">
            Không thấy email? Kiểm tra spam hoặc{" "}
            <button onClick={() => { setSent(false); }}
              className="text-[#2563eb] font-semibold hover:underline">gửi lại</button>.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg">
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </Link>
        </motion.div>
      ) : (
        /* ── Form ── */
        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
          {/* Icon */}

          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Quên mật khẩu?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nhập địa chỉ email và chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ email</label>
              <input id="forgot-email" type="email" autoComplete="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a64]/25 focus:border-[#1e3a64] transition-all duration-200 shadow-sm" />
            </div>

            <button id="forgot-submit" type="submit" disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
              {isLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Đang gửi...</>
              ) : "Gửi liên kết đặt lại"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft size={14} /> Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
