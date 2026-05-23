import { create } from "zustand";

interface PermissionState {
  permissions: string[];
  isLoading: boolean;
  setPermissions: (permissions: string[]) => void;
  setLoading: (isLoading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  isLoading: false,
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),
  hasPermission: (permission) => get().permissions.includes(permission),
  clearPermissions: () => set({ permissions: [] }),
}));
