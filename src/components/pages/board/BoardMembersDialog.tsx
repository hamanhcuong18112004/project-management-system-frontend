"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Users, X } from "lucide-react";
import type { Member as WorkspaceMember } from "@/lib/api/workspace";

interface BoardMembersDialogProps {
  open: boolean;
  boardName: string;
  members: WorkspaceMember[];
  selectedUserIds: string[];
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void> | void;
}

export function BoardMembersDialog({
  open,
  boardName,
  members,
  selectedUserIds,
  onClose,
  onConfirm,
}: BoardMembersDialogProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedUserIds);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftIds(selectedUserIds);
    setConfirmOpen(false);
  }, [open, selectedUserIds]);

  const selectedCount = draftIds.length;
  const selectedMembers = useMemo(
    () => members.filter((member) => draftIds.includes(member.userId)),
    [draftIds, members],
  );

  if (!open) {
    return null;
  }

  const toggleMember = (userId: string) => {
    setDraftIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      await onConfirm(draftIds);
      setConfirmOpen(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="Đóng quản lý thành viên"
          onClick={onClose}
        />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/30">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Board Members
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Chọn thành viên cho bảng riêng tư
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Chọn những người trong workspace được phép xem bảng{" "}
                <span className="font-semibold text-slate-700">{boardName}</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Users size={16} />
                <span className="text-sm font-medium">Danh sách thành viên workspace</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {selectedCount} đã chọn
              </span>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  Workspace này chưa có thành viên nào để thêm vào bảng.
                </div>
              ) : (
                members.map((member) => {
                  const checked = draftIds.includes(member.userId);

                  return (
                    <label
                      key={member.userId}
                      className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                        checked
                          ? "border-sky-300 bg-sky-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.fullName || member.email}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">{member.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {member.role === "OWNER" ? "Chủ sở hữu" : "Thành viên"}
                        </span>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                            checked
                              ? "border-sky-500 bg-sky-500 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMember(member.userId)}
                          className="sr-only"
                        />
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-5">
            <span className="text-sm text-slate-500">
              Bước tiếp theo sẽ là gọi board-service rồi phát event sang notification-service.
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[97] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Đóng xác nhận thành viên"
            onClick={() => setConfirmOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30">
            <h4 className="text-xl font-bold text-slate-900">Xác nhận cập nhật thành viên</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn đang chọn <span className="font-semibold text-slate-900">{selectedCount}</span>{" "}
              người có quyền xem bảng riêng tư này.
            </p>

            <div className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {selectedMembers.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa chọn ai.</p>
              ) : (
                selectedMembers.map((member) => (
                  <div key={member.userId} className="text-sm text-slate-700">
                    {member.fullName || member.email} - {member.email}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
