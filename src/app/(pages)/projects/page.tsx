"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspaceRole,
  createWorkspace,
  deleteWorkspace,
  deleteWorkspaceRole,
  getMyWorkspaces,
  getMyInvitations,
  getMyPermissions,
  getWorkspaceById,
  inviteToWorkspace,
  leaveWorkspace,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
  updateWorkspaceRole,
  type Board,
  type SaveRolePayload,
  type WorkspaceRoleCode,
  type Workspace,
} from "@/lib/api/workspace";
import { createBoard, getBoardsByWorkspace, getBoardsByUser } from "@/lib/api/board";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  CreateBoardModal,
  CreateProjectModal,
  type CreateBoardFormData,
} from "@/components/pages/workspace";
import { WorkspaceRow } from "@/components/pages/workspace/WorkspaceRow";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { WorkspaceInvitationModal } from "@/components/modals/WorkspaceInvitationModal";
import { useNotifications } from "@/providers/NotificationProvider";

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

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { lastNotification, notifications, markAsRead } = useNotifications();

  // Invitation state
  const [inviteData, setInviteData] = useState<{
    token: string;
    workspaceId: string;
    inviterName: string;
    workspaceName: string;
  } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

      // Fetch workspaces AND direct board memberships in parallel
      const [data, directBoards] = await Promise.all([
        getMyWorkspaces(),
        userId ? getBoardsByUser(userId).catch(() => []) : Promise.resolve([]),
      ]);

      const boardsByWorkspace = new Map<string, Board[]>(
        await Promise.all(
          data.map(
            async (workspace): Promise<[string, Board[]]> => [
              workspace.id,
              await getBoardsByWorkspace(workspace.id, userId).catch(
                () => workspace.boards || [],
              ),
            ],
          ),
        ),
      );

      // Merge direct board memberships into the per-workspace map (dedup by id)
      for (const board of directBoards) {
        if (!board.workspaceId) continue;
        const existing = boardsByWorkspace.get(board.workspaceId) ?? [];
        if (!existing.some((b) => b.id === board.id)) {
          boardsByWorkspace.set(board.workspaceId, [...existing, board]);
        }
      }

      // Build base workspace list
      const knownWorkspaceIds = new Set(data.map((w) => w.id));

      const safeData = await Promise.all(data.map(async (workspace) => {
        let role: WorkspaceRoleCode = "MEMBER";
        let permissions: string[] = [];

        try {
          permissions = await getMyPermissions(workspace.id);
        } catch (e) {
          console.error(`Failed to fetch permissions for workspace ${workspace.id}`, e);
        }

        if (userId && Array.isArray(workspace.members)) {
          const foundMember = workspace.members.find(
            (member) => member.userId === userId,
          );

          if (foundMember?.role?.code) {
            role = foundMember.role.code;
          }
        }

        return {
          ...workspace,
          boards: boardsByWorkspace.get(workspace.id) || workspace.boards || [],
          members: workspace.members || [],
          role,
          permissions,
        };
      }));

      // For direct boards in workspaces the user is NOT a member of,
      // fetch workspace info and append synthetic workspace entries
      const orphanWorkspaceIds = [
        ...new Set(
          directBoards
            .filter((b) => b.workspaceId && !knownWorkspaceIds.has(b.workspaceId))
            .map((b) => b.workspaceId!),
        ),
      ];

      const orphanWorkspaces: Workspace[] = (
        await Promise.all(
          orphanWorkspaceIds.map(async (id) => {
            try {
              const ws = await getWorkspaceById(id);
              return ws;
            } catch {
              return {
                id,
                name: "Không gian làm việc (Khách)",
                description: "Bạn là thành viên của một số bảng trong Không gian làm việc này.",
                ownerId: "",
                visibility: "PRIVATE" as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: "MEMBER" as const,
                boards: [],
                members: [],
              };
            }
          }),
        )
      ) as Workspace[];

      const orphanEntries: Workspace[] = orphanWorkspaces.map((workspace) => ({
        ...workspace,
        boards: boardsByWorkspace.get(workspace.id) ?? [],
        members: workspace.members || [],
        role: undefined,
      }));

      const combined = [...safeData, ...orphanEntries];
      const uniqueWorkspaces = Array.from(
        new Map(combined.map((w) => [w.id, w])).values(),
      );

      setWorkspaces(uniqueWorkspaces);
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

  // Listen for real-time notifications to refresh list
  useEffect(() => {
    const refreshTypes = [
      "WORKSPACE_MEMBER_JOINED",
      "WORKSPACE_MEMBER_REMOVED",
      "WORKSPACE_ROLE_CHANGED",
      "BOARD_CREATED",
      "BOARD_UPDATED",
      "WORKSPACE_CREATED",
      "WORKSPACE_DELETED",
      "BOARD_MEMBER_ADDED",
    ];

    if (lastNotification && refreshTypes.includes(lastNotification.type)) {
      const timer = setTimeout(() => {
        fetchWorkspaces();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, fetchWorkspaces]);

  // Handle invitation query params
  useEffect(() => {
    const token = searchParams.get("inviteToken");
    const wsId = searchParams.get("workspaceId");
    const invName = searchParams.get("inviterName");

    if (token && wsId) {
      const checkInvite = async () => {
        try {
          // 1. Fetch user's invitations to check status of this token
          const invites = await getMyInvitations();
          const targetInvite = invites.find(inv => inv.inviteToken === token);

          if (targetInvite) {
            if (targetInvite.status === "ACCEPTED") {
              // Check if they are actually a member now
              const myWorkspaces = await getMyWorkspaces();
              const alreadyMember = myWorkspaces.some(w => w.id === wsId);

              if (alreadyMember) {
                toast.info(`Bạn đã là thành viên của không gian làm việc "${targetInvite.workspaceName}"`);
              } else {
                toast.warning(`Lời mời này đã được chấp nhận trước đó, nhưng hiện tại bạn không còn là thành viên của "${targetInvite.workspaceName}".`);
              }
              
              // Mark corresponding notifications as read
              const matching = notifications.filter(
                (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === token || n.workspaceId === wsId)
              );
              for (const n of matching) {
                void markAsRead(n.id);
              }
              
              router.push("/projects");
              return;
            } else if (targetInvite.status === "REJECTED") {
              toast.warning(`Bạn đã từ chối lời mời tham gia "${targetInvite.workspaceName}"`);
              
              // Mark corresponding notifications as read
              const matching = notifications.filter(
                (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === token || n.workspaceId === wsId)
              );
              for (const n of matching) {
                void markAsRead(n.id);
              }

              router.push("/projects");
              return;
            } else if (targetInvite.status === "EXPIRED") {
              toast.error(`Lời mời tham gia "${targetInvite.workspaceName}" đã hết hạn`);
              
              // Mark corresponding notifications as read
              const matching = notifications.filter(
                (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === token || n.workspaceId === wsId)
              );
              for (const n of matching) {
                void markAsRead(n.id);
              }

              router.push("/projects");
              return;
            }
          }

          // 2. Double check if user is already a member of this workspace
          const myWorkspaces = await getMyWorkspaces();
          const alreadyMember = myWorkspaces.some(w => w.id === wsId);
          if (alreadyMember) {
            toast.info(`Bạn đã là thành viên của không gian làm việc này`);
            
            // Mark corresponding notifications as read
            const matching = notifications.filter(
              (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === token || n.workspaceId === wsId)
            );
            for (const n of matching) {
              void markAsRead(n.id);
            }

            router.push("/projects");
            return;
          }

          // If we have targetInvite, use its workspaceName directly without querying the workspace API (which would 403)
          if (targetInvite) {
            setInviteData({
              token,
              workspaceId: wsId,
              inviterName: invName || targetInvite.inviterName || "Ai đó",
              workspaceName: targetInvite.workspaceName,
            });
            setShowInviteModal(true);
          } else {
            // Fallback to getWorkspaceById only if targetInvite is not found
            const ws = await getWorkspaceById(wsId);
            if (ws) {
              setInviteData({
                token,
                workspaceId: wsId,
                inviterName: invName || "Ai đó",
                workspaceName: ws.name,
              });
              setShowInviteModal(true);
            } else {
              console.warn("Workspace not found or deleted");
              // Clear query params since invitation is invalid
              router.push("/projects");
            }
          }
        } catch (error) {
          console.error("Failed to fetch workspace for invitation", error);
          router.push("/projects");
        }
      };
      checkInvite();
    }
  }, [searchParams, notifications, markAsRead, router]);

  // Handle search and workspaceId query params
  useEffect(() => {
    const searchParam = searchParams.get("search");
    const wsIdParam = searchParams.get("workspaceId");
    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (wsIdParam && workspaces.length > 0) {
      const ws = workspaces.find((w) => w.id === wsIdParam);
      if (ws) {
        setSearchQuery(ws.name);
      }
    } else {
      setSearchQuery("");
    }
  }, [searchParams, workspaces]);

  const filteredWorkspaces = useMemo(() => {
    const wsIdParam = searchParams.get("workspaceId");
    if (wsIdParam) {
      return workspaces.filter((ws) => ws.id === wsIdParam);
    }

    if (!searchQuery.trim()) {
      return workspaces;
    }

    const query = searchQuery.toLowerCase();
    return workspaces
      .map((ws) => {
        const wsNameMatches = ws.name.toLowerCase().includes(query);
        const filteredBoards = ws.boards?.filter((b) => b.name.toLowerCase().includes(query)) || [];
        if (wsNameMatches || filteredBoards.length > 0) {
          return {
            ...ws,
            boards: wsNameMatches ? ws.boards : filteredBoards,
          };
        }
        return null;
      })
      .filter(Boolean) as Workspace[];
  }, [workspaces, searchQuery, searchParams]);

  const ownedWorkspaces = useMemo(
    () => filteredWorkspaces.filter((workspace) => workspace.role === "OWNER"),
    [filteredWorkspaces],
  );
  const sharedWorkspaces = useMemo(
    () => filteredWorkspaces.filter((workspace) => workspace.role !== "OWNER"),
    [filteredWorkspaces],
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

  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

  const handleDeleteWorkspace = async (workspaceId: string) => {
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

  const handleInviteMember = async (workspaceId: string, email: string, roleId: string) => {
    await inviteToWorkspace(workspaceId, email, roleId);
    toast.info(`Đã gửi lời mời tới email ${email}`);
    fetchWorkspaces();
  };

  const [memberToRemove, setMemberToRemove] = useState<{ workspaceId: string, memberId: string } | null>(null);

  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    setMemberToRemove({ workspaceId, memberId });
  };

  const handleUpdateMemberRole = async (
    workspaceId: string,
    memberId: string,
    roleId: string,
  ) => {
    await updateWorkspaceMemberRole(workspaceId, memberId, roleId);
    toast.success("Cập nhật vai trò thành viên thành công");
    fetchWorkspaces();
  };

  const handleCreateRole = async (workspaceId: string, payload: SaveRolePayload) => {
    await createWorkspaceRole(workspaceId, payload);
    toast.success("Đã tạo role mới");
    fetchWorkspaces();
  };

  const handleUpdateRole = async (
    workspaceId: string,
    roleId: string,
    payload: SaveRolePayload,
  ) => {
    await updateWorkspaceRole(workspaceId, roleId, payload);
    toast.success("Đã cập nhật role");
    fetchWorkspaces();
  };

  const handleDeleteRole = async (workspaceId: string, roleId: string) => {
    await deleteWorkspaceRole(workspaceId, roleId);
    toast.success("Đã xóa role");
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

  const handleCreateBoard = async (data: CreateBoardFormData) => {
    if (!selectedWorkspaceForBoard) {
      return;
    }

    try {
      setIsSubmittingBoard(true);

      const createdBoard: Board = await createBoard({
        name: data.name,
        description: "",
        workspaceId: selectedWorkspaceForBoard.id,
        ownerId: userId,
        visibility: data.visibility,
        archived: false,
        backgroundType: data.backgroundType,
        backgroundValue: data.backgroundValue,
      });

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === selectedWorkspaceForBoard.id
            ? {
              ...workspace,
              boards: [
                ...(workspace.boards || []).filter(
                  (board) => board.id !== createdBoard.id,
                ),
                createdBoard,
              ],
              updatedAt: new Date().toISOString(),
            }
            : workspace,
        ),
      );

      toast.success(`Đã tạo board "${data.name}".`);
      setShowCreateBoardModal(false);
      setSelectedWorkspaceForBoard(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo board"));
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
          <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            {title}
          </h2>
          {title.includes("KHÁC") && <Info size={18} className="text-blue-500" />}
        </div>

        <div className="space-y-8">
          {items.map((workspace, i) => (
            <WorkspaceRow
              key={`${workspace.id}-${i}`}
              workspace={workspace}
              currentUserId={userId}
              onNavigateBoard={handleNavigateBoard}
              onCreateBoard={handleOpenCreateBoard}
              onInviteMember={handleInviteMember}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberRole={handleUpdateMemberRole}
              onCreateRole={handleCreateRole}
              onUpdateRole={handleUpdateRole}
              onDeleteRole={handleDeleteRole}
              onUpdateWorkspace={handleUpdateWorkspace}
              onDeleteWorkspace={setWorkspaceToDelete}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] px-4 py-10 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
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

        {workspaces.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm không gian hoặc bảng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 dark:text-white transition"
              />
            </div>
            {(searchQuery || searchParams.get("workspaceId")) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  if (searchParams.get("workspaceId") || searchParams.get("search")) {
                    router.push("/projects");
                  }
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-20 text-center shadow-sm transition-colors">
            <p className="mb-5 text-slate-500 dark:text-slate-400">
              Bạn chưa có không gian làm việc nào.
            </p>
            <button
              onClick={() => setShowCreateWsModal(true)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Bắt đầu tạo ngay
            </button>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-16 text-center shadow-sm transition-colors">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Không tìm thấy không gian làm việc hoặc bảng nào khớp với từ khóa tìm kiếm.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                if (searchParams.get("workspaceId") || searchParams.get("search")) {
                  router.push("/projects");
                }
              }}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Xem tất cả không gian làm việc
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

      <ConfirmModal
        open={!!workspaceToDelete}
        title="Xóa không gian làm việc"
        description="Bạn có chắc chắn muốn xóa không gian làm việc này? Toàn bộ dữ liệu bên trong sẽ bị mất."
        confirmText="Xóa Workspace"
        isDanger={true}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={async () => {
          if (workspaceToDelete) {
            await handleDeleteWorkspace(workspaceToDelete);
            setWorkspaceToDelete(null);
          }
        }}
      />

      <ConfirmModal
        open={!!memberToRemove}
        title={memberToRemove?.memberId === userId ? "Rời workspace" : "Xóa thành viên"}
        description={
          memberToRemove?.memberId === userId
            ? "Bạn có chắc chắn muốn rời khỏi không gian làm việc này?"
            : "Bạn có chắc chắn muốn xóa thành viên này khỏi không gian làm việc?"
        }
        confirmText={memberToRemove?.memberId === userId ? "Rời workspace" : "Xóa thành viên"}
        isDanger={true}
        onClose={() => setMemberToRemove(null)}
        onConfirm={async () => {
          if (memberToRemove) {
            if (memberToRemove.memberId === userId) {
              await leaveWorkspace(memberToRemove.workspaceId);
              toast.success("Đã rời khỏi workspace");
            } else {
              await removeWorkspaceMember(memberToRemove.workspaceId, memberToRemove.memberId);
              toast.success("Đã xóa thành viên khỏi workspace");
            }
            fetchWorkspaces();
            setMemberToRemove(null);
          }
        }}
      />

      {inviteData && (
        <WorkspaceInvitationModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            // Clear query params
            router.push("/projects");
          }}
          onAccept={() => {
            fetchWorkspaces();
          }}
          workspaceId={inviteData.workspaceId}
          workspaceName={inviteData.workspaceName}
          inviterName={inviteData.inviterName}
          inviteToken={inviteData.token}
        />
      )}
    </div>
  );
}
