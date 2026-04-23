"use client";

import { CalendarDays, Flag, FolderKanban, X } from "lucide-react";
import type { BoardTask } from "@/lib/api/task";

interface BoardTaskDialogProps {
  task: BoardTask | null;
  listName?: string;
  onClose: () => void;
}

function formatDueDate(value?: string | null) {
  if (!value) {
    return "Chưa có hạn";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BoardTaskDialog({
  task,
  listName,
  onClose,
}: BoardTaskDialogProps) {
  if (!task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chi tiết task"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Task Detail
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {task.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Mở rộng sau với comment, checklist, member và attachment.
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

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.6fr,1fr]">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Mô tả
            </h4>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-700">
                {task.description || "Task này chưa có mô tả."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <FolderKanban size={15} />
                <span className="text-sm font-medium">Danh sách</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {listName || "Chưa xác định"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Flag size={15} />
                <span className="text-sm font-medium">Ưu tiên</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {task.priority || "MEDIUM"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays size={15} />
                <span className="text-sm font-medium">Hạn xử lý</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatDueDate(task.dueDate)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Trạng thái</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {task.status || "TODO"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
