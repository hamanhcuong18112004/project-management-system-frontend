"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/config";
import { logout as logoutApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/error";
import { MAIN_MENU } from "@/lib/constants/menu";
import { useAuthStore } from "@/lib/stores/useAuthStore";

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
    if (href === ROUTES.dashboard) {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const mod = await import("../lib/api/workspace");
        const workspaces = await mod.getMyWorkspaces();
        setWorkspaceItems(
          workspaces.map((workspace: { id: string; name: string }) => ({
            id: workspace.id,
            name: workspace.name,
            href: `/projects/${workspace.id}`,
          })),
        );
      } catch {
        // Ignore sidebar workspace loading failures.
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
      toast.error(getApiErrorMessage(error, "Đã xảy ra lỗi khi đăng xuất"));
      logout();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
          <span className="text-sm font-bold text-white">T</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          TaskFlow
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    active
                      ? "text-blue-700"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            onClick={() => setWorkspacesExpanded((current) => !current)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600"
          >
            <span>Workspace</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                workspacesExpanded ? "" : "-rotate-90"
              }`}
            />
          </button>

          {workspacesExpanded && (
            <div className="mt-1 space-y-1">
              {workspaceItems.map((workspace) => {
                const active = pathname === workspace.href;

                return (
                  <Link
                    key={workspace.id}
                    href={workspace.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <span className="truncate">{workspace.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="space-y-1 px-3 pb-3">
        <Link
          href={ROUTES.settings}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
            isActive(ROUTES.settings)
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Settings
            size={20}
            className={`shrink-0 ${
              isActive(ROUTES.settings) ? "text-blue-700" : "text-slate-400"
            }`}
          />
          <span className="text-sm font-medium">Cài đặt</span>
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600">
            <span className="text-sm font-semibold text-white">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.fullName || "User"}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-md p-1.5 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
