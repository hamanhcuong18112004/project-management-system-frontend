"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StatusItem = {
  label: string;
  value: number;
};

type PriorityItem = {
  label: string;
  value: number;
  color: string;
};

type WorkloadItem = {
  member: string;
  tasks: number;
};

type WeeklyPoint = {
  week: string;
  completed: number;
  created: number;
};

const REPORT_SCOPE = "Tổng quan hiệu suất làm việc của Phòng Kế toán";

const TOTAL_TASKS = 15;
const COMPLETION_RATE = 26;
const AVG_FINISH_DAYS = 3.2;

const STATUS_DATA: StatusItem[] = [
  { label: "Chưa phân loại", value: 3 },
  { label: "Đang thực hiện", value: 5 },
  { label: "Đang xem xét", value: 3 },
  { label: "Hoàn thành", value: 4 },
];

const PRIORITY_DATA: PriorityItem[] = [
  { label: "Cao", value: 5, color: "#ef4444" },
  { label: "Trung bình", value: 4, color: "#f59e0b" },
  { label: "Thấp", value: 6, color: "#10b981" },
];

const WORKLOAD_DATA: WorkloadItem[] = [
  { member: "Mạnh", tasks: 8 },
  { member: "Phương", tasks: 6 },
  { member: "Vân", tasks: 5 },
  { member: "Như", tasks: 4 },
  { member: "Huỳnh", tasks: 7 },
];

const WEEKLY_DATA: WeeklyPoint[] = [
  { week: "Tuần 1", completed: 2, created: 5 },
  { week: "Tuần 2", completed: 4, created: 3 },
  { week: "Tuần 3", completed: 3, created: 4 },
  { week: "Tuần 4", completed: 6, created: 2 },
];

const PRIORITY_TOTAL = PRIORITY_DATA.reduce((sum, item) => sum + item.value, 0);

const CHART_COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  slate: "#cbd5e1",
};

export default function ReportsPage() {
  const maxWorkload = Math.max(...WORKLOAD_DATA.map((item) => item.tasks));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo & Phân tích</h1>
        <p className="mt-1 text-sm text-slate-500">{REPORT_SCOPE}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tổng công việc</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{TOTAL_TASKS}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tỷ lệ hoàn thành</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{COMPLETION_RATE}%</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Thời gian TB hoàn thành</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-amber-600">{AVG_FINISH_DAYS}</p>
            <span className="text-sm font-medium text-slate-500">ngày</span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Công việc theo trạng thái</h2>
          <div className="mt-5 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STATUS_DATA} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="value" fill={CHART_COLORS.blue} radius={[10, 10, 0, 0]} barSize={44}>
                  {STATUS_DATA.map((entry) => (
                    <Cell key={entry.label} fill={CHART_COLORS.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Phân bổ theo mức độ ưu tiên</h2>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
            <div className="relative h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PRIORITY_DATA}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {PRIORITY_DATA.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">{PRIORITY_TOTAL}</p>
                  <p className="text-xs text-slate-500">công việc</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {PRIORITY_DATA.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Khối lượng công việc theo thành viên</h2>
          <div className="mt-6 space-y-4">
            {WORKLOAD_DATA.map((item) => (
              <div key={item.member} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
                <span className="text-sm text-slate-600">{item.member}</span>
                <div className="h-3 w-full rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${(item.tasks / maxWorkload) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm font-semibold text-slate-900">{item.tasks}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Tiến độ theo tuần (Tháng này)</h2>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Hoàn thành
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Thêm mới
            </span>
          </div>

          <div className="mt-4 h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={CHART_COLORS.emerald}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Hoàn thành"
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHART_COLORS.blue, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Thêm mới"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
