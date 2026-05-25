"use client";

import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info"
}: ConfirmModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-600 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-5 w-5" />
          </div>
        );
      case "success":
        return (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 sm:mx-0 sm:h-10 sm:w-10">
            <CheckCircle className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600 sm:mx-0 sm:h-10 sm:w-10">
            <Info className="h-5 w-5" />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10 focus:ring-rose-500";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 focus:ring-emerald-500";
      default:
        return "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10 focus:ring-indigo-500";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start gap-4">
              {getIcon()}
              <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left min-w-0 flex-1">
                <h3 className="text-base font-bold leading-6 text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed break-words">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onConfirm}
              className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all sm:w-auto ${getConfirmButtonStyles()} focus:outline-hidden focus:ring-2 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
