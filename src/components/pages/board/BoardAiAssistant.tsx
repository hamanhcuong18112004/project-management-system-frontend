"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Kanban,
  List,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  getWorkspaceTaskRecommendations,
  type AiRecommendedTaskItem,
  type WorkspaceTaskRecommendation,
} from "@/lib/api/ai";
import { getApiErrorMessage } from "@/lib/api/error";

interface BoardAiAssistantProps {
  boardId: string;
  boardName: string;
  workspaceId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "Không có deadline";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

function priorityLabel(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "URGENT": return "Khẩn cấp";
    case "HIGH":   return "Cao";
    case "MEDIUM": return "Trung bình";
    case "LOW":    return "Thấp";
    default:       return priority || "—";
  }
}

function priorityClass(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "URGENT": return "bg-rose-100 text-rose-700";
    case "HIGH":   return "bg-orange-100 text-orange-700";
    case "MEDIUM": return "bg-amber-100 text-amber-700";
    case "LOW":    return "bg-emerald-100 text-emerald-700";
    default:       return "bg-slate-100 text-slate-600";
  }
}

function statusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "TODO":        return "Cần làm";
    case "IN_PROGRESS": return "Đang làm";
    case "DONE":        return "Hoàn thành";
    case "ARCHIVED":    return "Lưu trữ";
    default:            return status || "—";
  }
}

function scoreColor(score: number): string {
  if (score >= 150) return "bg-rose-600 text-white";
  if (score >= 100) return "bg-orange-500 text-white";
  if (score >= 60)  return "bg-amber-400 text-white";
  return "bg-slate-700 text-white";
}

// ── Sub-component: Task card ──────────────────────────────────────────────────

function RecommendationItem({
  item,
  currentBoardId,
  rank,
}: {
  item: AiRecommendedTaskItem;
  currentBoardId: string;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCurrentBoard = item.boardId === currentBoardId;
  const overdue = isOverdue(item.dueDate);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {/* Rank */}
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              rank <= 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {rank}
          </span>
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {item.title}
          </h4>
        </div>
        {/* Score badge */}
        <span className={`shrink-0 rounded-xl px-2 py-0.5 text-xs font-bold ${scoreColor(item.score)}`}>
          {item.score}
        </span>
      </div>

      {/* Tags row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className={`rounded-lg px-2 py-0.5 font-semibold ${priorityClass(item.priority)}`}>
          <Flag size={9} className="mr-1 inline" />
          {priorityLabel(item.priority)}
        </span>
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {statusLabel(item.status)}
        </span>
        {isCurrentBoard && (
          <span className="rounded-lg bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
            Board hiện tại
          </span>
        )}
      </div>

      {/* Context */}
      <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
        <p className="flex items-center gap-1">
          <Kanban size={10} className="shrink-0" />
          {item.boardName}
          <span className="text-slate-300">/</span>
          <List size={10} className="shrink-0" />
          {item.taskListName}
        </p>
        <p className={`flex items-center gap-1 ${overdue ? "font-semibold text-rose-600" : ""}`}>
          <Clock size={10} className="shrink-0" />
          {overdue ? "⚠ Quá hạn: " : ""}
          {formatDateLabel(item.dueDate)}
        </p>
      </div>

      {/* Expand reasons */}
      {item.reasons.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((s) => !s)}
          className="mt-2 flex w-full items-center gap-1 rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <TrendingUp size={10} />
          {expanded ? "Ẩn lý do" : "Xem lý do"}
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}
      {expanded && item.reasons.length > 0 && (
        <ul className="mt-1.5 space-y-1 rounded-xl bg-blue-50 px-3 py-2">
          {item.reasons.map((reason) => (
            <li key={reason} className="text-[11px] text-blue-800">
              • {reason}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BoardAiAssistant({
  boardId,
  boardName,
  workspaceId,
}: BoardAiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkspaceTaskRecommendation | null>(null);
  const [limit, setLimit] = useState(10);

  // Reset khi đổi board/workspace
  useEffect(() => {
    setError(null);
    setResult(null);
  }, [boardId, workspaceId]);

  const currentBoardHits = useMemo(() => {
    if (!result) return 0;
    return result.recommendedTasks.filter((task) => task.boardId === boardId).length;
  }, [boardId, result]);

  const generatedTime = useMemo(() => {
    if (!result?.generatedAt) return null;
    const date = new Date(result.generatedAt);
    if (Number.isNaN(date.getTime())) return result.generatedAt;
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }, [result?.generatedAt]);

  const handleGenerate = async () => {
    if (!workspaceId) {
      setError("Board này chưa có workspace ID. Vui lòng thử lại sau.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recommendation = await getWorkspaceTaskRecommendations(workspaceId, limit);
      setResult(recommendation);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Không thể lấy gợi ý từ AI. Hãy đảm bảo Ollama đang chạy.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        id="btn-board-ai-assistant"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-xl shadow-slate-300/50 transition hover:bg-white hover:shadow-2xl active:scale-95"
      >
        <Bot size={18} className="text-sky-600" />
        AI Gợi ý
        {result && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
            {result.recommendedTasks.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <aside className="fixed bottom-24 right-6 z-30 flex w-96 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/95 shadow-2xl shadow-slate-400/35 backdrop-blur-xl">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                <Bot size={16} className="text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  AI Assistant
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  Gợi ý công việc ưu tiên
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng AI assistant"
            >
              <X size={16} />
            </button>
          </header>

          {/* Body */}
          <div className="flex flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {/* Board info */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">📋 {boardName}</p>
              <p className="mt-0.5 text-slate-500">
                AI sẽ phân tích toàn bộ task trong workspace và gợi ý theo độ ưu tiên, deadline.
              </p>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Số gợi ý
                </label>
                <select
                  id="ai-limit-select"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} task</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <button
                  id="btn-ai-generate"
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={loading || !workspaceId}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {loading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : result ? (
                    <RefreshCw size={13} />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {loading ? "Đang phân tích..." : result ? "Làm mới" : "Lấy gợi ý"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                ⚠️ {error}
              </div>
            )}

            {/* Results */}
            {result ? (
              <section className="space-y-3">
                {/* Summary card */}
                <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-xs text-slate-700">
                  <p className="mb-1 font-semibold text-violet-800">🤖 Tóm tắt từ AI</p>
                  <p className="leading-relaxed text-slate-600">
                    {result.summary || "Không có tóm tắt."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-slate-500">
                      {result.model}
                    </span>
                    <span className="rounded-lg bg-sky-100 px-1.5 py-0.5 text-sky-600">
                      Board này: {currentBoardHits} task
                    </span>
                    {generatedTime && (
                      <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-slate-500">
                        Lúc {generatedTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Task list */}
                {result.recommendedTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400">
                    AI không trả về task nào cần ưu tiên.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.recommendedTasks.map((item, index) => (
                      <RecommendationItem
                        key={item.taskId}
                        item={item}
                        currentBoardId={boardId}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              !loading && !error && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-400">
                  Nhấn &quot;Lấy gợi ý&quot; để AI phân tích công việc.
                </div>
              )
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white"
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
