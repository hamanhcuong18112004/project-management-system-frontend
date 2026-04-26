"use client";

import { ChevronLeft, Pencil, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BoardDetails } from "@/lib/api/board";

interface BoardHeaderProps {
  board: BoardDetails;
  currentUserId?: string;
  currentUserRole?: string;
  onOpenBoardSettings: () => void;
  onOpenMembers: () => void;
  onJoinBoard?: () => void;
  joiningBoard?: boolean;
}

export function BoardHeader({
  board,
  currentUserId,
  currentUserRole,
  onOpenBoardSettings,
  onOpenMembers,
  onJoinBoard,
  joiningBoard = false,
}: BoardHeaderProps) {
  const router = useRouter();
  const isCurrentUserMember = currentUserId
    ? board.members?.some((m) => (m.userId || m.id) === currentUserId)
    : true;
  const canJoin =
    !isCurrentUserMember &&
    (board.visibility === "WORKSPACE" || board.visibility === "PUBLIC");
  const canManageBoard = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const memberInitials =
    board.members?.slice(0, 3).map((member, index) => ({
      id: member.userId || member.id || `member-${index}`,
      label:
        member.fullName
          ?.split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "U",
    })) || [];

  return (
    <div className="sticky top-0 z-20 w-full min-w-0 shrink-0 border-b border-slate-200/80 bg-white/72 px-6 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
            Về workspace
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {board.name}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-600">
              {board.description || "Board detail theo mô hình Board -> TaskList -> Task."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex -space-x-2">
            {memberInitials.map((member) => (
              <div
                key={member.id}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-xs font-bold text-white shadow-sm"
              >
                {member.label}
              </div>
            ))}
          </div>

          {canJoin ? (
            <button
              type="button"
              onClick={onJoinBoard}
              disabled={joiningBoard}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-400 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joiningBoard ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              ) : (
                <Users size={16} />
              )}
              Tham gia board
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenMembers}
            title="Quản lý thành viên board"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Users size={16} />
            Thành viên
          </button>
          {canManageBoard ? (
            <button
              type="button"
              onClick={onOpenBoardSettings}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={16} />
              Cài đặt bảng
            </button>
          ) : null}
          {canManageBoard ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Share2 size={16} />
              Chia sẻ
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
