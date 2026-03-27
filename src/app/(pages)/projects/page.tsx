"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, FolderKanban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAllWorkspaces,
  createWorkspace,
  deleteWorkspace,
  type Workspace,
  type Visibility,
} from "@/lib/api/workspace";
import { getApiErrorMessage } from "@/lib/api/error";
import { ProjectGrid } from "@/components/pages/workspace";
import { CreateProjectModal } from "@/components/pages/workspace";

export default function ProjectsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filtered, setFiltered] = useState<Workspace[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllWorkspaces();
      setWorkspaces(data);
      setFiltered(data);
      console.log("workspaces", data);
    } catch (err) {
      const message = getApiErrorMessage(err, "Không thể tải danh sách dự án");
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(workspaces);
      console.log("workspaces", workspaces);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        workspaces.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            (w.description && w.description.toLowerCase().includes(q))
        )
      );
    }
  }, [search, workspaces]);

  // Create workspace
  const handleCreate = async (data: {
    name: string;
    description: string;
    color: string;
    visibility: Visibility;
  }) => {
    try {
      setIsCreating(true);
      await createWorkspace({
        name: data.name,
        description: data.description || undefined,
        visibility: data.visibility,
      });
      toast.success("Tạo dự án thành công!");
      setShowModal(false);
      fetchWorkspaces();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo dự án"));
    } finally {
      setIsCreating(false);
    }
  };

  // Delete workspace
  const handleMenuClick = async (workspace: Workspace) => {
    if (!confirm(`Bạn có chắc muốn xóa dự án "${workspace.name}"?`)) return;
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Đã xóa dự án");
      fetchWorkspaces();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa dự án"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FolderKanban size={20} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Dự án</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm dự án..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all w-56"
            />
          </div>

          {/* Filter */}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Filter size={16} />
            <span>Lọc</span>
          </button>

          {/* Create */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>Tạo dự án</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchWorkspaces}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <ProjectGrid
          workspaces={filtered}
          onCreateClick={() => setShowModal(true)}
          onMenuClick={handleMenuClick}
        />
      )}

      {/* Create Modal */}
      <CreateProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />
    </div>
  );
}
