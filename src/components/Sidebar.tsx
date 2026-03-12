"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/config";
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: ROUTES.projects,
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    href: ROUTES.tasks,
    icon: CheckSquare,
  },
  {
    label: "Team",
    href: ROUTES.team,
    icon: Users,
  },
  {
    label: "Calendar",
    href: ROUTES.calendar,
    icon: Calendar,
  },
  {
    label: "Reports",
    href: ROUTES.reports,
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"
        }`}
      style={{ backgroundColor: "var(--primary-color)" }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-white/10">
        <Link href={ROUTES.home} className="inline-block">
          {!isCollapsed ? (
            <div className=" origin-center -my-8">
              <Logo scale={1} />
            </div>
          ) : (
            <div className="origin-center -my-10">
              <Logo scale={1} />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${active
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${active ? "text-white" : "text-white/70 group-hover:text-white"
                  }`}
              />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 right-0 transform translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ color: "var(--primary-color)" }}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
