"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, BarChart3, ChevronDown, Loader2, Users } from "lucide-react";
import { getMyWorkspaces, type Member, type Workspace } from "@/lib/api/workspace";
import { getBoardsByWorkspace, type BoardMemberSummary } from "@/lib/api/board";
import { getTaskListsByBoardId, type BoardTask, type BoardTaskList } from "@/lib/api/task";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type BoardData = {
  id: string;
  name: string;
  taskLists: BoardTaskList[];
  tasks: BoardTask[];
  members: BoardMemberSummary[];
};

type ReportData = {
  workspace: Workspace;
  boards: BoardData[];
};

type ChartEntry = { label: string; value: number; color: string; key: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
  ARCHIVED: "Lưu trữ",
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Khẩn cấp",
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  DONE: "#10b981",
  ARCHIVED: "#6b7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#3b82f6",
  LOW: "#10b981",
};

const TOOLTIP_STYLE = { borderRadius: 12, border: "1px solid #e2e8f0" };

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function toStatusChart(tasks: BoardTask[]): ChartEntry[] {
  const counts: Record<string, number> = {};
  for (const t of tasks) {
    const s = t.status ?? "TODO";
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return Object.entries(counts).map(([key, value]) => ({
    label: STATUS_LABELS[key] ?? key,
    value,
    color: STATUS_COLORS[key] ?? "#94a3b8",
    key,
  }));
}

function toPriorityChart(tasks: BoardTask[]): ChartEntry[] {
  const counts: Record<string, number> = {};
  for (const t of tasks) {
    const p = t.priority ?? "MEDIUM";
    counts[p] = (counts[p] ?? 0) + 1;
  }
  return Object.entries(counts).map(([key, value]) => ({
    label: PRIORITY_LABELS[key] ?? key,
    value,
    color: PRIORITY_COLORS[key] ?? "#3b82f6",
    key,
  }));
}

function toMemberChart(
  tasks: BoardTask[],
  members: Member[],
): { member: string; uid: string; TODO: number; IN_PROGRESS: number; DONE: number; ARCHIVED: number; total: number }[] {
  const nameMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m.userId, m.fullName]),
  );
  type Row = { TODO: number; IN_PROGRESS: number; DONE: number; ARCHIVED: number };
  const rows: Record<string, Row> = {};
  for (const t of tasks) {
    for (const uid of t.assigneeIds ?? []) {
      if (!rows[uid]) rows[uid] = { TODO: 0, IN_PROGRESS: 0, DONE: 0, ARCHIVED: 0 };
      const s = (t.status ?? "TODO") as keyof Row;
      if (s in rows[uid]) rows[uid][s]++;
    }
  }
  return Object.entries(rows)
    .map(([uid, r]) => ({
      member: nameMap[uid] ?? uid.slice(0, 8),
      uid,
      ...r,
      total: r.TODO + r.IN_PROGRESS + r.DONE + r.ARCHIVED,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function countOverdue(tasks: BoardTask[]) {
  const now = new Date();
  return tasks.filter(
    (t) => t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < now,
  ).length;
}

type TimelinePoint = {
  date: string;
  isoDate: string;
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
  ARCHIVED: number;
};

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function buildTimelineData(
  tasks: BoardTask[],
  mode: "week" | "month",
  anchor: string,
): TimelinePoint[] {
  const pivot = new Date(anchor + "T00:00:00");
  const days: Date[] = [];

  if (mode === "week") {
    const dow = pivot.getDay();
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() - (dow === 0 ? 6 : dow - 1));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
  } else {
    const year = pivot.getFullYear();
    const month = pivot.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
  }

  return days.map((d) => {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label =
      mode === "week"
        ? `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const dayTasks = tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === iso);
    return {
      date: label,
      isoDate: iso,
      TODO: dayTasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: dayTasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: dayTasks.filter((t) => t.status === "DONE").length,
      ARCHIVED: dayTasks.filter((t) => t.status === "ARCHIVED").length,
    };
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const userId = useAuthStore((s) => s.user?.id);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsLoading, setWsLoading] = useState(true);
  const [selectedWsId, setSelectedWsId] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [timelineMode, setTimelineMode] = useState<"week" | "month">("week");
  const [timelineAnchor, setTimelineAnchor] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [memberStatusFilter, setMemberStatusFilter] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED">("ALL");

  // Load workspace list once
  useEffect(() => {
    getMyWorkspaces()
      .then(setWorkspaces)
      .catch(() => toast.error("Không thể tải danh sách workspace"))
      .finally(() => setWsLoading(false));
  }, []);

  // Fetch all board + task data when workspace is chosen
  async function handleWorkspaceChange(wsId: string) {
    if (!wsId) return;
    setSelectedWsId(wsId);
    setSelectedBoardId("");
    setReport(null);
    setReportLoading(true);
    try {
      const workspace = workspaces.find((w) => w.id === wsId)!;
      const boards = await getBoardsByWorkspace(wsId, userId).catch(
        () => workspace.boards ?? [],
      );
      const boardsData: BoardData[] = await Promise.all(
        boards.map(async (b) => {
          const taskLists = await getTaskListsByBoardId(b.id).catch(
            (): BoardTaskList[] => [],
          );
          return { id: b.id, name: b.name, taskLists, tasks: taskLists.flatMap((l) => l.tasks), members: (b as import("@/lib/api/board").BoardDetails).members ?? [] };
        }),
      );
      setReport({ workspace, boards: boardsData });
    } catch {
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setReportLoading(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const allTasks = useMemo(() => report?.boards.flatMap((b) => b.tasks) ?? [], [report]);
  const members = useMemo(() => report?.workspace.members ?? [], [report]);
  const selectedBoard = useMemo(
    () => report?.boards.find((b) => b.id === selectedBoardId) ?? null,
    [report, selectedBoardId],
  );

  // workspace charts
  const wsStatusData = useMemo(() => toStatusChart(allTasks), [allTasks]);
  const wsPriorityData = useMemo(() => toPriorityChart(allTasks), [allTasks]);
  const wsBoardData = useMemo(() => {
    if (!report) return [];
    const now = new Date();
    const wsNameMap: Record<string, string> = Object.fromEntries(
      members.map((m) => [m.userId, m.fullName]),
    );
    return report.boards.map((b) => {
      const todo = b.tasks.filter((t) => t.status === "TODO").length;
      const inProgress = b.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const done = b.tasks.filter((t) => t.status === "DONE").length;
      const archived = b.tasks.filter((t) => t.status === "ARCHIVED").length;
      const overdue = b.tasks.filter(
        (t) => t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < now,
      ).length;
      const admins = b.members
        .filter((m) => {
          const r = typeof m.role === "string" ? m.role.toUpperCase() : "";
          return r === "OWNER" || r === "ADMIN";
        })
        .map((m) => {
          const uid = m.userId ?? m.id;
          const wsM = uid ? members.find((w) => w.userId === uid) : undefined;
          return {
            name: m.fullName ?? wsM?.fullName ?? uid?.slice(0, 8) ?? "—",
            email: m.email ?? wsM?.email ?? "",
          };
        });
      return { id: b.id, name: b.name, tasks: b.tasks.length, todo, inProgress, done, archived, overdue, memberCount: b.members.length, admins };
    });
  }, [report, members]);

  // board charts
  const boardTasks = useMemo(() => selectedBoard?.tasks ?? [], [selectedBoard]);
  const boardStatusData = useMemo(() => toStatusChart(boardTasks), [boardTasks]);
  const boardPriorityData = useMemo(() => toPriorityChart(boardTasks), [boardTasks]);
  const boardMemberData = useMemo(
    () => toMemberChart(boardTasks, members),
    [boardTasks, members],
  );
  const boardMemberChartData = useMemo(() => {
    if (memberStatusFilter === "ALL") return boardMemberData;
    return boardMemberData
      .map((r) => ({ ...r, total: r[memberStatusFilter] }))
      .filter((r) => r.total > 0);
  }, [boardMemberData, memberStatusFilter]);
  const boardListData = useMemo(
    () =>
      selectedBoard?.taskLists.map((l) => ({
        name: l.name,
        TODO: l.tasks.filter((t) => t.status === "TODO").length,
        IN_PROGRESS: l.tasks.filter((t) => t.status === "IN_PROGRESS").length,
        DONE: l.tasks.filter((t) => t.status === "DONE").length,
        ARCHIVED: l.tasks.filter((t) => t.status === "ARCHIVED").length,
      })) ?? [],
    [selectedBoard],
  );

  const boardTimelineData = useMemo(
    () => buildTimelineData(boardTasks, timelineMode, timelineAnchor),
    [boardTasks, timelineMode, timelineAnchor],
  );

  const timelineRangeLabel = useMemo(() => {
    const pivot = new Date(timelineAnchor + "T00:00:00");
    if (timelineMode === "month") {
      return pivot.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
    }
    const dow = pivot.getDay();
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – ${sunday.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  }, [timelineMode, timelineAnchor]);

  const boardMemberList = useMemo(() => {
    const nameMap: Record<string, string> = Object.fromEntries(
      members.map((m) => [m.userId, m.fullName]),
    );
    const countByUid: Record<string, number> = {};
    for (const t of boardTasks) {
      for (const uid of t.assigneeIds ?? []) {
        countByUid[uid] = (countByUid[uid] ?? 0) + 1;
      }
    }
    return (selectedBoard?.members ?? []).map((m) => {
      const uid = (m.userId ?? m.id) as string;
      const wsM = members.find((w) => w.userId === uid);
      return {
        id: uid,
        name: m.fullName ?? nameMap[uid] ?? wsM?.fullName ?? "—",
        email: m.email ?? wsM?.email ?? "",
        role: typeof m.role === "string" ? m.role : "MEMBER",
        tasks: countByUid[uid] ?? 0,
      };
    });
  }, [selectedBoard, members, boardTasks]);

  // KPIs
  const wsTotal = allTasks.length;
  const wsDone = allTasks.filter((t) => t.status === "DONE").length;
  const wsRate = wsTotal > 0 ? Math.round((wsDone / wsTotal) * 100) : 0;
  const wsOverdue = useMemo(() => countOverdue(allTasks), [allTasks]);

  const boardTotal = boardTasks.length;
  const boardDone = boardTasks.filter((t) => t.status === "DONE").length;
  const boardRate = boardTotal > 0 ? Math.round((boardDone / boardTotal) * 100) : 0;
  const boardOverdue = useMemo(() => countOverdue(boardTasks), [boardTasks]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ overflowX: "clip" }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo & Phân tích
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {selectedBoard
              ? `${report?.workspace.name} / ${selectedBoard.name}`
              : report
                ? report.workspace.name
                : "Chọn workspace để bắt đầu xem báo cáo"}
          </p>
        </div>

        <WsSelector
          value={selectedWsId}
          workspaces={workspaces}
          loading={wsLoading}
          onChange={(wsId) => void handleWorkspaceChange(wsId)}
        />
      </div>

      {/* Loading */}
      {reportLoading && (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-3 h-7 w-7 animate-spin text-blue-500" />
          Đang tải dữ liệu...
        </div>
      )}

      {/* Empty prompt */}
      {!reportLoading && !report && (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400">
          <BarChart3 size={52} className="mb-4 opacity-20" />
          <p className="font-medium text-slate-500">Chọn workspace để xem báo cáo</p>
          <p className="mt-1 text-sm">
            Xem tổng quan workspace hoặc đi sâu vào từng board
          </p>
        </div>
      )}

      {/* ─── WORKSPACE OVERVIEW ─── */}
      {!reportLoading && report && !selectedBoardId && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Tổng công việc"
              value={wsTotal}
              sub={`${report.boards.length} boards`}
              color="blue"
            />
            <KpiCard
              label="Tỷ lệ hoàn thành"
              value={`${wsRate}%`}
              sub={`${wsDone} / ${wsTotal} tasks`}
              color="emerald"
            />
            <KpiCard
              label="Quá hạn"
              value={wsOverdue}
              sub="công việc chưa xong"
              color="red"
            />
            <KpiCard
              label="Thành viên workspace"
              value={members.length}
              sub="người dùng đang tham gia"
              color="violet"
            />
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Công việc theo trạng thái">
              <div style={{ overflow: "hidden" }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={wsStatusData} margin={{ top: 8, right: 24, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Công việc" radius={[8, 8, 0, 0]} barSize={44}>
                      {wsStatusData.map((e) => <Cell key={e.key} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Phân bổ theo mức độ ưu tiên">
              <DonutChart data={wsPriorityData} total={wsTotal} />
            </ChartCard>
          </div>

          {/* Board overview table */}
          <ChartCard title="Tổng quan các board — nhấp vào hàng để xem chi tiết">
            {wsBoardData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-6">Board</th>
                      <th className="pb-3 pr-6">Người phụ trách</th>
                      <th className="pb-3 pr-4 text-center">Thành viên</th>
                      <th className="pb-3 pr-4 text-center">Chờ xử lý</th>
                      <th className="pb-3 pr-4 text-center">Đang làm</th>
                      <th className="pb-3 pr-4 text-center">Hoàn thành</th>
                      <th className="pb-3 pr-4 text-center">Quá hạn</th>
                      <th className="pb-3 pr-4 text-center">Tổng</th>
                      <th className="pb-3 text-right">Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {wsBoardData.map((b) => {
                      const rate = b.tasks > 0 ? Math.round((b.done / b.tasks) * 100) : 0;
                      return (
                        <tr
                          key={b.id}
                          className="group cursor-pointer transition-colors hover:bg-blue-50/40"
                          onClick={() => setSelectedBoardId(b.id)}
                        >
                          <td className="py-3 pr-6">
                            <span className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                              {b.name}
                            </span>
                          </td>
                          <td className="py-3 pr-6">
                            {b.admins.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {b.admins.map((a, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex flex-col rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 leading-tight"
                                  >
                                    <span className="text-xs font-semibold text-indigo-800">{a.name}</span>
                                    {a.email && (
                                      <span className="text-[10px] text-indigo-500">{a.email}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Users size={12} />{b.memberCount}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              {b.todo}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {b.inProgress}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              {b.done}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {b.overdue > 0 ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                {b.overdue}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center font-semibold text-slate-700">
                            {b.tasks}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="w-9 text-right text-xs font-semibold text-slate-600">
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                Workspace này chưa có board
              </p>
            )}
          </ChartCard>
        </>
      )}

      {/* ─── BOARD DETAIL ─── */}
      {!reportLoading && report && selectedBoardId && selectedBoard && (
        <>
          {/* Board nav: back + switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedBoardId("")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <ArrowLeft size={15} /> Về workspace
            </button>
            <span className="text-slate-300">/</span>
            <div className="relative">
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {report.boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Tổng công việc"
              value={boardTotal}
              sub={`${selectedBoard.taskLists.length} danh sách`}
              color="blue"
            />
            <KpiCard
              label="Tỷ lệ hoàn thành"
              value={`${boardRate}%`}
              sub={`${boardDone} / ${boardTotal} tasks`}
              color="emerald"
            />
            <KpiCard
              label="Quá hạn"
              value={boardOverdue}
              sub="công việc chưa xong"
              color="red"
            />
            <KpiCard
              label="Thành viên board"
              value={selectedBoard.members.length}
              sub="đang tham gia board này"
              color="violet"
            />
          </div>

          {/* Member list */}
          {boardMemberList.length > 0 && (
            <ChartCard title="Danh sách thành viên board">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Thành viên</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Vai trò</th>
                      <th className="pb-3 text-right">Công việc phụ trách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {boardMemberList.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{m.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{m.email || "—"}</td>
                        <td className="py-3 pr-4">
                          <RoleBadge role={m.role} />
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-semibold text-slate-700">{m.tasks}</span>
                          <span className="ml-1 text-slate-400">tasks</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Công việc theo trạng thái">
              <div style={{ overflow: "hidden" }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={boardStatusData} margin={{ top: 8, right: 24, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Công việc" radius={[8, 8, 0, 0]} barSize={44}>
                      {boardStatusData.map((e) => <Cell key={e.key} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Phân bổ theo mức độ ưu tiên">
              <DonutChart data={boardPriorityData} total={boardTotal} />
            </ChartCard>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Khối lượng công việc theo thành viên">
              {/* Filter tabs */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(["ALL", "TODO", "IN_PROGRESS", "DONE", "ARCHIVED"] as const).map((f) => {
                  const label = f === "ALL" ? "Tất cả" : STATUS_LABELS[f];
                  const active = memberStatusFilter === f;
                  const dotColor = f === "ALL" ? "#8b5cf6" : STATUS_COLORS[f];
                  return (
                    <button
                      key={f}
                      onClick={() => setMemberStatusFilter(f)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-transparent bg-violet-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {!active && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              {boardMemberChartData.length > 0 ? (
                <div className="overflow-x-auto" style={{ overflowY: "clip" }}>
                  <div style={{ minWidth: `${Math.max(320, boardMemberChartData.length * 36)}px`, overflow: "hidden" }}>
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(200, boardMemberChartData.length * 44)}
                    >
                      <BarChart
                        data={boardMemberChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="member"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(v, k) => [v, k === "total" ? STATUS_LABELS[memberStatusFilter] ?? "Tổng" : STATUS_LABELS[String(k)] ?? String(k)]}
                        />
                        {memberStatusFilter === "ALL" ? (
                          <>
                            <Legend
                              formatter={(v) => STATUS_LABELS[String(v)] ?? String(v)}
                              wrapperStyle={{ fontSize: 12 }}
                            />
                            <Bar dataKey="TODO" stackId="s" fill={STATUS_COLORS.TODO} barSize={22} />
                            <Bar dataKey="IN_PROGRESS" stackId="s" fill={STATUS_COLORS.IN_PROGRESS} barSize={22} />
                            <Bar dataKey="DONE" stackId="s" fill={STATUS_COLORS.DONE} barSize={22} />
                            <Bar dataKey="ARCHIVED" stackId="s" fill={STATUS_COLORS.ARCHIVED} radius={[0, 6, 6, 0]} barSize={22} />
                          </>
                        ) : (
                          <Bar
                            dataKey="total"
                            fill={STATUS_COLORS[memberStatusFilter]}
                            radius={[0, 8, 8, 0]}
                            barSize={22}
                            label={{ position: "right", fontSize: 11, fill: "#64748b" }}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <EmptyState label="Không có công việc nào ở trạng thái này" />
              )}
            </ChartCard>

            <ChartCard title="Phân bổ công việc theo danh sách">
              {boardListData.length > 0 ? (
                <div className="overflow-x-auto" style={{ overflowY: "clip" }}>
                  <div style={{ minWidth: `${Math.max(480, boardListData.length * 120)}px`, overflow: "hidden" }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={boardListData} barCategoryGap="30%" margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend formatter={(v) => STATUS_LABELS[String(v)] ?? String(v)} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="TODO" fill={STATUS_COLORS.TODO} radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="IN_PROGRESS" fill={STATUS_COLORS.IN_PROGRESS} radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="DONE" fill={STATUS_COLORS.DONE} radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="ARCHIVED" fill={STATUS_COLORS.ARCHIVED} radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <EmptyState label="Board này chưa có danh sách" />
              )}
            </ChartCard>
          </div>

          {/* Timeline chart */}
          <ChartCard title="Xu hướng công việc theo deadline">
            {/* Controls */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["week", "month"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTimelineMode(m)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      timelineMode === m
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {m === "week" ? "Theo tuần" : "Theo tháng"}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={timelineAnchor}
                onChange={(e) => e.target.value && setTimelineAnchor(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <span className="text-sm font-medium text-slate-600">{timelineRangeLabel}</span>
            </div>

            {/* Chart */}
            <div className="overflow-x-auto" style={{ overflowY: "clip" }}>
              <div
                style={{
                  minWidth:
                    boardTimelineData.length > 7
                      ? `${boardTimelineData.length * 52}px`
                      : "100%",
                  overflow: "hidden",
                }}
              >
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={boardTimelineData}
                    margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v, k) => [v, STATUS_LABELS[String(k)] ?? String(k)]}
                    />
                    <Legend
                      formatter={(v) => STATUS_LABELS[String(v)] ?? String(v)}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="TODO"
                      stroke={STATUS_COLORS.TODO}
                      strokeWidth={2}
                      dot={boardTimelineData.length <= 7}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="IN_PROGRESS"
                      stroke={STATUS_COLORS.IN_PROGRESS}
                      strokeWidth={2}
                      dot={boardTimelineData.length <= 7}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="DONE"
                      stroke={STATUS_COLORS.DONE}
                      strokeWidth={2}
                      dot={boardTimelineData.length <= 7}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ARCHIVED"
                      stroke={STATUS_COLORS.ARCHIVED}
                      strokeWidth={2}
                      dot={boardTimelineData.length <= 7}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WsSelector({
  value,
  workspaces,
  loading,
  onChange,
}: {
  value: string;
  workspaces: Workspace[];
  loading: boolean;
  onChange: (id: string) => void;
}) {
  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <option value="">Chọn workspace...</option>
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>{ws.name}</option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: "blue" | "emerald" | "red" | "violet";
}) {
  const cls = { blue: "text-blue-600", emerald: "text-emerald-600", red: "text-red-500", violet: "text-violet-600" }[color];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${cls}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </article>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </article>
  );
}

function DonutChart({
  data,
  total,
}: {
  data: ChartEntry[];
  total: number;
}) {
  return (
    <div className="flex h-65 items-center justify-center gap-8">
      <div className="relative h-44 w-44 shrink-0" style={{ overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">công việc</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <span className="ml-2 font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const upper = role.toUpperCase();
  const styles: Record<string, string> = {
    OWNER: "bg-amber-100 text-amber-700",
    ADMIN: "bg-blue-100 text-blue-700",
    MEMBER: "bg-slate-100 text-slate-600",
    VIEWER: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MEMBER: "Thành viên",
    VIEWER: "Người xem",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[upper] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[upper] ?? role}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-65 items-center justify-center text-sm text-slate-400">
      {label}
    </div>
  );
}
