"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Loader2, 
  Clock, 
  FolderPlus,
  RefreshCw,
  ArrowRight,
  WifiOff,
  Plus
} from "lucide-react";
import { 
  getAllDrafts, 
  createDraft, 
  updateDraft, 
  deleteDraft, 
  type TaskDraft 
} from "@/lib/api/redisDraft";
import { createTask } from "@/lib/api/task";
import { toast } from "sonner";

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

  // Monitor network status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        toast.success("Mạng đã được kết nối lại. Đang đồng bộ hóa dữ liệu từ Redis...");
        void loadDrafts();
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

  // Restore draft backup on mount
  useEffect(() => {
    void loadDrafts();

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

  // Auto-save progress to LocalStorage
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("task_draft_local_backup");
    }
  };

  const handleEditClick = (draft: TaskDraft) => {
    setEditingId(draft.id || null);
    setTitle(draft.title);
    setDescription(draft.description);
    setAssigneeId(draft.assigneeId || "");
    setListId(draft.listId || "");
    toast.info("Đã chọn bản nháp để chỉnh sửa");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.warning("Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả bản nháp");
      return;
    }

    setIsSubmitting(true);

    const draft = drafts.find(d => d.id === editingId);
    const isLocal = draft && (draft as any).isLocalOnly;

    const payload: TaskDraft = {
      title,
      description,
      assigneeId: assigneeId.trim() || undefined,
      listId: listId.trim() || undefined,
    };

    try {
      if (!isOnline) {
        // Save to localStorage offline
        if (typeof window !== "undefined") {
          const targetListId = listId.trim() || (editingId ? editingId.replace("board_list_", "") : "unknown");
          const localDraftObj = {
            id: `board_list_${targetListId}`,
            title,
            description,
            listId: targetListId,
            assigneeId: assigneeId.trim() || undefined,
            updatedAt: Date.now()
          };
          localStorage.setItem(`workspace_task_draft_${targetListId}`, JSON.stringify(localDraftObj));
          toast.success("Đã cập nhật bản nháp cục bộ ngoại tuyến thành công");
        }
      } else {
        // Online: save to Redis
        if (editingId) {
          if (isLocal && typeof window !== "undefined") {
            const oldListId = editingId.replace("board_list_", "");
            localStorage.removeItem(`workspace_task_draft_${oldListId}`);
          }
          if (editingId.startsWith("board_list_")) {
            payload.id = editingId;
            await createDraft(payload);
          } else {
            await updateDraft(editingId, payload);
          }
          toast.success("Đã cập nhật bản nháp thành công trên Redis");
        } else {
          await createDraft(payload);
          toast.success("Đã lưu bản nháp mới thành công vào Redis");
        }
      }
      resetForm();
      await loadDrafts();
    } catch (error) {
      console.error("Lỗi khi lưu bản nháp:", error);
      toast.error("Có lỗi xảy ra khi lưu trữ dữ liệu. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const draft = drafts.find(d => d.id === id);
    const isLocal = draft && (draft as any).isLocalOnly;

    if (!isLocal && !isOnline) {
      toast.error("Không thể thực hiện tác vụ xóa trên Redis khi ngoại tuyến.");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa bản nháp này không?")) {
      return;
    }

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
  };

  // Convert draft to an official task and delete from Redis/LocalStorage
  const handlePublish = async (draft: TaskDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draft.listId) {
      toast.error("Bản nháp này chưa có List ID (Mã cột công việc). Vui lòng cập nhật List ID trước khi chuyển thành công việc chính thức.");
      return;
    }

    if (!isOnline) {
      toast.error("Không thể kết nối đến máy chủ khi ngoại tuyến.");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn chuyển bản nháp "${draft.title}" thành công việc chính thức? (Bản nháp sẽ được xóa sau khi tạo thành công)`)) {
      return;
    }

    try {
      // 1. Tạo công việc chính thức qua task-service
      await createTask({
        title: draft.title,
        description: draft.description || "",
        taskListId: draft.listId,
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
      toast.error(err.message || "Không thể tạo công việc. Vui lòng kiểm tra lại List ID.");
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "Vừa xong";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit"
      }).format(new Date(timestamp));
    } catch {
      return "Vừa xong";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            Hộp Nháp Công Việc
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Lưu trữ tức thì và đồng bộ thông minh các công việc chưa hoàn tất cả khi trực tuyến lẫn ngoại tuyến.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-xs">
              <WifiOff size={14} className="animate-bounce" />
              Ngoại tuyến
            </div>
          )}
          <button 
            onClick={() => void loadDrafts()}
            disabled={!isOnline}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 transition"
          >
            <RefreshCw size={14} className={loading && isOnline ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Drafts List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            Danh sách bản nháp hiện có ({drafts.length})
          </h3>

          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
              <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Đang đồng bộ dữ liệu từ Redis...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Bộ nhớ đệm Redis trống</p>
              <p className="text-xs text-slate-400 mt-1">Chưa có bản nháp công việc nào được lưu trên Redis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <div 
                  key={draft.id} 
                  onClick={() => handleEditClick(draft)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition duration-200 cursor-pointer relative overflow-hidden group ${
                    editingId === draft.id ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200/80"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">{draft.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{draft.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={(e) => handlePublish(draft, e)}
                          disabled={!isOnline}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition flex items-center gap-1 shadow-sm shadow-emerald-500/10"
                          title="Tạo công việc chính thức từ bản nháp này"
                        >
                          <Plus size={11} />
                          Publish
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditClick(draft); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
                          title="Sửa"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(draft.id!, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Xóa khỏi Redis"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-50">
                      {draft.listId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 border border-blue-100 text-blue-700">
                          List ID: {draft.listId}
                        </span>
                      )}
                      {(draft as any).isLocalOnly && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                          Ngoại tuyến (Chưa sync)
                        </span>
                      )}
                      {draft.assigneeId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700">
                          Người gắn: {draft.assigneeId.substring(0, 8)}...
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 ml-auto font-medium">
                        <Clock size={11} />
                        {formatTime(draft.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Form (Create/Update) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6 sticky top-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="text-indigo-500" size={18} />
                {editingId ? "Hiệu Chỉnh Bản Nháp" : "Soạn Thảo Bản Nháp"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {editingId ? "Nội dung thay đổi sẽ tự động đồng bộ và lưu trữ tức thời." : "Bản nháp sẽ được lưu trữ tự động trên đám mây và thiết bị của bạn."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Tiêu đề công việc</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bản nháp..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Mô tả chi tiết</label>
                <textarea
                  rows={4}
                  placeholder="Nhập mô tả nội dung bản nháp..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">List ID (Không bắt buộc để lưu nháp, bắt buộc để tạo task)</label>
                  <input
                    type="text"
                    placeholder="Mã cột chứa..."
                    value={listId}
                    onChange={(e) => setListId(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Assignee ID (Không bắt buộc)</label>
                  <input
                    type="text"
                    placeholder="Mã người xử lý..."
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10 transition flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      {editingId ? "Lưu thay đổi" : "Lưu bản nháp"}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
