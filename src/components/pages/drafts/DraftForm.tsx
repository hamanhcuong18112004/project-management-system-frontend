"use client";

import React from "react";
import { FolderPlus, Loader2, ArrowRight } from "lucide-react";
import { type Workspace } from "@/lib/api/workspace";
import { type BoardDetails } from "@/lib/api/board";
import { type BoardTaskList } from "@/lib/api/task";

interface DraftFormProps {
  editingId: string | null;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  assigneeId: string;
  setAssigneeId: (val: string) => void;
  listId: string;
  setListId: (val: string) => void;
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (val: string) => void;
  selectedBoardId: string;
  setSelectedBoardId: (val: string) => void;
  showManualListId: boolean;
  setShowManualListId: (val: boolean) => void;
  isOnline: boolean;
  isSubmitting: boolean;
  saveStatus: "saved" | "saving" | "idle";
  workspaces: Workspace[];
  boardsMap: Record<string, BoardDetails[]>;
  columnsMap: Record<string, BoardTaskList[]>;
  listLookup: Record<string, {
    workspaceName: string;
    boardName: string;
    listName: string;
    workspaceId: string;
    boardId: string;
  }>;
  resetForm: () => void;
  onPublishClick: (e: React.MouseEvent) => void;
}

export function DraftForm({
  editingId,
  title,
  setTitle,
  description,
  setDescription,
  assigneeId,
  setAssigneeId,
  listId,
  setListId,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  selectedBoardId,
  setSelectedBoardId,
  showManualListId,
  setShowManualListId,
  isOnline,
  isSubmitting,
  saveStatus,
  workspaces,
  boardsMap,
  columnsMap,
  listLookup,
  resetForm,
  onPublishClick
}: DraftFormProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6 sticky top-4 animate-in fade-in-50 slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FolderPlus className="text-indigo-500" size={18} />
          {editingId ? "Hiệu Chỉnh Bản Nháp" : "Soạn Thảo Bản Nháp"}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {editingId ? "Nội dung thay đổi sẽ tự động đồng bộ và lưu trữ tức thời." : "Bản nháp sẽ được lưu trữ tự động trên đám mây và thiết bị của bạn."}
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

        {/* Vị trí lưu trữ (Workspace / Board / Column) */}
        <div className="space-y-3 p-4 bg-slate-50/60 border border-slate-200/60 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Vị trí lưu trữ</span>
            <button
              type="button"
              onClick={() => setShowManualListId(!showManualListId)}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              {showManualListId ? "Chọn theo menu" : "Nhập ID thủ công"}
            </button>
          </div>

          {!showManualListId ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Không gian làm việc</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => {
                    const wsId = e.target.value;
                    setSelectedWorkspaceId(wsId);
                    setSelectedBoardId("");
                    setListId("");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white hover:bg-slate-50 transition"
                >
                  <option value="">-- Chọn Không gian --</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Bảng công việc</label>
                  <select
                    value={selectedBoardId}
                    disabled={!selectedWorkspaceId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setSelectedBoardId(bId);
                      setListId("");
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition"
                  >
                    <option value="">-- Chọn Bảng --</option>
                    {(boardsMap[selectedWorkspaceId] || []).map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Cột chứa thẻ</label>
                  <select
                    value={listId}
                    disabled={!selectedBoardId}
                    onChange={(e) => setListId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition"
                  >
                    <option value="">-- Chọn Cột --</option>
                    {(columnsMap[selectedBoardId] || []).map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Mã ID cột chứa (List ID)</label>
              <input
                type="text"
                placeholder="Mã cột chứa (UUID)..."
                value={listId}
                onChange={(e) => {
                  const val = e.target.value;
                  setListId(val);
                  if (listLookup[val]) {
                    setSelectedWorkspaceId(listLookup[val].workspaceId);
                    setSelectedBoardId(listLookup[val].boardId);
                  }
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition font-mono"
              />
            </div>
          )}
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

        <div className="pt-2 flex flex-col gap-2">
          {/* Auto-save status indicator */}
          <div className="flex items-center justify-end text-[11px] text-slate-400 gap-1.5 h-5">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="animate-spin text-indigo-500" size={12} />
                <span>Đang lưu tự động...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-600 font-medium">Đã tự động lưu trữ tức thời</span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  Tạo nháp mới
                </button>
                <button
                  type="button"
                  onClick={onPublishClick}
                  disabled={!listId || !title.trim() || !description.trim() || !isOnline}
                  className="flex-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-1.5"
                  title={!isOnline ? "Vui lòng kết nối mạng để đăng công việc" : !listId ? "Vui lòng chọn vị trí cột chứa trước khi đăng" : ""}
                >
                  Tạo Task chính thức
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={!title.trim() && !description.trim()}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
                >
                  Xóa trắng
                </button>
                <button
                  type="button"
                  onClick={onPublishClick}
                  disabled={!listId || !title.trim() || !description.trim() || !isOnline || isSubmitting}
                  className="flex-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-1.5"
                  title={!isOnline ? "Vui lòng kết nối mạng để đăng công việc" : !listId ? "Vui lòng chọn vị trí cột chứa trước khi đăng" : ""}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Tạo Task chính thức"}
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
