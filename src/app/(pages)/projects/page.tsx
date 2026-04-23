"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspace,
  deleteWorkspace,
  getMyWorkspaces,
  inviteToWorkspace,
  updateWorkspace,
  type Board,
  type Role,
  type Workspace,
} from "@/lib/api/workspace";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  CreateBoardModal,
  CreateProjectModal,
  type CreateBoardFormData,
} from "@/components/pages/workspace";
import { WorkspaceRow } from "@/components/pages/workspace/WorkspaceRow";

type CreateWorkspaceFormData = {
  name: string;
  description: string;
  color: string;
  visibility: "PUBLIC" | "PRIVATE";
};

type WorkspaceSettingsFormData = {
  id: string;
  name: string;
  description: string;
};

function createLocalBoardId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `temp-board-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [selectedWorkspaceForBoard, setSelectedWorkspaceForBoard] =
    useState<Workspace | null>(null);
  const [isSubmittingBoard, setIsSubmittingBoard] = useState(false);

  const userId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("auth-storage")
        ? JSON.parse(window.localStorage.getItem("auth-storage") || "{}").state
            ?.user?.id
        : undefined
      : undefined;

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyWorkspaces();

      const safeData = data.map((workspace) => {
        let role: Role = "MEMBER";

        if (userId && Array.isArray(workspace.members)) {
          const foundMember = workspace.members.find(
            (member) => member.userId === userId,
          );

          if (foundMember?.role) {
            role = foundMember.role as Role;
          }
        }

        return {
          ...workspace,
          boards: workspace.boards || [],
          members: workspace.members || [],
          role,
        };
      });

      setWorkspaces(safeData);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải danh sách không gian làm việc",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const ownedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role === "OWNER"),
    [workspaces],
  );
  const sharedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role !== "OWNER"),
    [workspaces],
  );

  const handleCreateWorkspace = async (data: CreateWorkspaceFormData) => {
    try {
      setIsSubmittingCreate(true);
      await createWorkspace(data);
      toast.success("Tạo không gian làm việc thành công!");
      setShowCreateWsModal(false);
      fetchWorkspaces();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tạo không gian làm việc"),
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa không gian làm việc này? Toàn bộ dữ liệu bên trong sẽ bị mất.",
      )
    ) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      toast.success("Đã xóa không gian làm việc");
      fetchWorkspaces();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể xóa không gian làm việc"),
      );
    }
  };

  const handleUpdateWorkspace = async (data: WorkspaceSettingsFormData) => {
    try {
      await updateWorkspace(data.id, {
        name: data.name,
        description: data.description,
      });
      toast.info(`Đã cập nhật workspace ${data.name}`);
      fetchWorkspaces();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể cập nhật không gian làm việc"),
      );
      throw error;
    }
  };

  const handleInviteMember = async (workspaceId: string, email: string) => {
    await inviteToWorkspace(workspaceId, email);
    toast.info(`Đã gửi lời mời tới email ${email}`);
    fetchWorkspaces();
  };

  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    if (!confirm("Xóa thành viên này khỏi không gian làm việc?")) {
      return;
    }

    toast.info(`Xóa member ${memberId} khỏi workspace ${workspaceId} (Cần API)`);
    fetchWorkspaces();
  };

  const handleUpdateMemberRole = async (
    workspaceId: string,
    memberId: string,
    role: string,
  ) => {
    toast.info(`Cập nhật role member ${memberId} thành ${role} (Cần API)`);
    fetchWorkspaces();
  };

  const handleOpenCreateBoard = (workspace: Workspace) => {
    setSelectedWorkspaceForBoard(workspace);
    setShowCreateBoardModal(true);
  };

  const handleCloseCreateBoard = () => {
    if (isSubmittingBoard) {
      return;
    }

    setShowCreateBoardModal(false);
    setSelectedWorkspaceForBoard(null);
  };

  const handleCreateBoard = (data: CreateBoardFormData) => {
    if (!selectedWorkspaceForBoard) {
      return;
    }

    try {
      setIsSubmittingBoard(true);

      const localBoard: Board = {
        id: createLocalBoardId(),
        name: data.name,
        description: null,
        visibility: data.visibility,
        backgroundType: data.backgroundType,
        backgroundValue: data.backgroundValue,
        workspaceId: selectedWorkspaceForBoard.id,
      };

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === selectedWorkspaceForBoard.id
            ? {
                ...workspace,
                boards: [...(workspace.boards || []), localBoard],
                updatedAt: new Date().toISOString(),
              }
            : workspace,
        ),
      );

      toast.success(`Đã tạo board "${data.name}" trên giao diện.`);
      setShowCreateBoardModal(false);
      setSelectedWorkspaceForBoard(null);
    } finally {
      setIsSubmittingBoard(false);
    }
  };

  const handleNavigateBoard = (board: Board) => {
    const searchParams = new URLSearchParams();

    searchParams.set("name", board.name);
    if (board.description) {
      searchParams.set("description", board.description);
    }
    if (board.workspaceId) {
      searchParams.set("workspaceId", board.workspaceId);
    }
    if (board.backgroundType) {
      searchParams.set("bgType", board.backgroundType);
    }
    if (board.backgroundValue) {
      searchParams.set("bgValue", board.backgroundValue);
    } else if (board.background) {
      searchParams.set("bgValue", board.background);
    }

    const query = searchParams.toString();
    router.push(query ? `/boards/${board.id}?${query}` : `/boards/${board.id}`);
  };

  const renderWorkspaceSection = (title: string, items: Workspace[]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-700">
            {title}
          </h2>
          {title.includes("KHÁC") && <Info size={18} className="text-blue-500" />}
        </div>

        <div className="space-y-8">
          {items.map((workspace) => (
            <WorkspaceRow
              key={workspace.id}
              workspace={workspace}
              onNavigateBoard={handleNavigateBoard}
              onCreateBoard={handleOpenCreateBoard}
              onInviteMember={handleInviteMember}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberRole={handleUpdateMemberRole}
              onUpdateWorkspace={handleUpdateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Không gian làm việc
            </h1>
          </div>

          <button
            onClick={() => setShowCreateWsModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Plus size={16} />
            <span>Tạo không gian làm việc</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <p className="mb-5 text-slate-500">
              Bạn chưa có không gian làm việc nào.
            </p>
            <button
              onClick={() => setShowCreateWsModal(true)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Bắt đầu tạo ngay
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {renderWorkspaceSection(
              "CÁC KHÔNG GIAN LÀM VIỆC CỦA BẠN",
              ownedWorkspaces,
            )}
            {renderWorkspaceSection(
              "CÁC KHÔNG GIAN LÀM VIỆC KHÁC",
              sharedWorkspaces,
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={isSubmittingCreate}
      />

      <CreateBoardModal
        key={selectedWorkspaceForBoard?.id ?? "create-board-closed"}
        open={showCreateBoardModal}
        workspace={selectedWorkspaceForBoard}
        onClose={handleCloseCreateBoard}
        onSubmit={handleCreateBoard}
        isLoading={isSubmittingBoard}
      />
    </div>
  );
}
