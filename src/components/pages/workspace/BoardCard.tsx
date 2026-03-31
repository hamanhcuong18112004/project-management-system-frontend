"use client";

import React from "react";
import { Plus } from "lucide-react";
import type { Board } from "@/lib/api/workspace";

export function BoardCard({ board, onClick }: { board: Board; onClick: (id: string) => void }) {
  return (
    <div
      onClick={() => onClick(board.id)}
      className="relative w-48 h-24 rounded-md cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all flex-shrink-0 bg-blue-600/80"
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      <div className="absolute inset-0 p-3">
        <h3 className="text-white font-bold text-sm line-clamp-2">{board.name}</h3>
      </div>
    </div>
  );
}

export function CreateBoardCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-48 h-24 rounded-md cursor-pointer bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
    >
      <div className="flex items-center gap-2 text-gray-600">
        <Plus size={16} />
        <span className="text-sm font-medium">Tạo bảng mới</span>
      </div>
    </div>
  );
}