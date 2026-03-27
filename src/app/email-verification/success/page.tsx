"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AuthShell } from "../../(auth)/layout";

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const code = searchParams.get("code");

  const isSuccess = status === "success" && code === "EMAIL_VERIFIED";

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"

        >
          <CheckCircle size={40} className="text-green-700" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-4">
          <CheckCircle size={12} /> Xác thực thành công
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Email đã được xác nhận!
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-7">
          Tài khoản của bạn đã được kích hoạt thành công.
          <br />
          Bạn có thể đăng nhập ngay bây giờ.
        </p>

        <Link
          href="/login"
          id="go-to-login"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: "#2563eb",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}
        >
          Đăng nhập ngay
        </Link>
      </motion.div>
    );
  }

  // Failure / unknown state
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
        }}
      >
        <XCircle size={40} className="text-white" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
        Xác thực thất bại
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-7">
        Liên kết xác thực không hợp lệ hoặc đã hết hạn.
        <br />
        Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
          style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
        >
          Đăng ký lại
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
        >
          Về đăng nhập
        </Link>
      </div>
    </motion.div>
  );
}

export default function EmailVerificationSuccessPage() {
  return (
    <AuthShell
      heading="Xác thực tài khoản"
      subheading="Hoàn tất quá trình xác thực để bắt đầu sử dụng Project management system và quản lý công việc hiệu quả hơn."
    >
      <Suspense fallback={<div className="text-gray-400 text-sm text-center py-8">Đang kiểm tra...</div>}>
        <EmailVerificationContent />
      </Suspense>
    </AuthShell>
  );
}
