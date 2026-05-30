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
  FolderKanban,
} from "lucide-react";
import {
  getWorkspaceTaskRecommendations,
  generateProjectTasks,
  analyzeProjectProgress,
  type AiRecommendedTaskItem,
  type WorkspaceTaskRecommendation,
  type AiGeneratedProject,
} from "@/lib/api/ai";
import {
  createTaskList,
  createTask,
  getTaskListsByBoardId,
  createTaskChecklist,
  addChecklistItem,
  type BoardTaskList,
} from "@/lib/api/task";
import { type BoardMemberSummary } from "@/lib/api/board";
import { getApiErrorMessage } from "@/lib/api/error";
import { toast } from "sonner";
import { useRealtime } from "@/providers/RealtimeProvider";

interface BoardAiAssistantProps {
  boardId: string;
  boardName: string;
  workspaceId?: string;
  taskLists?: BoardTaskList[];
  boardMembers?: BoardMemberSummary[];
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
    case "HIGHEST": return "Rất cao";
    case "HIGH":   return "Cao";
    case "MEDIUM": return "Trung bình";
    case "LOW":    return "Thấp";
    case "LOWEST": return "Rất thấp";
    case "NONE":   return "Không";
    default:       return priority || "—";
  }
}

function priorityClass(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "URGENT": return "bg-rose-100 text-rose-700";
    case "HIGHEST": return "bg-orange-100 text-orange-700";
    case "HIGH":   return "bg-yellow-100 text-yellow-800";
    case "MEDIUM": return "bg-blue-100 text-blue-700";
    case "LOW":    return "bg-emerald-100 text-emerald-700";
    case "LOWEST": return "bg-indigo-100 text-indigo-700";
    case "NONE":   return "bg-zinc-100 text-zinc-600";
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
  taskLists = [],
  boardMembers = [],
}: BoardAiAssistantProps) {
  const { emitBoardUpdated } = useRealtime();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"priority" | "generate" | "analyze">("priority");

  // Priority tab state
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkspaceTaskRecommendation | null>(null);
  const [limit, setLimit] = useState(10);

  // Generate tab state
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<AiGeneratedProject | null>(null);
  const [creating, setCreating] = useState(false);

  // Analyze tab state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyzeProgress = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisReport(null);

    try {
      const report = await analyzeProjectProgress(boardId);
      setAnalysisReport(report);
    } catch (err: any) {
      setAnalysisError(
        getApiErrorMessage(
          err,
          "Không thể phân tích tiến độ dự án bằng AI. Vui lòng kiểm tra lại dịch vụ."
        )
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Reset when swapping board/workspace
  useEffect(() => {
    setError(null);
    setResult(null);
    setGeneratedProject(null);
    setDescription("");
    setAnalysisReport(null);
    setAnalysisError(null);
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

      // Check if the AI returned an error in the summary
      if (
        recommendation.recommendedTasks.length === 0 &&
        recommendation.summary &&
        (recommendation.summary.toLowerCase().includes("khong the") ||
         recommendation.summary.toLowerCase().includes("không thể"))
      ) {
        setError(
          "AI không thể tải dữ liệu task. Hãy đảm bảo các service (board-service, task-service) đang hoạt động.",
        );
        setResult(null);
      } else {
        setResult(recommendation);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Không thể lấy gợi ý từ AI. Hãy đảm bảo AI service và Ollama đang chạy.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProject = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const project = await generateProjectTasks(description.trim(), boardId);
      if (!project || !project.lists || project.lists.length === 0) {
        throw new Error("Không thể tạo quy trình từ mô tả này. Vui lòng nhập mô tả chi tiết hơn.");
      }
      setGeneratedProject(project);
      toast.success("AI đã phác thảo xong quy trình công việc!");
    } catch (err: any) {
      setError(err?.message || "Không thể sinh quy trình bằng AI. Vui lòng kiểm tra lại dịch vụ AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyProject = async () => {
    if (!generatedProject) return;
    setCreating(true);
    setError(null);
    try {
      // 1. Get existing task lists on this board
      const existingLists = await getTaskListsByBoardId(boardId);

      // 2. Iterate and create lists & tasks
      let listCount = 0;
      let taskCount = 0;

      for (const list of [...generatedProject.lists].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))) {
        // Find if this list already exists (case-insensitive)
        const matchedList = existingLists.find(
          (el) => el.name.trim().toLowerCase() === list.name.trim().toLowerCase()
        );

        let listId = "";
        if (matchedList) {
          listId = matchedList.id;
        } else {
          // Create the new list
          const createdList = await createTaskList({
            boardId,
            name: list.name,
            position: (existingLists.length + listCount) * 1000 + 1000,
          });
          listId = createdList.id;
          listCount++;
        }

        // Create tasks inside this list
        for (const task of list.tasks) {
          // Format rich description with acceptance criteria
          const descParts: string[] = [];
          if (task.description) {
            descParts.push(task.description);
          }
          if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
            descParts.push("Điều kiện nghiệm thu (Acceptance Criteria):");
            task.acceptanceCriteria.forEach((ac: string) => descParts.push(`- ${ac}`));
          }
          const finalDescription = descParts.join("\n\n");

          const createdTask = await createTask({
            taskListId: listId,
            title: task.title,
            description: finalDescription,
            status: task.status as any,
            priority: task.priority as any,
          });

          // Create checklist if present
          if (task.checklists && task.checklists.length > 0 && createdTask && createdTask.id) {
            try {
              const checklist = await createTaskChecklist(createdTask.id, "Tiến độ thực hiện");
              if (checklist && checklist.id) {
                for (const item of task.checklists) {
                  await addChecklistItem(checklist.id, item);
                }
              }
            } catch (chkErr) {
              console.error("Failed to populate checklists for task:", createdTask.id, chkErr);
            }
          }

          taskCount++;
        }
      }

      toast.success(`Đã tự động tạo thành công ${listCount} danh sách và ${taskCount} thẻ công việc bằng AI!`);
      
      // Close the assistant
      setOpen(false);
      setGeneratedProject(null);
      setDescription("");

      // Notify other clients via WebSockets
      emitBoardUpdated();

      // Instantly reload to update the board state
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tạo danh sách/thẻ công việc.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        id="btn-board-ai-assistant"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-sky-200 bg-white/95 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800 shadow-xl shadow-slate-300/50 transition hover:bg-white hover:shadow-2xl active:scale-95"
      >
        <Bot size={16} className="text-sky-600 sm:w-[18px] sm:h-[18px]" />
        AI Trợ lý
        {result && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
            {result.recommendedTasks.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <aside className="fixed z-30 flex flex-col overflow-hidden border border-slate-200 bg-slate-50/95 shadow-2xl shadow-slate-400/35 backdrop-blur-xl
          bottom-24 right-6 w-96 max-w-[calc(100vw-1.5rem)] rounded-3xl h-[520px] max-h-[calc(100vh-8rem)]
          max-sm:top-16 max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:h-auto
        ">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                <Bot size={16} className="text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  AI Assistant
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  Trợ lý dự án AI
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

          {/* Navigation tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4 shrink-0 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("priority")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                activeTab === "priority"
                  ? "border-sky-500 text-sky-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Gợi ý ưu tiên
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                activeTab === "generate"
                  ? "border-sky-500 text-sky-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Tạo task tự động
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analyze")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                activeTab === "analyze"
                  ? "border-sky-500 text-sky-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Phân tích tiến độ
            </button>
          </div>

          {/* Active Tab Panel Body */}
          {activeTab === "priority" ? (
            /* Tab 1: Priority Recommendations */
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto p-4">
              {/* Board info */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs text-slate-700 shrink-0">
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
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 shrink-0">
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
          ) : activeTab === "generate" ? (
            /* Tab 2: Auto-create Tasks from Description */
            !generatedProject ? (
              /* State 2.1: Input description */
              <div className="flex-1 min-h-0 flex flex-col gap-3 p-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs text-slate-700 shrink-0">
                  <p className="font-semibold text-slate-900">🪄 Tự động tạo task bằng AI</p>
                  <p className="mt-0.5 text-slate-500">
                    Nhập mô tả dự án của bạn (ví dụ: các tính năng, yêu cầu, phạm vi). AI sẽ tự động phân tích và chia thành các cột và thẻ công việc chuẩn tương ứng cho Board này!
                  </p>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Mô tả dự án hoặc yêu cầu
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ví dụ: Xây dựng website bán hàng gồm đăng nhập, quản lý sản phẩm, giỏ hàng, thanh toán VNPay..."
                    className="w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 min-h-[100px]"
                  />
                </div>

                {/* Error inside tab */}
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shrink-0">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateProject}
                  disabled={generating || !description.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 shrink-0"
                >
                  {generating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {generating ? "AI đang thiết kế quy trình..." : "Tạo quy trình bằng AI"}
                </button>
              </div>
            ) : (
              /* State 2.2: Preview and Apply */
              <div className="flex-1 min-h-0 flex flex-col gap-3 p-4">
                <div className="rounded-2xl border border-lime-100 bg-lime-50/80 px-3 py-2 text-xs text-slate-700 shrink-0">
                  <p className="font-semibold text-lime-850">✅ Đã thiết kế xong quy trình!</p>
                  <p className="mt-0.5 text-slate-500">
                    Dưới đây là sơ đồ danh sách và công việc do AI gợi ý. Bạn có thể nhấn &quot;Xác nhận tạo vào Board&quot; để áp dụng ngay.
                  </p>
                </div>

                {/* Sơ đồ hiển thị quy trình */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                  {[...generatedProject.lists]
                    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
                    .map((list, lIdx) => (
                    <div key={lIdx} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center justify-between">
                        <span>📂 {list.name}</span>
                        <span className="text-[10px] font-normal text-slate-400">({list.tasks.length} thẻ)</span>
                      </h4>
                      {list.tasks.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-1 pl-1">Không có thẻ nào</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {list.tasks.map((task, tIdx) => (
                            <li key={tIdx} className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-700 border border-slate-100/50">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">{task.title}</span>
                                <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                  task.priority === "URGENT" || task.priority === "HIGH" || task.priority === "HIGHEST"
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {priorityLabel(task.priority)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {task.moduleName && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 font-medium">
                                    🧩 {task.moduleName}
                                  </span>
                                )}
                                {task.storyPoints != null && task.storyPoints > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 font-medium">
                                    🎯 {task.storyPoints} SP
                                  </span>
                                )}
                                {task.estimatedHours != null && task.estimatedHours > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
                                    ⏱ {task.estimatedHours}h
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {/* Error inside tab */}
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shrink-0">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedProject(null);
                      setError(null);
                    }}
                    disabled={creating}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    Làm lại
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyProject}
                    disabled={creating}
                    className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 active:scale-95"
                  >
                    {creating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {creating ? "Đang tạo công việc..." : "Xác nhận tạo vào Board"}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Tab 3: Project Progress Analysis */
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto p-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs text-slate-700 shrink-0">
                <p className="font-semibold text-slate-900">Phân tích tiến độ dự án</p>
                <p className="mt-0.5 text-slate-500">
                  AI sẽ đánh giá tiến độ dựa trên tổng số task, task hoàn thành, quá hạn và phân tải của từng thành viên.
                </p>
              </div>

              {/* Stats Summary Panel */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tổng số task</span>
                  <p className="text-xl font-bold text-slate-900">
                    {(() => {
                      let t = 0;
                      taskLists.forEach(l => t += l.tasks.length);
                      return t;
                    })()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hoàn thành</span>
                  <p className="text-xl font-bold text-emerald-600">
                    {(() => {
                      let c = 0;
                      taskLists.forEach(l => {
                        const isDone = l.name.trim().toLowerCase() === "hoàn thành";
                        l.tasks.forEach(t => {
                          if (t.status === "DONE" || isDone) c++;
                        });
                      });
                      return c;
                    })()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quá hạn</span>
                  <p className="text-xl font-bold text-rose-600">
                    {(() => {
                      let o = 0;
                      const now = new Date();
                      taskLists.forEach(l => {
                        const isDone = l.name.trim().toLowerCase() === "hoàn thành";
                        l.tasks.forEach(t => {
                          if (t.status !== "DONE" && !isDone && t.dueDate) {
                            const due = new Date(t.dueDate);
                            if (!Number.isNaN(due.getTime()) && due < now) o++;
                          }
                        });
                      });
                      return o;
                    })()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Thành viên</span>
                  <p className="text-xl font-bold text-blue-600">{boardMembers.length}</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAnalyzeProgress}
                disabled={analyzing}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 active:scale-95 shrink-0"
              >
                {analyzing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <TrendingUp size={13} />
                )}
                {analyzing ? "AI đang phân tích..." : "Phân tích bằng AI"}
              </button>

              {/* Error */}
              {analysisError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shrink-0">
                  ⚠️ {analysisError}
                </div>
              )}

              {/* Report Display */}
              {analysisReport && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 text-xs text-slate-700">
                  <p className="mb-2 font-bold text-violet-800 text-[13px] flex items-center gap-1.5">
                    🤖 Báo cáo phân tích của AI
                  </p>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium space-y-1.5">
                    {analysisReport}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      )}
    </>
  );
}
