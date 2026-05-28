"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header, Sidebar } from "@/components";
import { useAuthStore, useSidebarStore } from "@/lib/stores";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();

  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );
  const isBoardRoute = pathname.startsWith("/boards/");

  useEffect(() => {
    if (hydrated) {
      return;
    }

    const unsubscribeHydration = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => {
      unsubscribeHydration?.();
    };
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen min-w-0">
      <Sidebar />

      <div className={`${isCollapsed ? "ml-20" : "ml-64"} flex min-w-0 flex-1 flex-col transition-all duration-300`}>

        <Header />

        <main
          className={`mt-16 flex-1 ${isBoardRoute ? "min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-900" : "min-w-0 bg-gray-50 dark:bg-black p-6"
            }`}
        >
          <div className={isBoardRoute ? "h-full min-w-0" : "mx-auto max-w-7xl"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
