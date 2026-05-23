"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Flag,
  FolderKanban,
  Loader2,
  Paperclip,
  Save,
  Search,
  Trash2,
  Upload,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import type {
  BoardTask,
  TaskAttachment,
  TaskPriority,
  UpdateTaskPayload,
} from "@/lib/api/task";
import type { BoardMemberSummary } from "@/lib/api/board";
import {
  assignTaskMember,
  deleteTaskAttachment,
  getTaskAttachments,
  getTaskMembers,
  unassignTaskMember,
  uploadTaskAttachment,
} from "@/lib/api/task";

import { TaskComments } from "./TaskComments";
import { TaskChecklists } from "./TaskChecklists";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { parseServerDate } from "@/lib/helper/formatTime";

interface BoardTaskDialogProps {

  open: boolean;
  task: BoardTask | null;
  listName?: string;
  boardMembers?: BoardMemberSummary[];
  onClose: () => void;
  onSave: (taskId: string, payload: UpdateTaskPayload) => Promise<void> | void;
  onDelete: (task: BoardTask) => Promise<void> | void;
  readOnly?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
  canManageAttachment?: boolean;
  canComment?: boolean;
}

interface TaskFieldRowProps {
  label: string;
  icon?: ReactNode;
  alignTop?: boolean;
  children: ReactNode;
}

const PRIORITY_OPTIONS: TaskPriority[] = ["NONE", "LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST", "URGENT"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  NONE: "Không",
  LOWEST: "Rất thấp",
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  HIGHEST: "Rất cao",
  URGENT: "Khẩn cấp",
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) return <File size={16} />;
  if (fileType.startsWith("image/")) return <FileImage size={16} className="text-violet-500" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return <FileSpreadsheet size={16} className="text-emerald-600" />;
  if (fileType.includes("pdf")) return <FileText size={16} className="text-rose-500" />;
  if (fileType.includes("word")) return <FileText size={16} className="text-sky-500" />;
  return <File size={16} className="text-slate-500" />;
}

function parseTaskDueDate(value?: string | null) {
  if (!value) {
    return { hasDueDate: false, date: "", time: "17:30", isAllDay: false };
  }
  const dateObj = parseServerDate(value);
  if (Number.isNaN(dateObj.getTime())) {
    return { hasDueDate: false, date: "", time: "17:30", isAllDay: false };
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const isAllDay = (hours === 0 && minutes === 0);

  return {
    hasDueDate: true,
    date: dateStr,
    time: isAllDay ? "17:30" : timeStr,
    isAllDay
  };
}

function toDueDatePayload(hasDueDate: boolean, date: string, time: string, isAllDay: boolean) {
  if (!hasDueDate || !date) {
    return null;
  }
  if (isAllDay) {
    return `${date}T00:00:00Z`;
  }
  const t = time || "17:30";
  const localDate = new Date(`${date}T${t}`);
  if (Number.isNaN(localDate.getTime())) {
    return `${date}T00:00:00Z`;
  }
  return localDate.toISOString();
}

function TaskFieldRow({
  label,
  icon,
  alignTop = false,
  children,
}: TaskFieldRowProps) {
  return (
    <div
      className={`grid gap-3 sm:grid-cols-[136px_minmax(0,1fr)] ${
        alignTop ? "items-start" : "items-center"
      }`}
    >
      <div className="flex items-center gap-2 pt-0.5 text-sm font-semibold text-slate-600">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function BoardTaskDialog({
  open,
  task,
  listName,
  boardMembers = [],
  onClose,
  onSave,
  onDelete,
  readOnly,
  canUpdate,
  canDelete,
  canAssign,
  canManageAttachment,
  canComment,
}: BoardTaskDialogProps) {
  // Effective permissions: if canUpdate/canDelete are explicitly provided, use them;
  // otherwise fall back to !readOnly
  const effectiveCanUpdate = canUpdate ?? !readOnly;
  const effectiveCanDelete = canDelete ?? !readOnly;
  const effectiveCanAssign = canAssign ?? effectiveCanUpdate;
  const effectiveCanManageAttachment = canManageAttachment ?? effectiveCanUpdate;
  const effectiveCanComment = canComment ?? effectiveCanUpdate;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<string>("TODO");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDateStr, setDueDateStr] = useState("");
  const [dueTimeStr, setDueTimeStr] = useState("17:30");
  const [isAllDay, setIsAllDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Members state
  const [members, setMembers] = useState<string[]>([]);
  const [initialMembers, setInitialMembers] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberAssigning, setMemberAssigning] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAssigned = currentUserId ? members.includes(currentUserId) : false;

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority ?? "MEDIUM");
    setStatus(task.status ?? "TODO");
    const parsed = parseTaskDueDate(task.dueDate);
    setHasDueDate(parsed.hasDueDate);
    setDueDateStr(parsed.date);
    setDueTimeStr(parsed.time);
    setIsAllDay(parsed.isAllDay);

    setMembersLoading(true);
    getTaskMembers(task.id)
      .then((data) => {
        setMembers(data);
        setInitialMembers(data);
      })
      .catch(() => {
        setMembers([]);
        setInitialMembers([]);
      })
      .finally(() => setMembersLoading(false));

    setAttachmentsLoading(true);
    getTaskAttachments(task.id)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [open, task]);

  // Close member dropdown on outside click
  useEffect(() => {
    if (!memberDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setMemberDropdownOpen(false);
        setMemberSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [memberDropdownOpen]);

  if (!open || !task) {
    return null;
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      // Save member assignments/unassignments to database first
      const toAdd = members.filter((id) => !initialMembers.includes(id));
      const toRemove = initialMembers.filter((id) => !members.includes(id));

      await Promise.all([
        ...toAdd.map((userId) => assignTaskMember(task.id, userId)),
        ...toRemove.map((userId) => unassignTaskMember(task.id, userId)),
      ]);

      await onSave(task.id, {
        title: title.trim(),
        description,
        priority,
        status: status as any,
        dueDate: toDueDatePayload(hasDueDate, dueDateStr, dueTimeStr, isAllDay),
      });
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await onDelete(task);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignMember = (userId: string) => {
    if (!userId || members.includes(userId)) return;
    setMembers((prev) => [...prev, userId]);
  };

  const handleUnassignMember = (userId: string) => {
    setMembers((prev) => prev.filter((id) => id !== userId));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: TaskAttachment[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadTaskAttachment(task.id, file);
        uploaded.push(result);
      }
      setAttachments((prev) => [...uploaded, ...prev]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteTaskAttachment(task.id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chi tiết task"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Task Detail
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{effectiveCanUpdate ? "Chỉnh sửa thẻ" : "Xem thẻ"}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {effectiveCanUpdate ? "Cập nhật nội dung, trạng thái và hạn xử lý cho task này." : "Bạn chỉ có quyền xem thẻ này."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
        <div className="space-y-4 px-5 py-5">
          <TaskFieldRow label="Danh sách" icon={<FolderKanban size={15} />}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
              {listName || "Chưa xác định"}
            </div>
          </TaskFieldRow>

          <TaskFieldRow label="Tiêu đề">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nhập tiêu đề task"
              disabled={!effectiveCanUpdate}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </TaskFieldRow>

          <TaskFieldRow label="Mô tả" alignTop>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Thêm mô tả ngắn gọn cho task"
              disabled={!effectiveCanUpdate}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </TaskFieldRow>

          <TaskFieldRow label="Ưu tiên" icon={<Flag size={15} />}>
            <div className="relative">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                disabled={!effectiveCanUpdate}
                className="w-full appearance-none rounded-2xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {PRIORITY_LABELS[option]}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </TaskFieldRow>

          <TaskFieldRow label="Hạn xử lý" icon={<CalendarDays size={15} />} alignTop={true}>
            <div className="space-y-3">
              {/* Toggle to enable/disable deadline */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!hasDueDate}
                    onChange={(e) => {
                      setHasDueDate(!e.target.checked);
                      if (e.target.checked) {
                        setDueDateStr("");
                      } else {
                        const today = new Date();
                        const y = today.getFullYear();
                        const m = String(today.getMonth() + 1).padStart(2, '0');
                        const d = String(today.getDate()).padStart(2, '0');
                        setDueDateStr(`${y}-${m}-${d}`);
                        setDueTimeStr("17:30");
                        setIsAllDay(false);
                      }
                    }}
                    disabled={!effectiveCanUpdate}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 transition"
                  />
                  <span className="text-sm font-semibold text-slate-700">Không có hạn xử lý</span>
                </label>
              </div>

              {hasDueDate && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all">
                  {/* Date & Time selection */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <input
                        type="date"
                        value={dueDateStr}
                        onChange={(e) => setDueDateStr(e.target.value)}
                        disabled={!effectiveCanUpdate}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                      />
                    </div>

                    {!isAllDay && (
                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="time"
                          value={dueTimeStr}
                          onChange={(e) => setDueTimeStr(e.target.value)}
                          disabled={!effectiveCanUpdate}
                          required
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* All day toggle */}
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        disabled={!effectiveCanUpdate}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 transition"
                      />
                      <span className="text-xs font-semibold text-slate-500">Cả ngày</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </TaskFieldRow>

          {isAssigned && (
            <TaskFieldRow label="Hoàn thành" icon={<CheckCircle2 size={15} className={status === "DONE" ? "text-emerald-500" : "text-slate-400"} />}>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={status === "DONE"}
                  disabled={!effectiveCanUpdate}
                  onChange={(e) => setStatus(e.target.checked ? "DONE" : "TODO")}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500 transition"
                />
                <span className={`text-sm font-semibold transition ${status === "DONE" ? "text-emerald-600" : "text-slate-700"}`}>
                  Xác nhận hoàn thành công việc
                </span>
              </label>
            </TaskFieldRow>
          )}
        </div>

        {/* Members section */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users size={15} />
            <span>Thành viên được gán</span>
            {membersLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
          </div>

          {/* Assigned members list */}
          {!membersLoading && members.length === 0 ? (
            <p className="mb-3 text-xs text-slate-400">Chưa có thành viên nào được gán.</p>
          ) : (
            <ul className="mb-3 space-y-1.5">
              {members.map((userId) => {
                const info = boardMembers.find(
                  (m) => (m.userId || m.id) === userId,
                );
                const displayName = info?.fullName || info?.email || userId;
                const initials = (info?.fullName || info?.email || "U")
                  .charAt(0)
                  .toUpperCase();
                return (
                  <li key={userId} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{displayName}</p>
                        {info?.email && info.email !== displayName ? (
                          <p className="truncate text-[10px] text-slate-400">{info.email}</p>
                        ) : null}
                      </div>
                    </div>
                    {effectiveCanAssign && (
                      <button
                        type="button"
                        onClick={() => void handleUnassignMember(userId)}
                        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Bỏ gán"
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Board member searchable dropdown */}
          {effectiveCanAssign && boardMembers.length > 0 ? (
            (() => {
              const unassigned = boardMembers.filter((m) => {
                const uid = m.userId || m.id;
                return uid && !members.includes(uid as string);
              });
              if (unassigned.length === 0) return null;
              const q = memberSearch.toLowerCase();
              const filtered = unassigned.filter((m) =>
                (m.fullName || "").toLowerCase().includes(q) ||
                (m.email || "").toLowerCase().includes(q)
              );
              return (
                <div ref={memberDropdownRef} className="relative mt-1">
                  {/* Trigger button */}
                  <button
                    type="button"
                    disabled={Boolean(memberAssigning)}
                    onClick={() => { setMemberDropdownOpen((v) => !v); setMemberSearch(""); }}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-500 transition hover:border-sky-400 disabled:opacity-60"
                  >
                    <span>-- Chọn thành viên để gán --</span>
                    {memberAssigning ? (
                      <Loader2 size={14} className="animate-spin text-slate-400" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-400">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {memberDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {/* Search input */}
                      <div className="border-b border-slate-100 px-3 py-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                          <Search size={13} className="shrink-0 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc email..."
                            className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                          />
                          {memberSearch ? (
                            <button type="button" onClick={() => setMemberSearch("")} className="text-slate-400 hover:text-slate-600">
                              <X size={12} />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Options list */}
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                          <li className="px-4 py-3 text-center text-xs text-slate-400">Không tìm thấy thành viên nào</li>
                        ) : (
                          filtered.map((m) => {
                            const uid = (m.userId || m.id) as string;
                            const name = m.fullName || "";
                            const email = m.email || "";
                            const initials = (name || email || "U").charAt(0).toUpperCase();
                            const isBusy = memberAssigning === uid;
                            return (
                              <li key={uid}>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    void handleAssignMember(uid);
                                    setMemberDropdownOpen(false);
                                    setMemberSearch("");
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-sky-50 disabled:opacity-50"
                                >
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                    {isBusy ? <Loader2 size={12} className="animate-spin" /> : initials}
                                  </span>
                                  <div className="min-w-0">
                                    {name ? <p className="truncate text-sm font-semibold text-slate-800">{name}</p> : null}
                                    {email ? <p className="truncate text-xs text-slate-400">{email}</p> : null}
                                    {!name && !email ? <p className="truncate text-xs text-slate-400">{uid}</p> : null}
                                  </div>
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })()
          ) : (
            <p className="text-xs text-slate-400">{readOnly ? null : "Board này chưa có thành viên nào."}</p>
          )}
        </div>

        {/* Attachments section */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Paperclip size={15} />
              <span>Tài liệu đính kèm</span>
              {attachmentsLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Tải lên
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.ppt,.pptx"
              className="hidden"
              onChange={(e) => void handleFileUpload(e.target.files)}
            />
          </div>

          {/* Drop zone */}
          <div
            className={`relative rounded-2xl border-2 border-dashed transition ${fileDragOver ? "border-sky-400 bg-sky-50" : "border-slate-200"} ${attachments.length === 0 && !attachmentsLoading ? "" : "mb-3"}`}
            onDragOver={(e) => {
              if (!effectiveCanManageAttachment) return;
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                setFileDragOver(true);
              }
            }}
            onDragLeave={() => setFileDragOver(false)}
            onDrop={(e) => {
              if (!effectiveCanManageAttachment) return;
              e.preventDefault();
              e.stopPropagation();
              setFileDragOver(false);
              void handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => {
              if (effectiveCanManageAttachment) fileInputRef.current?.click();
            }}
            role={effectiveCanManageAttachment ? "button" : undefined}
            tabIndex={effectiveCanManageAttachment ? 0 : -1}
            onKeyDown={(e) => { 
              if (effectiveCanManageAttachment && (e.key === "Enter" || e.key === " ")) {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="flex cursor-pointer flex-col items-center justify-center py-6 text-center">
              {uploading ? (
                <>
                  <Loader2 size={20} className="mb-2 animate-spin text-sky-500" />
                  <p className="text-xs text-sky-600 font-medium">Đang tải lên...</p>
                </>
              ) : fileDragOver ? (
                <>
                  <Upload size={20} className="mb-2 text-sky-500" />
                  <p className="text-xs text-sky-600 font-medium">Thả file vào đây để tải lên</p>
                </>
              ) : (
                <>
                  <Upload size={20} className="mb-2 text-slate-300" />
                  <p className="text-xs text-slate-400">Kéo thả hoặc nhấn để tải lên tài liệu</p>
                  <p className="mt-1 text-[10px] text-slate-300">Hỗ trợ: hình ảnh, PDF, Word, Excel, ZIP, ...</p>
                </>
              )}
            </div>
          </div>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="shrink-0">{getFileIcon(attachment.fileType)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {attachment.fileName || "File đính kèm"}
                    </p>
                    {attachment.fileSize ? (
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(attachment.fileSize)}
                        {attachment.fileType ? ` · ${attachment.fileType.split("/").pop()}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                      title="Tải xuống"
                      download={attachment.fileName ?? undefined}
                    >
                      <Download size={13} />
                    </a>
                    {effectiveCanManageAttachment && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteAttachment(attachment.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Xóa tệp"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checklist section */}
        <TaskChecklists taskId={task.id} canUpdate={effectiveCanUpdate} />

        {/* Comments section */}
        <TaskComments 
          taskId={task.id} 
          currentUserId={useAuthStore.getState().user?.id}
          userFullName={useAuthStore.getState().user?.fullName || useAuthStore.getState().user?.email || "Người dùng"} 
          userAvatarUrl={useAuthStore.getState().user?.avatarUrl || ""}
          canComment={effectiveCanComment}
        />

        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">

          {!effectiveCanUpdate && !effectiveCanDelete ? (
            <div className="ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {effectiveCanDelete ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Xóa thẻ
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  {effectiveCanUpdate ? "Hủy" : "Đóng"}
                </button>
                {effectiveCanUpdate && (
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    Lưu thay đổi
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
