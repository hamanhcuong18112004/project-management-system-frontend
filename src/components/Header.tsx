"use client";

import React from "react";
import Link from "next/link";
import { Bell, Search, User } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { Logo } from "./Logo";

export function Header() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-64 h-16 border-b z-40 transition-all duration-300"
      style={{
        backgroundColor: "var(--primary-color)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo - Hidden on mobile, shown on md screens when sidebar is hidden */}
        <Link href="/" className="hidden md:block lg:hidden mr-4">
          <div className="scale-[0.15] origin-left">
            <Logo scale={1} />
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60"
            />
            <input
              type="text"
              placeholder="Search projects, tasks, team members..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
            />
          </div>
        </div>

        {/* Right Side - Notifications & User */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-white" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          {isAuthenticated && user ? (
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-white/60 text-xs">{user.role || "Member"}</p>
              </div>
            </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
              <User size={18} className="text-white" />
              <span className="text-white text-sm font-medium">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
