"use client";

import React, { useState } from "react";
import { Users, Layout, Settings, Trash2 } from "lucide-react";
import type { Workspace } from "@/lib/api/workspace";
import { BoardCard, CreateBoardCard } from "./BoardCard";
import { MembersModal } from "./MembersModal"; // Đường dẫn tuỳ thuộc cấu trúc của bạn
import { SettingsModal } from "./SettingsModal"; // Đường dẫn tuỳ thuộc cấu trúc của bạn

interface WorkspaceRowProps {
  workspace: Workspace;
  onNavigateBoard: (boardId: string) => void;
  onCreateBoard: (workspaceId: string) => void;
  onInviteMember: (workspaceId: string, email: string) => void;
  onRemoveMember: (workspaceId: string, memberId: string) => void;
  onUpdateMemberRole: (workspaceId: string, memberId: string, role: string) => void;
  onUpdateWorkspace: (data: any) => Promise<void>;
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
  // Modal States
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const boards = workspace.boards || [];
  const members = workspace.members || [];
  const isOwner = workspace.role === "OWNER";
  const initial = workspace.name.charAt(0).toUpperCase();

  // Wrapper cho hàm update để xử lý loading và tự đóng Modal
  const handleUpdateSubmit = async (data: any) => {
    try {
      setIsUpdatingSettings(true);
      await onUpdateWorkspace(data);
      setShowSettingsModal(false); // Thành công thì đóng modal
    } catch (error) {
      // Có lỗi thì giữ modal mở
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <>
      <div className="mb-10 w-full bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {initial}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Không gian làm việc: {workspace.name}
              </h2>
              {workspace.description && (
                <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Layout size={16} /> Bảng ({boards.length})
            </button>
            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users size={16} /> Thành viên ({members.length})
            </button>

            {isOwner && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Settings size={16} /> Cài đặt
                </button>
                <button
                  onClick={() => onDeleteWorkspace(workspace.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Boards List */}
        <div className="flex items-center gap-5 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
          {boards.map((board) => (
            <div key={board.id} className="snap-start">
              <BoardCard board={board} onClick={onNavigateBoard} />
            </div>
          ))}
          {isOwner && (
            <div className="snap-start">
              <CreateBoardCard onClick={() => onCreateBoard(workspace.id)} />
            </div>
          )}
        </div>
      </div>

      {/* --- CÁC MODALS CỦA WORKSPACE NÀY --- */}
      
      {/* 1. Modal Quản lý thành viên */}
      <MembersModal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        workspace={workspace}
        onInviteMember={onInviteMember}
        onRemoveMember={onRemoveMember}
        onUpdateMemberRole={onUpdateMemberRole}
      />

      {/* 2. Modal Cài đặt */}
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