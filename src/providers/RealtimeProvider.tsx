"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export type DragItemType = "module" | "task" | "column";

export type RemoteDragState = {
  id: string;
  type: DragItemType;
  userId: string;
  username: string;
  x: number;
  y: number;
}

type RealtimeContextValue = {
  remoteDrags: Map<string, RemoteDragState>;
  checkIsLocked: (id: string) => boolean;
  emitDragStart: (id: string, type: DragItemType) => void;
  emitDragMove: (id: string, type: DragItemType, x: number, y: number) => void;
  emitDragEnd: (id: string, type: DragItemType, overId?: string | null) => void;
  boardVersion: number;
  emitBoardUpdated: () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

function RealtimeProvider({ children }: { children: ReactNode }) {
  const [remoteDrags, setRemoteDrags] = useState<Map<string, RemoteDragState>>(new Map());
  const [boardVersion, setBoardVersion] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Lấy user từ Auth Store
  const user = useAuthStore((state) => state.user);

  // Generate guest ID once với lazy initializer
  const [guestId] = useState(() => "guest-" + Math.random().toString(36).slice(2, 9));

  const CURRENT_USER_ID = user?.id || guestId;
  const CURRENT_USER_NAME = user?.name || "Guest";
  const checkIsLocked = useCallback((id: string) => {
    if (isConnected && remoteDrags.has(id)) {
      return true;
    } else {
      return false;
    }
  }, [remoteDrags, isConnected]);
  useEffect(() => {
    const newSocket = io(WS_URL, {
      path: "/ws",
      transports: ["websocket"]
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join_board")
    })
    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setRemoteDrags(new Map());
    })
    newSocket.on("drag_start", (payload: RemoteDragState) => {
      if (payload.userId === CURRENT_USER_ID) return;
      setRemoteDrags((prev) => {
        const next = new Map(prev);
        next.set(payload.id, payload);
        return next;
      })
    })
    newSocket.on("drag_move", (payload: {
      id: string;
      userId: string;
      x: number;
      y: number;
    }) => {
      if (payload.userId === CURRENT_USER_ID) return;
      setRemoteDrags((prev) => {
        const current = prev.get(payload.id);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(payload.id, {
          ...current,
          x: payload.x,
          y: payload.y,
        });
        return next;
      })
    })
    newSocket.on("drag_end", (payload: { id: string }) => {
      setRemoteDrags((prev) => {
        const next = new Map(prev);
        next.delete(payload.id);
        return next;
      });
    });
    newSocket.on("board_updated", () => {
      setBoardVersion((v) => v + 1);
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
      socketRef.current = null;
    };
  }, [CURRENT_USER_ID])

  const emitDragStart = useCallback((id: string, type: DragItemType) => {
    socketRef.current?.emit("drag_start", {
      id,
      type,
      userId: CURRENT_USER_ID,
      username: CURRENT_USER_NAME,
    });
  }, [CURRENT_USER_ID, CURRENT_USER_NAME]);

  const emitDragMove = useCallback((id: string, type: DragItemType, x: number, y: number) => {
    socketRef.current?.emit("drag_move", { id, type, x, y });
  }, []);

  const emitDragEnd = useCallback((id: string, type: DragItemType, overId?: string | null) => {
    socketRef.current?.emit("drag_end", { id, type, overId: overId ?? null });
  }, []);

  const emitBoardUpdated = useCallback(() => {
    socketRef.current?.emit("board_updated");
  }, []);

  return (
    <RealtimeContext.Provider value={{
      remoteDrags,
      checkIsLocked,
      emitDragStart,
      emitDragMove,
      emitDragEnd,
      boardVersion,
      emitBoardUpdated,
      isConnected,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}

export default RealtimeProvider