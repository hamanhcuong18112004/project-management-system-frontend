"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { MAIN_MENU } from "@/lib/constants/menu";

const HEADER_TABS = MAIN_MENU.filter((item) => item.label !== "Trang chủ");

export function Header() {
  const { user } = useAuthStore();
  const pathname = usePathname();

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
          <button
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
            aria-label="Thông báo"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

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
