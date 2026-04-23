"use client";

import React from "react";
import {
  Plus,
  FolderKanban,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";

// ── Static data for dashboard ──

const STATS = [
  {
    label: "Tổng công việc",
    value: 14,
    icon: ListTodo,
    color: "bg-blue-100 text-blue-600",
    ring: "ring-blue-200",
  },
  {
    label: "Đang thực hiện",
    value: 9,
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-600",
    ring: "ring-yellow-200",
  },
  {
    label: "Quá hạn",
    value: 2,
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
    ring: "ring-red-200",
  },
  {
    label: "Hoàn thành",
    value: 3,
    icon: CheckCircle2,
    color: "bg-green-100 text-green-600",
    ring: "ring-green-200",
  },
];

const QUICK_ACTIONS = [
  { label: "Tạo công việc", icon: Plus },
  { label: "Tạo workspace", icon: FolderKanban },
  { label: "Mời thành viên", icon: Users },
];

const DEADLINES = [
  {
    title: "Kiểm tra sự cân đối giữa số liệu kế toán chi tiết và tổng hợp",
    assignee: "Phạm Thị Trang",
    date: "29/02/2024",
    color: "border-red-400",
  },
  {
    title: "Giải trình số liệu và cung cấp hồ sơ, số liệu cho cơ quan thuế",
    assignee: "Phạm Thị Trang",
    date: "29/03/2024",
    color: "border-orange-400",
  },
  {
    title: "Cung cấp số liệu cho ban giám đốc",
    assignee: "Trần Thị Phương",
    date: "20/05/2024",
    color: "border-yellow-400",
  },
  {
    title: "Lưu trữ dữ liệu kế toán theo quy định",
    assignee: "Trần Thị Phương",
    date: "18/05/2024",
    color: "border-blue-400",
  },
  {
    title: "Kiểm tra số dư cuối kỳ cho hợp lý và khớp đúng với các báo cáo",
    assignee: "Lê Hoàng Văn, Nguyễn Văn Mạnh",
    date: "21/05/2024",
    color: "border-purple-400",
  },
];

const ACTIVITIES = [
  {
    user: "Nguyễn Văn Mạnh",
    action: "đã hoàn thành công việc: Thống kê và tổng hợp số liệu",
    time: "10 phút trước",
    avatarColor: "bg-blue-500",
  },
  {
    user: "Trần Thị Phương",
    action: "đã thêm bình luận vào Báo cáo tài chính quý 1",
    time: "1 giờ trước",
    avatarColor: "bg-red-500",
  },
  {
    user: "Lê Hoàng Văn",
    action: "đã tạo công việc mới: Kiểm tra số dư cuối kỳ",
    time: "3 giờ trước",
    avatarColor: "bg-green-500",
  },
  {
    user: "Phạm Thị Trang",
    action: "đã đính kèm tài liệu vào Hợp đồng thuê văn phòng",
    time: "Hôm qua",
    avatarColor: "bg-purple-500",
  },
];

const WORKLOAD = [
  { name: "Nguyễn Văn Mạnh", count: 3, color: "bg-blue-500" },
  { name: "Trần Thị Phương", count: 5, color: "bg-purple-500" },
  { name: "Lê Hoàng Văn", count: 5, color: "bg-green-500" },
  { name: "Bùi Quỳnh Như", count: 0, color: "bg-gray-300" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-2xl p-8 text-white bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.fullName || "bạn"}!
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            Chào mừng bạn đến với trang tổng quan. Hôm nay bạn có lý và 2 công việc cần chú ý gấp.
          </p>
          <div className="mt-4 text-sm text-blue-200">
            9 công việc đang chờ xử lý
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="flex gap-4 flex-wrap">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group min-w-35"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Icon size={20} className="text-gray-400 group-hover:text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout: Deadlines + Activity/Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Deadlines */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Hạn chốt sắp tới</h2>
          </div>
          <div className="space-y-3">
            {DEADLINES.map((d, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50 ${d.color}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Phụ trách: {d.assignee}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-white px-2 py-1 rounded-full border border-gray-200">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Activity + Workload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
            <div className="space-y-4">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${a.avatarColor}`}>
                    {a.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{a.user}</span>{" "}
                      {a.action}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workload */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Khối lượng công việc</h2>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">→</span>
            </div>
            <div className="space-y-3">
              {WORKLOAD.map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{w.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${w.color}`}
                        style={{ width: `${Math.min((w.count / 6) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8 text-right">
                      {w.count} CV
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
