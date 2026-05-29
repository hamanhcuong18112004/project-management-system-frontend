"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  AlertCircle,
  Building,
  User,
  Shield,
  ArrowRight,
} from "lucide-react";
import { getMyInvitations, acceptWorkspaceInvite, rejectWorkspaceInvite, getMyWorkspaces, type WorkspaceInviteResponse } from "@/lib/api/workspace";
import { toast } from "sonner";
import { useNotifications } from "@/providers/NotificationProvider";
import { parseServerDate } from "@/lib/helper/formatTime";

export default function InvitationsPage() {
  const { notifications, markAsRead } = useNotifications();
  const [invitations, setInvitations] = useState<WorkspaceInviteResponse[]>([]);
  const [myWorkspacesList, setMyWorkspacesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteActionLoading, setInviteActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<WorkspaceInviteResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadInvitations = async () => {
    try {
      const userInvites = await getMyInvitations();
      setInvitations(userInvites);
      
      const workspaces = await getMyWorkspaces();
      setMyWorkspacesList(workspaces);

      // Dispatch custom event to notify sidebar to update badge count
      window.dispatchEvent(new Event("invitations-updated"));
    } catch (error) {
      console.error("Lỗi khi tải danh sách lời mời:", error);
      toast.error("Không thể tải danh sách lời mời");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvitations();
  }, []);

  const handleAcceptInvite = async (invite: WorkspaceInviteResponse) => {
    setInviteActionLoading(invite.id);
    try {
      await acceptWorkspaceInvite(invite.workspaceId, invite.inviteToken);
      toast.success(`Đã đồng ý gia nhập workspace "${invite.workspaceName}"`);
      
      // Mark matching notifications as read
      try {
        const matching = notifications.filter(
          (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === invite.inviteToken || n.workspaceId === invite.workspaceId)
        );
        for (const n of matching) {
          await markAsRead(n.id);
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }

      await loadInvitations();
    } catch (error: any) {
      toast.error(error.message || "Không thể chấp nhận lời mời");
    } finally {
      setInviteActionLoading(null);
    }
  };

  const handleOpenRejectModal = (invite: WorkspaceInviteResponse) => {
    setShowRejectModal(invite);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng cung cấp lý do từ chối");
      return;
    }

    const invite = showRejectModal;
    setInviteActionLoading(invite.id);
    setShowRejectModal(null);

    try {
      await rejectWorkspaceInvite(invite.workspaceId, invite.inviteToken, rejectReason);
      toast.success(`Đã từ chối lời mời vào workspace "${invite.workspaceName}"`);
      
      // Mark matching notifications as read
      try {
        const matching = notifications.filter(
          (n) => !n.read && n.type === "WORKSPACE_INVITE" && (n.inviteToken === invite.inviteToken || n.workspaceId === invite.workspaceId)
        );
        for (const n of matching) {
          await markAsRead(n.id);
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }

      await loadInvitations();
    } catch (error: any) {
      toast.error(error.message || "Không thể từ chối lời mời");
    } finally {
      setInviteActionLoading(null);
      setRejectReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} />
            Đã đồng ý
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            Đã từ chối
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Hết hạn
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
            <HelpCircle size={12} />
            Đang chờ
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parseServerDate(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Đang tải danh sách lời mời...</p>
        </div>
      </div>
    );
  }

  const pendingInvites = invitations.filter((inv) => inv.status === "PENDING");
  const processedInvites = invitations.filter((inv) => inv.status !== "PENDING");

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="text-blue-600" size={26} />
          Hộp Thư Lời Mời
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý các lời mời tham gia workspace từ các đội nhóm khác gửi tới tài khoản của bạn.
        </p>
      </div>

      {/* Pending Invitations Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Đang chờ xử lý ({pendingInvites.length})
        </h3>
        
        {pendingInvites.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-700">
              <Mail size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Không có lời mời nào đang chờ</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hộp thư của bạn hoàn toàn trống sạch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvites.map((invite) => {
              const isLoadingThis = inviteActionLoading === invite.id;
              return (
                <div 
                  key={invite.id} 
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-100 transition duration-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-500/5 rounded-full pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Building size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm break-words">{invite.workspaceName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Mời bởi: <span className="font-semibold text-slate-600">{invite.inviterName}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <div className="text-center flex-1 border-r border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vai trò đề xuất</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                          <Shield size={10} />
                          {invite.roleName}
                        </span>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Nhận lúc</p>
                        <p className="text-xs font-semibold text-slate-600 mt-1">{formatDate(invite.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => handleOpenRejectModal(invite)}
                      disabled={Boolean(inviteActionLoading)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={Boolean(inviteActionLoading)}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 transition flex items-center gap-1.5"
                    >
                      {isLoadingThis ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>Đồng ý gia nhập <ArrowRight size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Lịch sử lời mời khác ({processedInvites.length})
        </h3>

        {processedInvites.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
            <p className="text-xs text-slate-400 dark:text-slate-500">Không có lịch sử lời mời nào trước đây.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-4">Workspace</th>
                      <th className="px-5 py-4">Người mời</th>
                      <th className="px-5 py-4">Vai trò đề xuất</th>
                      <th className="px-5 py-4">Thời gian nhận</th>
                      <th className="px-5 py-4">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {processedInvites.map((invite) => {
                      const isMember = myWorkspacesList.some((w) => w.id === invite.workspaceId);
                      return (
                        <tr key={invite.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-xs">{invite.workspaceName}</span>
                              {invite.status === "ACCEPTED" && (
                                isMember ? (
                                  <Link
                                    href={`/projects?workspaceId=${invite.workspaceId}`}
                                    className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold mt-0.5"
                                  >
                                    Đi đến workspace →
                                  </Link>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 italic">
                                    Không còn là thành viên
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-slate-600 text-xs">{invite.inviterName}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 uppercase">
                              {invite.roleName}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-slate-500 text-xs">{formatDate(invite.createdAt)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {getStatusBadge(invite.status)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-semibold">
                            {invite.status === "ACCEPTED" ? (
                              isMember ? (
                                <Link
                                  href={`/projects?workspaceId=${invite.workspaceId}`}
                                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold border border-blue-100 transition text-[11px]"
                                >
                                  Truy cập
                                </Link>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold select-none">
                                  Không khả dụng
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {processedInvites.map((invite) => {
                const isMember = myWorkspacesList.some((w) => w.id === invite.workspaceId);
                return (
                  <div
                    key={invite.id}
                    className="p-4 flex flex-col gap-3"
                  >
                    {/* Top Row: Workspace Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm block break-words">
                          {invite.workspaceName}
                        </span>
                        {invite.status === "ACCEPTED" && (
                          isMember ? (
                            <Link
                              href={`/projects?workspaceId=${invite.workspaceId}`}
                              className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold mt-0.5 inline-block"
                            >
                              Đi đến workspace →
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 italic block">
                              Không còn là thành viên
                            </span>
                          )
                        )}
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(invite.status)}
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-2.5 border border-slate-100/50 dark:border-slate-800 text-[11px]">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Người mời</p>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">{invite.inviterName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vai trò đề xuất</p>
                        <span className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                          {invite.roleName}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-100/80 dark:border-slate-800/80 pt-1.5 mt-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Thời gian nhận</p>
                        <p className="font-medium text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(invite.createdAt)}</p>
                      </div>
                    </div>

                    {/* Action Button if Accepted & Member */}
                    {invite.status === "ACCEPTED" && isMember && (
                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/projects?workspaceId=${invite.workspaceId}`}
                          className="w-full text-center inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs shadow-sm shadow-blue-500/10"
                        >
                          Truy cập Workspace
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Reject Invite Confirmation Dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-scale-in mx-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={20} />
              Từ chối lời mời tham gia
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Bạn đang thực hiện từ chối lời mời từ <span className="font-semibold text-slate-800">{showRejectModal.inviterName}</span> để gia nhập <span className="font-semibold text-slate-800">"{showRejectModal.workspaceName}"</span>.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase">Lý do từ chối (bắt buộc)</label>
              <textarea
                rows={3}
                placeholder="Nhập lý do ví dụ: 'Tôi hiện tại không thể tham gia dự án này'..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition"
              >
                Từ chối lời mời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
