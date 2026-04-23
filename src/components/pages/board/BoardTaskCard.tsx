"use client";

import {
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import type { BoardTask, TaskPriority } from "@/lib/api/task";

interface BoardTaskCardProps {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
  URGENT: "bg-red-100 text-red-700",
};

function formatDueDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BoardTaskCard({ task, onClick }: BoardTaskCardProps) {
  const dueDate = formatDueDate(task.dueDate);
  const priorityClass = PRIORITY_STYLES[task.priority || "MEDIUM"];

  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className="w-full rounded-2xl border border-slate-200 bg-white/95 p-3 text-left shadow-md shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-5 text-slate-900">
          {task.title}
        </h4>
        {task.priority && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${priorityClass}`}
          >
            {task.priority}
          </span>
        )}
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
          {task.description}
        </p>
      )}

      {(dueDate ||
        task.attachmentCount ||
        task.commentCount ||
        task.checklistCount) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <CalendarDays size={12} />
              {dueDate}
            </span>
          )}
          {task.attachmentCount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <Paperclip size={12} />
              {task.attachmentCount}
            </span>
          ) : null}
          {task.commentCount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <MessageSquare size={12} />
              {task.commentCount}
            </span>
          ) : null}
          {task.checklistCount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <CheckSquare size={12} />
              {task.checklistCount}
            </span>
          ) : null}
        </div>
      )}
    </button>
  );
}
