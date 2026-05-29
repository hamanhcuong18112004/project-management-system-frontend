"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback, type ReactNode } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/Dialog";
import { format, isAfter, isBefore, isValid, startOfDay, parse } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  AlignLeft, 
  CalendarDays, 
  CheckSquare, 
  Clock, 
  Flag, 
  MessageSquare, 
  MoreHorizontal, 
  Paperclip, 
  Plus, 
  Trash2, 
  User, 
  X,
  Loader2,
  Search,
  UserMinus,
  Users,
  FolderKanban,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Upload,
  CheckCircle2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link,
  Image,
  Smile,
  Info
} from "lucide-react";

import type { TaskPriority, TaskAttachment, BoardTask, UpdateTaskPayload } from "@/lib/api/task";
import type { BoardMemberSummary } from "@/lib/api/board";
import { TaskComments } from "./TaskComments";
import { TaskChecklists } from "./TaskChecklists";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { parseServerDate } from "@/lib/helper/formatTime";
import { getUsersProfiles } from "@/lib/api/auth";
import type { UserData } from "@/lib/api/auth";
import { uploadTaskAttachment, deleteTaskAttachment, assignTaskMember, getTaskAttachments, getTaskMembers, unassignTaskMember } from "@/lib/api/task";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import { useRealtime } from "@/providers/RealtimeProvider";


export type TaskDialogMode = "detail" | "comment";

export interface TaskFieldRowProps {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export interface UsePremiumDatePickerParams {
  dueDateStr: string;
  dueTimeStr: string;
  hasStartDate: boolean;
  startDateStr: string;
  initialRecurrence?: string;
  onSaveDatePicker: (
    hasDueDate: boolean,
    dueDateStr: string,
    dueTimeStr: string,
    isAllDay: boolean,
    recurrence: string
  ) => void;
  onClearDatePicker: () => void;
}

export function usePremiumDatePicker({
  dueDateStr,
  dueTimeStr,
  hasStartDate,
  startDateStr,
  initialRecurrence,
  onSaveDatePicker,
  onClearDatePicker,
}: UsePremiumDatePickerParams) {
  const [activeDatePickerOpen, setActiveDatePickerOpen] = useState(false);
  const [pickerStartDate, setPickerStartDate] = useState<string | null>(null);
  const [pickerHasStartDate, setPickerHasStartDate] = useState(false);
  const [pickerDueDate, setPickerDueDate] = useState<string | null>(null);
  const [pickerHasDueDate, setPickerHasDueDate] = useState(false);
  const [pickerDueTime, setPickerDueTime] = useState("17:30");
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerRecurrence, setPickerRecurrence] = useState(initialRecurrence || "Không bao giờ");
  const [pickerReminder, setPickerReminder] = useState("1 Ngày trước");

  const handleMonthNav = (offset: number) => {
    let nextMonth = pickerMonth + offset;
    let nextYear = pickerYear;

    if (nextMonth < 0) {
      nextYear += Math.floor(nextMonth / 12);
      nextMonth = ((nextMonth % 12) + 12) % 12;
    } else if (nextMonth > 11) {
      nextYear += Math.floor(nextMonth / 12);
      nextMonth = nextMonth % 12;
    }

    setPickerMonth(nextMonth);
    setPickerYear(nextYear);
  };

  const handleDayClick = (date: Date) => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const clickedDateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (clickedDateMidnight.getTime() < todayMidnight.getTime()) {
      toast.error("Không thể chọn ngày trong quá khứ.");
      return;
    }

    const formattedClicked = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
    setPickerDueDate(formattedClicked);
    setPickerHasDueDate(true);
  };

  const handleSavePicker = () => {
    let nextHasDueDate = false;
    let nextDueDateStr = "";
    let nextDueTimeStr = "17:30";
    let nextIsAllDay = false;

    if (pickerHasDueDate && pickerDueDate) {
      nextHasDueDate = true;
      nextDueDateStr = pickerDueDate;
      nextDueTimeStr = pickerDueTime;
      nextIsAllDay = false;
    }

    onSaveDatePicker(nextHasDueDate, nextDueDateStr, nextDueTimeStr, nextIsAllDay, pickerRecurrence);
    setActiveDatePickerOpen(false);
  };

  const handleClearPicker = () => {
    setPickerHasDueDate(false);
    setPickerDueDate(null);
    setActiveDatePickerOpen(false);
    onClearDatePicker();
  };

  const openPicker = () => {
    if (dueDateStr) {
      setPickerHasDueDate(true);
      setPickerDueDate(dueDateStr);
      setPickerDueTime(dueTimeStr);
      const dObj = new Date(dueDateStr);
      if (!isNaN(dObj.getTime())) {
        setPickerMonth(dObj.getMonth());
        setPickerYear(dObj.getFullYear());
      }
    } else {
      setPickerHasDueDate(false);
      setPickerDueDate(null);
      setPickerDueTime("17:30");
      setPickerMonth(new Date().getMonth());
      setPickerYear(new Date().getFullYear());
    }

    if (hasStartDate && startDateStr) {
      setPickerHasStartDate(true);
      setPickerStartDate(startDateStr);
    } else {
      setPickerHasStartDate(false);
      setPickerStartDate(null);
    }
    setActiveDatePickerOpen(true);
  };

  const firstDay = new Date(pickerYear, pickerMonth, 1);
  const startDayIdx = (firstDay.getDay() + 6) % 7;

  const calendarDays: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  const prevMonthLast = new Date(pickerYear, pickerMonth, 0);
  const prevMonthDaysCount = prevMonthLast.getDate();
  for (let i = startDayIdx - 1; i >= 0; i--) {
    const d = new Date(pickerYear, pickerMonth - 1, prevMonthDaysCount - i);
    calendarDays.push({ date: d, isCurrentMonth: false, key: `prev-${d.getDate()}-${i}` });
  }

  const currentMonthLast = new Date(pickerYear, pickerMonth + 1, 0);
  const currentMonthDaysCount = currentMonthLast.getDate();
  for (let i = 1; i <= currentMonthDaysCount; i++) {
    const d = new Date(pickerYear, pickerMonth, i);
    calendarDays.push({ date: d, isCurrentMonth: true, key: `curr-${i}` });
  }

  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(pickerYear, pickerMonth + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false, key: `next-${i}` });
  }

  return {
    activeDatePickerOpen,
    setActiveDatePickerOpen,
    pickerStartDate,
    setPickerStartDate,
    pickerHasStartDate,
    setPickerHasStartDate,
    pickerDueDate,
    setPickerDueDate,
    pickerHasDueDate,
    setPickerHasDueDate,
    pickerDueTime,
    setPickerDueTime,
    pickerMonth,
    setPickerMonth,
    pickerYear,
    setPickerYear,
    pickerRecurrence,
    setPickerRecurrence,
    pickerReminder,
    setPickerReminder,
    handleMonthNav,
    handleDayClick,
    handleSavePicker,
    handleClearPicker,
    openPicker,
    calendarDays,
  };
}

const isSameDayDialog = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isBetweenDialog = (d: Date, start: Date, end: Date) => {
  const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return dTime >= startTime && dTime <= endTime;
};

const formatDateVNDialog = (d: Date) => {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export interface PremiumDatePickerProps {
  hasDueDate: boolean;
  dueDateStr: string;
  dueTimeStr: string;
  isAllDay: boolean;
  status: string;
  hasStartDate: boolean;
  startDateStr: string;
  initialRecurrence?: string;
  effectiveCanUpdate: boolean;
  onSaveDatePicker: (
    hasDueDate: boolean,
    dueDateStr: string,
    dueTimeStr: string,
    isAllDay: boolean,
    recurrence: string
  ) => void;
  onClearDatePicker: () => void;
  onStatusChange: (newStatus: string) => void;
}

export function PremiumDatePicker({
  hasDueDate,
  dueDateStr,
  dueTimeStr,
  isAllDay,
  status,
  hasStartDate,
  startDateStr,
  initialRecurrence,
  effectiveCanUpdate,
  onSaveDatePicker,
  onClearDatePicker,
  onStatusChange,
}: PremiumDatePickerProps) {
  const {
    activeDatePickerOpen,
    setActiveDatePickerOpen,
    pickerStartDate,
    pickerHasStartDate,
    pickerDueDate,
    pickerHasDueDate,
    setPickerHasDueDate,
    pickerDueTime,
    setPickerDueTime,
    pickerMonth,
    pickerYear,
    pickerRecurrence,
    setPickerRecurrence,
    pickerReminder,
    setPickerReminder,
    handleMonthNav,
    handleDayClick,
    handleSavePicker,
    handleClearPicker,
    openPicker,
    calendarDays,
  } = usePremiumDatePicker({
    dueDateStr,
    dueTimeStr,
    hasStartDate,
    startDateStr,
    initialRecurrence,
    onSaveDatePicker,
    onClearDatePicker,
  });

  return (
    <>
      {!hasDueDate ? (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <button
            type="button"
            onClick={openPicker}
            disabled={!effectiveCanUpdate}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30 px-3.5 py-2 text-sm leading-6 font-medium text-slate-700 transition text-left outline-none focus:border-blue-500"
          >
            <CalendarDays size={15} className="text-slate-400 shrink-0" />
            <span>Chọn hạn xử lý</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div
            onClick={openPicker}
            className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 px-3.5 py-2 text-sm text-slate-800 transition cursor-pointer shadow-xs min-h-[40px]"
          >
            <input
              type="checkbox"
              checked={status === "DONE"}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (effectiveCanUpdate) {
                  onStatusChange(e.target.checked ? "DONE" : "TODO");
                }
              }}
              disabled={!effectiveCanUpdate}
              className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 transition shrink-0"
            />

            <span className="text-slate-700 font-medium tracking-wide text-xs">
              {(() => {
                const formatText = (dateStr: string) => {
                  const parts = dateStr.split("-");
                  if (parts.length === 3) {
                    const day = parseInt(parts[2], 10);
                    const month = parseInt(parts[1], 10);
                    return `${day} thg ${month}`;
                  }
                  return dateStr;
                };

                const dueText = formatText(dueDateStr);

                if (hasStartDate && startDateStr) {
                  const startText = formatText(startDateStr);
                  return `${startText} - ${isAllDay ? "0:00" : dueTimeStr} ${dueText}`;
                }
                return `${dueText}${isAllDay ? "" : ` lúc ${dueTimeStr}`}`;
              })()}
            </span>

            {(() => {
              if (status === "DONE") {
                return (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase shrink-0">
                    Hoàn thành
                  </span>
                );
              }

              const now = new Date();
              const dueObj = new Date(`${dueDateStr}T${dueTimeStr || "00:00"}:00`);
              if (!isNaN(dueObj.getTime()) && dueObj.getTime() < now.getTime()) {
                return (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase shrink-0">
                    Quá hạn
                  </span>
                );
              }

              const diff = dueObj.getTime() - now.getTime();
              if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
                return (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase shrink-0">
                    Sắp hết hạn
                  </span>
                );
              }

              return null;
            })()}

            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400 shrink-0"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {effectiveCanUpdate && (
            <button
              type="button"
              onClick={handleClearPicker}
              className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-semibold text-rose-700 transition min-h-[40px] flex items-center justify-center"
            >
              Gỡ bỏ hạn
            </button>
          )}
        </div>
      )}

      {/* Date Picker Overlay */}
      {activeDatePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setActiveDatePickerOpen(false)}
          />

          <div className="relative z-10 w-[304px] rounded-xl bg-white border border-slate-200 p-3 text-slate-800 shadow-2xl">
            <div className="relative mb-3 text-center">
              <span className="text-xs font-semibold text-slate-500">Ngày</span>
              <button
                type="button"
                onClick={() => setActiveDatePickerOpen(false)}
                className="absolute right-0 top-0 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthNav(-12)}
                  className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs font-bold"
                  title="Năm trước"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthNav(-1)}
                  className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs font-bold"
                  title="Tháng trước"
                >
                  ‹
                </button>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Tháng {pickerMonth + 1} {pickerYear}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthNav(1)}
                  className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs font-bold"
                  title="Tháng sau"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthNav(12)}
                  className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs font-bold"
                  title="Năm sau"
                >
                  »
                </button>
              </div>
            </div>

            <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
              <span>Thứ</span>
              <span>Thứ</span>
              <span>Thứ</span>
              <span>Thứ</span>
              <span>Thứ</span>
              <span>Thứ</span>
              <span className="text-[#f15b50]">CN</span>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((cell) => {
                const isSelectedStart =
                  pickerHasStartDate &&
                  pickerStartDate &&
                  isSameDayDialog(cell.date, new Date(pickerStartDate));
                const isSelectedDue =
                  pickerHasDueDate &&
                  pickerDueDate &&
                  isSameDayDialog(cell.date, new Date(pickerDueDate));

                let isInRange = false;
                if (
                  pickerHasStartDate &&
                  pickerStartDate &&
                  pickerHasDueDate &&
                  pickerDueDate
                ) {
                  isInRange = isBetweenDialog(
                    cell.date,
                    new Date(pickerStartDate),
                    new Date(pickerDueDate)
                  );
                }

                const cellDay = cell.date.getDate();
                const now = new Date();
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const cellMidnight = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
                const isPast = cellMidnight.getTime() < todayMidnight.getTime();

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && handleDayClick(cell.date)}
                    className={`h-7 w-7 rounded flex items-center justify-center transition-all ${
                      isPast
                        ? "text-slate-300 opacity-50 cursor-not-allowed"
                        : isSelectedStart || isSelectedDue
                        ? "bg-blue-600 text-white font-bold"
                        : isInRange
                        ? "bg-blue-50 text-blue-600"
                        : cell.isCurrentMonth
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cellDay}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-not-allowed font-semibold text-slate-500">
                  <input
                    type="checkbox"
                    checked={pickerHasStartDate}
                    disabled
                    className="rounded bg-slate-100 border-slate-300 text-slate-400 focus:ring-0 accent-slate-400 cursor-not-allowed"
                  />
                  <span>Ngày bắt đầu</span>
                </label>
                {pickerHasStartDate && (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={
                      pickerStartDate
                        ? formatDateVNDialog(new Date(pickerStartDate))
                        : "--/--/----"
                    }
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-400 outline-none cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-500">
                  <input
                    type="checkbox"
                    checked={pickerHasDueDate}
                    onChange={(e) => setPickerHasDueDate(e.target.checked)}
                    className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0 accent-blue-600"
                  />
                  <span>Ngày hết hạn</span>
                </label>
                {pickerHasDueDate && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        pickerDueDate
                          ? formatDateVNDialog(new Date(pickerDueDate))
                          : "--/--/----"
                      }
                      className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                    <div className="relative w-20">
                      <input
                        type="time"
                        value={pickerDueTime}
                        onChange={(e) => setPickerDueTime(e.target.value)}
                        className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="block font-semibold text-slate-500">Định kỳ</span>
                <select
                  value={pickerRecurrence}
                  onChange={(e) => setPickerRecurrence(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                >
                  <option value="Không bao giờ">Không bao giờ</option>
                  <option value="Hàng ngày">Hàng ngày</option>
                  <option value="Hàng tuần">Hàng tuần</option>
                  <option value="Hàng tháng">Hàng tháng</option>
                  <option value="Hàng năm">Hàng năm</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="block font-semibold text-slate-500">Thiết lập Nhắc nhở</span>
                <select
                  value={pickerReminder}
                  onChange={(e) => setPickerReminder(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                >
                  <option value="Không có">Không có</option>
                  <option value="Vào lúc hạn chót">Vào lúc hạn chót</option>
                  <option value="5 Phút trước">5 Phút trước</option>
                  <option value="15 Phút trước">15 Phút trước</option>
                  <option value="1 Giờ trước">1 Giờ trước</option>
                  <option value="2 Giờ trước">2 Giờ trước</option>
                  <option value="1 Ngày trước">1 Ngày trước</option>
                  <option value="2 Ngày trước">2 Ngày trước</option>
                </select>
                <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                  Nhắc nhở sẽ được gửi đến tất cả các thành viên và người theo dõi thẻ này.
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSavePicker}
                  className="w-full rounded bg-blue-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-blue-500 transition duration-200"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={handleClearPicker}
                  className="w-full rounded bg-slate-100 py-1.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition duration-200"
                >
                  Gỡ bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export interface UseTaskAttachmentsParams {
  taskId: string;
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  onRefreshActivities?: () => void;
}

export function useTaskAttachments({
  taskId,
  setAttachments,
  onRefreshActivities,
}: UseTaskAttachmentsParams) {
  const { emitBoardUpdated } = useRealtime();
  const [uploading, setUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const currentUserId = useAuthStore.getState().user?.id || undefined;
      const uploaded: TaskAttachment[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadTaskAttachment(taskId, file, currentUserId);
        uploaded.push(result);
      }
      setAttachments((prev) => [...uploaded, ...prev]);
      toast.success("Tải lên tài liệu thành công!");
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Lỗi khi tải lên tài liệu.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteTaskAttachment(taskId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Đã xóa tài liệu đính kèm.");
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể xóa tài liệu đính kèm.");
    }
  };

  return {
    uploading,
    fileDragOver,
    setFileDragOver,
    fileInputRef,
    handleFileUpload,
    handleDeleteAttachment,
  };
}

export interface TaskAttachmentsSectionProps {
  taskId: string;
  attachments: TaskAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  attachmentsLoading: boolean;
  readOnly: boolean;
  effectiveCanManageAttachment: boolean;
  effectiveCanDelete?: boolean;
  onRefreshActivities?: () => void;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) return <File size={16} />;
  if (fileType.startsWith("image/")) return <FileImage size={16} className="text-violet-500" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return <FileSpreadsheet size={16} className="text-emerald-600" />;
  if (fileType.includes("pdf")) return <FileText size={16} className="text-rose-500" />;
  if (fileType.includes("word")) return <FileText size={16} className="text-sky-500" />;
  return <File size={16} className="text-slate-500" />;
}

export function TaskAttachmentsSection({
  taskId,
  attachments,
  setAttachments,
  attachmentsLoading,
  readOnly,
  effectiveCanManageAttachment,
  effectiveCanDelete = false,
  onRefreshActivities,
}: TaskAttachmentsSectionProps) {
  const {
    uploading,
    fileDragOver,
    setFileDragOver,
    fileInputRef,
    handleFileUpload,
    handleDeleteAttachment,
  } = useTaskAttachments({
    taskId,
    setAttachments,
    onRefreshActivities,
  });

  return (
    <div className="py-4">
      <TaskFieldRow
        label="Tài liệu đính kèm"
        icon={<Paperclip size={15} />}
        rightAction={
          !readOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 size={12} className="animate-spin text-slate-400" /> : <Upload size={12} />}
              Tải lên
            </button>
          )
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.ppt,.pptx"
          className="hidden"
          onChange={(e) => void handleFileUpload(e.target.files)}
        />

        {/* Drop zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition ${
            fileDragOver ? "border-sky-400 bg-sky-50" : "border-slate-200"
          } ${attachments.length === 0 && !attachmentsLoading ? "" : "mb-3"}`}
          onDragOver={(e) => {
            if (!effectiveCanManageAttachment) return;
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setFileDragOver(true);
            }
          }}
          onDragLeave={() => setFileDragOver(false)}
          onDrop={(e) => {
            if (!effectiveCanManageAttachment) return;
            e.preventDefault();
            e.stopPropagation();
            setFileDragOver(false);
            void handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => {
            if (effectiveCanManageAttachment) fileInputRef.current?.click();
          }}
          role={effectiveCanManageAttachment ? "button" : undefined}
          tabIndex={effectiveCanManageAttachment ? 0 : -1}
          onKeyDown={(e) => {
            if (effectiveCanManageAttachment && (e.key === "Enter" || e.key === " ")) {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex cursor-pointer flex-col items-center justify-center py-6 text-center">
            {uploading ? (
              <>
                <Loader2 size={20} className="mb-2 animate-spin text-sky-500" />
                <p className="text-xs text-sky-600 font-medium">Đang tải lên...</p>
              </>
            ) : fileDragOver ? (
              <>
                <Upload size={20} className="mb-2 text-sky-500" />
                <p className="text-xs text-sky-600 font-medium">Thả file vào đây để tải lên</p>
              </>
            ) : (
              <>
                <Upload size={20} className="mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">Kéo thả hoặc nhấn để tải lên tài liệu</p>
                <p className="mt-1 text-[10px] text-slate-300">Hỗ trợ: hình ảnh, PDF, Word, Excel, ZIP, ...</p>
              </>
            )}
          </div>
        </div>

        {/* Attachment list */}
        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((attachment) => {
              const currentUserId = useAuthStore.getState().user?.id;
              const canDeleteThisAttachment =
                effectiveCanManageAttachment &&
                (!attachment.uploadedBy || attachment.uploadedBy === currentUserId);

              return (
                <li
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5"
                >
                  <span className="shrink-0">{getFileIcon(attachment.fileType)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {attachment.fileName || "File đính kèm"}
                    </p>
                    {attachment.fileSize ? (
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(attachment.fileSize)}
                        {attachment.fileType ? ` · ${attachment.fileType.split("/").pop()}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          const toastId = toast.loading("Đang chuẩn bị tải xuống...");
                          try {
                            let downloadUrl = attachment.fileUrl;
                            if (downloadUrl.includes("/uploads/")) {
                              const suffix = downloadUrl.substring(downloadUrl.indexOf("/uploads/"));
                              const baseUrl = apiClient.defaults.baseURL || "http://localhost:8000";
                              downloadUrl = `${baseUrl}/task${suffix}`;
                            }
                            if (typeof window !== "undefined" && window.location.protocol === "https:") {
                              downloadUrl = downloadUrl.replace(/^http:\/\//i, "https://");
                            }
                            console.log("Downloading from rewritten URL:", downloadUrl);

                            const response = await apiClient.get(downloadUrl, {
                              responseType: "blob",
                            });
                            const blob = new Blob([response.data], { type: attachment.fileType || undefined });
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = attachment.fileName || "download";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                            toast.success("Tải xuống thành công!", { id: toastId });
                          } catch (error) {
                            console.error("Lỗi khi tải tệp xuống:", error);
                            let fallbackUrl = attachment.fileUrl;
                            if (fallbackUrl.includes("/uploads/")) {
                              const suffix = fallbackUrl.substring(fallbackUrl.indexOf("/uploads/"));
                              const baseUrl = apiClient.defaults.baseURL || "http://localhost:8000";
                              fallbackUrl = `${baseUrl}/task${suffix}`;
                            }
                            if (typeof window !== "undefined" && window.location.protocol === "https:") {
                              fallbackUrl = fallbackUrl.replace(/^http:\/\//i, "https://");
                            }
                            window.open(fallbackUrl, "_blank");
                            toast.error("Không thể tải tệp xuống trực tiếp. Đã mở trong tab mới.", { id: toastId });
                          }
                        })();
                      }}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                      title="Tải xuống"
                    >
                      <Download size={13} />
                    </button>
                    {canDeleteThisAttachment && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteAttachment(attachment.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Xóa tệp"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TaskFieldRow>
    </div>
  );
}

export interface UseTaskDescriptionParams {
  taskId: string;
  description: string;
  onSaveDescription: (newDesc: string) => Promise<void> | void;
}

export function useTaskDescription({
  taskId,
  description,
  onSaveDescription,
}: UseTaskDescriptionParams) {
  const [localDesc, setLocalDesc] = useState(description);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descBgUrl, setDescBgUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showTtDropdown, setShowTtDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);

  const [activeHeading, setActiveHeading] = useState<string>("div");

  const descEditorRef = useRef<HTMLDivElement>(null);
  const descBgInputRef = useRef<HTMLInputElement>(null);

  // Initialize values
  useEffect(() => {
    setLocalDesc(description);
  }, [description]);

  // Populate editor when entering edit mode
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!editingDesc) {
      initializedRef.current = false;
      return;
    }

    if (!descEditorRef.current) return;

    // tránh set innerHTML nhiều lần gây dính text
    if (initializedRef.current) return;

    let content = localDesc || "";

    if (!content.trim()) {
      content = "<div><br></div>";
    } else if (!content.trim().startsWith("<")) {
      content = `<div>${content}</div>`;
    }

    descEditorRef.current.innerHTML = content;

    initializedRef.current = true;

    try {
      document.execCommand("defaultParagraphSeparator", false, "div");
    } catch {}

    // Focus and place cursor at the end of the text
    setTimeout(() => {
      const el = descEditorRef.current;
      if (el) {
        el.focus();
        if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false); // false collapses the range to the end
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }, 50);
  }, [editingDesc]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBg = localStorage.getItem(`task-desc-bg-${taskId}`);
      setDescBgUrl(savedBg || "");
    }
  }, [taskId]);

  // Close description toolbar dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".desc-toolbar-btn")) {
        setShowTtDropdown(false);
        setShowMoreDropdown(false);
        setShowListDropdown(false);
        setShowEmojiDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Track active heading
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editingDesc && document.activeElement === descEditorRef.current) {
        const format = document.queryCommandValue("formatBlock");
        setActiveHeading(format ? format.toLowerCase() : "div");
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [editingDesc]);

  // Sync contentEditable content to state
  const handleEditorInput = () => {
    if (descEditorRef.current) {
      setLocalDesc(descEditorRef.current.innerHTML);
    }
  };

  // Rich text formatting via execCommand
  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const applyHeading = (level: number) => {
    execFormat("formatBlock", `<H${level}>`);
  };

  const resetHeading = () => {
    execFormat("formatBlock", `<div>`);
  };

  const insertEmoji = (emoji: string) => {
    execFormat("insertText", emoji);
  };

  const handleDescBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    try {
      const attachment = await uploadTaskAttachment(taskId, file);
      if (attachment && attachment.fileUrl) {
        setDescBgUrl(attachment.fileUrl);
        localStorage.setItem(`task-desc-bg-${taskId}`, attachment.fileUrl);
        toast.success("Đã cài đặt ảnh nền cho mô tả!");
      }
    } catch {
      toast.error("Không thể tải lên ảnh làm hình nền.");
    } finally {
      if (descBgInputRef.current) descBgInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const content = descEditorRef.current?.innerHTML || "";

      // normalize tránh append html cũ
      const normalized = content.trim();

      await onSaveDescription(normalized);

      setLocalDesc(normalized);

      initializedRef.current = false;
      setEditingDesc(false);
    } catch {
      toast.error("Lỗi khi lưu mô tả.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    localDesc,
    setLocalDesc,
    editingDesc,
    setEditingDesc,
    descBgUrl,
    setDescBgUrl,
    submitting,
    activeHeading,
    showTtDropdown,
    setShowTtDropdown,
    showMoreDropdown,
    setShowMoreDropdown,
    showListDropdown,
    setShowListDropdown,
    showEmojiDropdown,
    setShowEmojiDropdown,
    descEditorRef,
    descBgInputRef,
    execFormat,
    applyHeading,
    resetHeading,
    insertEmoji,
    handleEditorInput,
    handleDescBgUpload,
    handleSave,
  };
}

export function TaskFieldRow({
  label,
  icon,
  children,
  rightAction,
}: TaskFieldRowProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        {rightAction && <div className="font-normal">{rightAction}</div>}
      </div>
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}

/* Scoped styles for the rich text editor headings, code, and selection highlight */
const EDITOR_STYLES = `
  .desc-rich-editor h1 { font-size: 28px; font-weight: 800; margin: 4px 0; }
  .desc-rich-editor h2 { font-size: 24px; font-weight: 700; margin: 4px 0; }
  .desc-rich-editor h3 { font-size: 20px; font-weight: 700; margin: 4px 0; }
  .desc-rich-editor h4 { font-size: 18px; font-weight: 700; margin: 4px 0; }
  .desc-rich-editor h5 { font-size: 16px; font-weight: 600; margin: 4px 0; }
  .desc-rich-editor h6 { font-size: 14px; font-weight: 600; margin: 4px 0; }
  .desc-rich-editor code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
  .desc-rich-editor ul { list-style: disc; padding-left: 1.5em; }
  .desc-rich-editor ol { list-style: decimal; padding-left: 1.5em; }
  .desc-rich-editor strike, .desc-rich-editor s, .desc-rich-editor del { text-decoration: line-through !important; }
  .desc-rich-editor a { color: #2563eb; text-decoration: underline; }
  .desc-rich-editor ::selection { background: #93c5fd; color: #0f172a; }
  .desc-rich-view h1 { font-size: 28px; font-weight: 800; margin: 4px 0; }
  .desc-rich-view h2 { font-size: 24px; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h3 { font-size: 20px; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h4 { font-size: 18px; font-weight: 700; margin: 4px 0; }
  .desc-rich-view h5 { font-size: 16px; font-weight: 600; margin: 4px 0; }
  .desc-rich-view h6 { font-size: 14px; font-weight: 600; margin: 4px 0; }
  .desc-rich-view code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
  .desc-rich-view ul { list-style: disc; padding-left: 1.5em; }
  .desc-rich-view ol { list-style: decimal; padding-left: 1.5em; }
  .desc-rich-view strike, .desc-rich-view s, .desc-rich-view del { text-decoration: line-through !important; }
  .desc-rich-view a { color: #2563eb; text-decoration: underline; }
`;

export interface TaskDescriptionProps {
  taskId: string;
  description: string;
  effectiveCanUpdate: boolean;
  onSaveDescription: (newDesc: string) => Promise<void> | void;
}

export function TaskDescription({
  taskId,
  description,
  effectiveCanUpdate,
  onSaveDescription,
}: TaskDescriptionProps) {
  const {
    localDesc,
    setLocalDesc,
    editingDesc,
    setEditingDesc,
    descBgUrl,
    setDescBgUrl,
    submitting,
    activeHeading,
    showTtDropdown,
    setShowTtDropdown,
    showMoreDropdown,
    setShowMoreDropdown,
    showListDropdown,
    setShowListDropdown,
    showEmojiDropdown,
    setShowEmojiDropdown,
    descEditorRef,
    descBgInputRef,
    execFormat,
    applyHeading,
    resetHeading,
    insertEmoji,
    handleEditorInput,
    handleDescBgUpload,
    handleSave,
  } = useTaskDescription({
    taskId,
    description,
    onSaveDescription,
  });

  const ttBtnRef = React.useRef<HTMLDivElement>(null);

  // Check if description has any real text content
  const hasDescription = (() => {
    if (!localDesc) return false;
    return localDesc
      .replace(/<[^>]*>?/gm, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0;
  })();

  return (
    <div className={editingDesc ? "relative z-20" : ""}>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
      <TaskFieldRow label="Mô tả" icon={<AlignLeft size={15} />}>
        <input
          type="file"
          ref={descBgInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleDescBgUpload}
        />

        {!editingDesc ? (
          /* VIEW MODE */
          <div
            key="view-mode"
            onClick={effectiveCanUpdate ? () => setEditingDesc(true) : undefined}
            className={`group relative w-full rounded-xl border transition min-h-[60px] px-3.5 py-2.5 ${
              descBgUrl
                ? "border-slate-200 bg-white bg-cover bg-center"
                : "border-transparent bg-transparent"
            } ${
              effectiveCanUpdate ? "cursor-pointer hover:border-slate-200 hover:bg-slate-50/30" : ""
            }`}
            style={descBgUrl ? { backgroundImage: `url(${descBgUrl})` } : {}}
          >
            {descBgUrl && <div className="absolute inset-0 bg-white/80 rounded-xl z-0" />}

            <div
              className={`desc-rich-view relative z-10 block w-full pr-24 whitespace-pre-wrap text-sm leading-6 text-slate-700`}
            >
              {hasDescription ? (
                <div
                  className="w-full wrap-break-word"
                  dangerouslySetInnerHTML={{ __html: localDesc }}
                />
              ) : (
                <span className="text-slate-400">Chưa có mô tả. Click để thêm mô tả...</span>
              )}
            </div>
            {effectiveCanUpdate && (
              <div className={`absolute z-10 flex items-center gap-2 ${descBgUrl ? "right-3.5 top-3.5" : "right-3.5 top-3.5"}`}>
                {descBgUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescBgUrl("");
                      localStorage.removeItem(`task-desc-bg-${taskId}`);
                    }}
                    className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition"
                  >
                    Xóa nền
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingDesc(true)}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE: rich editor */
          <div
            className={`relative w-full rounded-xl border border-sky-400 shadow-sm ${
              descBgUrl ? "bg-cover bg-center" : "bg-white"
            }`}
            style={descBgUrl ? { backgroundImage: `url(${descBgUrl})` } : {}}
          >
            {descBgUrl && <div className="absolute inset-0 bg-white/80 z-0" />}

            {/* Toolbar */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              className={`relative z-20 flex items-center gap-0.5 border-b border-slate-200 px-2 py-1.5 rounded-t-xl ${
                descBgUrl ? "bg-white/90 backdrop-blur-xs" : "bg-white"
              }`}
            >
              {/* Tt Button with Dropdown */}
              <div className="relative" ref={ttBtnRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTtDropdown(!showTtDropdown);
                    setShowMoreDropdown(false);
                    setShowListDropdown(false);
                    setShowEmojiDropdown(false);
                  }}
                  className="flex items-center gap-0.5 rounded px-1.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition desc-toolbar-btn"
                >
                  <span>Tt</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showTtDropdown && ttBtnRef.current && (() => {
                  const rect = ttBtnRef.current!.getBoundingClientRect();
                  return (
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      className="fixed w-64 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl"
                      style={{ bottom: `${window.innerHeight - rect.top + 4}px`, left: `${rect.left}px`, zIndex: 9999 }}
                    >
                      {/* Normal text */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          resetHeading();
                          setShowTtDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 transition-colors desc-toolbar-btn ${
                          ["div", "p"].includes(activeHeading) ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                        }`}
                      >
                        <span>Văn bản bình thường</span>
                        <span className="text-[10px] text-slate-400">Ctrl+Alt+0</span>
                      </button>

                      <div className="mx-3 my-1 h-px bg-slate-200" />

                      {/* Headings H1 - H6 */}
                      {([
                        { level: 1, fontSize: "text-[22px]", fontWeight: "font-extrabold" },
                        { level: 2, fontSize: "text-[19px]", fontWeight: "font-bold" },
                        { level: 3, fontSize: "text-[16px]", fontWeight: "font-bold" },
                        { level: 4, fontSize: "text-[14px]", fontWeight: "font-bold" },
                        { level: 5, fontSize: "text-[12.5px]", fontWeight: "font-semibold" },
                        { level: 6, fontSize: "text-[11px]", fontWeight: "font-semibold" },
                      ] as const).map(({ level, fontSize, fontWeight }) => (
                        <button
                          key={level}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            applyHeading(level);
                            setShowTtDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-2 text-left transition-colors desc-toolbar-btn ${fontSize} ${fontWeight} ${
                            activeHeading === `h${level}` ? "bg-slate-100 text-slate-900" : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <span>Heading {level}</span>
                          <span className="text-[10px] font-normal text-slate-400">Ctrl+Alt+{level}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="mx-1 h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => execFormat("bold")}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn flex items-center justify-center"
                title="Chữ đậm (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => execFormat("italic")}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn flex items-center justify-center"
                title="Chữ nghiêng (Ctrl+I)"
              >
                <Italic size={14} />
              </button>

              {/* More Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDropdown(!showMoreDropdown);
                    setShowTtDropdown(false);
                    setShowListDropdown(false);
                    setShowEmojiDropdown(false);
                  }}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn flex items-center justify-center"
                  title="Thêm định dạng"
                >
                  <MoreHorizontal size={14} />
                </button>

                {showMoreDropdown && (
                  <div 
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 top-full z-30 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execFormat("strikeThrough");
                        setShowMoreDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Strikethrough size={13} className="text-slate-500 shrink-0" />
                      <span className="line-through">Gạch ngang</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        // Wrap selection in <code> tag
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                          const range = sel.getRangeAt(0);
                          const code = document.createElement("code");
                          try {
                            range.surroundContents(code);
                          } catch {
                            // If selection spans multiple elements, insert as text
                            code.textContent = sel.toString();
                            range.deleteContents();
                            range.insertNode(code);
                          }
                          handleEditorInput();
                        }
                        setShowMoreDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Code size={13} className="text-slate-500 shrink-0" />
                      <span>Đoạn mã (Code)</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mx-1 h-4 w-px bg-slate-200" />

              {/* List Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowListDropdown(!showListDropdown);
                    setShowTtDropdown(false);
                    setShowMoreDropdown(false);
                    setShowEmojiDropdown(false);
                  }}
                  className="flex items-center gap-0.5 rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn"
                  title="Danh sách"
                >
                  <List size={14} />
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400 shrink-0"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showListDropdown && (
                  <div 
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execFormat("insertUnorderedList");
                        setShowListDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <List size={13} className="text-slate-500 shrink-0" />
                      <span>Danh sách dấu đầu dòng</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execFormat("insertOrderedList");
                        setShowListDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ListOrdered size={13} className="text-slate-500 shrink-0" />
                      <span>Danh sách số đầu dòng</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = prompt("Nhập URL:");
                  if (url) execFormat("createLink", url);
                }}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn flex items-center justify-center"
                title="Chèn liên kết"
              >
                <Link size={14} />
              </button>

              <button
                type="button"
                onClick={() => descBgInputRef.current?.click()}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn flex items-center justify-center"
                title="Chọn ảnh nền cho mô tả"
              >
                <Image size={14} />
              </button>

              {/* Emoji Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiDropdown(!showEmojiDropdown);
                    setShowTtDropdown(false);
                    setShowMoreDropdown(false);
                    setShowListDropdown(false);
                  }}
                  className="flex items-center gap-0.5 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition desc-toolbar-btn"
                  title="Chèn biểu cảm"
                >
                  <Smile size={14} />
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400 shrink-0"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showEmojiDropdown && (
                  <div 
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  >
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        "😀", "😂", "😍", "👍", "🎉", "🔥",
                        "❤️", "🚀", "🤔", "👀", "👏", "🌟",
                        "💡", "💯", "❌", "✅", "✨", "👋",
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            insertEmoji(emoji);
                            setShowEmojiDropdown(false);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded text-base hover:bg-slate-100 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-100 transition"
                >
                  Mɔ
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ContentEditable Rich Editor */}
            <div
              ref={descEditorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              onInput={handleEditorInput}
              className={`desc-rich-editor relative z-10 w-full min-h-30 px-4 py-3 text-sm leading-6 text-slate-900 outline-none ${
                descBgUrl ? "bg-white/70" : "bg-white"
              }`}
              style={{ whiteSpace: "pre-wrap" }}
            />

            {/* Footer */}
            <div
              className={`relative z-10 flex items-center justify-between border-t border-slate-200 px-3 py-2 rounded-b-xl ${
                descBgUrl ? "bg-white/80" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSave}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalDesc(description);
                    setEditingDesc(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Hủy bỏ thay đổi
                </button>
              </div>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1 font-semibold"
              >
                <Info size={12} className="shrink-0" />
                Trợ giúp định dạng
              </button>
            </div>
          </div>
        )}
      </TaskFieldRow>
    </div>
  );
}

export interface UseTaskMembersParams {
  handleAssignMember: (userId: string) => void | Promise<void>;
  handleUnassignMember: (userId: string) => void | Promise<void>;
}

export function useTaskMembers({
  handleAssignMember,
  handleUnassignMember,
}: UseTaskMembersParams) {
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const [memberAssigning, setMemberAssigning] = useState<string | null>(null);

  // Close member dropdown on outside click
  useEffect(() => {
    if (!memberDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setMemberDropdownOpen(false);
        setMemberSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [memberDropdownOpen]);

  const onAssign = async (userId: string) => {
    setMemberAssigning(userId);
    try {
      await handleAssignMember(userId);
    } finally {
      setMemberAssigning(null);
    }
  };

  const onUnassign = async (userId: string) => {
    setMemberAssigning(userId);
    try {
      await handleUnassignMember(userId);
    } finally {
      setMemberAssigning(null);
    }
  };

  return {
    memberSearch,
    setMemberSearch,
    memberDropdownOpen,
    setMemberDropdownOpen,
    memberDropdownRef,
    memberAssigning,
    onAssign,
    onUnassign,
  };
}

export interface TaskMembersSectionProps {
  boardMembers: BoardMemberSummary[];
  members: string[];
  membersLoading: boolean;
  readOnly: boolean;
  effectiveCanAssign: boolean;
  handleAssignMember: (userId: string) => void;
  handleUnassignMember: (userId: string) => void;
}

export function TaskMembersSection({
  boardMembers,
  members,
  membersLoading,
  readOnly,
  effectiveCanAssign,
  handleAssignMember,
  handleUnassignMember,
}: TaskMembersSectionProps) {
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserData>>({});

  useEffect(() => {
    if (members.length > 0) {
      const missing = members.filter(uid => {
        const info = boardMembers?.find(m => (m.userId || m.id) === uid);
        return !info?.fullName && !memberProfiles[uid];
      });
      if (missing.length > 0) {
        getUsersProfiles(missing).then(users => {
          setMemberProfiles(prev => {
            const next = { ...prev };
            users.forEach(u => { if (u.id) next[u.id] = u; });
            return next;
          });
        }).catch(console.error);
      }
    }
  }, [members, boardMembers]);

  const {
    memberSearch,
    setMemberSearch,
    memberDropdownOpen,
    setMemberDropdownOpen,
    memberDropdownRef,
    memberAssigning,
    onAssign,
    onUnassign,
  } = useTaskMembers({
    handleAssignMember,
    handleUnassignMember,
  });

  return (
    <div className="py-4">
      <TaskFieldRow
        label="Thành viên được gán"
        icon={<Users size={15} />}
        rightAction={membersLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
      >
        {/* Assigned members list */}
        {!membersLoading && members.length === 0 ? (
          <p className="mb-3 text-xs text-slate-400">Chưa có thành viên nào được gán.</p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {members.map((userId) => {
              const info = boardMembers?.find((m) => (m.userId || m.id) === userId);
              const profile = memberProfiles[userId];
              const displayName = profile?.fullName || info?.fullName || profile?.email || info?.email || userId;
              const initials = (profile?.fullName || info?.fullName || profile?.email || info?.email || "U").charAt(0).toUpperCase();
              const displayEmail = profile?.email || info?.email;
              return (
                <li
                  key={userId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{displayName}</p>
                      {displayEmail && displayEmail !== displayName ? (
                        <p className="truncate text-[10px] text-slate-400">{displayEmail}</p>
                      ) : null}
                    </div>
                  </div>
                  {effectiveCanAssign && (
                    <button
                      type="button"
                      onClick={() => void onUnassign(userId)}
                      className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Bỏ gán"
                    >
                      <UserMinus size={13} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Board member searchable dropdown */}
        {effectiveCanAssign && boardMembers.length > 0 && (
          (() => {
            const unassigned = boardMembers.filter((m) => {
              const uid = m.userId || m.id;
              return uid && !members.includes(uid as string);
            });
            if (unassigned.length === 0) return null;
            const q = memberSearch.toLowerCase();
            const filtered = unassigned.filter(
              (m) =>
                (m.fullName || "").toLowerCase().includes(q) ||
                (m.email || "").toLowerCase().includes(q)
            );
            return (
              <div ref={memberDropdownRef} className="relative mt-1">
                {/* Trigger button */}
                <button
                  type="button"
                  disabled={Boolean(memberAssigning)}
                  onClick={() => {
                    setMemberDropdownOpen((v) => !v);
                    setMemberSearch("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-500 transition hover:border-slate-300 disabled:opacity-60 outline-none"
                >
                  <span>-- Chọn thành viên để gán --</span>
                  {memberAssigning ? (
                    <Loader2 size={14} className="animate-spin text-slate-400" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-400">
                      <path
                        d="M3 5l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Dropdown panel */}
                {memberDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {/* Search input */}
                    <div className="border-b border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <Search size={13} className="shrink-0 text-slate-400" />
                        <input
                          autoFocus
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Tìm theo tên hoặc email..."
                          className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        {memberSearch ? (
                          <button
                            type="button"
                            onClick={() => setMemberSearch("")}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={12} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {filtered.length === 0 ? (
                        <li className="px-4 py-3 text-center text-xs text-slate-400">
                          Không tìm thấy thành viên nào
                        </li>
                      ) : (
                        filtered.map((m) => {
                          const uid = (m.userId || m.id) as string;
                          const name = m.fullName || "";
                          const email = m.email || "";
                          const initials = (name || email || "U").charAt(0).toUpperCase();
                          const isBusy = memberAssigning === uid;
                          return (
                            <li key={uid}>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  void onAssign(uid);
                                  setMemberDropdownOpen(false);
                                  setMemberSearch("");
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-sky-50 disabled:opacity-50"
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                  {isBusy ? <Loader2 size={12} className="animate-spin" /> : initials}
                                </span>
                                <div className="min-w-0">
                                  {name ? <p className="truncate text-sm font-semibold text-slate-800">{name}</p> : null}
                                  {email ? <p className="truncate text-xs text-slate-400">{email}</p> : null}
                                  {!name && !email ? <p className="truncate text-xs text-slate-400">{uid}</p> : null}
                                </div>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })()
        )}
      </TaskFieldRow>
    </div>
  );
}

interface BoardTaskDialogProps {
  open: boolean;
  task: BoardTask | null;
  listName?: string;
  boardMembers?: BoardMemberSummary[];
  onClose: () => void;
  onSave: (taskId: string, payload: UpdateTaskPayload) => Promise<void> | void;
  onDelete: (task: BoardTask) => Promise<void> | void;
  readOnly?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
  canManageAttachment?: boolean;
  canComment?: boolean;
}

const PRIORITY_OPTIONS: TaskPriority[] = ["NONE", "LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST", "URGENT"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  NONE: "Không",
  LOWEST: "Rất thấp",
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  HIGHEST: "Rất cao",
  URGENT: "Khẩn cấp",
};

function parseTaskDueDate(value?: string | null) {
  if (!value) {
    return { hasDueDate: false, date: "", time: "17:30", isAllDay: false };
  }
  const dateObj = parseServerDate(value);
  if (Number.isNaN(dateObj.getTime())) {
    return { hasDueDate: false, date: "", time: "17:30", isAllDay: false };
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const isAllDay = (hours === 0 && minutes === 0);

  return {
    hasDueDate: true,
    date: dateStr,
    time: isAllDay ? "17:30" : timeStr,
    isAllDay
  };
}

function toDueDatePayload(hasDueDate: boolean, date: string, time: string, isAllDay: boolean) {
  if (!hasDueDate || !date) {
    return null;
  }
  if (isAllDay) {
    return `${date}T00:00:00Z`;
  }
  const t = time || "17:30";
  const localDate = new Date(`${date}T${t}`);
  if (Number.isNaN(localDate.getTime())) {
    return `${date}T00:00:00Z`;
  }
  return localDate.toISOString();
}

export function BoardTaskDialog({
  open,
  task,
  listName,
  boardMembers = [],
  onClose,
  onSave,
  onDelete,
  readOnly,
  canUpdate,
  canDelete,
  canAssign,
  canManageAttachment,
  canComment,
}: BoardTaskDialogProps) {
  // Effective permissions: if canUpdate/canDelete are explicitly provided, use them;
  // otherwise fall back to !readOnly
  const effectiveCanUpdate = canUpdate ?? !readOnly;
  const effectiveCanDelete = canDelete ?? !readOnly;
  const effectiveCanAssign = canAssign ?? effectiveCanUpdate;
  const effectiveCanManageAttachment = canManageAttachment ?? effectiveCanUpdate;
  const effectiveCanComment = canComment ?? effectiveCanUpdate;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<string>("TODO");
  const [hasStartDate, setHasStartDate] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDateStr, setDueDateStr] = useState("");
  const [dueTimeStr, setDueTimeStr] = useState("17:30");
  const [isAllDay, setIsAllDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentsRefreshTrigger, setCommentsRefreshTrigger] = useState(0);
  const triggerCommentsRefresh = useCallback(() => {
    setCommentsRefreshTrigger((prev) => prev + 1);
  }, []);

  // Members state
  const [members, setMembers] = useState<string[]>([]);
  const [initialMembers, setInitialMembers] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [checklistStats, setChecklistStats] = useState({ total: 0, checked: 0 });

  const handleChecklistProgressChange = useCallback((total: number, checked: number) => {
    setChecklistStats((prev) => {
      if (prev.total === total && prev.checked === checked) {
        return prev;
      }
      return { total, checked };
    });
  }, []);

  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title, open]);

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setChecklistStats({ total: 0, checked: 0 });

    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority ?? "MEDIUM");
    setStatus(task.status ?? "TODO");
    
    const parsed = parseTaskDueDate(task.dueDate);
    setHasDueDate(parsed.hasDueDate);
    setDueDateStr(parsed.date);
    setDueTimeStr(parsed.time);
    setIsAllDay(parsed.isAllDay);

    const parsedStart = parseTaskDueDate(task.createdAt);
    setHasStartDate(parsedStart.hasDueDate);
    setStartDateStr(parsedStart.date);

    setMembersLoading(true);
    getTaskMembers(task.id)
      .then((data) => {
        setMembers(data);
        setInitialMembers(data);
      })
      .catch(() => {
        setMembers([]);
        setInitialMembers([]);
      })
      .finally(() => setMembersLoading(false));

    setAttachmentsLoading(true);
    getTaskAttachments(task.id)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [open, task]);

  const saveChanges = async (
    nextTitle?: string,
    nextDesc?: string,
    nextPriority?: TaskPriority,
    nextStatus?: string,
    nextHasDueDate?: boolean,
    nextDueDateStr?: string | null,
    nextDueTimeStr?: string,
    nextIsAllDay?: boolean,
    nextMembers?: string[],
    nextRecurrence?: string
  ) => {
    if (!task) return;
    
    const activeTitle = (nextTitle !== undefined ? nextTitle : title).trim();
    if (!activeTitle) return;

    setSubmitting(true);
    try {
      const activeMembers = nextMembers || members;
      const toAdd = activeMembers.filter((id) => !initialMembers.includes(id));
      const toRemove = initialMembers.filter((id) => !activeMembers.includes(id));

      await Promise.all([
        ...toAdd.map((userId) => assignTaskMember(task.id, userId)),
        ...toRemove.map((userId) => unassignTaskMember(task.id, userId)),
      ]);
      setInitialMembers(activeMembers);

      const resolvedHasDueDate = nextHasDueDate !== undefined ? nextHasDueDate : hasDueDate;
      const resolvedDueDateStr = nextDueDateStr !== undefined ? nextDueDateStr : dueDateStr;
      const resolvedDueTimeStr = nextDueTimeStr !== undefined ? nextDueTimeStr : dueTimeStr;
      const resolvedIsAllDay = nextIsAllDay !== undefined ? nextIsAllDay : isAllDay;

      const resolvedRecurrence = nextRecurrence !== undefined ? nextRecurrence : task.recurrence;

      await onSave(task.id, {
        title: activeTitle,
        description: nextDesc !== undefined ? nextDesc : description,
        priority: nextPriority !== undefined ? nextPriority : priority,
        status: (nextStatus !== undefined ? nextStatus : status) as UpdateTaskPayload["status"],
        dueDate: toDueDatePayload(resolvedHasDueDate, resolvedDueDateStr || "", resolvedDueTimeStr, resolvedIsAllDay),
        recurrence: resolvedRecurrence,
      });
      triggerCommentsRefresh();
    } catch {
      toast.error("Lỗi khi lưu task. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await onDelete(task);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignMember = (userId: string) => {
    if (!userId || members.includes(userId)) return;
    const nextMembers = [...members, userId];
    setMembers(nextMembers);
    void saveChanges(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      nextMembers
    );
  };

  const handleUnassignMember = (userId: string) => {
    const nextMembers = members.filter((id) => id !== userId);
    setMembers(nextMembers);
    void saveChanges(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      nextMembers
    );
  };

  if (!open || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Đóng chi tiết task"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Task Detail
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{effectiveCanUpdate ? "Chỉnh sửa thẻ" : "Xem thẻ"}</h3>
          </div>

          <div className="flex items-center gap-2">
            {effectiveCanDelete && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDelete()}
                className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                title="Xóa thẻ"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-column body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* LEFT COLUMN: Task detail */}
          <div className="flex-1 overflow-y-auto border-r border-slate-100">
            <div className="space-y-4 px-5 py-5">
              <TaskFieldRow label="Danh sách" icon={<FolderKanban size={15} />}>
                <div className="w-full px-3.5 py-1 text-sm leading-6 font-medium text-slate-700 bg-transparent">
                  {listName || "Chưa xác định"}
                </div>
              </TaskFieldRow>

              <TaskFieldRow label="Tiêu đề" icon={<FileText size={15} />}>
                <textarea
                  ref={titleRef}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onFocus={(e) => {
                    const val = e.target.value;
                    e.target.setSelectionRange(val.length, val.length);
                  }}
                  onBlur={() => {
                    if (task && title.trim() !== task.title) {
                      void saveChanges(title);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Nhập tiêu đề task"
                  disabled={!effectiveCanUpdate}
                  rows={1}
                  className="w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-3.5 py-2 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-200 hover:bg-slate-50/30 focus:border-blue-500 focus:bg-white disabled:bg-transparent"
                />
              </TaskFieldRow>

              <TaskDescription
                taskId={task.id}
                description={description}
                effectiveCanUpdate={effectiveCanUpdate}
                onSaveDescription={async (newDesc) => {
                  await saveChanges(undefined, newDesc);
                  setDescription(newDesc);
                }}
              />

              <TaskFieldRow label="Ưu tiên" icon={<Flag size={15} />}>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(event) => {
                      const nextP = event.target.value as TaskPriority;
                      setPriority(nextP);
                      void saveChanges(undefined, undefined, nextP);
                    }}
                    disabled={!effectiveCanUpdate}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm leading-6 text-slate-900 outline-none transition hover:border-slate-300 focus:border-blue-500 disabled:bg-slate-50/50 disabled:text-slate-500"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {PRIORITY_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </TaskFieldRow>

              <TaskFieldRow label="Hạn xử lý" icon={<CalendarDays size={15} />}>
                <PremiumDatePicker
                  hasDueDate={hasDueDate}
                  dueDateStr={dueDateStr}
                  dueTimeStr={dueTimeStr}
                  isAllDay={isAllDay}
                  status={status}
                  hasStartDate={hasStartDate}
                  startDateStr={startDateStr}
                  initialRecurrence={task.recurrence || undefined}
                  effectiveCanUpdate={effectiveCanUpdate}
                  onSaveDatePicker={(nextHasDueDate, nextDueDateStr, nextDueTimeStr, nextIsAllDay, nextRecurrence) => {
                    setHasDueDate(nextHasDueDate);
                    setDueDateStr(nextDueDateStr);
                    setDueTimeStr(nextDueTimeStr);
                    setIsAllDay(nextIsAllDay);
                    void saveChanges(
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      nextHasDueDate,
                      nextDueDateStr,
                      nextDueTimeStr,
                      nextIsAllDay,
                      undefined,
                      nextRecurrence
                    );
                  }}
                  onClearDatePicker={() => {
                    setHasDueDate(false);
                    setDueDateStr("");
                    setDueTimeStr("17:30");
                    setIsAllDay(false);
                    void saveChanges(
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      false,
                      "",
                      "17:30",
                      false
                    );
                  }}
                  onStatusChange={(nextStatus) => {
                    if (nextStatus === "DONE" && checklistStats.total > 0 && checklistStats.checked < checklistStats.total) {
                      toast.warning("Vui lòng hoàn thành tất cả công việc phụ trước khi đánh dấu hoàn thành thẻ.");
                      return;
                    }
                    setStatus(nextStatus);
                    void saveChanges(
                      undefined,
                      undefined,
                      undefined,
                      nextStatus
                    );
                  }}
                />
              </TaskFieldRow>

              <TaskMembersSection
                boardMembers={boardMembers}
                members={members}
                membersLoading={membersLoading}
                readOnly={readOnly ?? false}
                effectiveCanAssign={effectiveCanAssign}
                handleAssignMember={handleAssignMember}
                handleUnassignMember={handleUnassignMember}
              />

              <TaskAttachmentsSection
                taskId={task.id}
                attachments={attachments}
                setAttachments={setAttachments}
                attachmentsLoading={attachmentsLoading}
                readOnly={readOnly ?? false}
                effectiveCanManageAttachment={effectiveCanManageAttachment}
                effectiveCanDelete={effectiveCanDelete}
                onRefreshActivities={triggerCommentsRefresh}
              />

              <TaskChecklists
                taskId={task.id}
                canUpdate={effectiveCanUpdate}
                boardMembers={boardMembers}
                taskMemberIds={members}
                taskDueDate={hasDueDate ? dueDateStr : null}
                onProgressChange={handleChecklistProgressChange}
                onRefreshActivities={triggerCommentsRefresh}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Comments */}
          <div className="flex w-[480px] shrink-0 flex-col overflow-hidden bg-slate-50/60">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Nhận xét và hoạt động</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TaskComments
                taskId={task.id}
                refreshTrigger={commentsRefreshTrigger}
                currentUserId={useAuthStore.getState().user?.id}
                userFullName={useAuthStore.getState().user?.fullName || useAuthStore.getState().user?.email || "Người dùng"}
                userAvatarUrl={useAuthStore.getState().user?.avatarUrl || ""}
                canComment={effectiveCanComment}
                boardMembers={boardMembers}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
