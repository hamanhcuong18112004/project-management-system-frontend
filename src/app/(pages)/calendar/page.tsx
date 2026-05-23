"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useCalendarTask } from "@/hooks/useCalendarTask";
import { BoardTaskDialog } from "@/components/pages/board";
import { type BoardTask } from "@/lib/api/task";
import { format, differenceInCalendarDays } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/lib/stores/useAuthStore";

const PRIORITY_COLORS = {
  URGENT: "#e11d48", // rose-600
  HIGH: "#f97316",   // orange-500
  MEDIUM: "#3b82f6", // blue-500
  LOW: "#22c55e",    // green-500
};

export default function CalendarPage() {
  const {
    tasks,
    loading,
    currentDate,
    nextMonth,
    prevMonth,
    goToToday,
    handleUpdateTask,
    handleDeleteTask,
  } = useCalendarTask();

  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  const user = useAuthStore((state) => state.user);

  const events = tasks
    .filter((task) => {
      // Yêu cầu 1: lịch của ai hiện của người đó (là thành viên trong task thì hiển thị)
      if (!user?.id) return false;
      const isMember = task.assigneeIds && task.assigneeIds.includes(user.id);
      return task.dueDate && isMember;
    })
    .map((task) => {
      // Yêu cầu 2: nếu thời gian của task dài 2 ngày hoặc hơn thì task sẽ được nối dài ra 2 ô từ ngày tạo đến ngày kết thúc
      let start = task.dueDate!;
      let end: string | undefined = undefined;

      if (task.createdAt && task.dueDate) {
        const startDate = new Date(task.createdAt);
        const endDate = new Date(task.dueDate);
        const diffDays = differenceInCalendarDays(endDate, startDate) + 1;
        if (diffDays >= 2) {
          start = task.createdAt;
          end = task.dueDate;
        }
      }

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        className: `priority-${(task.priority || "MEDIUM").toLowerCase()} ${task.status === "DONE" ? "task-done" : ""}`,
        extendedProps: { ...task },
        editable: true, // Enable dragging for individual events
      };
    });

  const handleEventClick = (info: any) => {
    setSelectedTask(info.event.extendedProps);
  };

  const handleEventDrop = async (info: any) => {
    const task = info.event.extendedProps as BoardTask;
    const newDate = info.event.start;
    
    if (!newDate) return;

    try {
      // Keep the original time if possible, or use the new date's time
      const formattedDate = format(newDate, "yyyy-MM-dd'T'HH:mm:ss");
      await handleUpdateTask(task.id, { dueDate: formattedDate });
    } catch (error) {
      info.revert(); // Undo UI change if API fails
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { title, dueDate, priority, status } = eventInfo.event.extendedProps;
    const timeStr = dueDate ? format(new Date(dueDate), "HH:mm") : "";
    const isDone = status === "DONE";
    
    // Choose icon based on status then priority
    const statusIcon = isDone ? "✅" : (priority === "URGENT" ? "🔥" : priority === "HIGH" ? "⚡" : "•");

    return (
      <div className={`flex h-full w-full flex-col justify-center overflow-hidden px-2 py-1 leading-tight text-white ${isDone ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-1 opacity-90">
          <span className="text-[9px] font-black uppercase tracking-tighter">
            {timeStr}
          </span>
          <span className="text-[10px]">{statusIcon}</span>
        </div>
        <div className={`truncate text-[11px] font-extrabold leading-none tracking-tight ${isDone ? "line-through decoration-white/50" : ""}`}>
          {title}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 p-4 lg:p-8 overflow-hidden font-sans">
      {/* Header */}
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200">
            <CalendarIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Lịch Công Việc</h1>
            <p className="text-sm font-medium text-slate-500 italic">Quản lý tiến độ - Nâng tầm hiệu suất</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg border border-slate-100">
          <button
            onClick={prevMonth}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-[150px] text-center font-bold text-slate-800 px-2 capitalize text-lg">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </div>
          <button
            onClick={nextMonth}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            <ChevronRight size={20} />
          </button>
          <div className="mx-2 h-6 w-px bg-slate-100" />
          <button
            onClick={goToToday}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-xl shadow-md"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="relative flex-1 min-h-0 rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        )}

        <div className="h-full calendar-container">
          <FullCalendar
            key={tasks.length}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={events}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventDrop={handleEventDrop} // Handle drag and drop
            editable={true} // Enable editing/dragging
            height="100%"
            locale="vi"
            dayMaxEvents={3}
            dayHeaderClassNames="calendar-header-cell"
          />
        </div>
      </div>

      {/* Task Dialog */}
      <BoardTaskDialog
        open={!!selectedTask}
        task={selectedTask}
        listName={selectedTask?.taskListName || "Calendar"}
        onClose={() => setSelectedTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <style jsx global>{`
        .calendar-container .fc {
          --fc-border-color: #f1f5f9;
          --fc-today-bg-color: #f8fafc;
          font-family: inherit;
          border: none;
        }
        
        .calendar-header-cell {
          background: #f1f5f9;
          padding: 12px 0 !important;
          border: none !important;
        }

        .calendar-header-cell .fc-col-header-cell-cushion {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          text-decoration: none !important;
        }

        .calendar-container .fc-daygrid-day-number {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          padding: 10px 14px !important;
          text-decoration: none !important;
        }

        .calendar-container .fc-day-today {
          background-color: #eff6ff !important;
        }

        .calendar-container .fc-event {
          margin: 1px 3px !important;
          border-radius: 8px !important;
          border: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
        }

        .calendar-container .fc-event-main {
          padding: 0 !important;
          color: white !important;
        }

        /* Priority Colors */
        .priority-urgent { background-color: #e11d48 !important; }
        .priority-high { background-color: #f97316 !important; }
        .priority-medium { background-color: #3b82f6 !important; }
        .priority-low { background-color: #16a34a !important; }

        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th {
          border-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
