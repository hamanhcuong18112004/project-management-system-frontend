"use client";

import { Fragment, useEffect, useState } from "react";
import { Pencil, Plus, SquarePen, WifiOff } from "lucide-react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import type { BoardTask, BoardTaskList } from "@/lib/api/task";
import { useRealtime } from "@/providers/RealtimeProvider";
import { createTaskDragId, createTaskListDragId } from "./boardState";
import {
  BoardTaskCard,
  BoardTaskDropPlaceholder,
  SortableBoardTaskCard,
} from "./BoardTaskCard";
import { toast } from "sonner";

interface BoardTaskListColumnProps {
  list: BoardTaskList;
  onOpenTask: (task: BoardTask) => void;
  onCreateTask: (list: BoardTaskList, title: string) => Promise<void> | void;
  onOpenListSettings: (list: BoardTaskList) => void;
  tempDropPosition?: number | null;
  activeDragId?: string | null;
  activeTask?: BoardTask | null;
  readOnly?: boolean;
  canCreateTask?: boolean;
  canUpdateList?: boolean;
  canDeleteList?: boolean;
}

export function BoardTaskListPreview({ list }: { list: BoardTaskList }) {
  return (
    <section className="w-[320px] shrink-0 rounded-3xl border border-slate-200/80 bg-white/92 p-4 shadow-xl shadow-slate-300/35 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{list.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            {list.tasks.length} task
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-55">
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500"
            aria-label="Cài đặt danh sách"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {list.tasks.map((task) => (
          <BoardTaskCard key={task.id} task={task} />
        ))}
      </div>

      <button
        type="button"
        disabled
        className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-500 opacity-60"
      >
        <Plus size={16} />
        Thêm thẻ
      </button>
    </section>
  );
}

function BoardTaskListColumnBase({
  list,
  onOpenTask,
  onCreateTask,
  onOpenListSettings,
  tempDropPosition,
  activeDragId,
  activeTask,
  dragHandlers,
  isOver,
  readOnly,
  canCreateTask,
  canUpdateList,
  canDeleteList,
}: BoardTaskListColumnProps & {
  dragHandlers?: Record<string, unknown>;
  isOver?: boolean;
}) {
  // If explicit granular permission is not passed, fall back to readOnly
  const showCreateTask = canCreateTask ?? !readOnly;
  const showUpdateList = canUpdateList ?? !readOnly;
  const showDeleteList = canDeleteList ?? !readOnly;
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const activeFromThisList = activeDragId
    ? list.tasks.some((task) => createTaskDragId(task.id) === activeDragId)
    : false;
  const showPlaceholder =
    typeof tempDropPosition === "number" &&
    tempDropPosition >= 0 &&
    !activeFromThisList;
  const showEndPlaceholder =
    showPlaceholder &&
    typeof tempDropPosition === "number" &&
    tempDropPosition >= list.tasks.length &&
    Boolean(activeTask);

  // Load saved draft from localStorage when box opens
  useEffect(() => {
    if (addingTask && typeof window !== "undefined") {
      const savedDraft = localStorage.getItem(`workspace_task_draft_${list.id}`);
      if (savedDraft) {
        setTaskTitle(savedDraft);
        toast.info(`Đã tự động khôi phục bản nháp công việc ở cột "${list.name}"`);
      }
    }
  }, [addingTask, list.id, list.name]);

  // Auto-save input value to localStorage as the user types
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (taskTitle.trim()) {
        localStorage.setItem(`workspace_task_draft_${list.id}`, taskTitle);
      } else {
        localStorage.removeItem(`workspace_task_draft_${list.id}`);
      }
    }
  }, [taskTitle, list.id]);

  const submitTask = async () => {
    if (!taskTitle.trim() || creatingTask) {
      return;
    }

    if (typeof window !== "undefined" && !window.navigator.onLine) {
      toast.warning("Mất kết nối mạng. Bản nháp của bạn đã được sao lưu an toàn tại thiết bị.");
      return;
    }

    setCreatingTask(true);

    try {
      await onCreateTask(list, taskTitle.trim());
      if (typeof window !== "undefined") {
        localStorage.removeItem(`workspace_task_draft_${list.id}`);
      }
      setTaskTitle("");
      setAddingTask(false);
    } catch (error) {
      console.error("Lỗi khi tạo task:", error);
      toast.error("Không thể tạo thẻ công việc. Bản nháp vẫn được lưu trữ tạm thời.");
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <section className="flex h-fit w-[320px] shrink-0 flex-col rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-xl shadow-slate-300/35 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="min-w-0 flex-1 cursor-grab rounded-2xl px-1 py-1 active:cursor-grabbing"
          {...dragHandlers}
        >
          <h3 className="truncate text-lg font-semibold text-slate-900">{list.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            {list.tasks.length} task
          </p>
        </div>

        <div className="flex items-center gap-1">
          {showUpdateList && (
            <button
              type="button"
              onClick={() => onOpenListSettings(list)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              title="Cài đặt danh sách"
            >
              <Pencil size={16} />
            </button>
          )}
          {showCreateTask && (
            <button
              type="button"
              onClick={() => setAddingTask(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              title="Thêm thẻ"
            >
              <SquarePen size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        className={`space-y-3 rounded-2xl transition ${isOver ? "bg-sky-50/80 p-2" : ""}`}
      >
        <SortableContext
          items={list.tasks.map((task) => createTaskDragId(task.id))}
          strategy={verticalListSortingStrategy}
        >
          {list.tasks.map((task, index) => (
            <Fragment key={task.id}>
              {showPlaceholder && tempDropPosition === index && activeTask ? (
                <BoardTaskDropPlaceholder task={activeTask} />
              ) : null}
              <SortableBoardTaskCard task={task} taskListId={list.id} onClick={onOpenTask} disableDrag={readOnly} />
            </Fragment>
          ))}
        </SortableContext>
      </div>

      {showEndPlaceholder ? (
        <div className="mt-4">
          <BoardTaskDropPlaceholder task={activeTask!} />
        </div>
      ) : null}

      {addingTask ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Nhập tiêu đề thẻ"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void submitTask()}
              disabled={creatingTask}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Thêm thẻ
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskTitle("");
                setAddingTask(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : showEndPlaceholder ? null : showCreateTask ? (
        <button
          type="button"
          onClick={() => setAddingTask(true)}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:bg-sky-50/80 hover:text-sky-700"
        >
          <Plus size={16} />
          Thêm thẻ
        </button>
      ) : null}
    </section>
  );
}

export function BoardTaskListColumn(props: BoardTaskListColumnProps) {
  const { checkIsLocked } = useRealtime();
  const dragId = createTaskListDragId(props.list.id);
  const disabled = props.readOnly || checkIsLocked(dragId);

  const {
    setNodeRef: setSortableNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: {
      type: "taskList",
      taskListId: props.list.id,
    },
    disabled,
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: dragId,
    data: {
      type: "taskList",
      taskListId: props.list.id,
    },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-55" : disabled ? "opacity-60" : ""}
    >
      <BoardTaskListColumnBase
        {...props}
        dragHandlers={disabled ? {} : { ...attributes, ...listeners }}
        isOver={isOver}
      />
    </div>
  );
}
