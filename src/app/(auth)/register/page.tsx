"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";

function strengthInfo(len: number) {
  if (len === 0) return null;
  if (len < 4) return { label: "Quá yếu", color: "#ef4444", bars: 1 };
  if (len < 8) return { label: "Trung bình", color: "#f59e0b", bars: 2 };
  if (len < 12) return { label: "Khá mạnh", color: "#3b82f6", bars: 3 };
  return { label: "Mạnh", color: "#22c55e", bars: 4 };
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const strength = strengthInfo(password.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    try {
      setIsLoading(true);
      await authApi.register(username, email, password, fullName);
      // Registration always requires email verification — show confirmation screen
      setRegisteredEmail(email);
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a64]/25 focus:border-[#1e3a64] transition-all duration-200 shadow-sm";

  return (
    <AnimatePresence mode="wait">
      {registeredEmail ? (
        /* ── Verification prompt ── */
        <motion.div key="verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563eb, #1e3a64)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
            <Mail size={38} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-4">
            <CheckCircle size={13} /> Đăng ký thành công
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận email của bạn</h2>
          <p className="text-gray-400 text-sm mb-2 leading-relaxed">
            Chúng tôi đã gửi email xác nhận đến
          </p>
          <p className="text-[#1e3a64] font-bold text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 inline-block mb-5">
            {registeredEmail}
          </p>
          <p className="text-gray-400 text-xs mb-7 leading-relaxed">
            Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác nhận để kích hoạt tài khoản.
            <br />
            Không thấy email? Kiểm tra thư mục <strong>Spam</strong>.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200"
            style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
            Đến trang đăng nhập
          </Link>
        </motion.div>
      ) : (
        /* ── Register form ── */
        <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Đăng ký</h2>
            <p className="text-gray-400 text-sm">Tạo tài khoản mới để bắt đầu sử dụng Project management system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-7">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              <input id="register-fullname" type="text" autoComplete="name" placeholder="Nguyễn Văn A"
                value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên người dùng</label>
              <input id="register-username" type="text" autoComplete="username" placeholder="nguyen_van_a"
                value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input id="register-email" type="email" autoComplete="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                  placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mb-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength.bars ? strength.color : "#e5e7eb" }} />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>


            {/* Submit */}
            <button id="register-submit" type="submit" disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
              {isLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Đang tạo tài khoản...</>
              ) : "Tạo tài khoản"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#e8eaed" }} />
              <span className="text-xs text-gray-400">hoặc</span>
              <div className="flex-1 h-px" style={{ background: "#e8eaed" }} />
            </div>

            {/* Google */}
            <button id="register-google" type="button"
              className="w-full py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.5 2.9 13.6l7.8 6C12.5 13.2 17.9 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.2-9.4 6.2-16.2z" />
                <path fill="#FBBC05" d="M10.7 28.4A14.5 14.5 0 0 1 9.5 24c0-1.5.3-3 .7-4.4l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.9 10.7l7.8-6.3z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7-5.4c-2.2 1.5-5 2.3-8.9 2.3-6.1 0-11.4-3.7-13.3-9.1l-7.8 6C6.7 42.5 14.7 48 24 48z" />
              </svg>
              Đăng ký bằng Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-bold text-[#2563eb] hover:opacity-80 transition-opacity">Đăng nhập</Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
