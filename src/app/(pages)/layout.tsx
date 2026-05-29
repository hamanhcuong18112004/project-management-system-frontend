"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );
  const isBoardRoute = pathname.startsWith("/boards/");
  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

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
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [currentPath, hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen min-w-0 bg-gray-50 dark:bg-black">
      <Sidebar />

      <div className={`${isCollapsed ? "lg:ml-20" : "lg:ml-64"} ml-0 flex min-w-0 flex-1 flex-col transition-all duration-300`}>

        <Header />

        <main
          className={`mt-16 flex-1 ${isBoardRoute ? "min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-900" : "min-w-0 bg-gray-50 dark:bg-black p-4 sm:p-6"
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
