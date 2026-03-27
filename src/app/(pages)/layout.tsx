import { Header, Sidebar } from "@/components";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header />

        <main className="flex-1 mt-16 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
