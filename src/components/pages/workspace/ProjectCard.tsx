"use client";

import React from "react";
import { Users, ListTodo, MoreHorizontal } from "lucide-react";
import type { Workspace } from "@/lib/api/workspace";

const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
];

function getWorkspaceColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `Cập nhật: ${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Cập nhật: ${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Cập nhật: ${diffDays} ngày trước`;
  return `Cập nhật: ${date.toLocaleDateString("vi-VN")}`;
}

interface ProjectCardProps {
  workspace: Workspace;
  memberCount?: number;
  taskCount?: number;
  progress?: number;
  onMenuClick?: (workspace: Workspace) => void;
}

export function ProjectCard({
  workspace,
  memberCount = 0,
  taskCount = 0,
  progress = 0,
  onMenuClick,
}: ProjectCardProps) {
  const colorClass = getWorkspaceColor(workspace.id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Color header bar */}
      <div className={`h-2 w-full ${colorClass}`} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
            {workspace.name}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(workspace);
            }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-10">
          {workspace.description || "Không có mô tả"}
        </p>

        {/* Members & Tasks count */}
        <div className="flex items-center gap-5 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-gray-400" />
            <span>{memberCount} thành viên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ListTodo size={15} className="text-gray-400" />
            <span>{taskCount} công việc</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Tiến độ</span>
            <span className="text-xs font-semibold text-gray-700">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Updated time */}
        <p className="text-xs text-gray-400">
          {timeAgo(workspace.updatedAt)}
        </p>
      </div>
    </div>
  );
}
