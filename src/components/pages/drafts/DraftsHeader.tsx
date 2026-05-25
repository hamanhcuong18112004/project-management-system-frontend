"use client";

import React from "react";
import { Sparkles, WifiOff, RefreshCw } from "lucide-react";

interface DraftsHeaderProps {
  isOnline: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export function DraftsHeader({ isOnline, loading, onRefresh }: DraftsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          Hộp Nháp Công Việc
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Lưu trữ tức thời và đồng bộ thông minh các công việc chưa hoàn tất cả khi trực tuyến lẫn ngoại tuyến.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!isOnline && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-xs">
            <WifiOff size={14} className="animate-bounce" />
            Ngoại tuyến
          </div>
        )}
        <button 
          onClick={onRefresh}
          disabled={!isOnline}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 transition"
        >
          <RefreshCw size={14} className={loading && isOnline ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>
    </div>
  );
}
