"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import type { Workspace } from "@/lib/api/workspace";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onUpdateWorkspace: (data: any) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  isLoading?: boolean;
}

export function SettingsModal({
  open,
  onClose,
  workspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  isLoading = false,
}: SettingsModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || "");
    }
  }, [workspace]);

  if (!open || !workspace) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateWorkspace({ id: workspace.id, name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Cài đặt không gian làm việc
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên không gian làm việc
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onDeleteWorkspace(workspace.id)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} /> Xóa không gian làm việc
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading && <span className="animate-spin mr-1">⌛</span>}
              <Save size={16} /> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}