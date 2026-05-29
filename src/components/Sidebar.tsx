"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, Settings, ChevronLeft, ChevronRight, Menu, ActivitySquare } from "lucide-react";

import { toast } from "sonner";
import { ROUTES } from "@/config";
import { logout as logoutApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/error";
import { MAIN_MENU } from "@/lib/constants/menu";
import { useAuthStore, useSidebarStore } from "@/lib/stores";

import { useNotifications } from "@/providers/NotificationProvider";


interface WorkspaceNavItem {
  id: string;
  name: string;
  href: string;
}

export function Sidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceNavItem[]>([]);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshToken, logout } = useAuthStore();
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { lastNotification } = useNotifications();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams, setMobileOpen]);

  const isActive = (href: string) => {
    if (href === ROUTES.dashboard) {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  const loadWorkspaces = useCallback(async () => {
    try {
      const mod = await import("../lib/api/workspace");
      const workspaces = await mod.getMyWorkspaces();
      setWorkspaceItems(
        workspaces.map((workspace: { id: string; name: string }) => ({
          id: workspace.id,
          name: workspace.name,
          href: `/projects?workspaceId=${workspace.id}`,
        })),
      );
    } catch {
      // Ignore
    }
  }, []);

  const loadPendingInvitesCount = useCallback(async () => {
    try {
      const mod = await import("../lib/api/workspace");
      const invites = await mod.getMyInvitations();
      const pendingCount = invites.filter((inv: any) => inv.status === "PENDING").length;
      setPendingInvitesCount(pendingCount);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
    loadPendingInvitesCount();
  }, [loadWorkspaces, loadPendingInvitesCount]);

  useEffect(() => {
    window.addEventListener("invitations-updated", loadPendingInvitesCount);
    return () => {
      window.removeEventListener("invitations-updated", loadPendingInvitesCount);
    };
  }, [loadPendingInvitesCount]);

  useEffect(() => {
    const refreshTypes = [
      "WORKSPACE_MEMBER_JOINED",
      "WORKSPACE_CREATED",
      "WORKSPACE_DELETED",
      "WORKSPACE_INVITE",
    ];

    if (lastNotification && refreshTypes.includes(lastNotification.type)) {
      const timer = setTimeout(() => {
        loadWorkspaces();
        loadPendingInvitesCount();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, loadWorkspaces, loadPendingInvitesCount]);

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
    <>
      {/* Mobile Sidebar Overlay/Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300
          ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64
          max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0
          ${isMobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}
      >
        <div className={`flex items-center border-b border-slate-200 dark:border-slate-800 px-5 py-5 ${isCollapsed ? "lg:justify-center justify-between" : "justify-between"}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <span className={`text-xl font-bold tracking-tight text-slate-900 dark:text-white ${isCollapsed ? "lg:hidden" : ""}`}>
              TaskFlow
            </span>
          </div>
          <button
            onClick={toggle}
            className={`lg:flex hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${isCollapsed ? "lg:hidden" : ""}`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className={`hidden lg:flex justify-center border-b border-slate-200 dark:border-slate-800 py-2 ${isCollapsed ? "" : "lg:hidden"}`}>
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Menu size={18} />
          </button>
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
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl py-2.5 transition-all duration-200 relative ${isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"} ${active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 ${active
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                      }`}
                  />
                  <span className={`text-sm font-medium ${isCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                  {item.href === ROUTES.invitations && pendingInvitesCount > 0 && (
                    <>
                      <span className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border border-white lg:block hidden ${isCollapsed ? "" : "lg:hidden"}`} />
                      <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md shadow-red-500/20 ${isCollapsed ? "lg:hidden" : ""}`}>
                        {pendingInvitesCount}
                      </span>
                    </>
                  )}
                </Link>


              );
            })}
          </div>

          <div className="mt-6">
            <button
              onClick={() => setWorkspacesExpanded((current) => !current)}
              className={`flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300 ${isCollapsed ? "lg:hidden" : ""}`}
            >
              <span>Workspace</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${workspacesExpanded ? "" : "-rotate-90"
                  }`}
              />
            </button>

            <div className={`my-2 h-px bg-slate-200 dark:bg-slate-800 mx-4 lg:block hidden ${isCollapsed ? "" : "lg:hidden"}`} />


            {workspacesExpanded && (
              <div className={`mt-1 space-y-1 ${isCollapsed ? "lg:hidden" : ""}`}>
                {workspaceItems.map((workspace) => {
                  const active = pathname === "/projects" && searchParams.get("workspaceId") === workspace.id;

                  return (
                    <Link
                      key={workspace.id}
                      href={workspace.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
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
            title={isCollapsed ? "Cài đặt" : undefined}
            className={`group flex items-center gap-3 rounded-xl py-2.5 transition-all duration-200 ${isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"} ${isActive(ROUTES.settings)
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <Settings
              size={20}
              className={`shrink-0 ${isActive(ROUTES.settings) ? "text-blue-700 dark:text-blue-400" : "text-slate-400"
                }`}
            />
            <span className={`text-sm font-medium ${isCollapsed ? "lg:hidden" : ""}`}>Cài đặt</span>
          </Link>

          <Link
            href={ROUTES.auditLog}
            title={isCollapsed ? "Nhật ký hệ thống" : undefined}
            className={`group flex items-center gap-3 rounded-xl py-2.5 transition-all duration-200 ${isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"} ${isActive(ROUTES.auditLog)
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <ActivitySquare
              size={20}
              className={`shrink-0 ${isActive(ROUTES.auditLog) ? "text-blue-700 dark:text-blue-400" : "text-slate-400"
                }`}
            />
            <span className={`text-sm font-medium ${isCollapsed ? "lg:hidden" : ""}`}>Nhật ký hệ thống</span>
          </Link>

          <div className={`flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-3 ${isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"}`}>
            <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600">
                <span className="text-sm font-semibold text-white">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className={`min-w-0 flex-1 ${isCollapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">
                  {user?.fullName || "User"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || ""}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`rounded-md p-1.5 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 ${isCollapsed ? "lg:hidden" : ""}`}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
