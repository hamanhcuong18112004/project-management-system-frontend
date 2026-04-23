"use client";

import { Plus, SquarePen } from "lucide-react";
import { useState } from "react";
import type { BoardTask, BoardTaskList } from "@/lib/api/task";
import { BoardTaskCard } from "./BoardTaskCard";

interface BoardTaskListColumnProps {
  list: BoardTaskList;
  onOpenTask: (task: BoardTask) => void;
  onCreateTask: (list: BoardTaskList, title: string) => Promise<void> | void;
}

export function BoardTaskListColumn({
  list,
  onOpenTask,
  onCreateTask,
}: BoardTaskListColumnProps) {
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const submitTask = async () => {
    if (!taskTitle.trim()) {
      return;
    }

    await onCreateTask(list, taskTitle.trim());
    setTaskTitle("");
    setAddingTask(false);
  };

  return (
    <section className="flex h-fit w-[320px] shrink-0 flex-col rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-xl shadow-slate-300/35 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{list.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            {list.tasks.length} task
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddingTask(true)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          title="Them the"
        >
          <SquarePen size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {list.tasks.map((task) => (
          <BoardTaskCard key={task.id} task={task} onClick={onOpenTask} />
        ))}
      </div>

      {addingTask ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <textarea
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            rows={3}
            placeholder="Nhap tieu de the"
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void submitTask()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Them the
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskTitle("");
                setAddingTask(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Huy
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingTask(true)}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:bg-sky-50/80 hover:text-sky-700"
        >
          <Plus size={16} />
          Them the
        </button>
      )}
    </section>
  );
}
