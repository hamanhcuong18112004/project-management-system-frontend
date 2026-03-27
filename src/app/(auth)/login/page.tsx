"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    try {
      setIsLoading(true);
      // Login returns only tokens — fetch user profile separately
      const { accessToken, refreshToken } = await authApi.login(email, password);
      // Set token in store so the interceptor attaches it for getMyProfile
      useAuthStore.setState({ accessToken });
      const user = await authApi.getMyProfile();
      setAuth(accessToken, refreshToken, user);
      toast.success("Đăng nhập thành công!");
      router.push("/dashboard");
    } catch (err: unknown) {

      toast.error(getApiErrorMessage(err, "Đăng nhập thất bại. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Heading */}
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Đăng nhập</h2>
        <p className="text-gray-400 text-sm">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mb-7">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a64]/25 focus:border-[#1e3a64] transition-all duration-200 shadow-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a64]/25 focus:border-[#1e3a64] transition-all duration-200 shadow-sm"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input id="remember-me" type="checkbox" checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-[#1e3a64]" />
            <span className="text-sm text-gray-500">Nhớ tài khoản</span>
          </label>
          <Link href="/forgot-password"
            className="text-sm font-semibold text-[#1e3a64] hover:opacity-75 transition-opacity">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          id="login-submit" type="submit" disabled={isLoading}
          className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
        >
          {isLoading ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>Đang đăng nhập...</>
          ) : "Đăng nhập"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-150" style={{ background: "#e8eaed" }} />
          <span className="text-xs text-gray-400">hoặc</span>
          <div className="flex-1 h-px" style={{ background: "#e8eaed" }} />
        </div>

        {/* Google */}
        <button id="login-google" type="button"
          className="w-full py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.5 2.9 13.6l7.8 6C12.5 13.2 17.9 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.2-9.4 6.2-16.2z" />
            <path fill="#FBBC05" d="M10.7 28.4A14.5 14.5 0 0 1 9.5 24c0-1.5.3-3 .7-4.4l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.9 10.7l7.8-6.3z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7-5.4c-2.2 1.5-5 2.3-8.9 2.3-6.1 0-11.4-3.7-13.3-9.1l-7.8 6C6.7 42.5 14.7 48 24 48z" />
          </svg>
          Đăng nhập bằng Google
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-bold text-[#2563eb] hover:opacity-80 transition-opacity">
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}
