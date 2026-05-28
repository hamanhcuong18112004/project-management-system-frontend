import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

const highlights = [
  {
    icon: FolderKanban,
    title: "Quản lý dự án trực quan",
    description: "Tổ chức workspace, board, danh sách và task theo một luồng làm việc rõ ràng.",
  },
  {
    icon: CalendarClock,
    title: "Theo dõi deadline",
    description: "Nắm nhanh việc hôm nay, việc sắp đến hạn và các đầu việc quá hạn cần xử lý.",
  },
  {
    icon: Bot,
    title: "AI gợi ý ưu tiên",
    description: "Xếp hạng công việc theo mức độ ưu tiên, thời hạn và áp lực thực thi.",
  },
  {
    icon: Users,
    title: "Cộng tác theo thời gian thực",
    description: "Cập nhật task, bình luận, thành viên và thông báo ngay trong cùng một hệ thống.",
  },
];

const stats = [
  { value: "7", label: "mức độ ưu tiên" },
  { value: "Realtime", label: "cập nhật công việc" },
  { value: "AI", label: "đề xuất việc cần làm" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="TaskFlow">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              TF
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">TaskFlow</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-600">Tính năng</a>
            <a href="#workflow" className="hover:text-blue-600">Quy trình</a>
            <a href="#seo-summary" className="hover:text-blue-600">Lợi ích</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_520px] lg:items-center lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            <ShieldCheck size={16} />
            Nền tảng quản lý dự án cho đội nhóm hiện đại
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            TaskFlow đỉnh cao của quản lý
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            TaskFlow giúp đội nhóm quản lý dự án, phân chia công việc, theo dõi deadline,
            ưu tiên task quan trọng và phối hợp thời gian thực trên một không gian làm việc
            trực quan, gọn gàng và dễ kiểm soát.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700"
            >
              Tạo workspace miễn phí
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              Vào bảng làm việc
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {stats.map((item) => (
              <div key={item.label} className="border-r border-slate-100 px-4 py-4 last:border-r-0">
                <div className="text-lg font-bold text-slate-950">{item.value}</div>
                <div className="mt-1 text-xs font-medium leading-5 text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            <Image
              src="/ogimage.jpeg"
              alt="Giao diện TaskFlow quản lý dự án và công việc"
              width={1200}
              height={630}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-5 right-5 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Tập trung vào việc cần làm tiếp theo</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Dashboard, deadline, thông báo và AI assistant cùng hỗ trợ đội nhóm ra quyết định nhanh hơn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-12 pt-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Quản lý công việc từ tổng quan đến chi tiết
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              TaskFlow gom các thao tác quan trọng vào một trải nghiệm thống nhất để giảm thất lạc thông tin.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Xem dashboard
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Quy trình rõ ràng cho mọi workspace
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Từ lập kế hoạch, giao việc đến theo dõi tiến độ, TaskFlow giữ mọi dữ liệu dự án trong cùng một nơi.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "Tạo workspace", "Tổ chức đội nhóm, phân quyền và quản lý thành viên."],
              ["02", "Xây board công việc", "Chia task theo danh sách, deadline, nhãn và độ ưu tiên."],
              ["03", "Theo dõi tiến độ", "Nhận thông báo, xem báo cáo và dùng AI để chọn việc quan trọng."],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <span className="text-sm font-bold text-blue-600">{step}</span>
                <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="seo-summary" className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <BarChart3 className="mb-4 text-blue-600" size={22} />
            <h2 className="text-base font-bold text-slate-900">Báo cáo dễ nắm bắt</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Theo dõi khối lượng task, trạng thái xử lý và tiến độ dự án bằng các chỉ số rõ ràng.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Bell className="mb-4 text-blue-600" size={22} />
            <h2 className="text-base font-bold text-slate-900">Thông báo kịp thời</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Không bỏ lỡ thay đổi quan trọng khi task, board hoặc lời mời workspace được cập nhật.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="mb-4 text-blue-600" size={22} />
            <h2 className="text-base font-bold text-slate-900">Tối ưu hiệu suất nhóm</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Giúp đội nhóm tập trung vào công việc có tác động cao và hoàn thành dự án đúng hạn.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
