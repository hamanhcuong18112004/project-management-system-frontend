"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { MAIN_MENU } from "@/lib/constants/menu";
import { useRealtime } from "@/providers/RealtimeProvider";

const HEADER_TABS = MAIN_MENU.filter((item) => item.label !== "Trang chủ");

export function Header() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const { lastCommentUpdate } = useRealtime();
  const [isJiggling, setIsJiggling] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; time: number; read: boolean }[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (lastCommentUpdate) {
      const { actionUser, actionType, targetUserId, taskTitle } = lastCommentUpdate;

      // Xóa bình luận không cần thông báo
      if (actionType === "DELETE") return;

      // Nếu là Phản hồi hoặc Thả cảm xúc mà người nhận KHÔNG PHẢI mình -> Bỏ qua
      if ((actionType === "REPLY" || actionType === "REACT") && targetUserId && targetUserId !== user?.id) {
        return;
      }

      let message = `Có thông báo mới trong task "${taskTitle || "không rõ"}".`;
      if (actionType === "REPLY") {
        message = `${actionUser || "Một người dùng"} vừa phản hồi bình luận của bạn trong task "${taskTitle || "không rõ"}".`;
      } else if (actionType === "REACT") {
        message = `${actionUser || "Một người dùng"} vừa thả cảm xúc vào bình luận của bạn trong task "${taskTitle || "không rõ"}".`;
      } else if (actionType === "COMMENT") {
        message = `${actionUser || "Một người dùng"} vừa bình luận trong task "${taskTitle || "không rõ"}".`;
      }

      setIsJiggling(true);
      
      setNotifications(prev => [
        { 
          id: Math.random().toString(), 
          message, 
          time: Date.now(),
          read: false
        },
        ...prev
      ].slice(0, 10));

      const timer = setTimeout(() => setIsJiggling(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastCommentUpdate, user?.id]);

  const isTabActive = (href: string) => {
    if (href === "/projects") return pathname.startsWith("/projects");
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Navigation tabs */}
        <nav className="flex items-center gap-1">
          {HEADER_TABS.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  active
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
              className={`relative p-2 rounded-lg transition-all ${
                isJiggling ? "animate-bounce text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              aria-label="Thông báo"
              onClick={() => {
                if (!isDropdownOpen) {
                  // Đánh dấu tất cả là đã đọc khi mở menu
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
                setIsDropdownOpen(!isDropdownOpen);
              }}
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
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 text-sm">Thông báo</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="flex flex-col">
                      {notifications.map((n, i) => (
                        <div key={n.id} className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer flex gap-3 ${i !== notifications.length - 1 ? 'border-b border-gray-50' : ''} ${!n.read ? 'bg-blue-50/30' : ''}`}>
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
                          <div>
                            <p className={`text-sm leading-snug ${!n.read ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{n.message}</p>
                            <span className="text-xs text-gray-400 mt-1.5 block font-medium">
                              {new Date(n.time).toLocaleTimeString('vi-VN')}
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
