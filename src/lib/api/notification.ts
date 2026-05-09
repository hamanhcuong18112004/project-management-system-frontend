import api from "./client";

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  boardId?: string;
  workspaceId?: string;
  workspaceName?: string;
  actorUserId?: string;
  fullName?: string;
  inviteToken?: string;
}

type ServiceEnvelope<T> = {
  data?: T;
  message?: string;
  status?: string;
  success?: boolean;
};

function unwrapResponse<T>(payload: ServiceEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    ("status" in payload || "success" in payload || "data" in payload)
  ) {
    const envelope = payload as ServiceEnvelope<T>;
    if (typeof envelope.data !== "undefined") {
      return envelope.data;
    }
  }
  return payload as T;
}

export const notificationApi = {
  getByUserId: async (userId: string) => {
    const response = await api.get<ServiceEnvelope<AppNotification[]> | AppNotification[]>(`/notifications/api/notifications?userId=${userId}`);
    return unwrapResponse(response.data);
  },
    
  markAsRead: async (id: string) => {
    await api.patch(`/notifications/api/notifications/${id}/read`);
  },
    
  markAllAsRead: async (userId: string) => {
    await api.patch(`/notifications/api/notifications/read-all?userId=${userId}`);
  },
    
  delete: async (id: string) => {
    await api.delete(`/notifications/api/notifications/${id}`);
  },
};
