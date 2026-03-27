"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/config";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { logout as logoutApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/error";
import { MAIN_MENU } from "@/lib/constants/menu";

interface WorkspaceNavItem {
  id: string;
  name: string;
  href: string;
}

export function Sidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceNavItem[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshToken, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === ROUTES.dashboard) return pathname === href;
    return pathname.startsWith(href);
  };

  // Load workspace list for sidebar sub-menu
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const mod = await import("../lib/api/workspace");
        const workspaces = await mod.getMyWorkspaces();
        setWorkspaceItems(
          workspaces.map((w: { id: string; name: string }) => ({
            id: w.id,
            name: w.name,
            href: `/projects/${w.id}`,
          }))
        );
      } catch {
        // silently fail — workspaces will show empty
      }
    };
    loadWorkspaces();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
      logout();
      toast.success("Đã đăng xuất thành công!");
      router.push("/login");
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, "Đã xảy ra lỗi khi đăng xuất");
      toast.error(errorMessage);
      logout();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">TaskFlow</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    active ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Workspace Sub-section */}
        <div className="mt-6">
          <button
            onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>Dự án</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                workspacesExpanded ? "" : "-rotate-90"
              }`}
            />
          </button>
          {workspacesExpanded && (
            <div className="space-y-0.5 mt-1">
              {workspaceItems.map((ws) => {
                const active = pathname === ws.href;
                return (
                  <Link
                    key={ws.id}
                    href={ws.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1">
        {/* Settings */}
        <Link
          href={ROUTES.settings}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            isActive(ROUTES.settings)
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={20} className="shrink-0" />
          <span className="text-sm font-medium">Cài đặt</span>
        </Link>

        {/* User profile card */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-white/5 bg-white/5">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {user?.email || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
