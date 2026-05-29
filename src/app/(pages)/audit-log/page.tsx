"use client";

import React, { useState, useEffect } from "react";
import {
  ActivitySquare,
  Loader2,
  User,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  UserCheck,
  Shield,
  LogIn,
  LayoutGrid,
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityId: string;
  entityType: string;
  workspaceId: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// === Map action → icon + màu sắc ===
const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  TASK_CREATED:              { icon: Plus,       color: "text-emerald-600 dark:text-emerald-400",  bg: "bg-emerald-100 dark:bg-emerald-900/40",  label: "Tạo công việc" },
  TASK_UPDATED:              { icon: Pencil,     color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-100 dark:bg-blue-900/40",         label: "Cập nhật công việc" },
  TASK_DELETED:              { icon: Trash2,     color: "text-red-600 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/40",           label: "Xóa công việc" },
  BOARD_CREATED:             { icon: Plus,       color: "text-violet-600 dark:text-violet-400",    bg: "bg-violet-100 dark:bg-violet-900/40",     label: "Tạo bảng" },
  BOARD_UPDATED:             { icon: Pencil,     color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-100 dark:bg-blue-900/40",         label: "Cập nhật bảng" },
  BOARD_DELETED:             { icon: Trash2,     color: "text-red-600 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/40",           label: "Xóa bảng" },
  BOARD_MEMBERS_REPLACED:    { icon: UserCheck,  color: "text-indigo-600 dark:text-indigo-400",    bg: "bg-indigo-100 dark:bg-indigo-900/40",     label: "Cập nhật danh sách thành viên bảng" },
  BOARD_MEMBER_ROLE_UPDATED: { icon: Shield,     color: "text-amber-600 dark:text-amber-400",      bg: "bg-amber-100 dark:bg-amber-900/40",       label: "Thay đổi quyền thành viên bảng" },
  MEMBER_JOINED_BOARD:       { icon: LogIn,      color: "text-teal-600 dark:text-teal-400",        bg: "bg-teal-100 dark:bg-teal-900/40",         label: "Tham gia bảng" },
  MEMBER_REMOVED_FROM_BOARD: { icon: UserMinus,  color: "text-red-600 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/40",           label: "Xóa khỏi bảng" },
  WORKSPACE_CREATED:         { icon: Plus,       color: "text-emerald-600 dark:text-emerald-400",  bg: "bg-emerald-100 dark:bg-emerald-900/40",   label: "Tạo không gian làm việc" },
  WORKSPACE_UPDATED:         { icon: Pencil,     color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-100 dark:bg-blue-900/40",         label: "Cập nhật không gian làm việc" },
  WORKSPACE_DELETED:         { icon: Trash2,     color: "text-red-600 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/40",           label: "Xóa không gian làm việc" },
  MEMBER_INVITED:            { icon: UserPlus,   color: "text-sky-600 dark:text-sky-400",          bg: "bg-sky-100 dark:bg-sky-900/40",           label: "Mời thành viên" },
  MEMBER_JOINED:             { icon: LogIn,      color: "text-teal-600 dark:text-teal-400",        bg: "bg-teal-100 dark:bg-teal-900/40",         label: "Tham gia không gian làm việc" },
  MEMBER_REMOVED:            { icon: UserMinus,  color: "text-red-600 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/40",           label: "Xóa thành viên" },
  MEMBER_ROLE_UPDATED:       { icon: Shield,     color: "text-amber-600 dark:text-amber-400",      bg: "bg-amber-100 dark:bg-amber-900/40",       label: "Thay đổi quyền thành viên" },
};

const DEFAULT_CONFIG = { icon: ActivitySquare, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", label: "" };

// === Tạo câu mô tả từ metadata ===
const buildDescription = (action: string, metadata: Record<string, any>): string | null => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  switch (action) {
    case "TASK_CREATED":
    case "TASK_UPDATED":
    case "TASK_DELETED":
      return metadata.title ? `Công việc: "${metadata.title}"` : null;
    case "BOARD_CREATED":
    case "BOARD_UPDATED":
    case "BOARD_DELETED":
      return metadata.name ? `Bảng: "${metadata.name}"` : null;
    case "WORKSPACE_CREATED":
    case "WORKSPACE_UPDATED":
    case "WORKSPACE_DELETED":
      return metadata.name ? `Không gian: "${metadata.name}"` : null;
    case "MEMBER_INVITED":
      return `Email: ${metadata.email || ""}${metadata.role ? ` | Vai trò: ${metadata.role}` : ""}`;
    case "MEMBER_JOINED":
    case "MEMBER_JOINED_BOARD":
      return metadata.email ? `Email: ${metadata.email}` : null;
    case "MEMBER_REMOVED":
    case "MEMBER_REMOVED_FROM_BOARD":
      return metadata.removedUserId ? `Người dùng bị xóa: ${metadata.removedUserId}` : null;
    case "MEMBER_ROLE_UPDATED":
    case "BOARD_MEMBER_ROLE_UPDATED":
      return metadata.newRole ? `Vai trò mới: ${metadata.newRole}` : null;
    case "BOARD_MEMBERS_REPLACED":
      return metadata.memberCount != null ? `Tổng thành viên mới: ${metadata.memberCount}` : null;
    case "MEMBER_JOINED_BOARD":
      return metadata.boardName ? `Bảng: "${metadata.boardName}"` : null;
    default:
      return null;
  }
};

// === Group logs by date ===
const groupByDate = (logs: AuditLog[]) => {
  const groups: Record<string, AuditLog[]> = {};
  logs.forEach((log) => {
    const dateKey = format(new Date(log.timestamp), "dd/MM/yyyy", { locale: vi });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(log);
  });
  return groups;
};

// === Initials Avatar ===
const ActorAvatar = ({ name }: { name: string }) => {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
    : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();
  const [workspaceId, setWorkspaceId] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleExpand = (dateKey: string) => {
    setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await apiClient.get("workspace/api/workspaces/my-workspaces");
        const data = response.data?.data || response.data;
        if (data && data.length > 0) {
          setWorkspaceId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`audit/workspace/${workspaceId}/my-logs?page=${page}&size=50`);
        const newLogs = response.data?.content || [];
        if (page === 0) {
          setLogs(newLogs);
        } else {
          setLogs((prev) => [...prev, ...newLogs]);
        }
        setHasMore(!response.data?.last);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải nhật ký hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [workspaceId, page]);

  const grouped = groupByDate(logs);
  const dateKeys = Object.keys(grouped);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <ActivitySquare className="text-indigo-600 dark:text-indigo-400" size={26} />
          Nhật ký hoạt động
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Toàn bộ thay đổi và hành động trong không gian làm việc được ghi lại tại đây.
        </p>
      </div>

      {/* Content */}
      {loading && page === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm">Đang tải nhật ký...</p>
        </div>
      ) : !workspaceId ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
          <p>Bạn chưa tham gia không gian làm việc nào.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 gap-4">
          <ActivitySquare size={64} className="opacity-20" />
          <p className="text-sm">Chưa có hoạt động nào được ghi nhận.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {(expandedDates[dateKey] ? grouped[dateKey] : grouped[dateKey].slice(0, 5)).map((log) => {
                  const config = ACTION_CONFIG[log.action] || DEFAULT_CONFIG;
                  const Icon = config.icon;
                  const description = buildDescription(log.action, log.metadata);

                  const isCurrentUser = log.actorId === user?.id;
                  const actorDisplay = isCurrentUser
                    ? "Bạn"
                    : (log.actorName && log.actorName !== log.actorId)
                      ? log.actorName
                      : `Người dùng (${log.actorId?.substring(0, 6)}...)`;

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 group"
                    >
                      {/* Action Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <Icon size={16} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-sm font-semibold truncate max-w-[160px] ${
                              isCurrentUser
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                            title={log.actorName || log.actorId}
                          >
                            {actorDisplay}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">đã</span>
                          <span className={`text-sm font-semibold ${config.color}`}>
                            {config.label || log.action}
                          </span>
                        </div>
                        {description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={description}>
                            {description}
                          </p>
                        )}
                      </div>

                      {/* Time - backend stores UTC+7 so display as-is */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {format(new Date(log.timestamp), "HH:mm", { locale: vi })}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expand button if more than 5 logs */}
              {grouped[dateKey].length > 5 && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => toggleExpand(dateKey)}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {expandedDates[dateKey] 
                      ? "Thu gọn" 
                      : `Xem thêm ${grouped[dateKey].length - 5} hoạt động...`}
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
              >
                Tải thêm...
              </button>
            </div>
          )}

          {loading && page > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
