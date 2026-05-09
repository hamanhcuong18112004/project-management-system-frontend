"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { AppNotification, notificationApi } from "@/lib/api/notification";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  isConnected: boolean;
  lastNotification: AppNotification | null;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function normalizeWebSocketUrl(url: string) {
  if (url.startsWith("http://")) return `ws://${url.slice("http://".length)}`;
  if (url.startsWith("https://")) return `wss://${url.slice("https://".length)}`;
  return url;
}

const WS_URL = normalizeWebSocketUrl(
  ((process as any).env.NEXT_PUBLIC_NOTIFICATION_WS_URL) || "ws://localhost:8000/ws/notifications"
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationApi.getByUserId(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationApi.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const url = new URL(WS_URL);
      url.searchParams.set("userId", user.id);

      const socket = new WebSocket(url.toString());
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log("Notification WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as AppNotification;
          setNotifications(prev => [notification, ...prev]);
          setLastNotification(notification);

          // Show toast for specific notification types
          if (notification.type === "WORKSPACE_INVITE") {
            toast.info(notification.message || "Bạn có một lời mời mới!", {
              duration: 2000,
              description: "Vui lòng kiểm tra danh sách không gian làm việc để chấp nhận hoặc từ chối.",
            });
          } else if (notification.type === "WORKSPACE_INVITE_REJECTED") {
            toast.error(notification.message || "Lời mời đã bị từ chối.", {
              duration: 2000,
            });
          } else if (notification.type === "BOARD_UPDATED" || notification.type === "TASK_UPDATED") {
            toast.info(notification.title || "Có thay đổi mới", {
              duration: 2000,
              description: notification.message || "Dữ liệu vừa được cập nhật bởi thành viên khác.",
            });
          } else if (notification.type === "BOARD_CREATED" || notification.type === "TASK_CREATED" || notification.type === "WORKSPACE_CREATED" || notification.type === "TASK_ASSIGNED" || notification.type === "BOARD_MEMBER_ADDED") {
            toast.success(notification.title || "Thông báo mới", {
              duration: 3000,
              description: notification.message,
            });
          }
        } catch (e) {
          console.error("Error parsing notification message:", e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(() => {
          if (user?.id) connect();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error("Notification WebSocket error:", error);
      };
    };

    connect();

    return () => {
      if (socketRef.current) socketRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, [user?.id]);

  const value = React.useMemo(() => ({
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected,
    lastNotification
  }), [notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, isConnected, lastNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
