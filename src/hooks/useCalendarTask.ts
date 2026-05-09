"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getCalendarTasks, type BoardTask, type UpdateTaskPayload, updateTask, deleteTask } from "@/lib/api/task";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

export function useCalendarTask() {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const month = useMemo(() => currentDate.getMonth() + 1, [currentDate]);
  const year = useMemo(() => currentDate.getFullYear(), [currentDate]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    console.log(`🔍 Fetching tasks for ${month}/${year}...`);
    try {
      const data = await getCalendarTasks(month, year);
      console.log(`✅ API Response for ${month}/${year}:`, data);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch calendar tasks:", error);
      toast.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const nextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleUpdateTask = async (taskId: string, payload: UpdateTaskPayload) => {
    try {
      const updatedTask = await updateTask(taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      toast.success("Đã cập nhật công việc");
      return updatedTask;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Không thể cập nhật công việc";
      toast.error(msg);
      throw error;
    }
  };

  const handleDeleteTask = async (task: BoardTask) => {
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Đã xóa công việc");
    } catch (error) {
      toast.error("Không thể xóa công việc");
      throw error;
    }
  };

  return {
    tasks,
    loading,
    currentDate,
    nextMonth,
    prevMonth,
    goToToday,
    handleUpdateTask,
    handleDeleteTask,
    refresh: fetchTasks
  };
}
