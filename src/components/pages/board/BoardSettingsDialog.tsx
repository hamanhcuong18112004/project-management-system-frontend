"use client";

import { useEffect, useState } from "react";
import { Globe, Lock, Save, Trash2, Users, X } from "lucide-react";
import type { BoardDetails, UpdateBoardPayload } from "@/lib/api/board";
import type { BoardVisibility } from "@/lib/api/workspace";

interface BoardSettingsDialogProps {
  board: BoardDetails | null;
  onClose: () => void;
  onSave: (boardId: string, payload: UpdateBoardPayload) => Promise<void> | void;
  onDelete: (board: BoardDetails) => Promise<void> | void;
}

export function BoardSettingsDialog({
  board,
  onClose,
  onSave,
  onDelete,
}: BoardSettingsDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BoardVisibility>("WORKSPACE");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!board) {
      return;
    }

    setName(board.name);
    setDescription(board.description || "");
    setVisibility((board.visibility as BoardVisibility) || "WORKSPACE");
  }, [board]);

  if (!board) {
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave(board.id, {
        name: name.trim(),
        description,
        visibility,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete(board);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chỉnh sửa bảng"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Board Settings
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Chỉnh sửa bảng</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cập nhật tên và mô tả, hoặc xóa bảng này khỏi workspace.
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
              Tên bảng
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-3 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Quyền truy cập
            </label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([
                {
                  value: "PRIVATE" as const,
                  label: "Riêng tư",
                  desc: "Chỉ thành viên được mời",
                  icon: Lock,
                  color: "rose",
                },
                {
                  value: "WORKSPACE" as const,
                  label: "Workspace",
                  desc: "Thành viên workspace có thể tham gia",
                  icon: Users,
                  color: "sky",
                },
                {
                  value: "PUBLIC" as const,
                  label: "Công khai",
                  desc: "Ai cũng có thể xem",
                  icon: Globe,
                  color: "emerald",
                },
              ] as const).map(({ value, label, desc, icon: Icon, color }) => {
                const active = visibility === value;
                const base = "relative flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition";
                const style = active
                  ? color === "rose"
                    ? "border-rose-400 bg-rose-50"
                    : color === "sky"
                      ? "border-sky-400 bg-sky-50"
                      : "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-white hover:bg-slate-50";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVisibility(value)}
                    className={`${base} ${style}`}
                  >
                    <span className={`flex items-center gap-2 text-sm font-semibold ${
                      active
                        ? color === "rose" ? "text-rose-700" : color === "sky" ? "text-sky-700" : "text-emerald-700"
                        : "text-slate-700"
                    }`}>
                      <Icon size={14} />
                      {label}
                    </span>
                    <span className="text-xs text-slate-500">{desc}</span>
                    {active && (
                      <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${
                        color === "rose" ? "bg-rose-400" : color === "sky" ? "bg-sky-400" : "bg-emerald-400"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Xóa bảng sẽ cần dọn các task list và task liên quan trước. Frontend hiện đang
            gọi xóa task list theo board rồi mới xóa board.
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
            Xóa bảng
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
              Lưu bảng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
