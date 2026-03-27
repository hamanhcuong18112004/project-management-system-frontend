import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";
import type { ComponentType } from "react";
import { ROUTES } from "@/config";

export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export const MAIN_MENU: MenuItem[] = [
  {
    label: "Trang chủ",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Công việc",
    href: ROUTES.tasks,
    icon: CheckSquare,
  },
  {
    label: "Dự án",
    href: ROUTES.projects,
    icon: FolderKanban,
  },
  {
    label: "Nhóm",
    href: ROUTES.team,
    icon: Users,
  },
  {
    label: "Lịch",
    href: ROUTES.calendar,
    icon: Calendar,
  },
  {
    label: "Báo cáo",
    href: ROUTES.reports,
    icon: BarChart3,
  },
];

export const BOTTOM_MENU: MenuItem[] = [
  {
    label: "Cài đặt",
    href: ROUTES.settings,
    icon: Settings,
  },
];
