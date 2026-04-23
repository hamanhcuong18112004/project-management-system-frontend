"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  BoardHeader,
  BoardTaskDialog,
  BoardTaskListColumn,
  createFallbackBoard,
  createFallbackTaskLists,
} from "@/components/pages/board";
import { getBoardBackgroundStyle } from "@/components/pages/workspace/boardPresets";
import { getApiErrorMessage } from "@/lib/api/error";
import { getBoardById, type BoardDetails } from "@/lib/api/board";
import {
  createTask,
  createTaskList,
  getTaskListsByBoardId,
  type BoardTask,
  type BoardTaskList,
} from "@/lib/api/task";

type SourceMode = "live" | "mixed" | "demo";
type SelectedTaskContext = { listName: string; task: BoardTask } | null;

function createTempId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sortTaskLists(lists: BoardTaskList[]) {
  return [...lists].sort((left, right) => (left.position || 0) - (right.position || 0));
}

export default function BoardDetailPage() {
  const params = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const boardId = params.boardId;
  const searchKey = searchParams.toString();

  const [board, setBoard] = useState<BoardDetails | null>(null);
  const [taskLists, setTaskLists] = useState<BoardTaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceMode, setSourceMode] = useState<SourceMode>("live");
  const [selectedTask, setSelectedTask] = useState<SelectedTaskContext>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const fallbackBoard = useMemo(
    () => createFallbackBoard(boardId, searchParams),
    [boardId, searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getBoardById(boardId), getTaskListsByBoardId(boardId)])
      .then(([boardResult, taskListResult]) => {
        if (cancelled) {
          return;
        }

        const nextBoard =
          boardResult.status === "fulfilled" ? boardResult.value : fallbackBoard;
        const nextTaskLists =
          taskListResult.status === "fulfilled" && taskListResult.value.length > 0
            ? taskListResult.value
            : createFallbackTaskLists(boardId);

        const nextSourceMode: SourceMode =
          boardResult.status === "fulfilled" &&
          taskListResult.status === "fulfilled"
            ? "live"
            : boardResult.status === "fulfilled" ||
                taskListResult.status === "fulfilled"
              ? "mixed"
              : "demo";

        setBoard(nextBoard);
        setTaskLists(sortTaskLists(nextTaskLists));
        setSourceMode(nextSourceMode);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setBoard(fallbackBoard);
        setTaskLists(sortTaskLists(createFallbackTaskLists(boardId)));
        setSourceMode("demo");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boardId, fallbackBoard, searchKey]);

  const backgroundStyle = useMemo(() => {
    if (!board) {
      return getBoardBackgroundStyle(
        fallbackBoard.backgroundType,
        fallbackBoard.backgroundValue,
        fallbackBoard.background,
      );
    }

    return getBoardBackgroundStyle(
      board.backgroundType,
      board.backgroundValue,
      board.background,
    );
  }, [board, fallbackBoard]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !board) {
      return;
    }

    const optimisticList: BoardTaskList = {
      id: createTempId("list"),
      boardId: board.id,
      name: newListName.trim(),
      position: (taskLists.at(-1)?.position || 0) + 1000,
      tasks: [],
    };

    setTaskLists((current) => sortTaskLists([...current, optimisticList]));
    setNewListName("");
    setAddingList(false);

    try {
      const createdList = await createTaskList({
        boardId: board.id,
        name: optimisticList.name,
        position: optimisticList.position || 1000,
      });

      setTaskLists((current) =>
        sortTaskLists(
          current.map((taskList) =>
            taskList.id === optimisticList.id ? createdList : taskList,
          ),
        ),
      );
    } catch (error) {
      toast.info(
        getApiErrorMessage(
          error,
          "TaskList đang được thêm ở frontend. Backend task-service chưa sẵn sàng.",
        ),
      );
    }
  };

  const handleCreateTask = async (list: BoardTaskList, title: string) => {
    const optimisticTask: BoardTask = {
      id: createTempId("task"),
      title,
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      position: (list.tasks.at(-1)?.position || 0) + 1000,
      archived: false,
      attachmentCount: 0,
      commentCount: 0,
      checklistCount: 0,
    };

    setTaskLists((current) =>
      current.map((taskList) =>
        taskList.id === list.id
          ? {
              ...taskList,
              tasks: [...taskList.tasks, optimisticTask].sort(
                (left, right) => (left.position || 0) - (right.position || 0),
              ),
            }
          : taskList,
      ),
    );

    if (list.id.startsWith("list-") && sourceMode === "demo") {
      return;
    }

    try {
      const createdTask = await createTask({
        taskListId: list.id,
        title,
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
        position: optimisticTask.position || 1000,
        archived: false,
      });

      setTaskLists((current) =>
        current.map((taskList) =>
          taskList.id === list.id
            ? {
                ...taskList,
                tasks: taskList.tasks.map((task) =>
                  task.id === optimisticTask.id ? createdTask : task,
                ),
              }
            : taskList,
        ),
      );
    } catch (error) {
      toast.info(
        getApiErrorMessage(
          error,
          "Task đang được thêm cục bộ. Backend task-service chưa có endpoint tương ứng.",
        ),
      );
    }
  };

  if (loading && !board) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-100 text-slate-700">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const resolvedBoard = board || fallbackBoard;

  return (
    <>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/74 via-slate-100/58 to-white/68" />

        <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
          <BoardHeader board={resolvedBoard} sourceMode={sourceMode} />

          <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-6">
            <div className="flex min-h-full items-start gap-4 pb-6">
              {taskLists.map((taskList) => (
                <BoardTaskListColumn
                  key={taskList.id}
                  list={taskList}
                  onOpenTask={(task) =>
                    setSelectedTask({
                      task,
                      listName: taskList.name,
                    })
                  }
                  onCreateTask={handleCreateTask}
                />
              ))}

              <section className="w-[320px] shrink-0 rounded-3xl border border-dashed border-slate-300/80 bg-white/60 p-4 shadow-lg shadow-slate-300/25 backdrop-blur-xl">
                {addingList ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-3">
                    <textarea
                      value={newListName}
                      onChange={(event) => setNewListName(event.target.value)}
                      rows={3}
                      placeholder="Nhập tên danh sách"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCreateList()}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                      >
                        Thêm danh sách
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewListName("");
                          setAddingList(false);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingList(true)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-white/70"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm shadow-slate-200/70">
                      <Plus size={16} />
                    </span>
                    Thêm danh sách
                  </button>
                )}
              </section>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/82 px-4 py-2 text-sm text-slate-700 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
              <span className="rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-700">
                Bảng thông tin
              </span>
              <span className="rounded-xl px-3 py-2 text-slate-500">
                Chuyển đổi các bảng
              </span>
            </div>
          </div>
        </div>
      </div>

      <BoardTaskDialog
        task={selectedTask?.task || null}
        listName={selectedTask?.listName}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
