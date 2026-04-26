"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BoardAiAssistant,
  BoardHeader,
  BoardMembersDialog,
  BoardSettingsDialog,
  BoardTaskCardPreview,
  BoardTaskDialog,
  BoardTaskListColumn,
  TaskListSettingsDialog,
  BoardTaskListPreview,
  RemoteDragOverlay,
} from "@/components/pages/board";
import {
  createTaskDragId,
  createTaskListDragId,
  moveTaskList,
  moveTaskWithinList,
  moveTaskToPosition,
  parseDragEntityId,
  removeTask,
  removeTaskList,
  replaceTask,
  replaceTaskList,
  sortTasks,
  sortTaskLists,
} from "@/components/pages/board/boardState";
import { getBoardBackgroundStyle } from "@/components/pages/workspace/boardPresets";
import {
  deleteBoard,
  getBoardById,
  joinBoard,
  replaceBoardMembers,
  updateBoard,
  type BoardMemberSummary,
  type BoardDetails,
} from "@/lib/api/board";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  createTask,
  createTaskList,
  deleteTask,
  deleteTaskList,
  deleteTaskListsByBoardId,
  getTaskListsByBoardId,
  updateTask,
  updateTaskList,
  type BoardTask,
  type BoardTaskList,
  type UpdateTaskPayload,
} from "@/lib/api/task";
import { getWorkspaceById, type Workspace } from "@/lib/api/workspace";
import { useRealtime, type DragItemType } from "@/providers/RealtimeProvider";

type SelectedTaskContext = {
  listId: string;
  listName: string;
  task: BoardTask;
} | null;

type DropTarget = {
  taskListId: string;
  position: number;
} | null;

function createTempId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function buildTaskSnapshot(lists: BoardTaskList[]) {
  const snapshot = new Map<string, { taskListId: string; position: number | null | undefined }>();

  for (const list of lists) {
    for (const task of list.tasks) {
      snapshot.set(task.id, {
        taskListId: list.id,
        position: task.position,
      });
    }
  }

  return snapshot;
}

function findTaskByDragId(lists: BoardTaskList[], dragId: string) {
  const taskId = parseDragEntityId(dragId);

  for (const list of lists) {
    const task = list.tasks.find((item) => item.id === taskId);
    if (task) {
      return task;
    }
  }

  return null;
}

function findTaskListByDragId(lists: BoardTaskList[], dragId: string) {
  const taskListId = parseDragEntityId(dragId);
  return lists.find((list) => list.id === taskListId) || null;
}

export default function BoardDetailPage() {
  const params = useParams<{ boardId: string }>();
  const router = useRouter();
  const boardId = params.boardId;

  const {
    boardVersion,
    remoteDrags,
    emitBoardUpdated,
    emitDragEnd,
    emitDragMove,
    emitDragStart,
  } = useRealtime();

  const [board, setBoard] = useState<BoardDetails | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [taskLists, setTaskLists] = useState<BoardTaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<SelectedTaskContext>(null);
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [joiningBoard, setJoiningBoard] = useState(false);
  const [selectedTaskList, setSelectedTaskList] = useState<BoardTaskList | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<DragItemType>("task");
  const [tempDropTarget, setTempDropTarget] = useState<DropTarget>(null);

  const pointerRef = useRef({ x: 0, y: 0 });
  const dragMoveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDragTypeRef = useRef<DragItemType>("task");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 6 } }),
  );

  const userId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = window.localStorage.getItem("auth-storage");
      if (!raw) return undefined;
      return (JSON.parse(raw) as { state?: { user?: { id?: string } } }).state?.user?.id;
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getBoardById(boardId), getTaskListsByBoardId(boardId)])
      .then(([boardResult, taskListResult]) => {
        if (cancelled) {
          return;
        }

        if (boardResult.status === "rejected") {
          setBoard(null);
          setTaskLists([]);
          setLoadError(getApiErrorMessage(boardResult.reason, "Không thể tải board."));
          setLoading(false);
          return;
        }

        const nextTaskLists =
          taskListResult.status === "fulfilled" ? taskListResult.value : [];

        setBoard(boardResult.value);
        setTaskLists(sortTaskLists(nextTaskLists));
        setLoadError(
          taskListResult.status === "rejected"
            ? getApiErrorMessage(taskListResult.reason, "Không thể tải danh sách task.")
            : null,
        );
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setBoard(null);
        setTaskLists([]);
        setLoadError(getApiErrorMessage(error, "Không thể tải board."));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boardId, boardVersion]);

  useEffect(() => {
    let cancelled = false;

    if (!board?.workspaceId) {
      setWorkspace(null);
      return () => {
        cancelled = true;
      };
    }

    getWorkspaceById(board.workspaceId)
      .then((workspaceResponse) => {
        if (!cancelled) {
          setWorkspace(workspaceResponse);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspace(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [board?.workspaceId]);

  useEffect(() => {
    if (!activeDragId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [activeDragId]);

  useEffect(() => {
    if (!activeDragId) {
      return;
    }

    dragMoveIntervalRef.current = setInterval(() => {
      emitDragMove(
        activeDragId,
        activeDragTypeRef.current,
        pointerRef.current.x,
        pointerRef.current.y,
      );
    }, 60);

    return () => {
      if (dragMoveIntervalRef.current) {
        clearInterval(dragMoveIntervalRef.current);
        dragMoveIntervalRef.current = null;
      }
    };
  }, [activeDragId, emitDragMove]);

  const backgroundStyle = useMemo(() => {
    if (!board) {
      return { background: "#f1f5f9" };
    }

    return getBoardBackgroundStyle(
      board.backgroundType,
      board.backgroundValue,
      board.background,
    );
  }, [board]);

  // Enrich board.members with fullName/email from workspace.members
  const enrichedBoardMembers = useMemo(() => {
    if (!board) return [];
    const wsMembers = workspace?.members || [];
    return (board.members || []).map((m) => {
      const uid = m.userId || m.id;
      const ws = wsMembers.find((w) => w.userId === uid);
      return {
        ...m,
        userId: uid,
        fullName: m.fullName || ws?.fullName,
        email: m.email || ws?.email,
      };
    });
  }, [board?.members, workspace?.members]);

  const activeTask = activeDragId ? findTaskByDragId(taskLists, activeDragId) : null;
  const activeTaskList = activeDragId
    ? findTaskListByDragId(taskLists, activeDragId)
    : null;

  const clearDragState = () => {
    if (dragMoveIntervalRef.current) {
      clearInterval(dragMoveIntervalRef.current);
      dragMoveIntervalRef.current = null;
    }

    setActiveDragId(null);
    setTempDropTarget(null);
  };

  const persistTaskListPositions = async (
    previousLists: BoardTaskList[],
    nextLists: BoardTaskList[],
  ) => {
    const previousPositions = new Map(
      previousLists.map((list) => [list.id, list.position]),
    );

    const updates = nextLists
      .filter((list) => previousPositions.get(list.id) !== list.position)
      .map((list) =>
        updateTaskList(list.id, {
          position: list.position || undefined,
        }),
      );

    await Promise.all(updates);
  };

  const persistTaskPositions = async (
    previousLists: BoardTaskList[],
    nextLists: BoardTaskList[],
  ) => {
    const previousSnapshot = buildTaskSnapshot(previousLists);
    const updates: Promise<unknown>[] = [];

    for (const list of nextLists) {
      for (const task of list.tasks) {
        const previousTask = previousSnapshot.get(task.id);
        if (
          !previousTask ||
          previousTask.taskListId !== list.id ||
          previousTask.position !== task.position
        ) {
          updates.push(
            updateTask(task.id, {
              taskListId: list.id,
              position: task.position || undefined,
            }),
          );
        }
      }
    }

    await Promise.all(updates);
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !board || creatingList) {
      return;
    }

    const optimisticList: BoardTaskList = {
      id: createTempId("list"),
      boardId: board.id,
      name: newListName.trim(),
      position: ((taskLists.at(-1)?.position || 0) + 1000),
      tasks: [],
    };

    setTaskLists((current) => sortTaskLists([...current, optimisticList]));
    setNewListName("");
    setAddingList(false);
    setCreatingList(true);

    try {
      const createdList = await createTaskList({
        boardId: board.id,
        name: optimisticList.name,
        position: optimisticList.position || 1000,
      });

      setTaskLists((current) => {
        let replaced = false;
        const nextLists = current.map((taskList) => {
          if (taskList.id === optimisticList.id) {
            replaced = true;
            return createdList;
          }

          return taskList;
        });

        if (replaced) {
          return sortTaskLists(nextLists);
        }

        if (current.some((taskList) => taskList.id === createdList.id)) {
          return sortTaskLists(current);
        }

        return sortTaskLists([...current, createdList]);
      });
      emitBoardUpdated();
      setCreatingList(false);
    } catch (error) {
      setTaskLists((current) => current.filter((taskList) => taskList.id !== optimisticList.id));
      setCreatingList(false);
      toast.error(getApiErrorMessage(error, "Không thể tạo danh sách"));
    }
  };

  const handleSaveBoard = async (
    boardIdToUpdate: string,
    payload: Parameters<typeof updateBoard>[1],
  ) => {
    if (!payload.name?.trim()) {
      toast.error("Tên bảng không được để trống");
      return;
    }

    try {
      const updatedBoard = await updateBoard(boardIdToUpdate, payload);
      setBoard(updatedBoard);
      toast.success("Đã cập nhật bảng");
      emitBoardUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật bảng"));
    }
  };

  const handleDeleteBoard = async (boardToDelete: BoardDetails) => {
    try {
      await deleteTaskListsByBoardId(boardToDelete.id);
      await deleteBoard(boardToDelete.id);
      toast.success("Đã xóa bảng");
      router.push("/projects");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa bảng"));
    }
  };

  const handleSaveTaskList = async (list: BoardTaskList, nextName: string) => {
    if (!nextName.trim()) {
      toast.error("Tên danh sách không được để trống");
      return;
    }

    try {
      const updatedList = await updateTaskList(list.id, { name: nextName.trim() });
      setTaskLists((current) => replaceTaskList(current, updatedList));
      if (selectedTask?.listId === list.id) {
        setSelectedTask((current) =>
          current
            ? {
              ...current,
              listName: updatedList.name,
            }
            : current,
        );
      }
      toast.success("Đã cập nhật danh sách");
      emitBoardUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật danh sách"));
    }
  };

  const handleDeleteTaskList = async (list: BoardTaskList) => {
    try {
      await deleteTaskList(list.id);
      setTaskLists((current) => removeTaskList(current, list.id));
      if (selectedTask?.listId === list.id) {
        setSelectedTask(null);
      }
      toast.success("Đã xóa danh sách");
      emitBoardUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa danh sách"));
    }
  };

  const handleCreateTask = async (list: BoardTaskList, title: string) => {
    const targetList = taskLists.find((item) => item.id === list.id);

    if (!targetList) {
      toast.error("Không tìm thấy danh sách để tạo task");
      return;
    }

    const optimisticTask: BoardTask = {
      id: createTempId("task"),
      title,
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      position: (targetList.tasks.at(-1)?.position || 0) + 1000,
      archived: false,
      attachmentCount: 0,
      commentCount: 0,
      checklistCount: 0,
    };

    setTaskLists((current) => replaceTask(current, targetList.id, optimisticTask));

    try {
      const createdTask = await createTask({
        taskListId: targetList.id,
        title,
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
        position: optimisticTask.position || 1000,
        archived: false,
      });

      setTaskLists((current) =>
        current.map((taskList) => {
          if (taskList.id !== targetList.id) {
            return taskList;
          }

          let replaced = false;
          const nextTasks = taskList.tasks.map((task) => {
            if (task.id === optimisticTask.id) {
              replaced = true;
              return createdTask;
            }

            return task;
          });

          return {
            ...taskList,
            tasks: replaced
              ? sortTasks(nextTasks)
              : taskList.tasks.some((task) => task.id === createdTask.id)
                ? sortTasks(taskList.tasks)
                : sortTasks([...taskList.tasks, createdTask]),
          };
        }),
      );
      emitBoardUpdated();
    } catch (error) {
      setTaskLists((current) => removeTask(current, targetList.id, optimisticTask.id));
      toast.error(getApiErrorMessage(error, "Không thể tạo task"));
    }
  };

  const handleSaveTask = async (
    taskId: string,
    payload: UpdateTaskPayload,
  ) => {
    if (!selectedTask) {
      return;
    }

    try {
      const updatedTask = await updateTask(taskId, payload);
      setTaskLists((current) => replaceTask(current, selectedTask.listId, updatedTask));
      setSelectedTask((current) =>
        current
          ? {
            ...current,
            task: updatedTask,
          }
          : current,
      );
      toast.success("Đã cập nhật task");
      emitBoardUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật task"));
      throw error;
    }
  };

  const handleDeleteTask = async (task: BoardTask) => {
    if (!selectedTask) {
      return;
    }

    try {
      await deleteTask(task.id);
      setTaskLists((current) => removeTask(current, selectedTask.listId, task.id));
      toast.success("Đã xóa task");
      emitBoardUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa task"));
      throw error;
    }
  };

  const handleJoinBoard = async () => {
    if (!board || !userId || joiningBoard) return;
    setJoiningBoard(true);
    try {
      const updatedBoard = await joinBoard(board.id, userId);
      setBoard((current) =>
        current ? { ...current, members: updatedBoard.members } : current,
      );
      toast.success("Bạn đã tham gia board!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tham gia board"));
    } finally {
      setJoiningBoard(false);
    }
  };

  const handleOpenMembers = () => {
    setMembersDialogOpen(true);
  };

  const handleConfirmBoardMembers = async (userIds: string[]) => {
    if (!board) {
      return;
    }

    const workspaceMembers = workspace?.members || [];
    const updatedBoard = await replaceBoardMembers(board.id, { userIds });
    const nextMembers: BoardMemberSummary[] = (updatedBoard.members || []).map(
      (member) => {
        const workspaceMember = workspaceMembers.find(
          (item) => item.userId === member.userId,
        );

        return {
          ...member,
          id: member.id || member.userId,
          userId: member.userId,
          fullName: workspaceMember?.fullName,
          email: workspaceMember?.email,
        };
      },
    );

    setBoard({
      ...updatedBoard,
      members: nextMembers,
    });

    toast.success(
      "Đã cập nhật danh sách thành viên trên giao diện. Bước tiếp theo là nối board-service và notification-service.",
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const dragId = String(event.active.id);
    const dragType =
      event.active.data.current?.type === "taskList" ? "taskList" : "task";

    setActiveDragId(dragId);
    setActiveDragType(dragType);
    activeDragTypeRef.current = dragType;
    emitDragStart(dragId, dragType);
  };

  const handleDragCancel = () => {
    if (activeDragId) {
      emitDragEnd(activeDragId, activeDragTypeRef.current, null);
      clearDragState();
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const dragType =
      event.active.data.current?.type === "taskList" ? "taskList" : "task";

    if (!activeDragId || dragType !== "task" || !event.over) {
      setTempDropTarget(null);
      return;
    }

    const overId = String(event.over.id);
    let targetTaskListId: string | undefined;
    let insertPosition = 0;

    if (overId.startsWith("task:")) {
      targetTaskListId = event.over.data.current?.taskListId as string | undefined;
      const targetTaskList = taskLists.find((list) => list.id === targetTaskListId);
      const targetTaskId = parseDragEntityId(overId);
      const targetIndex =
        targetTaskList?.tasks.findIndex((task) => task.id === targetTaskId) ?? 0;
      const targetMiddleY = event.over.rect.top + event.over.rect.height / 2;
      const isBelowTarget = pointerRef.current.y > targetMiddleY;

      insertPosition = targetIndex + (isBelowTarget ? 1 : 0);
    } else if (overId.startsWith("taskList:")) {
      targetTaskListId =
        (event.over.data.current?.taskListId as string | undefined) ||
        parseDragEntityId(overId);
      const targetTaskList = taskLists.find((list) => list.id === targetTaskListId);
      insertPosition =
        tempDropTarget?.taskListId === targetTaskListId
          ? tempDropTarget.position
          : targetTaskList?.tasks.length ?? 0;
    }

    if (!targetTaskListId) {
      setTempDropTarget(null);
      return;
    }

    setTempDropTarget({
      taskListId: targetTaskListId,
      position: insertPosition,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const currentActiveId = String(event.active.id);
    const overId = event.over?.id != null ? String(event.over.id) : null;
    const previousLists = taskLists;
    const dragType =
      event.active.data.current?.type === "taskList" ? "taskList" : "task";

    emitDragEnd(currentActiveId, dragType, overId);

    try {
      if (
        dragType === "taskList" &&
        overId &&
        overId.startsWith("taskList:")
      ) {
        const nextLists = moveTaskList(
          previousLists,
          parseDragEntityId(currentActiveId),
          parseDragEntityId(overId),
        );

        setTaskLists(nextLists);
        await persistTaskListPositions(previousLists, nextLists);
        emitBoardUpdated();
      }

      if (dragType === "task") {
        const sourceTaskListId = event.active.data.current?.taskListId as string | undefined;
        const targetTaskListId =
          tempDropTarget?.taskListId ||
          ((event.over?.data.current?.taskListId as string | undefined) ??
            (overId?.startsWith("taskList:") ? parseDragEntityId(overId) : undefined));

        if (sourceTaskListId && targetTaskListId) {
          const nextLists =
            sourceTaskListId === targetTaskListId
              ? moveTaskWithinList(previousLists, {
                taskId: parseDragEntityId(currentActiveId),
                taskListId: sourceTaskListId,
                overTaskId: overId?.startsWith("task:")
                  ? parseDragEntityId(overId)
                  : null,
              })
              : moveTaskToPosition(previousLists, {
                taskId: parseDragEntityId(currentActiveId),
                sourceListId: sourceTaskListId,
                targetListId: targetTaskListId,
                targetIndex:
                  tempDropTarget?.position ??
                  (overId?.startsWith("task:")
                    ? taskLists
                      .find((list) => list.id === targetTaskListId)
                      ?.tasks.findIndex((task) => createTaskDragId(task.id) === overId) ?? 0
                    : taskLists.find((list) => list.id === targetTaskListId)?.tasks.length ?? 0),
              });

          setTaskLists(nextLists);
          await persistTaskPositions(previousLists, nextLists);
          emitBoardUpdated();
        }
      }
    } catch (error) {
      setTaskLists(previousLists);
      toast.error(getApiErrorMessage(error, "Không thể lưu thay đổi kéo thả"));
    } finally {
      clearDragState();
    }
  };

  if (loading && !board) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-100 text-slate-700">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center text-slate-700">
        <h1 className="text-xl font-bold text-slate-900">Không tải được board</h1>
        <p className="max-w-md text-sm text-slate-600">
          {loadError || "Board này chưa có dữ liệu từ API thật."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Về workspace
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-[calc(100vh-4rem)] w-full min-w-0 overflow-hidden">
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/74 via-slate-100/58 to-white/68" />

        <div className="relative flex min-h-[calc(100vh-4rem)] w-full min-w-0 flex-col">
          <BoardHeader
            board={board}
            currentUserId={userId}
            onOpenBoardSettings={() => setBoardSettingsOpen(true)}
            onOpenMembers={handleOpenMembers}
            onJoinBoard={() => void handleJoinBoard()}
            joiningBoard={joiningBoard}
          />

          <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden px-6 py-6">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
              onDragOver={handleDragOver}
              onDragEnd={(event) => void handleDragEnd(event)}
              collisionDetection={pointerWithin}
            >
              <SortableContext
                items={taskLists.map((list) => createTaskListDragId(list.id))}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex min-h-full items-start gap-4 pb-6">
                  {taskLists.map((taskList) => (
                    <BoardTaskListColumn
                      key={taskList.id}
                      list={taskList}
                      onOpenTask={(task) =>
                        setSelectedTask({
                          listId: taskList.id,
                          task,
                          listName: taskList.name,
                        })
                      }
                      onCreateTask={handleCreateTask}
                      onOpenListSettings={(list) => setSelectedTaskList(list)}
                      tempDropPosition={
                        tempDropTarget?.taskListId === taskList.id
                          ? tempDropTarget.position
                          : null
                      }
                      activeDragId={activeDragId}
                      activeTask={activeDragType === "task" ? activeTask : null}
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
              </SortableContext>

              <DragOverlay>
                {activeDragType === "task" && activeTask ? (
                  <BoardTaskCardPreview task={activeTask} />
                ) : null}
                {activeDragType === "taskList" && activeTaskList ? (
                  <BoardTaskListPreview list={activeTaskList} />
                ) : null}
              </DragOverlay>

              <RemoteDragOverlay remoteDrags={remoteDrags} taskLists={taskLists} />
            </DndContext>
          </div>

          <div className="hidden pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
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
        open={Boolean(selectedTask)}
        task={selectedTask?.task || null}
        listName={selectedTask?.listName}
        boardMembers={enrichedBoardMembers}
        onClose={() => setSelectedTask(null)}
        onSave={(taskId, payload) => handleSaveTask(taskId, payload)}
        onDelete={(task) => handleDeleteTask(task)}
      />
      <BoardMembersDialog
        open={membersDialogOpen}
        boardName={board.name}
        boardMembers={enrichedBoardMembers}
        workspaceMembers={workspace?.members || []}
        ownerId={board.ownerId || undefined}
        onClose={() => setMembersDialogOpen(false)}
        onConfirm={async (userIds) => {
          try {
            await handleConfirmBoardMembers(userIds);
          } catch (error) {
            toast.error(
              getApiErrorMessage(error, "Không thể cập nhật thành viên của bảng"),
            );
            throw error;
          }
        }}
      />
      <BoardSettingsDialog
        board={boardSettingsOpen ? board : null}
        onClose={() => setBoardSettingsOpen(false)}
        onSave={(boardIdToUpdate, payload) => handleSaveBoard(boardIdToUpdate, payload)}
        onDelete={(boardToDelete) => handleDeleteBoard(boardToDelete)}
      />
      <TaskListSettingsDialog
        taskList={selectedTaskList}
        onClose={() => setSelectedTaskList(null)}
        onSave={(taskList, nextName) => handleSaveTaskList(taskList, nextName)}
        onDelete={(taskList) => handleDeleteTaskList(taskList)}
      />
      <BoardAiAssistant
        boardId={board.id}
        boardName={board.name}
        workspaceId={board.workspaceId}
      />
    </>
  );
}
