import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobileOpen: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
      setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
