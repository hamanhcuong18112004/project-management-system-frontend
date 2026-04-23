"use client";

import React, { useState } from "react";
import { Layout, Settings, Sparkles, Users } from "lucide-react";
import type { Workspace } from "@/lib/api/workspace";
import { BoardCard, CreateBoardCard } from "./BoardCard";
import { MembersModal } from "./MembersModal";
import { SettingsModal } from "./SettingsModal";

type WorkspaceSettingsFormData = {
  id: string;
  name: string;
  description: string;
};

interface WorkspaceRowProps {
  workspace: Workspace;
  onNavigateBoard: (board: NonNullable<Workspace["boards"]>[number]) => void;
  onCreateBoard: (workspace: Workspace) => void;
  onInviteMember: (workspaceId: string, email: string) => void;
  onRemoveMember: (workspaceId: string, memberId: string) => void;
  onUpdateMemberRole: (
    workspaceId: string,
    memberId: string,
    role: string,
  ) => void;
  onUpdateWorkspace: (data: WorkspaceSettingsFormData) => Promise<void>;
  onDeleteWorkspace: (workspaceId: string) => void;
}

export function WorkspaceRow({
  workspace,
  onNavigateBoard,
  onCreateBoard,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onUpdateWorkspace,
  onDeleteWorkspace,
}: WorkspaceRowProps) {
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const boards = workspace.boards || [];
  const members = workspace.members || [];
  const isOwner = workspace.role === "OWNER";
  const initial = workspace.name.charAt(0).toUpperCase();

  const handleUpdateSubmit = async (data: WorkspaceSettingsFormData) => {
    try {
      setIsUpdatingSettings(true);
      await onUpdateWorkspace(data);
      setShowSettingsModal(false);
    } catch {
      // Keep the settings modal open so the user can retry.
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <>
      <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c084fc] to-[#60a5fa] text-xl font-bold text-white shadow-sm">
              {initial}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {workspace.name}
              </h2>
              {workspace.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <Layout size={16} /> Bảng ({boards.length})
            </button>
            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Users size={16} /> Thành viên ({members.length})
            </button>

            {isOwner && (
              <>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings size={16} /> Cài đặt
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100">
                  <Sparkles size={16} /> Nâng cấp
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <div key={board.id}>
              <BoardCard board={board} onClick={onNavigateBoard} />
            </div>
          ))}
          {isOwner && (
            <div>
              <CreateBoardCard onClick={() => onCreateBoard(workspace)} />
            </div>
          )}
        </div>
      </div>

      <MembersModal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        workspace={workspace}
        onInviteMember={onInviteMember}
        onRemoveMember={onRemoveMember}
        onUpdateMemberRole={onUpdateMemberRole}
      />

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        workspace={workspace}
        onUpdateWorkspace={handleUpdateSubmit}
        onDeleteWorkspace={onDeleteWorkspace}
        isLoading={isUpdatingSettings}
      />
    </>
  );
}
