"use client";

import type { RemoteDragState } from "@/providers/RealtimeProvider";
import type { BoardTaskList } from "@/lib/api/task";
import { BoardTaskCardPreview } from "./BoardTaskCard";
import {
  BoardTaskListPreview,
} from "./BoardTaskListColumn";
import { parseDragEntityId } from "./boardState";

function findTask(lists: BoardTaskList[], dragId: string) {
  const taskId = parseDragEntityId(dragId);

  for (const list of lists) {
    const task = list.tasks.find((item) => item.id === taskId);
    if (task) {
      return task;
    }
  }

  return undefined;
}

function findTaskList(lists: BoardTaskList[], dragId: string) {
  const taskListId = parseDragEntityId(dragId);
  return lists.find((list) => list.id === taskListId);
}

interface RemoteDragOverlayProps {
  remoteDrags: Map<string, RemoteDragState>;
  taskLists: BoardTaskList[];
}

export function RemoteDragOverlay({
  remoteDrags,
  taskLists,
}: RemoteDragOverlayProps) {
  const entries = Array.from(remoteDrags.entries());
  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      {entries.map(([dragId, dragState]) => {
        const task = dragState.type === "task" ? findTask(taskLists, dragId) : null;
        const taskList =
          dragState.type === "taskList" ? findTaskList(taskLists, dragId) : null;

        if (!task && !taskList) {
          return null;
        }

        return (
          <div
            key={dragId}
            className="fixed pointer-events-none z-[120] space-y-2"
            style={{
              left: dragState.x - (dragState.type === "task" ? 140 : 160),
              top: dragState.y - 42,
            }}
          >
            <div className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              {dragState.username} đang kéo
            </div>
            {task ? <BoardTaskCardPreview task={task} /> : null}
            {taskList ? <BoardTaskListPreview list={taskList} /> : null}
          </div>
        );
      })}
    </>
  );
}
