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
  ArrowRight,
  Sparkles
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
  { value: "7+", label: "mức độ ưu tiên" },
  { value: "Realtime", label: "cập nhật công việc" },
  { value: "AI", label: "đề xuất việc cần làm" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]" aria-label="TaskFlow">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              TF
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Task<span className="text-blue-600">Flow</span></span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-blue-600">Tính năng</a>
            <a href="#workflow" className="transition-colors hover:text-blue-600">Quy trình</a>
            <a href="#seo-summary" className="transition-colors hover:text-blue-600">Lợi ích</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
              <Sparkles size={16} className="text-blue-500" />
              Nền tảng quản lý dự án thế hệ mới
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-6xl lg:text-[64px]">
              Đỉnh cao của <br/>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quản lý dự án</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              TaskFlow giúp đội nhóm tổ chức công việc, theo dõi deadline, ưu tiên task quan trọng và phối hợp theo thời gian thực trên một không gian làm việc trực quan và mạnh mẽ.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-blue-500/50 active:scale-95"
              >
                Tạo workspace miễn phí
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-slate-200 bg-white/50 px-8 text-base font-bold text-slate-700 backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white hover:text-blue-700 active:scale-95"
              >
                Vào bảng làm việc
              </Link>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-md">
              {stats.map((item) => (
                <div key={item.label} className="px-6 py-5 text-center transition-colors hover:bg-slate-50/50">
                  <div className="text-2xl font-black text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:ml-auto">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 to-indigo-50 opacity-50 blur-2xl"></div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50">
              <Image
                src="/hero-mockup.png"
                alt="Giao diện TaskFlow quản lý dự án và công việc"
                width={1200}
                height={630}
                priority
                className="h-auto w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xl backdrop-blur-xl sm:left-auto sm:right-10">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
                <div className="max-w-[220px]">
                  <p className="text-sm font-bold text-slate-900">Tập trung vào hiệu suất</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Dashboard, nhắc hẹn và AI assistant hỗ trợ ra quyết định siêu tốc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Quản lý công việc từ <br/> tổng quan đến chi tiết
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              TaskFlow gom các thao tác quan trọng vào một trải nghiệm thống nhất, với giao diện tuyệt đẹp và luồng làm việc mượt mà, giúp bạn không bao giờ bỏ sót thông tin.
            </p>
          </div>
          <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700">
            Khám phá Dashboard
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-blue-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="relative border-y border-slate-200/60 bg-slate-100/50 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Quy trình chuẩn hóa <br/> cho mọi workspace
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Từ lúc lên ý tưởng, giao việc đến theo dõi tiến độ hoàn thành, TaskFlow giữ mọi dữ liệu dự án của bạn an toàn, đồng bộ trong cùng một nơi.
            </p>
            <div className="mt-8 flex">
              <Link href="/register" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
                Bắt đầu xây dựng quy trình <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            {[
              ["01", "Tạo workspace", "Tổ chức không gian cho đội nhóm, phân quyền và quản lý thành viên dễ dàng."],
              ["02", "Xây board công việc", "Chia nhỏ task theo danh sách, thiết lập deadline, nhãn và độ ưu tiên."],
              ["03", "Theo dõi tiến độ", "Nhận thông báo realtime, xem báo cáo và dùng AI để chọn việc quan trọng."],
            ].map(([step, title, description]) => (
              <div key={step} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-lg">
                <span className="text-3xl font-black text-slate-100 transition-colors group-hover:text-blue-50">{step}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="seo-summary" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600">
              <BarChart3 size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Báo cáo siêu trực quan</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Theo dõi khối lượng task, trạng thái xử lý và tiến độ tổng thể của dự án bằng các chỉ số đồ họa sinh động, rõ ràng.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 inline-flex rounded-2xl bg-indigo-50 p-4 text-indigo-600">
              <Bell size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thông báo tức thời</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Hệ thống Realtime đảm bảo bạn không bao giờ lỡ nhịp các thay đổi quan trọng khi có bình luận hoặc task mới.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 inline-flex rounded-2xl bg-emerald-50 p-4 text-emerald-600">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Bảo mật cấp doanh nghiệp</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              An tâm lưu trữ dữ liệu dự án với hệ thống phân quyền (RBAC) chi tiết, mã hóa chuẩn và kiến trúc vững chắc.
            </p>
          </div>
        </div>
      </section>
      
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              TF
            </span>
            <span className="text-lg font-bold text-slate-900">TaskFlow</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
