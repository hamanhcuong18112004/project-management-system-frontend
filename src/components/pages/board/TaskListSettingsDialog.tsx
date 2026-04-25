"use client";

import { useEffect, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import type { BoardTaskList } from "@/lib/api/task";

interface TaskListSettingsDialogProps {
  taskList: BoardTaskList | null;
  onClose: () => void;
  onSave: (taskList: BoardTaskList, nextName: string) => Promise<void> | void;
  onDelete: (taskList: BoardTaskList) => Promise<void> | void;
}

export function TaskListSettingsDialog({
  taskList,
  onClose,
  onSave,
  onDelete,
}: TaskListSettingsDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!taskList) {
      return;
    }

    setName(taskList.name);
  }, [taskList]);

  if (!taskList) {
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave(taskList, name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete(taskList);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chỉnh sửa danh sách"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              List Settings
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Chỉnh sửa danh sách
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Đổi tên danh sách hoặc xóa toàn bộ cột này cùng các task bên trong.
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

        <div className="space-y-5 px-6 py-6">
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tên danh sách
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Danh sách này hiện có{" "}
            <span className="font-semibold text-slate-900">{taskList.tasks.length}</span> task.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            Xóa danh sách
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
              onClick={() => void handleSave()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              Lưu danh sách
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
