"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Flag, FolderKanban, Save, Trash2, X } from "lucide-react";
import type {
  BoardTask,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from "@/lib/api/task";

interface BoardTaskDialogProps {
  open: boolean;
  task: BoardTask | null;
  listName?: string;
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

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status ?? "TODO");
    setPriority(task.priority ?? "MEDIUM");
    setDueDate(toDateInputValue(task.dueDate));
  }, [open, task]);

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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chi tiết task"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
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
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </TaskFieldRow>

          <TaskFieldRow label="Ưu tiên" icon={<Flag size={15} />}>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
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
