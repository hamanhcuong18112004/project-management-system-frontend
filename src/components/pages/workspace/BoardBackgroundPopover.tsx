"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Ellipsis, ImageIcon, LoaderCircle, Pipette, X } from "lucide-react";
import type { BoardBackgroundType } from "@/lib/api/workspace";
import {
  BOARD_COLOR_PRESETS,
  BOARD_IMAGE_PRESETS,
  getBoardBackgroundStyle,
} from "./boardPresets";
import {
  fetchRandomUnsplashImages,
  type UnsplashImageOption,
} from "./unsplash";

interface BoardBackgroundPopoverProps {
  backgroundType: BoardBackgroundType;
  backgroundValue: string;
  onChange: (payload: {
    backgroundType: BoardBackgroundType;
    backgroundValue: string;
  }) => void;
  buttonClassName?: string;
}

type ExpandedPanel = "images" | "colors" | null;

const DEFAULT_START_COLOR = "#1D4ED8";
const DEFAULT_END_COLOR = "#38BDF8";
const DEFAULT_ANGLE = 135;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim();

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, first, second, third] = trimmed;
    return `#${first}${first}${second}${second}${third}${third}`.toUpperCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

function extractGradientConfig(
  backgroundType: BoardBackgroundType,
  backgroundValue: string,
) {
  if (backgroundType !== "COLOR") {
    return {
      start: DEFAULT_START_COLOR,
      end: DEFAULT_END_COLOR,
      angle: DEFAULT_ANGLE,
    };
  }

  const colorMatches = [
    ...backgroundValue.matchAll(
      /(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))\s+(\d{1,3})%/g,
    ),
  ];
  const fallbackColors = backgroundValue.match(
    /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g,
  );
  const angleMatch = backgroundValue.match(
    /linear-gradient\(\s*([-\d.]+)deg/i,
  );
  const resolvedAngle = angleMatch
    ? clamp(Math.round(Number(angleMatch[1])), 0, 360)
    : DEFAULT_ANGLE;

  if ((!colorMatches || colorMatches.length < 2) && (!fallbackColors || fallbackColors.length < 2)) {
    return {
      start: DEFAULT_START_COLOR,
      end: DEFAULT_END_COLOR,
      angle: resolvedAngle,
    };
  }

  const startColor =
    normalizeHexColor(colorMatches[0]?.[1] || fallbackColors?.[0] || "") ||
    DEFAULT_START_COLOR;
  const endColor =
    normalizeHexColor(colorMatches[1]?.[1] || fallbackColors?.[1] || "") ||
    DEFAULT_END_COLOR;

  return {
    start: startColor,
    end: endColor,
    angle: resolvedAngle,
  };
}

function buildGradientValue(
  start: string,
  end: string,
  angle: number,
) {
  return `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`;
}

export function BoardBackgroundPopover({
  backgroundType,
  backgroundValue,
  onChange,
  buttonClassName,
}: BoardBackgroundPopoverProps) {
  const [open, setOpen] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [imageOptions, setImageOptions] = useState<UnsplashImageOption[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imageError, setImageError] = useState("");
  const [colorStart, setColorStart] = useState(DEFAULT_START_COLOR);
  const [colorEnd, setColorEnd] = useState(DEFAULT_END_COLOR);
  const [gradientAngle, setGradientAngle] = useState(DEFAULT_ANGLE);

  const imageScrollRef = useRef<HTMLDivElement | null>(null);
  const imageSentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingImagesRef = useRef(false);

  const customGradientValue = useMemo(
    () => buildGradientValue(colorStart, colorEnd, gradientAngle),
    [colorEnd, colorStart, gradientAngle],
  );

  const closeAll = () => {
    setExpandedPanel(null);
    setOpen(false);
  };

  const selectBackground = (
    nextType: BoardBackgroundType,
    nextValue: string,
  ) => {
    onChange({
      backgroundType: nextType,
      backgroundValue: nextValue,
    });
    closeAll();
  };

  const loadMoreImages = useCallback(async (count: number) => {
    if (isLoadingImagesRef.current) {
      return;
    }

    isLoadingImagesRef.current = true;
    setIsLoadingImages(true);
    setImageError("");

    try {
      const nextBatch = await fetchRandomUnsplashImages(count);

      setImageOptions((current) => [...current, ...nextBatch]);
    } catch {
      setImageError("Không tải được ảnh nền lúc này.");
    } finally {
      isLoadingImagesRef.current = false;
      setIsLoadingImages(false);
    }
  }, []);

  const openColorPanel = () => {
    const nextGradient = extractGradientConfig(backgroundType, backgroundValue);

    setColorStart(nextGradient.start);
    setColorEnd(nextGradient.end);
    setGradientAngle(nextGradient.angle);
    setExpandedPanel("colors");
  };

  useEffect(() => {
    if (!open || expandedPanel !== "images" || imageOptions.length > 0) {
      return;
    }

    void loadMoreImages(20);
  }, [expandedPanel, imageOptions.length, loadMoreImages, open]);

  useEffect(() => {
    if (expandedPanel !== "images") {
      return;
    }

    const root = imageScrollRef.current;
    const sentinel = imageSentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMoreImages(10);
        }
      },
      {
        root,
        rootMargin: "120px 0px",
        threshold: 0.15,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [expandedPanel, imageOptions.length, loadMoreImages]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 ${buttonClassName ?? ""}`}
        >
          <Ellipsis size={18} />
        </button>

        {open && (
          <div className="absolute right-[calc(100%+16px)] top-[-10px] z-30 w-[310px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Phông nền board
              </h3>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Ảnh</h4>
                  <button
                    type="button"
                    onClick={() => setExpandedPanel("images")}
                    className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    Xem thêm ảnh
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {BOARD_IMAGE_PRESETS.map((preset) => {
                    const active =
                      backgroundType === preset.type &&
                      backgroundValue === preset.value;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectBackground(preset.type, preset.value)}
                        className={`relative h-14 overflow-hidden rounded-lg border transition ${active
                            ? "border-sky-400 ring-2 ring-sky-400/40"
                            : "border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        <div
                          className="absolute inset-0"
                          style={getBoardBackgroundStyle(preset.type, preset.value)}
                        />
                        <div className="absolute inset-0 bg-black/15" />
                        {active && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <Check size={18} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Màu sắc
                  </h4>
                  <button
                    type="button"
                    onClick={openColorPanel}
                    className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    Xem thêm màu
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {BOARD_COLOR_PRESETS.map((preset) => {
                    const active =
                      backgroundType === preset.type &&
                      backgroundValue === preset.value;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-label={preset.label}
                        onClick={() => selectBackground(preset.type, preset.value)}
                        className={`h-14 rounded-lg border transition ${active
                            ? "border-sky-400 ring-2 ring-sky-400/40"
                            : "border-slate-200 hover:border-slate-300"
                          }`}
                        style={getBoardBackgroundStyle(preset.type, preset.value)}
                      />
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {expandedPanel === "images" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25 px-4 py-6">
          <button
            type="button"
            aria-label="Đóng thư viện ảnh nền"
            className="absolute inset-0 cursor-default"
            onClick={() => setExpandedPanel(null)}
          />

          <div className="relative z-10 flex w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/50">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-900">
                  <ImageIcon size={18} />
                  <h3 className="text-lg font-semibold">Ảnh nền</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandedPanel(null)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div
              ref={imageScrollRef}
              className="max-h-[65vh] overflow-y-auto pr-1"
            >
              {imageError && imageOptions.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-6 text-center">
                  <p className="text-sm font-medium text-rose-600">
                    {imageError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadMoreImages(20)}
                    className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {imageOptions.map((option) => {
                      const active =
                        backgroundType === "IMAGE" &&
                        backgroundValue === option.full;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectBackground("IMAGE", option.full)}
                          className={`group overflow-hidden rounded-2xl border bg-white text-left transition ${active
                              ? "border-sky-400 ring-2 ring-sky-400/30"
                              : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
                            }`}
                        >
                          <div className="relative aspect-video">
                            <div
                              className="absolute inset-0"
                              style={getBoardBackgroundStyle("IMAGE", option.thumb)}
                            />
                            <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
                            {active && (
                              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-sky-600 shadow-md">
                                <Check size={16} />
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-2">
                            <p className="line-clamp-2 text-sm font-medium text-slate-700">
                              {option.alt}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {isLoadingImages &&
                      imageOptions.length === 0 &&
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`image-skeleton-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="aspect-video animate-pulse bg-slate-200" />
                          <div className="space-y-2 px-3 py-3">
                            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                  </div>

                  <div ref={imageSentinelRef} className="h-10">
                    {isLoadingImages && imageOptions.length > 0 && (
                      <div className="flex items-center justify-center gap-2 pt-3 text-sm text-slate-500">
                        <LoaderCircle size={16} className="animate-spin" />
                        <span>Đang tải thêm ảnh...</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {expandedPanel === "colors" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25 px-4 py-6">
          <button
            type="button"
            aria-label="Đóng trình chọn màu"
            className="absolute inset-0 cursor-default"
            onClick={() => setExpandedPanel(null)}
          />

          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/50">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-900">
                  <Pipette size={18} />
                  <h3 className="text-lg font-semibold">Tạo màu nền</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn màu trực tiếp bằng picker và chỉnh góc gradient của
                  board.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setExpandedPanel(null)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200">
              <div
                className="h-40 w-full"
                style={getBoardBackgroundStyle("COLOR", customGradientValue)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="mb-3 block text-sm font-semibold text-slate-700">
                  Màu bắt đầu
                </span>
                <input
                  type="color"
                  value={colorStart}
                  onChange={(event) =>
                    setColorStart(event.target.value.toUpperCase())
                  }
                  className="h-28 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-2"
                />
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  Mã màu:
                  <span className="ml-2 font-semibold uppercase text-slate-900">
                    {colorStart}
                  </span>
                </div>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="mb-3 block text-sm font-semibold text-slate-700">
                  Màu kết thúc
                </span>
                <input
                  type="color"
                  value={colorEnd}
                  onChange={(event) =>
                    setColorEnd(event.target.value.toUpperCase())
                  }
                  className="h-28 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-2"
                />
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  Mã màu:
                  <span className="ml-2 font-semibold uppercase text-slate-900">
                    {colorEnd}
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Góc gradient
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      Góc gradient
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={gradientAngle}
                      onChange={(event) =>
                        setGradientAngle(
                          clamp(Number(event.target.value || 0), 0, 360),
                        )
                      }
                      className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-400"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={gradientAngle}
                    onChange={(event) =>
                      setGradientAngle(Number(event.target.value))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                CSS sẽ tạo ra
              </p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                <code className="break-all text-xs text-slate-800">
                  {customGradientValue}
                </code>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExpandedPanel(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => selectBackground("COLOR", customGradientValue)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Dùng màu này
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
