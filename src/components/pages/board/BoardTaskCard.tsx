"use client";

import {
  CalendarDays,
  CheckSquare,
  Clock3,
  GripVertical,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardTask, TaskPriority } from "@/lib/api/task";
import { useRealtime } from "@/providers/RealtimeProvider";
import { createTaskDragId } from "./boardState";
import { isTaskOverdue } from "./taskCardMeta";

interface BoardTaskCardBaseProps {
  task: BoardTask;
  onClick?: (task: BoardTask) => void;
  dragHandle?: boolean;
  className?: string;
  ghost?: boolean;
}

interface SortableBoardTaskCardProps {
  task: BoardTask;
  taskListId: string;
  onClick: (task: BoardTask) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
  URGENT: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<NonNullable<BoardTask["status"]>, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  DONE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
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

function BoardTaskCardBase({
  task,
  onClick,
  dragHandle = false,
  className = "",
  ghost = false,
}: BoardTaskCardBaseProps) {
  const dueDate = formatDueDate(task.dueDate);
  const overdue = isTaskOverdue(task);
  const priorityClass = PRIORITY_STYLES[task.priority || "MEDIUM"];
  const status = task.status || "TODO";
  const statusClass = STATUS_STYLES[status];
  const attachmentCount = Number(task.attachmentCount || 0);
  const commentCount = Number(task.commentCount || 0);
  const checklistCount = Number(task.checklistCount || 0);
  const hasMeta = Boolean(
    dueDate || attachmentCount > 0 || commentCount > 0 || checklistCount > 0,
  );

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(task) : undefined}
      className={`w-full rounded-2xl border border-slate-200 bg-white/95 p-3 text-left shadow-md shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg ${ghost ? "pointer-events-none border-2 border-dashed border-sky-400 bg-sky-50/70 shadow-none hover:translate-y-0 hover:border-sky-400 hover:bg-sky-50/70 hover:shadow-none" : ""} ${className}`}
    >
      <div className={ghost ? "opacity-0" : ""}>
        <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {dragHandle ? (
            <span className="mt-0.5 rounded-lg p-1 text-slate-400 transition group-hover:text-slate-600">
              <GripVertical size={14} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold leading-5 text-slate-900">
              {task.title}
            </h4>
            {task.description ? (
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                {task.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusClass}`}
          >
            {status}
          </span>
          {task.priority ? (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${priorityClass}`}
            >
              {task.priority}
            </span>
          ) : null}
        </div>
        </div>

        {hasMeta ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {dueDate ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                overdue ? "bg-red-100 font-semibold text-red-700" : "bg-slate-100"
              }`}
            >
              {overdue ? <Clock3 size={12} /> : <CalendarDays size={12} />}
              {dueDate}
            </span>
          ) : null}
          {attachmentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <Paperclip size={12} />
              {attachmentCount}
            </span>
          ) : null}
          {commentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <MessageSquare size={12} />
              {commentCount}
            </span>
          ) : null}
          {checklistCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <CheckSquare size={12} />
              {checklistCount}
            </span>
          ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function BoardTaskCard({
  task,
  onClick,
}: {
  task: BoardTask;
  onClick?: (task: BoardTask) => void;
}) {
  return <BoardTaskCardBase task={task} onClick={onClick} />;
}

export function BoardTaskCardPreview({ task }: { task: BoardTask }) {
  return (
    <div className="w-[288px]">
      <BoardTaskCardBase task={task} dragHandle />
    </div>
  );
}

export function BoardTaskDropPlaceholder({ task }: { task: BoardTask }) {
  return <BoardTaskCardBase task={task} dragHandle ghost />;
}

export function SortableBoardTaskCard({
  task,
  taskListId,
  onClick,
}: SortableBoardTaskCardProps) {
  const { checkIsLocked } = useRealtime();
  const dragId = createTaskDragId(task.id);
  const disabled = checkIsLocked(dragId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: dragId,
      data: {
        type: "task",
        taskId: task.id,
        taskListId,
      },
      disabled,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-55" : disabled ? "opacity-60" : ""}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      <BoardTaskCardBase
        task={task}
        onClick={onClick}
        dragHandle
        className={disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
      />
    </div>
  );
}
