"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = searchParams.get("token") ?? "";
    setToken(t);
    if (!t) {
      toast.error("Liên kết không hợp lệ hoặc đã hết hạn.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!token) {
      toast.error("Token không hợp lệ.");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword(token, password, confirm);
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn."));
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a64]/25 focus:border-[#1e3a64] transition-all duration-200 shadow-sm";

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
            <CheckCircle size={38} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại thành công!</h2>
          <p className="text-gray-400 text-sm mb-7">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.</p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200"
            style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
          >
            Đến trang đăng nhập
          </button>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: "#1e3a64", boxShadow: "0 4px 14px rgba(30,58,100,0.3)" }}>
            <KeyRound size={20} className="text-white" />
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Đặt lại mật khẩu</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mb-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
              <div className="relative">
                <input id="reset-password" type={showPassword ? "text" : "password"}
                  autoComplete="new-password" placeholder="Ít nhất 6 ký tự"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
              <input id="reset-confirm" type={showPassword ? "text" : "password"}
                autoComplete="new-password" placeholder="Nhập lại mật khẩu"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className={inputCls} />
            </div>

            <button id="reset-submit" type="submit" disabled={isLoading || !token}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
              {isLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Đang đặt lại...</>
              ) : "Đặt lại mật khẩu"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login"
              className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
