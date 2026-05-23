"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-gray-600">
          {description}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${
              isDanger 
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400" 
                : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
