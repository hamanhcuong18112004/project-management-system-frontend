"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/useAuthStore";

const features = [
  {
    icon: <LayoutDashboard size={18} />,
    title: "Quản lý dự án hiệu quả",
    desc: "Tổ chức công việc theo Kanban, danh sách hoặc lịch trình rõ ràng.",
  },
  {
    icon: <Users size={18} />,
    title: "Cộng tác nhóm dễ dàng",
    desc: "Giao việc, thảo luận và chia sẻ tài liệu trực tiếp trên từng task.",
  },
  {
    icon: <Activity size={18} />,
    title: "Theo dõi tiến độ real-time",
    desc: "Báo cáo tự động giúp nắm bắt tình hình dự án mọi lúc mọi nơi.",
  },
];

export interface AuthShellProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export function AuthShell({ children, heading, subheading }: AuthShellProps) {
  return (
    <div className="min-h-screen flex">

      {/* ══ LEFT — Navy panel, 50% ══ */}
      <div
        className="hidden lg:flex w-1/2 flex-shrink-0 flex-col relative overflow-hidden"
        style={{ background: "#0f172a" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-60px] w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            {/* <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
            >
              <LayoutDashboard size={17} className="text-white" />
            </div> */}
            <span className="text-white font-bold text-3xl tracking-tight">Project management system</span>
          </Link>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="flex-1 flex flex-col justify-center"
          >
            <h1 className="text-white text-[1.8rem] xl:text-[2.1rem] font-extrabold leading-tight mb-4 tracking-tight">
              {heading}
            </h1>
            <p className="text-blue-200/55 text-sm xl:text-md leading-relaxed mb-10 ">
              {subheading}
            </p>

            <ul className="space-y-5">
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                  className="flex items-start gap-3.5"
                >
                  <span
                    className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-blue-300"
                    style={{ background: "rgba(59,130,246,0.13)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {f.icon}
                  </span>
                  <div>
                    <p className="text-white/90 font-semibold text-sm">{f.title}</p>
                    <p className="text-blue-200/45 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <p className="text-blue-100/20 text-xs">© 2026 Project management system Inc. All rights reserved.</p>
        </div>
      </div>

      {/* ══ RIGHT — Pure white, 50% ══ */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-white px-8 py-14 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          <div
            className="bg-white rounded-2xl px-9 py-10 border border-gray-100"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {children}
          </div>
        </motion.div>
      </div>

    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated (safe: only runs on client)
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }

    const unsubscribeHydration = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => {
      unsubscribeHydration?.();
    };
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  // Avoid flash of auth page while hydrating
  if (!hydrated || isAuthenticated) return null;

  return (
    <AuthShell
      heading="Quản lý công việc thông minh & hiệu quả"
      subheading="Nền tảng duy nhất bạn cần để tổ chức dự án, cộng tác với đội ngũ và theo dõi tiến độ công việc mỗi ngày."
    >
      {children}
    </AuthShell>
  );
}

