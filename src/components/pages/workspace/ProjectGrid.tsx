"use client";

import React from "react";
import { Plus } from "lucide-react";
import type { Workspace } from "@/lib/api/workspace";
import { ProjectCard } from "./ProjectCard";

interface ProjectGridProps {
  workspaces: Workspace[];
  onCreateClick: () => void;
  onMenuClick?: (workspace: Workspace) => void;
}

export function ProjectGrid({ workspaces, onCreateClick, onMenuClick }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {workspaces.map((ws) => (
        <ProjectCard
          key={ws.id}
          workspace={ws}
          memberCount={0}
          taskCount={0}
          progress={0}
          onMenuClick={onMenuClick}
        />
      ))}

      {/* Create new project card */}
      <button
        onClick={onCreateClick}
        className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all p-8 flex flex-col items-center justify-center gap-3 min-h-55 group"
      >
        <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <Plus size={28} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
            Tạo dự án mới
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Thiết lập không gian làm việc mới
          </p>
        </div>
      </button>
    </div>
  );
}
