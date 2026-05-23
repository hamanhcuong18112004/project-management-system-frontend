"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Loader2,
  Plus,
  Square,
  Trash2,
  X,
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

interface TaskChecklistsProps {
  taskId: string;
  canUpdate?: boolean;
}

export function TaskChecklists({ taskId, canUpdate = true }: TaskChecklistsProps) {
  const [checklists, setChecklists] = useState<TaskChecklistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChecklist, setCreatingChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState("");

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
    } finally {
      setCreatingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await deleteTaskChecklist(taskId, checklistId);
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
    } catch {
      // ignore
    }
  };

  const handleAddItem = async (checklistId: string) => {
    if (!newItemContent.trim()) return;
    try {
      const item = await addChecklistItem(checklistId, newItemContent.trim());
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId ? { ...c, items: [...c.items, item] } : c,
        ),
      );
      setNewItemContent("");
      setAddingItemTo(null);
    } catch {
      // ignore
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
          : c,
      ),
    );
    try {
      await updateChecklistItem(item.id, { completed: nextCompleted });
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
            : c,
        ),
      );
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
    } catch {
      // ignore
    }
  };

  const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const checkedItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.completed).length,
    0,
  );
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div className="border-t border-slate-100 px-5 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CheckSquare size={15} />
          <span>Công việc phụ</span>
          {loading && <Loader2 size={13} className="animate-spin text-slate-400" />}
        </div>
        {canUpdate && (
          <button
            type="button"
            onClick={() => setShowNewChecklist(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            Thêm danh sách
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="mb-3">
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPercent === 100 ? "bg-emerald-500" : "bg-sky-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* New checklist form */}
      {showNewChecklist && (
        <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <input
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder="Tên checklist"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreateChecklist();
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreateChecklist()}
              disabled={creatingChecklist}
              className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              Tạo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewChecklist(false);
                setNewChecklistTitle("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Checklists */}
      {checklists.length === 0 && !loading && !showNewChecklist && (
        <p className="text-xs text-slate-400">Chưa có checklist nào.</p>
      )}

      <div className="space-y-3">
        {checklists.map((checklist) => {
          const cTotal = checklist.items.length;
          const cChecked = checklist.items.filter((i) => i.completed).length;
          const cPercent = cTotal > 0 ? Math.round((cChecked / cTotal) * 100) : 0;

          return (
            <div
              key={checklist.id}
              className="rounded-2xl border border-slate-100 bg-white p-3"
            >
              {/* Checklist header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <CheckSquare size={15} className="text-sky-600" />
                  <span>{checklist.title}</span>
                </div>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteChecklist(checklist.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Xóa danh sách này"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Progress */}
              {cTotal > 0 && (
                <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cPercent === 100 ? "bg-emerald-500" : "bg-sky-400"}`}
                    style={{ width: `${cPercent}%` }}
                  />
                </div>
              )}

              {/* Items */}
              <ul className="space-y-1">
                {checklist.items.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      disabled={!canUpdate}
                      onClick={() => void handleToggleItem(checklist.id, item)}
                      className={`shrink-0 transition ${canUpdate ? "text-slate-400 hover:text-sky-600" : "cursor-default text-slate-300"}`}
                    >
                      {item.completed ? (
                        <CheckSquare size={16} className="text-emerald-500" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1 py-1 text-sm text-slate-700">
                      {item.content}
                    </div>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(checklist.id, item.id)}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Add item */}
              {canUpdate && (
                addingItemTo === checklist.id ? (
                  <div className="mt-3 pl-7">
                    <div className="flex items-start gap-2">
                      <textarea
                        value={newItemContent}
                        onChange={(e) => setNewItemContent(e.target.value)}
                        placeholder="Nhập nội dung mục..."
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400"
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleAddItem(checklist.id);
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAddItem(checklist.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                      >
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingItemTo(null);
                          setNewItemContent("");
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItemTo(checklist.id);
                      setNewItemContent("");
                    }}
                    className="ml-7 mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    <Plus size={14} />
                    Thêm mục
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
