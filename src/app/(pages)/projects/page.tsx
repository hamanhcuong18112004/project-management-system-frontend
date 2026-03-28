"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getMyWorkspaces,
  deleteWorkspace,
  createWorkspace,
  // updateWorkspace, 
  // inviteUser, 
  // removeUser, 
  // updateUserRole, 
  type Workspace,
} from "@/lib/api/workspace";
import { getApiErrorMessage } from "@/lib/api/error";
import { WorkspaceRow } from "@/components/pages/workspace/WorkspaceRow";
import { CreateProjectModal } from "@/components/pages/workspace";

export default function ProjectsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state (CHỈ CÒN CREATE MODAL Ở ĐÂY)
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Lấy danh sách Workspace
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyWorkspaces();
      
      const safeData = data.map(ws => ({
        ...ws,
        boards: ws.boards || [],
        members: ws.members || [],
        role: ws.role || "MEMBER" 
      }));

      setWorkspaces(safeData);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách không gian làm việc"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Tạo Workspace
  const handleCreateWorkspace = async (data: any) => {
    try {
      setIsSubmittingCreate(true);
      await createWorkspace(data);
      toast.success("Tạo không gian làm việc thành công!");
      setShowCreateWsModal(false);
      fetchWorkspaces();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo không gian làm việc"));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Các Action Truyền xuống WorkspaceRow (Cần return Promise để Row biết khi nào xong mà đóng Modal)
  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa không gian làm việc này? Toàn bộ dữ liệu bên trong sẽ bị mất.")) return;
    try {
      await deleteWorkspace(workspaceId);
      toast.success("Đã xóa không gian làm việc");
      fetchWorkspaces();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa không gian làm việc"));
    }
  };

  const handleUpdateWorkspace = async (data: any) => {
    try {
      // await updateWorkspace(data.id, { name: data.name, description: data.description });
      toast.info(`Tính năng Update cho workspace ${data.id} đang phát triển (Cần API)`);
      fetchWorkspaces();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật không gian làm việc"));
      throw err; // Ném lỗi để WorkspaceRow không đóng modal nếu lỗi
    }
  };

  const handleInviteMember = async (workspaceId: string, email: string) => {
    // await inviteUser(workspaceId, email);
    toast.info(`Mời ${email} vào workspace ${workspaceId} (Cần API)`);
    fetchWorkspaces();
  };

  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    if(!confirm("Xóa thành viên này khỏi không gian làm việc?")) return;
    // await removeUser(workspaceId, memberId);
    toast.info(`Xóa member ${memberId} khỏi workspace ${workspaceId} (Cần API)`);
    fetchWorkspaces();
  };

  const handleUpdateMemberRole = async (workspaceId: string, memberId: string, role: string) => {
    // await updateUserRole(workspaceId, memberId, role);
    toast.info(`Cập nhật role member ${memberId} thành ${role} (Cần API)`);
    fetchWorkspaces();
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Các Không Gian Làm Việc Của Bạn</h1>
        <button
          onClick={() => setShowCreateWsModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>Tạo Không gian làm việc</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-2xl border-gray-200 bg-white shadow-sm">
          <p className="text-gray-500 mb-5">Bạn chưa có không gian làm việc nào.</p>
          <button
            onClick={() => setShowCreateWsModal(true)}
            className="px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            Bắt đầu tạo ngay
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {workspaces.map((ws) => (
            <WorkspaceRow
              key={ws.id}
              workspace={ws}
              onNavigateBoard={(id) => console.log("Nav to board", id)}
              onCreateBoard={(wsId) => console.log("Create board modal for", wsId)} // Sẽ cập nhật tạo board ở đây sau
              onInviteMember={handleInviteMember}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberRole={handleUpdateMemberRole}
              onUpdateWorkspace={handleUpdateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
            />
          ))}
        </div>
      )}

      {/* CHỈ GIỮ LẠI MODAL NÀY Ở PAGE */}
      <CreateProjectModal
        open={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={isSubmittingCreate}
      />
    </div>
  );
}