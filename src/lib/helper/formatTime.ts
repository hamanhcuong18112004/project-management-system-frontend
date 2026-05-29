export const parseServerDate = (dateInput?: Date | string | null): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  // If the string doesn't end with Z or a timezone offset, and doesn't contain a timezone code, append Z to treat it as UTC
  if (typeof dateInput === 'string' && dateInput.trim() !== '') {
    const trimmed = dateInput.trim();
    if (!trimmed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(trimmed) && !/GMT|UTC/i.test(trimmed)) {
      if (trimmed.includes('T')) {
        return new Date(trimmed + 'Z');
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return new Date(trimmed + 'T00:00:00Z');
      }
    }
  }
  return new Date(dateInput);
};

export const formatDateToDDMMYYYY = (
    dateInput?: Date | string | null
  ): string => {
    if (!dateInput) return '';
  
    const date = parseServerDate(dateInput);
  
    if (isNaN(date.getTime())) return '';
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  };

  export const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  export interface FormattedDueDate {
    text: string;
    status: "normal" | "warning" | "overdue";
    badgeClass: string;
  }

  export const formatTaskDueDate = (
    dueDateStr?: string | null,
    status?: string,
    compact?: boolean
  ): FormattedDueDate => {
    if (!dueDateStr) {
      return { text: "", status: "normal", badgeClass: "" };
    }

    const date = parseServerDate(dueDateStr);
    if (isNaN(date.getTime())) {
      return { text: "", status: "normal", badgeClass: "" };
    }

    const now = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isAllDay = (hours === 0 && minutes === 0);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const datePart = `${day}/${month}/${year}`;
    const timePart = isAllDay ? "" : ` - ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const formattedText = `${datePart}${timePart}`;

    if (status === "DONE") {
      return {
        text: compact ? `✓ ${formattedText}` : `✓ Đã hoàn thành (${formattedText})`,
        status: "normal",
        badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
      };
    }

    const diffMs = date.getTime() - now.getTime();
    const diffInHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      const diffInDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      let text = "";
      if (diffInDays >= 1) {
        text = compact ? `Quá hạn ${diffInDays} ngày` : `Quá hạn ${diffInDays} ngày (${formattedText})`;
      } else {
        const diffInHoursAbs = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
        const hoursText = diffInHoursAbs > 0 ? `${diffInHoursAbs} giờ` : "ít phút";
        text = compact ? `Quá hạn ${hoursText}` : `Quá hạn ${hoursText} (${formattedText})`;
      }
      return {
        text,
        status: "overdue",
        badgeClass: "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
      };
    } else if (diffInHours <= 24) {
      const hoursLeft = Math.floor(diffInHours);
      const hoursLeftText = hoursLeft > 0 ? `${hoursLeft} giờ` : "ít phút";
      const text = compact ? `Còn ${hoursLeftText}` : `⚠ Sắp hết hạn (còn ${hoursLeftText}) - ${formattedText}`;
      return {
        text,
        status: "warning",
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
      };
    }

    return {
      text: compact ? formattedText : `Hạn chót: ${formattedText}`,
      status: "normal",
      badgeClass: "bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800",
    };
  };