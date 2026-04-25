import type { BoardTask } from "@/lib/api/task";

export function isTaskOverdue(
  task: Pick<BoardTask, "dueDate" | "status">,
  now: Date = new Date(),
) {
  if (!task.dueDate || task.status === "DONE") {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}
