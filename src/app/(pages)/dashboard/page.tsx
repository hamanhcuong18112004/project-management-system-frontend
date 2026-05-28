"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  FolderKanban,
  Users,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { getMyWorkspaces, type Workspace } from "@/lib/api/workspace";
import { getBoardsByWorkspace, type BoardDetails } from "@/lib/api/board";
import { getTaskListsByBoardId, type BoardTask } from "@/lib/api/task";
import { notificationApi, type AppNotification } from "@/lib/api/notification";
import { parseServerDate } from "@/lib/helper/formatTime";

// ── Types ──

interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  overdue: number;
  done: number;
}

interface UpcomingDeadline {
  title: string;
  dueDate: string;
  boardName: string;
  priority: string;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const greeting = getGreeting();

  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allBoards, setAllBoards] = useState<BoardDetails[]>([]);
  const [allTasks, setAllTasks] = useState<(BoardTask & { boardName?: string })[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch workspaces
        const ws = await getMyWorkspaces();
        if (cancelled) return;
        setWorkspaces(ws);

        // Count members
        const members = ws.reduce((sum, w) => sum + (w.members?.length || 0), 0);
        setTotalMembers(members);

        // Fetch all boards from all workspaces
        const boards: BoardDetails[] = [];
        for (const workspace of ws) {
          try {
            const wsBoards = await getBoardsByWorkspace(workspace.id, user!.id);
            boards.push(...wsBoards);
          } catch {
            // skip workspaces that fail
          }
        }
        if (cancelled) return;
        setAllBoards(boards);

        // Fetch all tasks from all boards
        const tasks: (BoardTask & { boardName?: string })[] = [];
        for (const board of boards) {
          try {
            const taskLists = await getTaskListsByBoardId(board.id);
            for (const list of taskLists) {
              for (const task of list.tasks) {
                tasks.push({ ...task, boardName: board.name });
              }
            }
          } catch {
            // skip boards that fail
          }
        }
        if (cancelled) return;
        setAllTasks(tasks);

        // Fetch notifications
        try {
          const notifs = await notificationApi.getByUserId(user!.id);
          if (!cancelled) setNotifications(Array.isArray(notifs) ? notifs : []);
        } catch {
          if (!cancelled) setNotifications([]);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Compute stats
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let overdue = 0;
    let inProgress = 0;
    let done = 0;

    for (const task of allTasks) {
      const checklistTotal = Number(task.checklistTotal || 0);
      const checklistChecked = Number(task.checklistChecked || 0);

      // Hoàn thành: tất cả checklist items đã checked (và có ít nhất 1 item)
      if (checklistTotal > 0 && checklistChecked === checklistTotal) {
        done++;
        continue;
      }

      // Quá hạn: dueDate < ngày hiện tại
      if (task.dueDate) {
        const due = parseServerDate(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < now) {
          overdue++;
          continue;
        }
      }

      // Đang thực hiện: ngày hiện tại nằm trong khoảng createdAt đến dueDate
      if (task.createdAt && task.dueDate) {
        const created = parseServerDate(task.createdAt);
        created.setHours(0, 0, 0, 0);
        const due = parseServerDate(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (now >= created && now <= due) {
          inProgress++;
        }
      } else if (task.createdAt && !task.dueDate) {
        // Có ngày tạo nhưng không có deadline → coi như đang thực hiện
        inProgress++;
      }
    }

    return {
      totalTasks: allTasks.length,
      inProgress,
      overdue,
      done,
    };
  }, [allTasks]);

  // Upcoming deadlines: top 10 tasks closest to deadline (have dueDate, not done)
  const upcomingDeadlines: UpcomingDeadline[] = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return allTasks
      .filter((t) => {
        if (!t.dueDate || t.status === "DONE") return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = parseServerDate(a.dueDate!);
        const dateB = parseServerDate(b.dueDate!);
        // Sort by closest to now (absolute distance)
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10)
      .map((t) => ({
        title: t.title,
        dueDate: t.dueDate!,
        boardName: t.boardName || "",
        priority: t.priority || "MEDIUM",
      }));
  }, [allTasks]);

  // Pending tasks count
  const pendingCount = stats.totalTasks - stats.done;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

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
            Chào mừng bạn đến với trang tổng quan.
            {stats.overdue > 0 && ` Bạn có ${stats.overdue} công việc quá hạn cần chú ý.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-blue-200">
            <span>{pendingCount} công việc đang chờ xử lý</span>
            <span>•</span>
            <span>{workspaces.length} workspace</span>
            <span>•</span>
            <span>{allBoards.length} bảng</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng công việc"
          value={stats.totalTasks}
          icon={ListTodo}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Đang thực hiện"
          value={stats.inProgress}
          icon={TrendingUp}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          label="Quá hạn"
          value={stats.overdue}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
        />
        <StatCard
          label="Hoàn thành"
          value={stats.done}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FolderKanban size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Workspace</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{workspaces.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <ListTodo size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Tổng bảng</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allBoards.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Thành viên</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout: Deadlines + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Deadlines */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-red-500 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hạn chốt sắp tới</h2>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">Không có deadline nào sắp tới.</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((d, i) => {
                const isOverdue = parseServerDate(d.dueDate) < new Date();
                let borderAndBg = "border-zinc-300 dark:border-slate-700 bg-zinc-50/40 dark:bg-slate-800/50";
                if (isOverdue) {
                  borderAndBg = "border-red-500 dark:border-red-500/50 bg-red-50/40 dark:bg-red-500/10";
                } else {
                  switch (d.priority) {
                    case "URGENT": borderAndBg = "border-red-500 dark:border-red-500/50 bg-red-50/40 dark:bg-red-500/10"; break;
                    case "HIGHEST": borderAndBg = "border-orange-500 dark:border-orange-500/50 bg-orange-50/40 dark:bg-orange-500/10"; break;
                    case "HIGH": borderAndBg = "border-amber-500 dark:border-amber-500/50 bg-amber-50/40 dark:bg-amber-500/10"; break;
                    case "MEDIUM": borderAndBg = "border-blue-500 dark:border-blue-500/50 bg-blue-50/40 dark:bg-blue-500/10"; break;
                    case "LOW": borderAndBg = "border-emerald-500 dark:border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-500/10"; break;
                    case "LOWEST": borderAndBg = "border-indigo-500 dark:border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-500/10"; break;
                    case "NONE": borderAndBg = "border-zinc-300 dark:border-slate-700 bg-zinc-50/40 dark:bg-slate-800/50"; break;
                  }
                }

                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${borderAndBg}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Bảng: {d.boardName}
                      </p>
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full border ${isOverdue ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50" : "bg-white text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"}`}>
                      {formatDate(d.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông báo mới</h2>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="ml-auto text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {notifications.filter((n) => !n.read).length} mới
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 p-3 rounded-lg transition ${notif.read ? "bg-white dark:bg-slate-800/20" : "bg-blue-50/60 dark:bg-blue-900/20"}`}
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${getNotifColor(notif.type)}`}>
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-white">{notif.title}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  const darkColorMap: Record<string, string> = {
    "bg-blue-100 text-blue-600": "dark:bg-blue-900/30 dark:text-blue-400",
    "bg-yellow-100 text-yellow-600": "dark:bg-yellow-900/30 dark:text-yellow-400",
    "bg-red-100 text-red-600": "dark:bg-red-900/30 dark:text-red-400",
    "bg-green-100 text-green-600": "dark:bg-green-900/30 dark:text-green-400",
  };
  const darkColor = darkColorMap[color] || "";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} ${darkColor}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-gray-500 dark:text-slate-400 text-xs">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return formatDate(value);
}

function getNotifColor(type: string): string {
  switch (type) {
    case "TASK_CREATED": return "bg-blue-500";
    case "TASK_UPDATED": return "bg-amber-500";
    case "TASK_ASSIGNED": return "bg-violet-500";
    case "BOARD_UPDATED": return "bg-indigo-500";
    case "BOARD_MEMBER_ADDED": return "bg-green-500";
    case "TASK_DEADLINE_APPROACHING": return "bg-red-500";
    case "WORKSPACE_INVITE": return "bg-emerald-500";
    default: return "bg-slate-500";
  }
}

function getNotifIcon(type: string): string {
  switch (type) {
    case "TASK_CREATED": return "✚";
    case "TASK_UPDATED": return "✎";
    case "TASK_ASSIGNED": return "→";
    case "BOARD_UPDATED": return "◫";
    case "BOARD_MEMBER_ADDED": return "+";
    case "TASK_DEADLINE_APPROACHING": return "⚠";
    case "WORKSPACE_INVITE": return "✉";
    default: return "•";
  }
}
