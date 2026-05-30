"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Loader2,
  Plus,
  Square,
  Trash2,
  X,
  Clock,
  UserPlus,
} from "lucide-react";
import {
  addChecklistItem,
  createTaskChecklist,
  deleteChecklistItem,
  deleteTaskChecklist,
  getTaskChecklists,
  updateChecklistItem,
  type TaskChecklistData,
  type TaskChecklistItemData,
} from "@/lib/api/task";
import type { BoardMemberSummary } from "@/lib/api/board";
import { TaskFieldRow } from "./BoardTaskDialog";
import { toast } from "sonner";
import { useRealtime } from "@/providers/RealtimeProvider";

interface TaskChecklistsProps {
  taskId: string;
  canUpdate?: boolean;
  boardMembers?: BoardMemberSummary[];
  taskMemberIds?: string[];
  taskDueDate?: string | null;
  onProgressChange?: (total: number, checked: number) => void;
  onRefreshActivities?: () => void;
}

export function TaskChecklists({
  taskId,
  canUpdate = true,
  boardMembers = [],
  taskMemberIds = [],
  taskDueDate,
  onProgressChange,
  onRefreshActivities,
}: TaskChecklistsProps) {
  const { emitBoardUpdated } = useRealtime();

  // Format the parent task due date for display below items
  const formattedDueDate = (() => {
    if (!taskDueDate) return null;
    const parts = taskDueDate.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      return `${day} thg ${month}`;
    }
    return taskDueDate;
  })();

  const dueDateStatus = (() => {
    if (!taskDueDate) return null;
    const now = new Date();
    const dueObj = new Date(taskDueDate + "T23:59:59");
    if (isNaN(dueObj.getTime())) return null;
    if (dueObj.getTime() < now.getTime()) return "overdue";
    const diff = dueObj.getTime() - now.getTime();
    if (diff < 24 * 60 * 60 * 1000) return "soon";
    return "normal";
  })();
  const [checklists, setChecklists] = useState<TaskChecklistData[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemContent, setEditItemContent] = useState("");
  const [editItemMemberId, setEditItemMemberId] = useState<string | null>(null);
  const [newItemMemberId, setNewItemMemberId] = useState<string | null>(null);
  const [activeAssignDropdown, setActiveAssignDropdown] = useState<{
    type: "add" | "edit";
    checklistId?: string;
    itemId?: string;
  } | null>(null);

  const taskMembersList = boardMembers.filter((m) => {
    const uid = m.userId || m.id;
    return uid && taskMemberIds.includes(uid as string);
  });
  const [loading, setLoading] = useState(false);
  const [creatingChecklist, setCreatingChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState("");
  const [hideChecked, setHideChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!activeAssignDropdown) return;
    const handler = () => {
      setActiveAssignDropdown(null);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [activeAssignDropdown]);

  const toggleHideChecked = (checklistId: string) => {
    setHideChecked((prev) => ({
      ...prev,
      [checklistId]: !prev[checklistId],
    }));
  };

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    getTaskChecklists(taskId)
      .then(setChecklists)
      .catch(() => setChecklists([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim() || creatingChecklist) return;
    setCreatingChecklist(true);
    try {
      const created = await createTaskChecklist(taskId, newChecklistTitle.trim());
      setChecklists((prev) => [...prev, created]);
      setNewChecklistTitle("");
      setShowNewChecklist(false);
      toast.success(`Đã tạo checklist: "${created.title}"`);
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể tạo checklist.");
    } finally {
      setCreatingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await deleteTaskChecklist(taskId, checklistId);
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
      toast.success("Đã xóa checklist.");
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể xóa checklist.");
    }
  };

  const handleAddItem = async (checklistId: string) => {
    if (!newItemContent.trim()) return;
    try {
      const item = await addChecklistItem(checklistId, newItemContent.trim(), newItemMemberId);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId ? { ...c, items: [...c.items, item] } : c,
        ),
      );
      setNewItemContent("");
      setAddingItemTo(null);
      setNewItemMemberId(null);
      toast.success(`Đã thêm mục: "${item.content}"`);
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể thêm mục công việc.");
    }
  };

  const handleSaveEdit = async (checklistId: string, itemId: string) => {
    if (!editItemContent.trim()) return;
    try {
      const updated = await updateChecklistItem(itemId, {
        content: editItemContent.trim(),
        assigneeId: editItemMemberId,
      });
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) => (i.id === itemId ? updated : i)),
              }
            : c,
        ),
      );
      setEditingItemId(null);
      setEditItemContent("");
      setEditItemMemberId(null);
      toast.success("Đã cập nhật mục công việc.");
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể cập nhật mục công việc.");
    }
  };

  const handleToggleItem = async (checklistId: string, item: TaskChecklistItemData) => {
    const nextCompleted = !item.completed;
    // Optimistic update
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === item.id ? { ...i, completed: nextCompleted } : i,
              ),
            }
          : c
      ),
    );
    try {
      await updateChecklistItem(item.id, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Đã hoàn thành: "${item.content}"`);
      } else {
        toast.info(`Đã bỏ tích: "${item.content}"`);
      }
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      // Revert
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === item.id ? { ...i, completed: item.completed } : i,
                ),
              }
            : c
        ),
      );
      toast.error("Lỗi khi cập nhật trạng thái mục công việc.");
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      await deleteChecklistItem(itemId);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
            : c,
        ),
      );
      toast.success("Đã xóa mục công việc.");
      onRefreshActivities?.();
      emitBoardUpdated();
    } catch {
      toast.error("Không thể xóa mục công việc.");
    }
  };

  const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const checkedItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.completed).length,
    0,
  );
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(totalItems, checkedItems);
    }
  }, [totalItems, checkedItems, onProgressChange]);

  return (
    <div className="py-4">
      <TaskFieldRow
        label="Công việc"
        icon={<CheckSquare size={15} />}
        rightAction={
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin text-slate-400" />}
            {canUpdate && (
              <button
                type="button"
                onClick={() => setShowNewChecklist(true)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/50"
              >
                Thêm danh sách
              </button>
            )}
          </div>
        }
      >


      {/* New checklist form */}
      {showNewChecklist && (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <input
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder="Tên checklist"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreateChecklist();
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreateChecklist()}
              disabled={creatingChecklist}
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              Tạo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewChecklist(false);
                setNewChecklistTitle("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Checklists Empty fallback */}
      {checklists.length === 0 && !loading && !showNewChecklist && (
        <p className="text-xs text-slate-400">Chưa có checklist nào.</p>
      )}

      {/* Checklists List */}
      <div className="space-y-4">
        {checklists.map((checklist) => {
          const cTotal = checklist.items.length;
          const cChecked = checklist.items.filter((i) => i.completed).length;
          const cPercent = cTotal > 0 ? Math.round((cChecked / cTotal) * 100) : 0;
          const filteredItems = hideChecked[checklist.id]
            ? checklist.items.filter((i) => !i.completed)
            : checklist.items;

          return (
            <div
              key={checklist.id}
              className="py-3 border-b border-slate-100 last:border-0"
            >
              {/* Checklist header */}
              <div className="mb-2.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <CheckSquare size={16} className="mt-1 shrink-0 text-slate-700" />
                  <h4 className="text-sm font-semibold text-slate-800 leading-tight break-words [word-break:break-word]">
                    {checklist.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleHideChecked(checklist.id)}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition duration-200"
                  >
                    {hideChecked[checklist.id] ? "Hiện các mục đã chọn" : "Ẩn các mục đã chọn"}
                  </button>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteChecklist(checklist.id)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition duration-200"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar per checklist */}
              {cTotal > 0 && (
                <div className="flex items-center gap-3.5 mb-3 mt-1">
                  <span className="text-xs font-semibold text-slate-500 min-w-[32px]">{cPercent}%</span>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-lime-500 transition-all duration-300"
                      style={{ width: `${cPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-1">
                {filteredItems.map((item) => {
                  const itemMemberId = item.assigneeId ?? null;
                  const itemMember = boardMembers.find((m) => (m.userId || m.id) === itemMemberId);

                  if (editingItemId === item.id) {
                    return (
                      <li key={item.id} className="pl-7 pr-2 py-1.5 list-none">
                        <textarea
                          value={editItemContent}
                          onChange={(e) => setEditItemContent(e.target.value)}
                          placeholder="Nhập nội dung mục..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500"
                          rows={2}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSaveEdit(checklist.id, item.id);
                            }
                          }}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleSaveEdit(checklist.id, item.id)}
                              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditItemContent("");
                                setEditItemMemberId(null);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/50"
                            >
                              Hủy
                            </button>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeAssignDropdown?.type === 'edit' && activeAssignDropdown?.itemId === item.id) {
                                  setActiveAssignDropdown(null);
                                } else {
                                  setActiveAssignDropdown({ type: 'edit', itemId: item.id });
                                }
                              }}
                              className="flex items-center gap-1 hover:text-slate-800 transition py-1 px-1.5 rounded hover:bg-slate-50 font-medium text-xs text-slate-600"
                              title="Chỉ định thành viên"
                            >
                              <UserPlus size={13} />
                              <span>
                                {editItemMemberId ? (
                                  (() => {
                                    const mInfo = boardMembers.find((m) => (m.userId || m.id) === editItemMemberId);
                                    return mInfo ? `Chỉ định: ${mInfo.fullName || mInfo.email}` : "Chỉ định";
                                  })()
                                ) : "Chỉ định"}
                              </span>
                            </button>

                            {/* Dropdown element for Edit */}
                            {activeAssignDropdown?.type === 'edit' && activeAssignDropdown?.itemId === item.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-full z-30 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                              >
                                <div className="mb-1.5 border-b border-slate-100 pb-1.5 text-center text-[11px] font-semibold text-slate-500">
                                  Chỉ định thành viên
                                </div>
                                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                                  {taskMembersList.length === 0 ? (
                                    <li className="py-2 text-center text-xs text-slate-400">Không có thành viên trong thẻ</li>
                                  ) : (
                                    taskMembersList.map((member) => {
                                      const uid = (member.userId || member.id || "") as string;
                                      const isSelected = editItemMemberId === uid;
                                      const initials = (member.fullName || member.email || "U").charAt(0).toUpperCase();
                                      return (
                                        <li key={uid}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditItemMemberId(isSelected ? null : uid);
                                              setActiveAssignDropdown(null);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition ${
                                              isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 uppercase">
                                                {initials}
                                              </span>
                                              <span className="truncate">{member.fullName || member.email}</span>
                                            </div>
                                            {isSelected && (
                                              <svg className="h-3 w-3 fill-none stroke-current stroke-[2.5px]" viewBox="0 0 24 24">
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                            )}
                                          </button>
                                        </li>
                                      );
                                    })
                                  )}
                                  {editItemMemberId && (
                                    <li className="border-t border-slate-100 pt-1.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditItemMemberId(null);
                                          setActiveAssignDropdown(null);
                                        }}
                                        className="w-full text-center text-[10px] font-semibold text-rose-600 hover:text-rose-700 py-1 hover:bg-rose-50 rounded"
                                      >
                                        Bỏ chỉ định
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={item.id}
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
                    >
                      {/* Toggle button */}
                      <button
                        type="button"
                        disabled={!canUpdate}
                        onClick={() => void handleToggleItem(checklist.id, item)}
                        className="shrink-0 transition outline-none text-left"
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition duration-200 ${
                          item.completed
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white hover:border-blue-500"
                        }`}>
                          {item.completed && (
                            <svg
                              className="h-2.5 w-2.5 fill-none stroke-current stroke-[3.5px]"
                              viewBox="0 0 24 24"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Content text */}
                      <div
                        onClick={() => {
                          if (canUpdate) {
                            setEditingItemId(item.id);
                            setEditItemContent(item.content);
                            setEditItemMemberId(itemMemberId);
                          }
                        }}
                        className={`min-w-0 flex-1 py-0.5 text-sm cursor-pointer rounded px-1 transition break-words [word-break:break-word] ${
                          item.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-700 hover:bg-slate-100/55"
                        }`}
                      >
                        {item.content}
                      </div>

                      {/* Actions & badges */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {formattedDueDate && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            dueDateStatus === "overdue"
                              ? "bg-rose-100 text-rose-700"
                              : dueDateStatus === "soon"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-lime-100 text-lime-700"
                          }`}>
                            <Clock size={10} />
                            <span>{formattedDueDate}</span>
                          </span>
                        )}
                        {itemMember && (
                          <div 
                            onClick={() => {
                              if (canUpdate) {
                                setEditingItemId(item.id);
                                setEditItemContent(item.content);
                                setEditItemMemberId(itemMemberId);
                              }
                            }}
                            className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span 
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase" 
                              title={itemMember.fullName || itemMember.email}
                            >
                              {(itemMember.fullName || itemMember.email || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteItem(checklist.id, item.id)}
                            className="rounded-lg p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Xóa mục này"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Add checklist item */}
              {canUpdate && (
                addingItemTo === checklist.id ? (
                  <div className="mt-3 pl-7">
                    <textarea
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      placeholder="Nhập nội dung mục..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500"
                      rows={2}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleAddItem(checklist.id);
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAddItem(checklist.id)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition"
                        >
                          Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingItemTo(null);
                            setNewItemContent("");
                            setNewItemMemberId(null);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/50"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="relative text-slate-500">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeAssignDropdown?.type === 'add' && activeAssignDropdown?.checklistId === checklist.id) {
                              setActiveAssignDropdown(null);
                            } else {
                              setActiveAssignDropdown({ type: 'add', checklistId: checklist.id });
                            }
                          }}
                          className="flex items-center gap-1 hover:text-slate-800 transition py-1 px-1.5 rounded hover:bg-slate-50 font-medium text-xs text-slate-600"
                          title="Chỉ định thành viên"
                        >
                          <UserPlus size={13} />
                          <span>
                            {newItemMemberId ? (
                              (() => {
                                const mInfo = boardMembers.find((m) => (m.userId || m.id) === newItemMemberId);
                                return mInfo ? `Chỉ định: ${mInfo.fullName || mInfo.email}` : "Chỉ định";
                              })()
                            ) : "Chỉ định"}
                          </span>
                        </button>

                        {/* Dropdown element for Add */}
                        {activeAssignDropdown?.type === 'add' && activeAssignDropdown?.checklistId === checklist.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full z-30 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                          >
                            <div className="mb-1.5 border-b border-slate-100 pb-1.5 text-center text-[11px] font-semibold text-slate-500">
                              Chỉ định thành viên
                            </div>
                            <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                              {taskMembersList.length === 0 ? (
                                <li className="py-2 text-center text-xs text-slate-400">Không có thành viên trong thẻ</li>
                              ) : (
                                taskMembersList.map((member) => {
                                  const uid = (member.userId || member.id || "") as string;
                                  const isSelected = newItemMemberId === uid;
                                  const initials = (member.fullName || member.email || "U").charAt(0).toUpperCase();
                                  return (
                                    <li key={uid}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewItemMemberId(isSelected ? null : uid);
                                          setActiveAssignDropdown(null);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition ${
                                          isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 uppercase">
                                            {initials}
                                          </span>
                                          <span className="truncate">{member.fullName || member.email}</span>
                                        </div>
                                        {isSelected && (
                                          <svg className="h-3 w-3 fill-none stroke-current stroke-[2.5px]" viewBox="0 0 24 24">
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })
                              )}
                              {newItemMemberId && (
                                <li className="border-t border-slate-100 pt-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewItemMemberId(null);
                                      setActiveAssignDropdown(null);
                                    }}
                                    className="w-full text-center text-[10px] font-semibold text-rose-600 hover:text-rose-700 py-1 hover:bg-rose-50 rounded"
                                  >
                                    Bỏ chỉ định
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItemTo(checklist.id);
                      setNewItemContent("");
                      setNewItemMemberId(null);
                    }}
                    className="mt-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition duration-200"
                  >
                    Thêm một mục
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </TaskFieldRow>
  </div>
);
}
