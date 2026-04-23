"use client";

import React from "react";
import { LayoutPanelTop, Plus } from "lucide-react";
import type { Board } from "@/lib/api/workspace";
import { getBoardCoverStyle } from "./boardPresets";

export function BoardCard({
  board,
  onClick,
}: {
  board: Board;
  onClick: (board: Board) => void;
}) {
  return (
    <div
      onClick={() => onClick(board)}
      className="group relative h-28 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]"
        style={getBoardCoverStyle(board)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-700 backdrop-blur-sm">
        <LayoutPanelTop size={12} />
        <span>Bảng</span>
      </div>
      <div className="absolute inset-x-3 bottom-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">
          {board.name}
        </h3>
      </div>
    </div>
  );
}

export function CreateBoardCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 transition-all hover:border-sky-400 hover:bg-sky-50"
    >
      <div className="flex flex-col items-center gap-2 text-slate-600">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <Plus size={18} />
        </div>
        <span className="text-sm font-medium">Tạo bảng mới</span>
      </div>
    </div>
  );
}
