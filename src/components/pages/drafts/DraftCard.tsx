"use client";

import React from "react";
import { Clock, Edit3, Plus, Trash2 } from "lucide-react";
import { type TaskDraft } from "@/lib/api/redisDraft";

interface DraftCardProps {
  draft: TaskDraft;
  isActive: boolean;
  isOnline: boolean;
  listLookup: Record<string, {
    workspaceName: string;
    boardName: string;
    listName: string;
    workspaceId: string;
    boardId: string;
  }>;
  onClick: () => void;
  onPublish: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function DraftCard({
  draft,
  isActive,
  isOnline,
  listLookup,
  onClick,
  onPublish,
  onDelete
}: DraftCardProps) {
  const isLocal = (draft as any).isLocalOnly;

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
    <div 
      onClick={onClick}
      className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition duration-200 cursor-pointer relative overflow-hidden group ${
        isActive ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200/80"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">{draft.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2">{draft.description}</p>
          </div>
          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition shrink-0">
            <button
              onClick={onPublish}
              disabled={!isOnline || !draft.listId}
              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white transition flex items-center gap-1 shadow-sm shadow-emerald-500/10"
              title={draft.listId ? "Tạo công việc chính thức từ bản nháp này" : "Vui lòng chọn vị trí cột chứa trước khi đăng"}
            >
              <Plus size={11} />
              Publish
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
              title="Sửa"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
              title="Xóa bản nháp"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-50 items-center">
          {draft.listId && (
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 border border-blue-100 text-blue-700 max-w-[280px] truncate"
              title={listLookup[draft.listId] ? `${listLookup[draft.listId].workspaceName} › ${listLookup[draft.listId].boardName} › ${listLookup[draft.listId].listName}` : `Mã ID: ${draft.listId}`}
            >
              {listLookup[draft.listId] ? (
                <span className="truncate">
                  {listLookup[draft.listId].workspaceName} › {listLookup[draft.listId].boardName} › {listLookup[draft.listId].listName}
                </span>
              ) : (
                `ID Cột: ${draft.listId.substring(0, 8)}...`
              )}
            </span>
          )}
          
          {isLocal && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
              Ngoại tuyến (Chưa sync)
            </span>
          )}
          
          {draft.priority && (
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                draft.priority === "LOW" ? "bg-slate-50 border-slate-200 text-slate-700" :
                draft.priority === "HIGH" ? "bg-orange-50 border-orange-200 text-orange-700" :
                draft.priority === "URGENT" ? "bg-rose-50 border-rose-200 text-rose-700" :
                "bg-blue-50 border-blue-100 text-blue-700"
              }`}
            >
              Ưu tiên: {
                draft.priority === "LOW" ? "Thấp" :
                draft.priority === "HIGH" ? "Cao" :
                draft.priority === "URGENT" ? "Khẩn cấp" : "Trung bình"
              }
            </span>
          )}

          {draft.dueDate && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 border border-indigo-150 text-indigo-700">
              Hạn: {new Date(draft.dueDate).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
          
          {draft.assigneeId && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700">
              Người xử lý: {draft.assigneeId.substring(0, 8)}...
            </span>
          )}
          
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 ml-auto font-medium">
            <Clock size={11} />
            {formatTime(draft.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
