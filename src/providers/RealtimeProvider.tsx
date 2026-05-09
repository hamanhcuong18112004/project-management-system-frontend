"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export type DragItemType = "task" | "taskList";

export type RemoteDragState = {
  id: string;
  type: DragItemType;
  userId: string;
  username: string;
  x: number;
  y: number;
};

interface IncomingRealtimeMessage {
  type: "drag_start" | "drag_move" | "drag_end" | "board_updated" | "comment_updated" | "ping";
  itemId?: string;
  itemType?: DragItemType | "REPLY" | "REACT" | "COMMENT" | "DELETE";
  userId?: string;
  username?: string;
  x?: number;
  y?: number;
  overId?: string | null;
  targetUserId?: string;
  taskTitle?: string;
};

type RealtimeContextValue = {
  remoteDrags: Map<string, RemoteDragState>;
  checkIsLocked: (id: string) => boolean;
  emitDragStart: (id: string, type: DragItemType) => void;
  emitDragMove: (id: string, type: DragItemType, x: number, y: number) => void;
  emitDragEnd: (id: string, type: DragItemType, overId?: string | null) => void;
  boardVersion: number;
  emitBoardUpdated: () => void;
  isConnected: boolean;
  lastCommentUpdate: { taskId: string; timestamp: number; actionUser?: string; actionType?: string; targetUserId?: string; taskTitle?: string } | null;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function normalizeWebSocketUrl(url: string) {
  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`;
  }

  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`;
  }

  return url;
}

const WS_URL = normalizeWebSocketUrl(
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8084/ws/boards",
);

function RealtimeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const socketRef = useRef<WebSocket | null>(null);

  const [remoteDrags, setRemoteDrags] = useState<Map<string, RemoteDragState>>(
    new Map(),
  );
  const [boardVersion, setBoardVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCommentUpdate, setLastCommentUpdate] = useState<{ taskId: string; timestamp: number; actionUser?: string; actionType?: string; targetUserId?: string; taskTitle?: string } | null>(null);

  const user = useAuthStore((state) => state.user);
  const [guestId] = useState(
    () => "guest-" + Math.random().toString(36).slice(2, 9),
  );

  const currentUserId = user?.id || guestId;
  const currentUserName = user?.username || "Guest";

  const boardId = useMemo(() => {
    if (!pathname.startsWith("/boards/")) {
      return null;
    }

    const parts = pathname.split("/");
    return parts[2] || null;
  }, [pathname]);

  const checkIsLocked = useCallback(
    (id: string) => isConnected && remoteDrags.has(id),
    [isConnected, remoteDrags],
  );

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_REALTIME_ENABLED !== "true" || !boardId) {
      return;
    }

    let socket: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const url = new URL(WS_URL);
      url.searchParams.set("boardId", boardId);
      url.searchParams.set("userId", currentUserId);
      url.searchParams.set("username", currentUserName);

      socket = new WebSocket(url.toString());
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        socket?.send(JSON.stringify({ type: "board_updated", itemId: boardId }));
        
        pingInterval = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as IncomingRealtimeMessage;
        console.log("🚨 [DEBUG] Nhận được tin nhắn từ Backend:", payload);

        if (payload.userId === currentUserId) {
          console.log("🚨 [DEBUG] Tin nhắn bị bỏ qua do trùng ID người gửi!");
          return;
        }

        if (payload.type === "drag_start" && payload.itemId && payload.itemType) {
          setRemoteDrags((prev) => {
            const next = new Map(prev);
            next.set(payload.itemId!, {
              id: payload.itemId!,
              type: payload.itemType!,
              userId: payload.userId || "",
              username: payload.username || "Guest",
              x: payload.x || 0,
              y: payload.y || 0,
            });
            return next;
          });
        }

        if (payload.type === "drag_move" && payload.itemId) {
          setRemoteDrags((prev) => {
            const current = prev.get(payload.itemId!);
            if (!current) return prev;
            const next = new Map(prev);
            next.set(payload.itemId!, {
              ...current,
              x: payload.x || 0,
              y: payload.y || 0,
            });
            return next;
          });
        }

        if (payload.type === "drag_end" && payload.itemId) {
          setRemoteDrags((prev) => {
            const next = new Map(prev);
            next.delete(payload.itemId!);
            return next;
          });
        }

        if (payload.type === "board_updated") {
          setBoardVersion((value) => value + 1);
        }

        if (payload.type === "comment_updated" && payload.itemId) {
          setLastCommentUpdate({ 
            taskId: payload.itemId, 
            timestamp: Date.now(),
            actionUser: payload.username,
            actionType: payload.itemType,
            targetUserId: payload.targetUserId,
            taskTitle: payload.taskTitle
          });
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error detail:", {
          url: socket?.url,
          readyState: socket?.readyState,
          error: error
        });
        setIsConnected(false);
      };

      socket.onclose = () => {
        setIsConnected(false);
        clearInterval(pingInterval);
        
        reconnectTimeout = setTimeout(() => {
          if (boardId) {
            console.log("Reconnecting WebSocket...");
            connect();
          }
        }, 3000);
      };
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [boardId, currentUserId, currentUserName]);

  const emitDragStart = useCallback(
    (id: string, type: DragItemType) => {
      sendMessage({
        type: "drag_start",
        itemId: id,
        itemType: type,
        x: 0,
        y: 0,
      });
    },
    [sendMessage],
  );

  const emitDragMove = useCallback(
    (id: string, type: DragItemType, x: number, y: number) => {
      sendMessage({
        type: "drag_move",
        itemId: id,
        itemType: type,
        x,
        y,
      });
    },
    [sendMessage],
  );

  const emitDragEnd = useCallback(
    (id: string, type: DragItemType, overId?: string | null) => {
      sendMessage({
        type: "drag_end",
        itemId: id,
        itemType: type,
        overId: overId ?? null,
      });
    },
    [sendMessage],
  );

  const emitBoardUpdated = useCallback(() => {
    sendMessage({
      type: "board_updated",
    });
  }, [sendMessage]);

  return (
    <RealtimeContext.Provider
      value={{
        remoteDrags,
        checkIsLocked,
        emitDragStart,
        emitDragMove,
        emitDragEnd,
        boardVersion,
        emitBoardUpdated,
        isConnected,
        lastCommentUpdate,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}

export default RealtimeProvider;
