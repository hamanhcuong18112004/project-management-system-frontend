"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Inbox,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useCalendarTask } from "@/hooks/useCalendarTask";
import { BoardTaskDialog } from "@/components/pages/board";
import { type BoardTask } from "@/lib/api/task";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PRIORITY_COLORS = {
  URGENT: {
    bg: "bg-rose-50 text-rose-700 border-rose-100",
    badge: "bg-rose-500",
    border: "border-l-rose-500",
    text: "text-rose-600"
  },
  HIGH: {
    bg: "bg-orange-50 text-orange-700 border-orange-100",
    badge: "bg-orange-500",
    border: "border-l-orange-500",
    text: "text-orange-600"
  },
  MEDIUM: {
    bg: "bg-blue-50 text-blue-700 border-blue-100",
    badge: "bg-blue-500",
    border: "border-l-blue-500",
    text: "text-blue-600"
  },
  LOW: {
    bg: "bg-green-50 text-green-700 border-green-100",
    badge: "bg-green-500",
    border: "border-l-green-500",
    text: "text-green-600"
  }
};

const STATUS_ICONS = {
  TODO: ListTodo,
  IN_PROGRESS: TrendingUp,
  DONE: CheckCircle2,
  ARCHIVED: Inbox,
};

const STATUS_LABELS = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Hoàn thành",
  ARCHIVED: "Lưu trữ",
};

export default function PersonalTasksPage() {
  const {
    tasks,
    loading,
    handleUpdateTask,
    handleDeleteTask,
  } = useCalendarTask();

  const user = useAuthStore((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  // Filter tasks to show only those assigned to the logged-in user
  const myTasks = useMemo(() => {
    if (!user?.id) return [];
    return tasks.filter((task) => {
      const isAssignee = task.assigneeIds && task.assigneeIds.includes(user.id);
      return isAssignee;
    });
  }, [tasks, user]);

  // Statistics
  const stats = useMemo(() => {
    const total = myTasks.length;
    const todo = myTasks.filter((t) => t.status === "TODO").length;
    const doing = myTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = myTasks.filter((t) => t.status === "DONE").length;
    return { total, todo, doing, done };
  }, [myTasks]);

  // Advanced search & filters
  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [myTasks, searchQuery, priorityFilter, statusFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-8 text-white shadow-xl shadow-slate-100">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1.5 text-xs font-bold text-blue-300 border border-blue-500/30">
              <Sparkles size={14} className="animate-pulse" />
              Không gian cá nhân
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Công Việc Của Tôi</h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl">
              Nơi tập trung tất cả các nhiệm vụ được giao cho bạn. Dễ dàng theo dõi, cập nhật tiến độ công việc nhanh chóng.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 self-start md:self-auto min-w-[200px]">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
              <UserCheck className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thành viên</p>
              <p className="text-lg font-black text-white">{user?.fullName || "Bản thân"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng công việc",
            value: stats.total,
            icon: CheckSquare,
            color: "bg-indigo-500 text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            label: "Cần thực hiện",
            value: stats.todo,
            icon: ListTodo,
            color: "bg-slate-500 text-slate-500",
            bg: "bg-slate-100",
          },
          {
            label: "Đang làm",
            value: stats.doing,
            icon: TrendingUp,
            color: "bg-orange-500 text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Hoàn thành",
            value: stats.done,
            icon: CheckCircle2,
            color: "bg-green-500 text-green-500",
            bg: "bg-green-50",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={item.label}
              className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${item.bg}`}>
                  <Icon className={item.color} size={22} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-black text-slate-800">{item.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm công việc theo tiêu đề hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700 outline-hidden"
          />
        </div>

        {/* Filter select inputs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-500">Lọc</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-600 outline-hidden bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">Cần làm (Todo)</option>
            <option value="IN_PROGRESS">Đang làm (Doing)</option>
            <option value="DONE">Hoàn thành (Done)</option>
            <option value="ARCHIVED">Lưu trữ (Archived)</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-600 outline-hidden bg-white"
          >
            <option value="ALL">Tất cả độ ưu tiên</option>
            <option value="URGENT">🔥 Khẩn cấp</option>
            <option value="HIGH">⚡ Cao</option>
            <option value="MEDIUM">🟢 Trung bình</option>
            <option value="LOW">🔵 Thấp</option>
          </select>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="text-slate-400 font-bold text-sm">Đang tải danh sách công việc của bạn...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-xl mx-auto space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
              <Inbox size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Không tìm thấy công việc nào</h3>
              <p className="text-slate-400 text-sm font-medium">
                {myTasks.length === 0
                  ? "Bạn chưa được phân công vào công việc nào trong tháng này."
                  : "Không có công việc nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn."}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => {
                const priorityInfo = PRIORITY_COLORS[task.priority || "MEDIUM"];
                const StatusIcon = STATUS_ICONS[task.status || "TODO"];
                const isDone = task.status === "DONE";

                return (
                  <motion.div
                    layout
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`group relative bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${priorityInfo.border}`}
                  >
                    <div className="space-y-4">
                      {/* Priority and Status Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase border ${priorityInfo.bg}`}>
                            {task.priority || "MEDIUM"}
                          </span>
                          {task.taskListName && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                              📁 {task.taskListName}
                            </span>
                          )}
                        </div>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-black ${isDone ? "text-green-600" : "text-slate-500"}`}>
                          <StatusIcon size={14} />
                          {STATUS_LABELS[task.status || "TODO"]}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h3 className={`text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors ${isDone ? "line-through text-slate-400 decoration-slate-300" : ""}`}>
                          {task.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">
                          {task.description || "Chưa có mô tả chi tiết cho công việc này."}
                        </p>
                      </div>

                      <div className="h-px bg-slate-50" />

                      {/* Due Date & Action */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={14} className={isDone ? "text-slate-300" : "text-slate-400"} />
                            <span className={isDone ? "text-slate-300" : "text-slate-500"}>
                              Hạn: {format(new Date(task.dueDate), "dd 'thg' M, yyyy", { locale: vi })}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-300">Không có hạn chốt</div>
                        )}

                        <div className="inline-flex items-center gap-1 text-blue-500 group-hover:translate-x-1 transition-transform">
                          <span>Chi tiết</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Task detail dialog */}
      <BoardTaskDialog
        open={!!selectedTask}
        task={selectedTask}
        listName={selectedTask?.taskListName || "My Tasks"}
        onClose={() => setSelectedTask(null)}
        onSave={async (taskId, payload) => {
          const updated = await handleUpdateTask(taskId, payload);
          setSelectedTask(null);
          return updated;
        }}
        onDelete={async (task) => {
          await handleDeleteTask(task);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
