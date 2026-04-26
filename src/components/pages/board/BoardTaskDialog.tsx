"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
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
  TaskStatus,
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

interface BoardTaskDialogProps {
  open: boolean;
  task: BoardTask | null;
  listName?: string;
  boardMembers?: BoardMemberSummary[];
  onClose: () => void;
  onSave: (taskId: string, payload: UpdateTaskPayload) => Promise<void> | void;
  onDelete: (task: BoardTask) => Promise<void> | void;
}

interface TaskFieldRowProps {
  label: string;
  icon?: ReactNode;
  alignTop?: boolean;
  children: ReactNode;
}

const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"];
const PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

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

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toDueDatePayload(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`).toISOString();
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
}: BoardTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Members state
  const [members, setMembers] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberAssigning, setMemberAssigning] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status ?? "TODO");
    setPriority(task.priority ?? "MEDIUM");
    setDueDate(toDateInputValue(task.dueDate));

    setMembersLoading(true);
    getTaskMembers(task.id)
      .then(setMembers)
      .catch(() => setMembers([]))
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
      await onSave(task.id, {
        title: title.trim(),
        description,
        status,
        priority,
        dueDate: toDueDatePayload(dueDate),
      });
      onClose();
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

  const handleAssignMember = async (userId: string) => {
    if (!userId || memberAssigning || members.includes(userId)) return;
    setMemberAssigning(userId);
    try {
      await assignTaskMember(task.id, userId);
      setMembers((prev) => [...prev, userId]);
    } finally {
      setMemberAssigning(null);
    }
  };

  const handleUnassignMember = async (userId: string) => {
    try {
      await unassignTaskMember(task.id, userId);
      setMembers((prev) => prev.filter((id) => id !== userId));
    } catch {
      // ignore
    }
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
            <h3 className="mt-2 text-xl font-bold text-slate-900">Chỉnh sửa thẻ</h3>
            <p className="mt-1 text-sm text-slate-500">
              Cập nhật nội dung, trạng thái và hạn xử lý cho task này.
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
            />
          </TaskFieldRow>

          <TaskFieldRow label="Mô tả" alignTop>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Thêm mô tả ngắn gọn cho task"
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
            />
          </TaskFieldRow>

          <TaskFieldRow label="Trạng thái">
            <div className="relative">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="w-full appearance-none rounded-2xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
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

          <TaskFieldRow label="Ưu tiên" icon={<Flag size={15} />}>
            <div className="relative">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="w-full appearance-none rounded-2xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
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

          <TaskFieldRow label="Hạn xử lý" icon={<CalendarDays size={15} />}>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </TaskFieldRow>
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
                    <button
                      type="button"
                      onClick={() => void handleUnassignMember(userId)}
                      className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Bỏ gán"
                    >
                      <UserMinus size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Board member searchable dropdown */}
          {boardMembers.length > 0 ? (
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
            <p className="text-xs text-slate-400">Board này chưa có thành viên nào.</p>
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Tải lên
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.ppt,.pptx"
              className="hidden"
              onChange={(e) => void handleFileUpload(e.target.files)}
            />
          </div>
          {!attachmentsLoading && attachments.length === 0 ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-6 text-center transition hover:border-sky-300 hover:bg-sky-50/50"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            >
              <Upload size={20} className="mb-2 text-slate-300" />
              <p className="text-xs text-slate-400">Kéo thả hoặc nhấn để tải lên tài liệu</p>
              <p className="mt-1 text-[10px] text-slate-300">Hỗ trợ: hình ảnh, PDF, Word, Excel, ZIP, ...</p>
            </div>
          ) : (
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
                    <button
                      type="button"
                      onClick={() => void handleDeleteAttachment(attachment.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa tệp"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            Xóa thẻ
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
