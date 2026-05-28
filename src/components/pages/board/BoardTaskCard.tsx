"use client";

import {
  CalendarDays,
  CheckSquare,
  Clock3,
  GripVertical,
  MessageSquare,
  Paperclip,
  Users,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardTask, TaskPriority } from "@/lib/api/task";
import { useRealtime } from "@/providers/RealtimeProvider";
import { createTaskDragId } from "./boardState";
import { isTaskOverdue } from "./taskCardMeta";
import { parseServerDate, formatTaskDueDate } from "@/lib/helper/formatTime";

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
  disableDrag?: boolean;
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  NONE: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  LOWEST: "bg-blue-50 text-blue-600 border border-blue-100",
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
  HIGHEST: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  NONE: "Không",
  LOWEST: "Rất thấp",
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  HIGHEST: "Rất cao",
  URGENT: "Khẩn cấp",
};

function formatDueDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseServerDate(value));
}

function stripHtmlTags(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function BoardTaskCardBase({
  task,
  onClick,
  dragHandle = false,
  className = "",
  ghost = false,
}: BoardTaskCardBaseProps) {
  const formattedDueDate = formatTaskDueDate(task.dueDate, task.status);
  const createdAt = formatDueDate(task.createdAt);
  const priorityClass = PRIORITY_STYLES[task.priority || "MEDIUM"];
  const attachmentCount = Number(task.attachmentCount || 0);
  const commentCount = Number(task.commentCount || 0);
  const checklistTotal = Number(task.checklistTotal || 0);
  const checklistChecked = Number(task.checklistChecked || 0);
  const memberCount = Number(task.memberCount || 0);
  const progressPercent = checklistTotal > 0 ? Math.round((checklistChecked / checklistTotal) * 100) : -1;
  const hasMeta = Boolean(
    task.dueDate || createdAt || attachmentCount > 0 || commentCount > 0 || checklistTotal > 0 || memberCount > 0,
  );

  const cleanDescription = stripHtmlTags(task.description);

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
            <h4 className="text-sm font-semibold leading-5 text-slate-900 break-words [word-break:break-word]">
              {task.title}
            </h4>
            {cleanDescription ? (
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 break-words [word-break:break-word]">
                {cleanDescription}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {task.priority ? (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${priorityClass}`}
            >
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
          ) : null}
        </div>
        </div>

        {/* Progress bar for checklist */}
        {progressPercent >= 0 ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <CheckSquare size={10} />
                {checklistChecked}/{checklistTotal}
              </span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPercent === 100 ? "bg-emerald-500" : "bg-sky-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        {hasMeta ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {createdAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
              <CalendarDays size={12} />
              {createdAt}
            </span>
          ) : null}
          {task.dueDate && formattedDueDate.text ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${formattedDueDate.badgeClass}`}
            >
              <Clock3 size={12} />
              {formattedDueDate.text}
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
          {memberCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-600">
              <Users size={12} />
              {memberCount}
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
  disableDrag,
}: SortableBoardTaskCardProps) {
  const { checkIsLocked } = useRealtime();
  const dragId = createTaskDragId(task.id);
  const disabled = disableDrag || checkIsLocked(dragId);

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
