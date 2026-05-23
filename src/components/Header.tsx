"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Settings, Trash2 } from "lucide-react";
import { useAuthStore, useSidebarStore } from "@/lib/stores";
import { MAIN_MENU } from "@/lib/constants/menu";
import { useRealtime } from "@/providers/RealtimeProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { parseServerDate } from "@/lib/helper/formatTime";

const HEADER_TABS = MAIN_MENU.filter((item) => item.label !== "Trang chủ");

export function Header() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const pathname = usePathname();
  const { lastCommentUpdate } = useRealtime();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [isJiggling, setIsJiggling] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hiệu ứng rung khi có thông báo mới (unreadCount tăng)
  useEffect(() => {
    if (unreadCount > 0) {
      setIsJiggling(true);
      const timer = setTimeout(() => setIsJiggling(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const isTabActive = (href: string) => {
    if (href === "/projects") return pathname.startsWith("/projects");
    return pathname.startsWith(href);
  };

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${isCollapsed ? "left-20" : "left-64"}`}>

      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Navigation tabs */}
        <nav className="flex items-center gap-1">
          {HEADER_TABS.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${active
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              className={`relative p-2 rounded-lg transition-all ${isJiggling ? "animate-bounce text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              aria-label="Thông báo"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 text-sm">Thông báo</h3>
                  <div className="flex gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-[450px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="flex flex-col">
                      {notifications.map((n, i) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                            if (n.type === "WORKSPACE_INVITE" && n.inviteToken && n.workspaceId) {
                              router.push(`/projects?inviteToken=${n.inviteToken}&workspaceId=${n.workspaceId}&inviterName=${encodeURIComponent(n.fullName || '')}`);
                            } else if (n.boardId) {
                              router.push(`/boards/${n.boardId}`);
                            }
                          }}
                          className={`group p-4 hover:bg-blue-50/50 transition-colors cursor-pointer flex gap-3 ${i !== notifications.length - 1 ? 'border-b border-gray-50' : ''} ${!n.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-sm leading-snug ${!n.read ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-400 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {n.message}
                            </p>
                            {(n.fullName || n.workspaceName) && (
                              <p className="text-[11px] text-gray-400 mt-1 flex items-center">
                                {n.fullName && <span className="font-medium text-gray-500">{n.fullName}</span>}
                                {n.fullName && n.workspaceName && <span className="mx-1.5">•</span>}
                                {n.workspaceName && <span>{n.workspaceName}</span>}
                              </p>
                            )}
                            <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                              {formatDistanceToNow(parseServerDate(n.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Bell size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Bạn chưa có thông báo mới</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Settings */}
          <button
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
            aria-label="Cài đặt"
          >
            <Settings size={20} />
          </button>

          {/* User Avatar */}
          <button className="ml-1 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all">
            <span className="text-white font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
