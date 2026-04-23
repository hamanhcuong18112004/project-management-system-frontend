"use client";

import { useMemo, useState } from "react";
import { LayoutPanelTop, X } from "lucide-react";
import type {
  BoardBackgroundType,
  BoardVisibility,
  Workspace,
} from "@/lib/api/workspace";
import { BoardBackgroundPopover } from "./BoardBackgroundPopover";
import { BoardVisibilityPopover } from "./BoardVisibilityPopover";
import {
  BOARD_COLOR_PRESETS,
  BOARD_IMAGE_PRESETS,
  DEFAULT_BOARD_BACKGROUND,
  DEFAULT_BOARD_VISIBILITY,
  getBoardBackgroundStyle,
} from "./boardPresets";

export interface CreateBoardFormData {
  name: string;
  visibility: BoardVisibility;
  backgroundType: BoardBackgroundType;
  backgroundValue: string;
}

interface CreateBoardModalProps {
  open: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onSubmit: (data: CreateBoardFormData) => void;
  isLoading?: boolean;
}

const PREVIEW_COLUMNS = [4, 3, 4];

export function CreateBoardModal({
  open,
  workspace,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<BoardVisibility>(
    DEFAULT_BOARD_VISIBILITY,
  );
  const [backgroundType, setBackgroundType] = useState<BoardBackgroundType>(
    DEFAULT_BOARD_BACKGROUND.type,
  );
  const [backgroundValue, setBackgroundValue] = useState(
    DEFAULT_BOARD_BACKGROUND.value,
  );
  const [errors, setErrors] = useState<{ name?: string }>({});

  const previewStyle = useMemo(
    () => getBoardBackgroundStyle(backgroundType, backgroundValue),
    [backgroundType, backgroundValue],
  );

  if (!open || !workspace) {
    return null;
  }

  const handleClose = () => {
    if (isLoading) {
      return;
    }
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setErrors({ name: "Tiêu đề bảng là bắt buộc" });
      return;
    }

    setErrors({});
    onSubmit({
      name: name.trim(),
      visibility,
      backgroundType,
      backgroundValue,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 px-4 py-6 backdrop-blur-[1px] sm:px-8">
      <button
        type="button"
        aria-label="Đóng tạo board"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Tạo board
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              trong workspace {workspace.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="relative aspect-[1.7/1] p-4" style={previewStyle}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-700 backdrop-blur-sm">
                <LayoutPanelTop size={12} />
                <span>Board</span>
              </div>
              <div className="absolute inset-x-4 bottom-4 top-8 z-10 flex items-end gap-2">
                {PREVIEW_COLUMNS.map((items, index) => (
                  <div
                    key={`${items}-${index}`}
                    className="flex flex-1 flex-col gap-2 rounded-md bg-white/90 p-2 shadow-lg shadow-black/15"
                  >
                    {Array.from({ length: items }).map((_, itemIndex) => (
                      <div
                        key={`${index}-${itemIndex}`}
                        className={`rounded ${
                          itemIndex === 0
                            ? "h-2.5 bg-slate-300"
                            : "h-2 bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Phông nền
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {BOARD_IMAGE_PRESETS.slice(0, 4).map((preset) => {
                const active =
                  backgroundType === preset.type &&
                  backgroundValue === preset.value;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setBackgroundType(preset.type);
                      setBackgroundValue(preset.value);
                    }}
                    className={`h-10 rounded-lg border transition ${
                      active
                        ? "border-sky-400 ring-2 ring-sky-400/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={getBoardBackgroundStyle(preset.type, preset.value)}
                  />
                );
              })}
            </div>

            <div className="mt-2 grid grid-cols-6 gap-2">
              {BOARD_COLOR_PRESETS.slice(0, 5).map((preset) => {
                const active =
                  backgroundType === preset.type &&
                  backgroundValue === preset.value;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.label}
                    onClick={() => {
                      setBackgroundType(preset.type);
                      setBackgroundValue(preset.value);
                    }}
                    className={`h-8 rounded-md border transition ${
                      active
                        ? "border-sky-400 ring-2 ring-sky-400/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={getBoardBackgroundStyle(preset.type, preset.value)}
                  />
                );
              })}

              <BoardBackgroundPopover
                backgroundType={backgroundType}
                backgroundValue={backgroundValue}
                onChange={({
                  backgroundType: nextType,
                  backgroundValue: nextValue,
                }) => {
                  setBackgroundType(nextType);
                  setBackgroundValue(nextValue);
                }}
                buttonClassName="h-8 w-full rounded-md border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Tiêu đề bảng <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors({});
                }
              }}
              placeholder="Ví dụ: Sprint Planning"
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${
                errors.name
                  ? "border-red-500 focus:border-red-400"
                  : "border-slate-300 focus:border-sky-400"
              }`}
            />
            {errors.name && (
              <p className="mt-2 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Quyền xem
            </label>
            <BoardVisibilityPopover
              value={visibility}
              onChange={setVisibility}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="mb-2 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isLoading ? "Đang tạo..." : "Tạo mới"}
          </button>

          <button
            type="button"
            className="mb-3 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Bắt đầu với Mẫu
          </button>

          <p className="text-xs leading-5 text-slate-500">
            Bằng cách sử dụng hình ảnh nền, bạn đồng ý với giấy phép và điều
            khoản dịch vụ của nền tảng ảnh.
          </p>
        </form>
      </div>
    </div>
  );
}
