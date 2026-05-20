"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useCalendarTask } from "@/hooks/useCalendarTask";
import { BoardTaskDialog } from "@/components/pages/board";
import { type BoardTask } from "@/lib/api/task";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { parseServerDate } from "@/lib/helper/formatTime";

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

  const events = tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: parseServerDate(task.dueDate!).toISOString(),
      className: `priority-${(task.priority || "MEDIUM").toLowerCase()} ${task.status === "DONE" ? "task-done" : ""}`,
      extendedProps: { ...task },
      editable: true,
    }));

  const handleEventClick = (info: any) => {
    setSelectedTask(info.event.extendedProps);
  };

  const handleEventDrop = async (info: any) => {
    const task = info.event.extendedProps as BoardTask;
    const newDate = info.event.start;
    
    if (!newDate) return;

    try {
      const formattedDate = format(newDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      await handleUpdateTask(task.id, { dueDate: formattedDate });
    } catch (error) {
      info.revert();
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { title, dueDate, priority, status } = eventInfo.event.extendedProps;
    const timeStr = dueDate ? format(parseServerDate(dueDate), "HH:mm") : "";
    const isDone = status === "DONE";
    
    const statusIcon = isDone ? "✅" : (priority === "URGENT" ? "🔥" : (priority === "HIGHEST" || priority === "HIGH") ? "⚡" : "•");

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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={26} />
            Lịch Công Việc
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tiến độ - Nâng tầm hiệu suất
          </p>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200">
          <button
            onClick={prevMonth}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-[150px] text-center font-bold text-slate-800 px-2 capitalize text-sm md:text-base">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </div>
          <button
            onClick={nextMonth}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            <ChevronRight size={20} />
          </button>
          <div className="mx-2 h-6 w-px bg-slate-200" />
          <button
            onClick={goToToday}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-xl shadow-sm"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4 min-h-[600px] h-[calc(100vh-240px)]">
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
            eventDrop={handleEventDrop}
            editable={true}
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
        onSave={async (id, payload) => {
          await handleUpdateTask(id, payload);
        }}
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
          background: #f8fafc;
          padding: 10px 0 !important;
          border: none !important;
        }

        .calendar-header-cell .fc-col-header-cell-cushion {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          text-decoration: none !important;
        }

        .calendar-container .fc-daygrid-day-number {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          padding: 8px 12px !important;
          text-decoration: none !important;
        }

        .calendar-container .fc-day-today {
          background-color: #eff6ff !important;
        }

        .calendar-container .fc-event {
          margin: 1px 3px !important;
          border-radius: 6px !important;
          border: none !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          cursor: pointer;
        }

        .calendar-container .fc-event-main {
          padding: 0 !important;
          color: white !important;
        }

        /* Priority Colors */
        .priority-urgent { background-color: #e11d48 !important; }
        .priority-highest { background-color: #f97316 !important; }
        .priority-high { background-color: #fbbf24 !important; }
        .priority-medium { background-color: #3b82f6 !important; }
        .priority-low { background-color: #16a34a !important; }
        .priority-lowest { background-color: #6366f1 !important; }
        .priority-none { background-color: #94a3b8 !important; }

        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th {
          border-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
