import type { BoardTask, BoardTaskList } from "@/lib/api/task";

export const POSITION_GAP = 1000;
export const TASK_DRAG_PREFIX = "task:";
export const TASK_LIST_DRAG_PREFIX = "taskList:";

export function createTaskDragId(taskId: string) {
  return `${TASK_DRAG_PREFIX}${taskId}`;
}

export function createTaskListDragId(taskListId: string) {
  return `${TASK_LIST_DRAG_PREFIX}${taskListId}`;
}

export function parseDragEntityId(dragId: string) {
  if (dragId.startsWith(TASK_DRAG_PREFIX)) {
    return dragId.slice(TASK_DRAG_PREFIX.length);
  }

  if (dragId.startsWith(TASK_LIST_DRAG_PREFIX)) {
    return dragId.slice(TASK_LIST_DRAG_PREFIX.length);
  }

  return dragId;
}

function cloneTask(task: BoardTask): BoardTask {
  return { ...task };
}

function cloneTaskList(list: BoardTaskList): BoardTaskList {
  return {
    ...list,
    tasks: list.tasks.map(cloneTask),
  };
}

function arrayMoveLocal<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function sortTasks(tasks: BoardTask[]) {
  return [...tasks].sort((left, right) => (left.position || 0) - (right.position || 0));
}

export function sortTaskLists(lists: BoardTaskList[]) {
  return [...lists].sort((left, right) => (left.position || 0) - (right.position || 0));
}

export function normalizeTaskPositions(tasks: BoardTask[]) {
  return tasks.map((task, index) => ({
    ...task,
    position: (index + 1) * POSITION_GAP,
  }));
}

export function normalizeTaskListPositions(lists: BoardTaskList[]) {
  return lists.map((list, index) => ({
    ...list,
    position: (index + 1) * POSITION_GAP,
  }));
}

export function moveTaskList(
  lists: BoardTaskList[],
  activeListId: string,
  overListId: string,
) {
  const ordered = sortTaskLists(lists).map(cloneTaskList);
  const activeIndex = ordered.findIndex((list) => list.id === activeListId);
  const overIndex = ordered.findIndex((list) => list.id === overListId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return ordered;
  }

  return normalizeTaskListPositions(arrayMoveLocal(ordered, activeIndex, overIndex));
}

export function moveTaskToPosition(
  lists: BoardTaskList[],
  options: {
    taskId: string;
    sourceListId: string;
    targetListId: string;
    targetIndex: number;
  },
) {
  const nextLists = sortTaskLists(lists).map(cloneTaskList);
  const sourceList = nextLists.find((list) => list.id === options.sourceListId);
  const targetList = nextLists.find((list) => list.id === options.targetListId);

  if (!sourceList || !targetList) {
    return nextLists;
  }

  const sourceIndex = sourceList.tasks.findIndex((task) => task.id === options.taskId);
  if (sourceIndex === -1) {
    return nextLists;
  }

  const [movedTask] = sourceList.tasks.splice(sourceIndex, 1);
  const adjustedTargetIndex =
    sourceList.id === targetList.id && sourceIndex < options.targetIndex
      ? options.targetIndex - 1
      : options.targetIndex;
  const nextTargetIndex = Math.max(
    0,
    Math.min(adjustedTargetIndex, targetList.tasks.length),
  );
  targetList.tasks.splice(nextTargetIndex, 0, movedTask);

  sourceList.tasks = normalizeTaskPositions(sourceList.tasks);
  if (sourceList.id === targetList.id) {
    targetList.tasks = normalizeTaskPositions(targetList.tasks);
  } else {
    targetList.tasks = normalizeTaskPositions(targetList.tasks);
  }

  return nextLists;
}

export function moveTaskWithinList(
  lists: BoardTaskList[],
  options: {
    taskId: string;
    taskListId: string;
    overTaskId?: string | null;
  },
) {
  return sortTaskLists(lists).map((list) => {
    const clonedList = cloneTaskList(list);

    if (clonedList.id !== options.taskListId) {
      return clonedList;
    }

    const orderedTasks = sortTasks(clonedList.tasks);
    const activeIndex = orderedTasks.findIndex((task) => task.id === options.taskId);
    if (activeIndex === -1) {
      return clonedList;
    }

    const overIndex = options.overTaskId
      ? orderedTasks.findIndex((task) => task.id === options.overTaskId)
      : orderedTasks.length - 1;

    if (overIndex === -1 || overIndex === activeIndex) {
      return {
        ...clonedList,
        tasks: normalizeTaskPositions(orderedTasks),
      };
    }

    return {
      ...clonedList,
      tasks: normalizeTaskPositions(
        arrayMoveLocal(orderedTasks, activeIndex, overIndex),
      ),
    };
  });
}

export function replaceTaskList(
  lists: BoardTaskList[],
  nextList: BoardTaskList,
) {
  const exists = lists.some((list) => list.id === nextList.id);
  const merged = exists
    ? lists.map((list) => (list.id === nextList.id ? cloneTaskList(nextList) : cloneTaskList(list)))
    : [...lists.map(cloneTaskList), cloneTaskList(nextList)];

  return sortTaskLists(merged);
}

export function removeTaskList(
  lists: BoardTaskList[],
  taskListId: string,
) {
  return sortTaskLists(
    lists
      .filter((list) => list.id !== taskListId)
      .map(cloneTaskList),
  );
}

export function replaceTask(
  lists: BoardTaskList[],
  taskListId: string,
  nextTask: BoardTask,
) {
  return lists.map((list) => {
    if (list.id !== taskListId) {
      return cloneTaskList(list);
    }

    const exists = list.tasks.some((task) => task.id === nextTask.id);
    const nextTasks = exists
      ? list.tasks.map((task) => (task.id === nextTask.id ? cloneTask(nextTask) : cloneTask(task)))
      : [...list.tasks.map(cloneTask), cloneTask(nextTask)];

    return {
      ...list,
      tasks: sortTasks(nextTasks),
    };
  });
}

export function removeTask(
  lists: BoardTaskList[],
  taskListId: string,
  taskId: string,
) {
  return lists.map((list) => {
    if (list.id !== taskListId) {
      return cloneTaskList(list);
    }

    return {
      ...list,
      tasks: normalizeTaskPositions(
        list.tasks
          .filter((task) => task.id !== taskId)
          .map(cloneTask),
      ),
    };
  });
}
