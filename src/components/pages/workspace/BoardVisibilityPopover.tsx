"use client";

import { useState } from "react";
import { ChevronDown, Globe, Lock, Users } from "lucide-react";
import type { BoardVisibility } from "@/lib/api/workspace";

type VisibilityOption = {
  value: BoardVisibility;
  title: string;
  description: string;
  icon: typeof Lock;
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "PRIVATE",
    title: "Riêng tư",
    description:
      "Chỉ thành viên board mới có quyền xem thông tin của bảng này.",
    icon: Lock,
  },
  {
    value: "WORKSPACE",
    title: "Không gian làm việc",
    description:
      "Tất cả thành viên trong không gian làm việc đều có thể xem bảng này.",
    icon: Users,
  },
  {
    value: "PUBLIC",
    title: "Công khai",
    description: "Bất kỳ ai trên internet đều có thể xem bảng này.",
    icon: Globe,
  },
];

interface BoardVisibilityPopoverProps {
  value: BoardVisibility;
  onChange: (value: BoardVisibility) => void;
  disabled?: boolean;
}

export function BoardVisibilityPopover({
  value,
  onChange,
  disabled = false,
}: BoardVisibilityPopoverProps) {
  const [open, setOpen] = useState(false);
  const activeOption =
    VISIBILITY_OPTIONS.find((option) => option.value === value) ??
    VISIBILITY_OPTIONS[1];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-blue-400 disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <activeOption.icon size={15} className="text-slate-500" />
          <span>{activeOption.title}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Đóng quyền xem"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{option.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
