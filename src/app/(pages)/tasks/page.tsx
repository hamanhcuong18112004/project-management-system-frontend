"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Search,
  SlidersHorizontal,
  FolderKanban,
  CheckCircle2,
  Tag,
  ArrowUpDown,
  Loader2,
  Inbox,
  Briefcase,
} from "lucide-react";
import { getMyTasks, updateTask } from "@/lib/api/task";
import { getMyWorkspaces } from "@/lib/api/workspace";
import { getBoardsByWorkspace, getBoardById } from "@/lib/api/board";
import type { BoardMemberSummary } from "@/lib/api/board";
import type { BoardTask, TaskPriority } from "@/lib/api/task";
import type { Workspace } from "@/lib/api/workspace";
import { useNotifications } from "@/providers/NotificationProvider";
import { formatTaskDueDate } from "@/lib/helper/formatTime";
import { TaskChecklists } from "@/components/pages/board/TaskChecklists";
import Link from "next/link";

const stripHtml = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

const DESC_STYLES = `
  .desc-rich-view h1 { font-size: 1.8em; font-weight: 800; margin: 4px 0; }
  .desc-rich-view h2 { font-size: 1.5em; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h3 { font-size: 1.25em; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h4 { font-size: 1.1em; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h5 { font-size: 1em; font-weight: 600; margin: 4px 0; }
  .desc-rich-view h6 { font-size: 0.9em; font-weight: 600; margin: 4px 0; }
  .desc-rich-view a { color: #2563eb; text-decoration: underline; }

  /* Lists formatting inside view */
  .desc-rich-view ul { list-style-type: disc !important; padding-left: 2em !important; margin: 8px 0 !important; }
  .desc-rich-view ol { list-style-type: decimal !important; padding-left: 2em !important; margin: 8px 0 !important; }
  .desc-rich-view li { list-style-type: inherit !important; display: list-item !important; margin: 4px 0 !important; }

  /* Ensure headings display inline inside list items so bullets/numbers show right next to them */
  .desc-rich-view li h1, .desc-rich-view li h2, .desc-rich-view li h3, .desc-rich-view li h4, .desc-rich-view li h5, .desc-rich-view li h6 {
    display: inline-block !important;
    margin: 0 !important;
    font-size: 1.2em !important;
  }

  /* Strikethrough formatting */
  .desc-rich-view s, .desc-rich-view strike, .desc-rich-view del {
    text-decoration: line-through !important;
  }
  .desc-rich-view s *, .desc-rich-view strike *, .desc-rich-view del * {
    text-decoration: line-through !important;
  }
  /* Support case where formatting tags are inside headings or wrap headings */
  .desc-rich-view h1 s, .desc-rich-view h2 s, .desc-rich-view h3 s, .desc-rich-view h4 s, .desc-rich-view h5 s, .desc-rich-view h6 s,
  .desc-rich-view h1 strike, .desc-rich-view h2 strike, .desc-rich-view h3 strike, .desc-rich-view h4 strike, .desc-rich-view h5 strike, .desc-rich-view h6 strike,
  .desc-rich-view h1 del, .desc-rich-view h2 del, .desc-rich-view h3 del, .desc-rich-view h4 del, .desc-rich-view h5 del, .desc-rich-view h6 del {
    text-decoration: line-through !important;
  }

  /* Highlight/Mark formatting */
  .desc-rich-view mark {
    background: #fef08a !important;
    color: #0f172a !important;
    border-radius: 4px;
    padding: 0 4px;
  }
  .desc-rich-view mark * {
    background: #fef08a !important;
    color: #0f172a !important;
  }
  .desc-rich-view h1 mark, .desc-rich-view h2 mark, .desc-rich-view h3 mark, .desc-rich-view h4 mark, .desc-rich-view h5 mark, .desc-rich-view h6 mark {
    background: #fef08a !important;
    color: #0f172a !important;
  }

  /* Code formatting */
  .desc-rich-view code {
    background: #f1f5f9 !important;
    color: #0f172a !important;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
  .desc-rich-view code * {
    background: #f1f5f9 !important;
    font-family: monospace !important;
  }
  .desc-rich-view h1 code, .desc-rich-view h2 code, .desc-rich-view h3 code, .desc-rich-view h4 code, .desc-rich-view h5 code, .desc-rich-view h6 code {
    background: #f1f5f9 !important;
    font-family: monospace !important;
    font-size: 0.9em !important;
    font-weight: normal !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
  }
`;

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  NONE: { bg: "bg-zinc-50 border-zinc-200", text: "text-zinc-600", label: "Không" },
  LOWEST: { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", label: "Rất thấp" },
  LOW: { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", label: "Thấp" },
  MEDIUM: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Trung bình" },
  HIGH: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Cao" },
  HIGHEST: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "Rất cao" },
  URGENT: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Khẩn cấp" },
};

interface BoardLocationInfo {
  boardName: string;
  boardId: string;
  workspaceName: string;
  workspaceId: string;
}

export default function MyTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [boardLocationMap, setBoardLocationMap] = useState<Record<string, BoardLocationInfo>>({});
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "overdue" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "title">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMemberSummary[]>([]);

  const handleProgressChangeForSelected = useCallback((total: number, checked: number) => {
    if (!selectedTask) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTask.id) return t;
        if (t.checklistTotal === total && t.checklistChecked === checked) {
          return t;
        }
        return { ...t, checklistTotal: total, checklistChecked: checked };
      })
    );
  }, [selectedTask?.id]);

  useEffect(() => {
    if (!selectedTask || !selectedTask.boardId) {
      setBoardMembers([]);
      return;
    }
    let active = true;
    getBoardById(selectedTask.boardId)
      .then((board) => {
        if (active) {
          setBoardMembers(board.members || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch board members for checklists:", err);
        if (active) {
          setBoardMembers([]);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedTask]);

  const { lastNotification } = useNotifications();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (refreshTrigger === 0) {
        setLoading(true);
      }
      try {
        const [fetchedTasks, workspaces] = await Promise.all([
          getMyTasks(),
          getMyWorkspaces(),
        ]);

        if (!active) return;

        setTasks(fetchedTasks);

        // Build mapping: boardId -> BoardLocationInfo
        const map: Record<string, BoardLocationInfo> = {};
        await Promise.all(
          workspaces.map(async (ws: Workspace) => {
            try {
              const boards = await getBoardsByWorkspace(ws.id);
              boards.forEach((board) => {
                map[board.id] = {
                  boardName: board.name,
                  boardId: board.id,
                  workspaceName: ws.name,
                  workspaceId: ws.id,
                };
              });
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              if (errMsg.includes("không có quyền") || errMsg.includes("permission") || errMsg.includes("403")) {
                console.warn(`No board-view permission for workspace ${ws.id} (${ws.name})`);
              } else {
                console.error(`Failed to fetch boards for workspace ${ws.id}:`, err);
              }
            }
          })
        );
        setBoardLocationMap(map);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu công việc:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  // Listen for real-time notifications to reload tasks
  useEffect(() => {
    const refreshTypes = ["TASK_ASSIGNED", "TASK_UPDATED", "TASK_CREATED", "BOARD_UPDATED"];
    if (lastNotification && refreshTypes.includes(lastNotification.type)) {
      const timer = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastNotification]);

  // Synchronize selectedTask when tasks list changes (e.g., real-time updates)
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) {
        if (
          selectedTask.checklistTotal !== updated.checklistTotal ||
          selectedTask.checklistChecked !== updated.checklistChecked ||
          selectedTask.status !== updated.status ||
          selectedTask.title !== updated.title
        ) {
          setSelectedTask(updated);
        }
      } else {
        setSelectedTask(null);
      }
    }
  }, [tasks, selectedTask]);

  // Check if a task is overdue
  const isOverdue = (task: BoardTask) => {
    if (!task.dueDate || task.status === "DONE") return false;
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  // Check if a task is due today
  const isDueToday = (task: BoardTask) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let assignedCount = 0;

    tasks.forEach((task) => {
      if (task.archived) return;
      assignedCount++;
      if (isOverdue(task)) {
        overdueCount++;
      }
      if (isDueToday(task) && task.status !== "DONE") {
        todayCount++;
      }
    });

    return {
      assigned: assignedCount,
      overdue: overdueCount,
      today: todayCount,
    };
  }, [tasks]);

  // Filtering tasks based on tab & search
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Exclude archived
        if (task.archived) return false;

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(query);
          const matchesDesc = task.description?.toLowerCase().includes(query) || false;
          const boardName = boardLocationMap[task.boardId || ""]?.boardName.toLowerCase() || "";
          const workspaceName = boardLocationMap[task.boardId || ""]?.workspaceName.toLowerCase() || "";
          const matchesBoard = boardName.includes(query) || workspaceName.includes(query);
          if (!matchesTitle && !matchesDesc && !matchesBoard) return false;
        }

        // Tab Filter
        const isCompleted = task.status === "DONE";
        switch (activeTab) {
          case "today":
            return isDueToday(task) && !isCompleted;
          case "upcoming":
            if (!task.dueDate || isCompleted) return false;
            const due = new Date(task.dueDate);
            const tomorrow = new Date();
            tomorrow.setHours(23, 59, 59, 999);
            return due > tomorrow;
          case "overdue":
            return isOverdue(task);
          case "completed":
            return isCompleted;
          case "all":
          default:
            return true;
        }
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (sortBy === "priority") {
          const priorityWeight: Record<TaskPriority, number> = {
            URGENT: 7,
            HIGHEST: 6,
            HIGH: 5,
            MEDIUM: 4,
            LOW: 3,
            LOWEST: 2,
            NONE: 1,
          };
          const weightA = priorityWeight[a.priority || "MEDIUM"];
          const weightB = priorityWeight[b.priority || "MEDIUM"];
          comparison = weightB - weightA; // High priority first
        } else if (sortBy === "title") {
          comparison = a.title.localeCompare(b.title);
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [tasks, activeTab, searchQuery, sortBy, sortOrder, boardLocationMap]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getPriorityBadge = (priority?: TaskPriority, compact?: boolean) => {
    const style = PRIORITY_STYLES[priority || "MEDIUM"];
    return (
      <span className={`inline-flex items-center gap-1 rounded-lg border text-[10px] font-semibold transition shrink-0 ${
        compact 
          ? "px-2 py-0.5" 
          : "px-2.5 py-1 text-xs rounded-full sm:px-2.5 sm:py-1 sm:rounded-full"
      } ${style.bg} ${style.text}`}>
        <span className={`rounded-full bg-current shrink-0 ${compact ? "w-1 h-1" : "w-1.5 h-1.5"}`} />
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Đang tải trung tâm công việc của bạn...</p>
        </div>
      </div>
    );
  }

  const selectedBoardInfo = selectedTask ? boardLocationMap[selectedTask.boardId || ""] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <style dangerouslySetInnerHTML={{ __html: DESC_STYLES }} />
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="text-blue-600" size={26} />
            My Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và theo dõi tất cả các công việc được giao cho bạn trên các workspace.
          </p>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-3 gap-2 sm:gap-5">
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Được giao</p>
              <h3 className="text-lg sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 sm:mt-1.5">{stats.assigned}</h3>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 items-center justify-center">
              <CheckSquare size={22} />
            </div>
          </div>
          <div className="hidden sm:block mt-3.5 text-xs text-slate-500 dark:text-slate-400">
            Tất cả công việc chưa lưu trữ
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Quá hạn</p>
              <h3 className="text-lg sm:text-3xl font-extrabold text-rose-600 dark:text-rose-500 mt-1 sm:mt-1.5">{stats.overdue}</h3>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="hidden sm:block mt-3.5 text-xs text-rose-600/90 dark:text-rose-400/90 font-medium">
            Cần ưu tiên xử lý ngay lập tức
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Hạn hôm nay</p>
              <h3 className="text-lg sm:text-3xl font-extrabold text-amber-600 dark:text-amber-500 mt-1 sm:mt-1.5">{stats.today}</h3>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <div className="hidden sm:block mt-3.5 text-xs text-slate-500 dark:text-slate-400">
            Các công việc hết hạn vào hôm nay
          </div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-nowrap whitespace-nowrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 overflow-x-auto gap-1 scrollbar-none">
          {(["all", "today", "upcoming", "overdue", "completed"] as const).map((tab) => {
            const tabLabels = {
              all: "Tất cả",
              today: "Hôm nay",
              upcoming: "Sắp tới",
              overdue: "Quá hạn",
              completed: "Hoàn thành",
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên công việc, mô tả hoặc bảng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-between md:justify-start">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <SlidersHorizontal size={14} />
              Sắp xếp:
            </span>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 flex-1 sm:flex-initial"
              >
                <option value="dueDate">Hạn hoàn thành</option>
                <option value="priority">Mức độ ưu tiên</option>
                <option value="title">Tên công việc</option>
              </select>
              <button
                onClick={toggleSortOrder}
                title="Đổi thứ tự sắp xếp"
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition shrink-0"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Task List Container */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
                <Inbox size={28} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Không có công việc nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
                Không tìm thấy công việc nào khớp với bộ lọc hiện tại của bạn.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-3.5 min-w-[200px] w-full max-w-0">Tên công việc</th>
                      <th className="px-6 py-3.5">Bảng</th>
                      <th className="px-6 py-3.5">Ưu tiên & Hạn chốt</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredTasks.map((task) => {
                      const checklistTotal = Number(task.checklistTotal || 0);
                      const checklistChecked = Number(task.checklistChecked || 0);
                      const progressPercent =
                        checklistTotal > 0 ? Math.round((checklistChecked / checklistTotal) * 100) : -1;
                      const overdue = isOverdue(task);
                      const boardInfo = boardLocationMap[task.boardId || ""];
                      const boardName = boardInfo?.boardName || "Không xác định";

                      return (
                        <tr
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition cursor-pointer group"
                        >
                          {/* Title & Description */}
                          <td className="px-6 py-4.5 min-w-[200px] w-full max-w-0">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newStatus = task.status === "DONE" ? "TODO" : "DONE";
                                  try {
                                    await updateTask(task.id, { status: newStatus });
                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                                    if (selectedTask?.id === task.id) {
                                      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
                                    }
                                  } catch (err) {
                                    console.error("Failed to update status:", err);
                                  }
                                }}
                                className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  task.status === "DONE"
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-transparent hover:text-slate-300 bg-white dark:bg-slate-800"
                                }`}
                                title={task.status === "DONE" ? "Đánh dấu là chưa hoàn thành" : "Đánh dấu là hoàn thành"}
                              >
                                <CheckCircle2 size={13} className="stroke-[3.5px]" />
                              </button>
                              <div className="min-w-0">
                                <div className={`font-semibold transition text-sm break-words whitespace-normal ${
                                  task.status === "DONE" ? "text-slate-400 dark:text-slate-500 line-through font-normal" : "text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold"
                                }`}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 font-normal">
                                    {stripHtml(task.description)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Workspace Tag */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            {task.boardId && boardInfo ? (
                              <Link
                                href={`/boards/${task.boardId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs border border-blue-100 font-semibold transition shadow-sm max-w-[240px]"
                              >
                                <FolderKanban size={13} className="shrink-0" />
                                <span className="truncate">{boardName}</span>
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs border border-slate-200/50 font-medium max-w-[240px]">
                                <FolderKanban size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate">{boardName}</span>
                              </span>
                            )}
                          </td>

                          {/* Priority & Due Date */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5 items-start">
                              {getPriorityBadge(task.priority, true)}
                              {task.dueDate ? (
                                (() => {
                                  const formatted = formatTaskDueDate(task.dueDate, task.status);
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${formatted.badgeClass}`}
                                    >
                                      <Calendar size={11} className="shrink-0" />
                                      {formatted.text}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-slate-300 text-[10px]">Không có hạn</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                task.status === "DONE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-slate-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {task.status === "DONE"
                                ? "Hoàn thành"
                                : task.status === "IN_PROGRESS"
                                ? "Đang làm"
                                : "Cần làm"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                {filteredTasks.map((task) => {
                  const checklistTotal = Number(task.checklistTotal || 0);
                  const checklistChecked = Number(task.checklistChecked || 0);
                  const progressPercent =
                    checklistTotal > 0 ? Math.round((checklistChecked / checklistTotal) * 100) : -1;
                  const overdue = isOverdue(task);
                  const boardInfo = boardLocationMap[task.boardId || ""];
                  const boardName = boardInfo?.boardName || "Không xác định";

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition cursor-pointer flex flex-col gap-2.5"
                    >
                      {/* Top Row: Complete Checkbox, Title & Status Badge */}
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newStatus = task.status === "DONE" ? "TODO" : "DONE";
                            try {
                              await updateTask(task.id, { status: newStatus });
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                              if (selectedTask?.id === task.id) {
                                  setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
                              }
                            } catch (err) {
                              console.error("Failed to update status:", err);
                            }
                          }}
                          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-all ${
                            task.status === "DONE"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-transparent hover:text-slate-300 bg-white dark:bg-slate-800"
                          }`}
                          title={task.status === "DONE" ? "Đánh dấu là chưa hoàn thành" : "Đánh dấu là hoàn thành"}
                        >
                          <CheckCircle2 size={13} className="stroke-[3.5px]" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold transition text-sm break-words whitespace-normal ${
                            task.status === "DONE" ? "text-slate-400 dark:text-slate-500 line-through font-normal" : "text-slate-900 dark:text-slate-100 font-semibold"
                          }`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 font-normal">
                              {stripHtml(task.description)}
                            </div>
                          )}
                        </div>
                        {/* Status Badge */}
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            task.status === "DONE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                              : task.status === "IN_PROGRESS"
                              ? "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50"
                              : "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {task.status === "DONE"
                            ? "Hoàn thành"
                            : task.status === "IN_PROGRESS"
                            ? "Đang làm"
                            : "Cần làm"}
                        </span>
                      </div>

                      {/* Bottom Row: Metadata Badges (Board, Priority, Due Date) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {/* Board Name */}
                        {task.boardId && boardInfo ? (
                          <Link
                            href={`/boards/${task.boardId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-[10px] border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50 font-semibold transition shadow-sm max-w-[120px]"
                          >
                            <FolderKanban size={11} className="shrink-0" />
                            <span className="truncate">{boardName}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 text-[10px] border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 font-medium max-w-[120px]">
                            <FolderKanban size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{boardName}</span>
                          </span>
                        )}

                        {/* Priority Badge */}
                        {getPriorityBadge(task.priority, true)}

                        {/* Due Date Badge */}
                        {task.dueDate ? (
                          (() => {
                            const formatted = formatTaskDueDate(task.dueDate, task.status, true);
                            return (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${formatted.badgeClass}`}
                              >
                                <Calendar size={11} className="shrink-0" />
                                {formatted.text}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-300 text-[10px]">--</span>
                        )}

                        {/* Checklist progress badge */}
                        {checklistTotal > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 text-[10px] border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 font-semibold">
                            {checklistChecked}/{checklistTotal} ({progressPercent}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Details Side Modal/Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const newStatus = selectedTask.status === "DONE" ? "TODO" : "DONE";
                    try {
                      await updateTask(selectedTask.id, { status: newStatus });
                      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: newStatus } : t));
                      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
                    } catch (err) {
                      console.error("Failed to update status:", err);
                    }
                  }}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedTask.status === "DONE"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300 hover:border-slate-400 text-transparent hover:text-slate-300"
                  }`}
                  title={selectedTask.status === "DONE" ? "Đánh dấu là chưa hoàn thành" : "Đánh dấu là hoàn thành"}
                >
                  <CheckCircle2 size={13} className="stroke-[3.5px]" />
                </button>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Chi tiết công việc
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-xl font-bold text-slate-900 break-words whitespace-normal">{selectedTask.title}</h2>
                <div className="flex flex-col gap-2 mt-3 items-start">
                  {selectedTask.priority && getPriorityBadge(selectedTask.priority)}
                  {selectedBoardInfo ? (
                    <Link
                      href={`/projects?workspaceId=${selectedBoardInfo.workspaceId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-100 text-indigo-600 text-xs font-semibold transition"
                    >
                      <Briefcase size={12} />
                      {selectedBoardInfo.workspaceName}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/50 text-slate-600 text-xs font-medium">
                      <Briefcase size={12} />
                      Không rõ Workspace
                    </span>
                  )}
                  {selectedTask.boardId && selectedBoardInfo ? (
                    <Link
                      href={`/boards/${selectedTask.boardId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100 text-blue-600 text-xs font-semibold transition"
                    >
                      <FolderKanban size={12} />
                      {selectedBoardInfo.boardName}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/50 text-slate-600 text-xs font-medium">
                      <FolderKanban size={12} />
                      Không rõ Bảng
                    </span>
                  )}
                  {selectedTask.taskListName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/50 text-slate-600 text-xs font-medium">
                      <Tag size={12} />
                      Cột: {selectedTask.taskListName}
                    </span>
                  )}
                </div>
              </div>

              {/* Deadline & Status Details */}
              <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Hạn hoàn thành</div>
                  <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {selectedTask.dueDate ? (
                      (() => {
                        const formatted = formatTaskDueDate(selectedTask.dueDate, selectedTask.status);
                        return (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${formatted.badgeClass}`}>
                            {formatted.text}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-slate-400 font-normal">Chưa thiết lập</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</div>
                  <div className="mt-1">
                    <select
                      value={selectedTask.status || "TODO"}
                      onChange={async (e) => {
                        const newStatus = e.target.value as any;
                        try {
                          await updateTask(selectedTask.id, { status: newStatus });
                          setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: newStatus } : t));
                          setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
                        } catch (err) {
                          console.error("Failed to update status:", err);
                        }
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs transition"
                    >
                      <option value="TODO">Cần thực hiện</option>
                      <option value="IN_PROGRESS">Đang tiến hành</option>
                      <option value="DONE">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mô tả chi tiết</h4>
                <div className="desc-rich-view text-sm text-slate-700 bg-slate-50/50 p-4 border border-slate-200/30 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description ? (
                    <div
                      className="w-full wrap-break-word"
                      dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                    />
                  ) : (
                    <span className="text-slate-400 italic font-normal">Không có mô tả chi tiết cho công việc này.</span>
                  )}
                </div>
              </div>

              {/* Checklist Progress Details */}
              <div className="border-t border-slate-100 pt-4">
                <TaskChecklists
                  taskId={selectedTask.id}
                  canUpdate={true}
                  boardMembers={boardMembers}
                  taskMemberIds={selectedTask.assigneeIds}
                  taskDueDate={selectedTask.dueDate}
                  onProgressChange={handleProgressChangeForSelected}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
