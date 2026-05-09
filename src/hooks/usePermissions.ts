import { useEffect } from "react";
import { usePermissionStore } from "@/lib/stores/usePermissionStore";
import apiClient from "@/lib/api/client";

export function usePermissions(workspaceId?: string) {
  const { permissions, isLoading, setPermissions, setLoading, hasPermission } = usePermissionStore();

  useEffect(() => {
    if (!workspaceId) return;

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        // Giả sử API trả về list string các permission codes của user hiện tại trong workspace
        const response = await apiClient.get(`workspace/workspaces/${workspaceId}/my-permissions`);
        setPermissions(response.data.data);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [workspaceId, setPermissions, setLoading]);

  return { permissions, isLoading, hasPermission };
}
