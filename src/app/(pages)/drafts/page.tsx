"use client";

import React, { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { 
  getAllDrafts, 
  createDraft, 
  updateDraft, 
  deleteDraft, 
  type TaskDraft 
} from "@/lib/api/redisDraft";
import { createTask, getTaskListsByBoardId, type BoardTaskList } from "@/lib/api/task";
import { getMyWorkspaces, type Workspace } from "@/lib/api/workspace";
import { getBoardsByWorkspace, type BoardDetails } from "@/lib/api/board";
import { toast } from "sonner";

// Import Refactored Smaller Components
import { ConfirmModal } from "@/components/pages/drafts/ConfirmModal";
import { DraftsHeader } from "@/components/pages/drafts/DraftsHeader";
import { DraftCard } from "@/components/pages/drafts/DraftCard";
import { DraftForm } from "@/components/pages/drafts/DraftForm";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<TaskDraft[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [listId, setListId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dropdown States
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [showManualListId, setShowManualListId] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");

  // Metadata Cache States
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boardsMap, setBoardsMap] = useState<Record<string, BoardDetails[]>>({});
  const [columnsMap, setColumnsMap] = useState<Record<string, BoardTaskList[]>>({});
  const [listLookup, setListLookup] = useState<Record<string, {
    workspaceName: string;
    boardName: string;
    listName: string;
    workspaceId: string;
    boardId: string;
  }>>({});
  const [metadataLoading, setMetadataLoading] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "success" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "success" | "info";
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type,
      onConfirm: () => {
        void options.onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Load drafts from Redis & LocalStorage
  const loadDrafts = async () => {
    setLoading(true);
    
    // Read local drafts from localStorage
    const localDrafts: TaskDraft[] = [];
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("workspace_task_draft_")) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              if (val.startsWith("{")) {
                const parsed = JSON.parse(val);
                localDrafts.push({
                  id: parsed.id || key,
                  title: parsed.title || "",
                  description: parsed.description || "Bản nháp cục bộ",
                  listId: parsed.listId || key.replace("workspace_task_draft_", ""),
                  assigneeId: parsed.assigneeId || undefined,
                  updatedAt: parsed.updatedAt || Date.now(),
                  isLocalOnly: true
                } as any);
              } else {
                localDrafts.push({
                  id: key,
                  title: val,
                  description: "Bản nháp cục bộ (Chưa đồng bộ)",
                  listId: key.replace("workspace_task_draft_", ""),
                  updatedAt: Date.now(),
                  isLocalOnly: true
                } as any);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    }

    try {
      const data = await getAllDrafts();
      
      const mergedDrafts = [...data];
      localDrafts.forEach(local => {
        const exists = mergedDrafts.some(r => r.id === local.id);
        if (!exists) {
          mergedDrafts.push(local);
        }
      });

      setDrafts(mergedDrafts);
      setIsOnline(true);
    } catch (error) {
      console.error("Lỗi khi tải bản nháp từ Redis:", error);
      setIsOnline(false);
      setDrafts(localDrafts);
      toast.error("Không thể kết nối đến máy chủ Redis. Đang hiển thị bản nháp ngoại tuyến.");
    } finally {
      setLoading(false);
    }
  };

  // Load Workspaces, Boards and Columns Metadata
  const loadMetadata = async () => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      // Offline: load from cache
      const cached = localStorage.getItem("metadata_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setWorkspaces(parsed.workspaces || []);
          setBoardsMap(parsed.boardsMap || {});
          setColumnsMap(parsed.columnsMap || {});
          setListLookup(parsed.listLookup || {});
        } catch (e) {
          console.error("Lỗi phân tích metadata cache:", e);
        }
      }
      return;
    }

    setMetadataLoading(true);
    try {
      const fetchedWorkspaces = await getMyWorkspaces();
      setWorkspaces(fetchedWorkspaces);

      const tempBoardsMap: Record<string, BoardDetails[]> = {};
      const tempColumnsMap: Record<string, BoardTaskList[]> = {};
      const tempLookup: Record<string, {
        workspaceName: string;
        boardName: string;
        listName: string;
        workspaceId: string;
        boardId: string;
      }> = {};

      // Load boards and columns in parallel
      await Promise.all(
        fetchedWorkspaces.map(async (ws) => {
          try {
            const boards = await getBoardsByWorkspace(ws.id);
            tempBoardsMap[ws.id] = boards;

            await Promise.all(
              boards.map(async (board) => {
                try {
                  const lists = await getTaskListsByBoardId(board.id);
                  tempColumnsMap[board.id] = lists;

                  lists.forEach((list) => {
                    tempLookup[list.id] = {
                      workspaceName: ws.name,
                      boardName: board.name,
                      listName: list.name,
                      workspaceId: ws.id,
                      boardId: board.id,
                    };
                  });
                } catch (err) {
                  console.error(`Lỗi tải cột của bảng ${board.id}:`, err);
                }
              })
            );
          } catch (err) {
            console.error(`Lỗi tải bảng của workspace ${ws.id}:`, err);
          }
        })
      );

      setBoardsMap(tempBoardsMap);
      setColumnsMap(tempColumnsMap);
      setListLookup(tempLookup);

      // Cache to localstorage
      localStorage.setItem(
        "metadata_cache",
        JSON.stringify({
          workspaces: fetchedWorkspaces,
          boardsMap: tempBoardsMap,
          columnsMap: tempColumnsMap,
          listLookup: tempLookup,
        })
      );
    } catch (err) {
      console.error("Lỗi tải metadata:", err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // Monitor network status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        toast.success("Mạng đã được kết nối lại. Đang đồng bộ hóa dữ liệu từ Redis...");
        void loadDrafts();
        void loadMetadata();
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        toast.warning("Bạn đang ngoại tuyến. Các bản nháp mới soạn thảo sẽ được lưu trữ an toàn trong bộ nhớ tạm của thiết bị.");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Restore draft backup on mount & load initial metadata
  useEffect(() => {
    void loadDrafts();
    void loadMetadata();

    if (typeof window !== "undefined") {
      const backupStr = localStorage.getItem("task_draft_local_backup");
      if (backupStr) {
        try {
          const backup = JSON.parse(backupStr);
          if (backup.title || backup.description) {
            setTitle(backup.title || "");
            setDescription(backup.description || "");
            setListId(backup.listId || "");
            setAssigneeId(backup.assigneeId || "");
            setEditingId(backup.editingId || null);
            
            // Resolve workspace & board dropdowns if backup has listId
            if (backup.listId) {
              const cached = localStorage.getItem("metadata_cache");
              if (cached) {
                const parsed = JSON.parse(cached);
                const lookup = parsed.listLookup || {};
                if (lookup[backup.listId]) {
                  setSelectedWorkspaceId(lookup[backup.listId].workspaceId);
                  setSelectedBoardId(lookup[backup.listId].boardId);
                }
              }
            }
            toast.info("Đã tự động khôi phục lại bản nháp chưa lưu gần nhất trên thiết bị của bạn.");
          }
        } catch (e) {
          console.error("Lỗi phân tích bản nháp dự phòng:", e);
        }
      }
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Auto-save form content (Title, Description, List ID, Assignee) in real-time
  useEffect(() => {
    if (!isLoaded) return;
    
    // We only auto-save if title is not empty
    if (!title.trim()) return;

    setSaveStatus("saving");

    const delayDebounceFn = setTimeout(async () => {
      const payload: TaskDraft = {
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId.trim() || undefined,
        listId: listId.trim() || undefined,
      };

      try {
        if (!isOnline) {
          // Offline auto-save to localStorage
          const targetListId = listId.trim() || (editingId ? editingId.replace("board_list_", "").replace("draft_temp_", "") : `temp_${Date.now()}`);
          const draftId = editingId || `board_list_${targetListId}`;
          
          const localDraftObj = {
            id: draftId,
            title: title.trim(),
            description: description.trim(),
            listId: listId.trim() || undefined,
            assigneeId: assigneeId.trim() || undefined,
            updatedAt: Date.now(),
            isLocalOnly: true
          };

          localStorage.setItem(`workspace_task_draft_${targetListId}`, JSON.stringify(localDraftObj));
          
          if (!editingId) {
            setEditingId(draftId);
          }
          void loadDrafts();
        } else {
          // Online auto-save to Redis
          if (editingId) {
            // Check if editing a local draft
            const draftObj = drafts.find(d => d.id === editingId);
            const isLocal = draftObj && (draftObj as any).isLocalOnly;
            
            if (isLocal && typeof window !== "undefined") {
              const oldListId = editingId.replace("board_list_", "");
              localStorage.removeItem(`workspace_task_draft_${oldListId}`);
            }

            if (editingId.startsWith("board_list_") || editingId.startsWith("draft_temp_")) {
              payload.id = editingId;
              await createDraft(payload);
            } else {
              await updateDraft(editingId, payload);
            }
          } else {
            // Create a new draft
            const created = await createDraft(payload);
            if (created && created.id) {
              setEditingId(created.id);
            }
          }
          void loadDrafts();
        }
        setSaveStatus("saved");
      } catch (err) {
        console.error("Lỗi tự động lưu bản nháp:", err);
        setSaveStatus("idle");
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [title, description, listId, assigneeId, editingId, isOnline, isLoaded]);

  // Keep a local backup in case of page close
  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window !== "undefined") {
      if (title.trim() || description.trim() || listId.trim() || assigneeId.trim()) {
        const backup = { title, description, listId, assigneeId, editingId };
        localStorage.setItem("task_draft_local_backup", JSON.stringify(backup));
      } else {
        localStorage.removeItem("task_draft_local_backup");
      }
    }
  }, [title, description, listId, assigneeId, editingId, isLoaded]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setListId("");
    setSelectedWorkspaceId("");
    setSelectedBoardId("");
    setSaveStatus("idle");
    if (typeof window !== "undefined") {
      localStorage.removeItem("task_draft_local_backup");
    }
  };

  const handleEditClick = (draft: TaskDraft) => {
    setEditingId(draft.id || null);
    setTitle(draft.title);
    setDescription(draft.description);
    setAssigneeId(draft.assigneeId || "");
    
    const targetListId = draft.listId || "";
    setListId(targetListId);
    
    // Resolve workspace and board from listId
    if (targetListId && listLookup[targetListId]) {
      setSelectedWorkspaceId(listLookup[targetListId].workspaceId);
      setSelectedBoardId(listLookup[targetListId].boardId);
      setShowManualListId(false);
    } else {
      setSelectedWorkspaceId("");
      setSelectedBoardId("");
      if (targetListId) {
        setShowManualListId(true);
      } else {
        setShowManualListId(false);
      }
    }
    toast.info("Đã chọn bản nháp để chỉnh sửa");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const draft = drafts.find(d => d.id === id);
    const isLocal = draft && (draft as any).isLocalOnly;

    if (!isLocal && !isOnline) {
      toast.error("Không thể thực hiện tác vụ xóa trên Redis khi ngoại tuyến.");
      return;
    }

    showConfirm({
      title: "Xóa bản nháp công việc",
      message: `Bạn có chắc chắn muốn xóa bản nháp "${draft?.title || 'này'}" không? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa bản nháp",
      cancelText: "Hủy bỏ",
      type: "danger",
      onConfirm: async () => {
        try {
          if (isLocal) {
            if (typeof window !== "undefined") {
              const listIdVal = id.replace("board_list_", "");
              localStorage.removeItem(`workspace_task_draft_${listIdVal}`);
              toast.success("Đã xóa bản nháp cục bộ thành công");
            }
          } else {
            await deleteDraft(id);
            toast.success("Đã xóa bản nháp thành công khỏi Redis");
          }
          
          if (editingId === id) {
            resetForm();
          }
          await loadDrafts();
        } catch (error) {
          console.error("Lỗi khi xóa bản nháp:", error);
          toast.error("Không thể xóa bản nháp");
        }
      }
    });
  };

  // Convert draft to an official task and delete from Redis/LocalStorage
  const handlePublish = (draft: TaskDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draft.listId) {
      toast.error("Bản nháp này chưa có vị trí lưu trữ (Cột công việc). Vui lòng chọn cột trước khi chuyển thành công việc chính thức.");
      return;
    }

    if (!isOnline) {
      toast.error("Không thể kết nối đến máy chủ khi ngoại tuyến.");
      return;
    }

    showConfirm({
      title: "Chuyển thành công việc chính thức",
      message: `Bạn có chắc chắn muốn chuyển bản nháp "${draft.title}" thành công việc chính thức trên bảng? Bản nháp sẽ được xóa sau khi tạo thành công.`,
      confirmText: "Xác nhận chuyển",
      cancelText: "Hủy",
      type: "success",
      onConfirm: async () => {
        try {
          // 1. Tạo công việc chính thức qua task-service
          await createTask({
            taskListId: draft.listId!,
            title: draft.title,
            description: draft.description || "",
            status: "TODO",
            priority: "MEDIUM"
          });

          toast.success("Đã tạo công việc chính thức thành công trên bảng!");

          // 2. Xóa bản nháp khỏi Redis hoặc LocalStorage
          if ((draft as any).isLocalOnly) {
            if (typeof window !== "undefined") {
              const listIdVal = draft.id!.replace("board_list_", "");
              localStorage.removeItem(`workspace_task_draft_${listIdVal}`);
            }
          } else {
            await deleteDraft(draft.id!);
          }
          
          if (editingId === draft.id) {
            resetForm();
          }
          await loadDrafts();
        } catch (err: any) {
          console.error("Lỗi khi chuyển bản nháp thành công việc:", err);
          toast.error(err.message || "Không thể tạo công việc. Vui lòng kiểm tra lại vị trí lưu trữ.");
        }
      }
    });
  };

  // Publish from Form
  const handlePublishFromForm = async (e: React.MouseEvent) => {
    const payload: TaskDraft = {
      title: title.trim(),
      description: description.trim(),
      assigneeId: assigneeId.trim() || undefined,
      listId: listId.trim() || undefined,
    };

    if (!payload.listId) {
      toast.error("Vui lòng chọn hoặc nhập vị trí cột chứa trước khi đăng");
      return;
    }

    showConfirm({
      title: "Chuyển thành công việc chính thức",
      message: `Bạn có chắc chắn muốn chuyển bản nháp "${payload.title}" thành công việc chính thức trên bảng?`,
      confirmText: "Xác nhận chuyển",
      cancelText: "Hủy",
      type: "success",
      onConfirm: async () => {
        try {
          setIsSubmitting(true);
          let finalId = editingId;
          
          // Save first if not already saved or if modified
          if (!editingId) {
            const created = await createDraft(payload);
            finalId = created.id || null;
          } else {
            const draftObj = drafts.find(d => d.id === editingId);
            const isLocal = draftObj && (draftObj as any).isLocalOnly;
            
            if (isLocal && typeof window !== "undefined") {
              const oldListId = editingId.replace("board_list_", "");
              localStorage.removeItem(`workspace_task_draft_${oldListId}`);
            }

            if (editingId.startsWith("board_list_") || editingId.startsWith("draft_temp_")) {
              payload.id = editingId;
              await createDraft(payload);
            } else {
              await updateDraft(editingId, payload);
            }
          }

          // Publish
          await createTask({
            taskListId: payload.listId!,
            title: payload.title,
            description: payload.description || "",
            status: "TODO",
            priority: "MEDIUM"
          });

          toast.success("Đã tạo công việc chính thức thành công trên bảng!");

          // Delete draft
          if (finalId) {
            if (finalId.startsWith("board_list_")) {
              if (typeof window !== "undefined") {
                const listIdVal = finalId.replace("board_list_", "");
                localStorage.removeItem(`workspace_task_draft_${listIdVal}`);
              }
            } else {
              await deleteDraft(finalId);
            }
          }

          resetForm();
          await loadDrafts();
        } catch (err: any) {
          console.error("Lỗi khi chuyển bản nháp thành công việc:", err);
          toast.error(err.message || "Không thể tạo công việc. Vui lòng kiểm tra lại vị trí lưu trữ.");
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <DraftsHeader 
        isOnline={isOnline} 
        loading={loading} 
        onRefresh={() => { void loadDrafts(); void loadMetadata(); }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Drafts List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            Danh sách bản nháp hiện có ({drafts.length})
          </h3>

          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
              <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Bộ nhớ đệm trống</p>
              <p className="text-xs text-slate-400 mt-1">Chưa có bản nháp công việc nào được lưu trữ.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  isActive={editingId === draft.id}
                  isOnline={isOnline}
                  listLookup={listLookup}
                  onClick={() => handleEditClick(draft)}
                  onPublish={(e) => handlePublish(draft, e)}
                  onDelete={(e) => handleDelete(draft.id!, e)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Form (Create/Update) */}
        <div className="lg:col-span-5">
          <DraftForm
            editingId={editingId}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            assigneeId={assigneeId}
            setAssigneeId={setAssigneeId}
            listId={listId}
            setListId={setListId}
            selectedWorkspaceId={selectedWorkspaceId}
            setSelectedWorkspaceId={setSelectedWorkspaceId}
            selectedBoardId={selectedBoardId}
            setSelectedBoardId={setSelectedBoardId}
            showManualListId={showManualListId}
            setShowManualListId={setShowManualListId}
            isOnline={isOnline}
            isSubmitting={isSubmitting}
            saveStatus={saveStatus}
            workspaces={workspaces}
            boardsMap={boardsMap}
            columnsMap={columnsMap}
            listLookup={listLookup}
            resetForm={resetForm}
            onPublishClick={handlePublishFromForm}
          />
        </div>
      </div>

      {/* Confirmation Modal Component */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />
    </div>
  );
}
