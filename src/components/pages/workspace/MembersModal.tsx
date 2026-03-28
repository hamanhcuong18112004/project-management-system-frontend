"use client";

import React, { useState } from "react";
import { X, UserPlus, Trash2 } from "lucide-react";
import type { Workspace, Member } from "@/lib/api/workspace";

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onInviteMember: (workspaceId: string, email: string) => void;
  onRemoveMember: (workspaceId: string, memberId: string) => void;
  onUpdateMemberRole: (workspaceId: string, memberId: string, role: string) => void;
}

export function MembersModal({
  open,
  onClose,
  workspace,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
}: MembersModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");

  if (!open || !workspace) return null;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInviteMember(workspace.id, inviteEmail.trim());
    setInviteEmail("");
  };

  const members = workspace.members || [];
  const isOwner = workspace.role === "OWNER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Quản lý thành viên: {workspace.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite Form */}
          {isOwner && (
            <form onSubmit={handleInviteSubmit} className="border-b border-gray-100 pb-6 flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Nhập email của thành viên mới..."
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <UserPlus size={16} /> Mời
              </button>
            </form>
          )}

          {/* Member List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Danh sách thành viên ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Chưa có thành viên nào.</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 text-sm">
                      {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Role Tag/Selector */}
                    <span className={`px-2.5 py-1 text-xs font-medium rounded ${member.role === 'OWNER' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                      {member.role === 'OWNER' ? 'Chủ sở hữu' : 'Thành viên'}
                    </span>

                    {/* Placeholder phân quyền/xóa cho Owner */}
                    {isOwner && member.role !== 'OWNER' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateMemberRole(workspace.id, member.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="OWNER">Owner</option>
                        </select>
                        <button 
                          onClick={() => onRemoveMember(workspace.id, member.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}