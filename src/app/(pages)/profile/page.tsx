"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Loader2,
  Building,
} from "lucide-react";
import { getMyProfile, type UserData } from "@/lib/api/auth";
import { getMyInvitations, type WorkspaceInviteResponse } from "@/lib/api/workspace";
import { toast } from "sonner";
import { parseServerDate } from "@/lib/helper/formatTime";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [invitations, setInvitations] = useState<WorkspaceInviteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [userProfile, userInvites] = await Promise.all([
        getMyProfile(),
        getMyInvitations(),
      ]);
      setProfile(userProfile);
      setInvitations(userInvites);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu profile:", error);
      toast.error("Không thể tải thông tin trang cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Đang tải thông tin trang cá nhân...</p>
        </div>
      </div>
    );
  }

  const pendingInvitesCount = invitations.filter((inv) => inv.status === "PENDING").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="text-blue-600" size={26} />
          Trang Cá Nhân
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem thông tin chi tiết tài khoản của bạn và điều hướng nhanh đến các khu vực làm việc.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Information Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />

            {/* Profile Avatar Block */}
            <div className="flex flex-col items-center text-center pt-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4 ring-4 ring-blue-50">
                {profile?.fullName?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{profile?.fullName || "Người dùng"}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">@{profile?.username || "username"}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mt-3.5">
                <Shield size={12} />
                Thành viên
              </div>
            </div>

            {/* Details List */}
            <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                  <Mail size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{profile?.email || "--"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày tham gia hệ thống</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {profile?.createdAt ? (
                      new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "long",
                      }).format(parseServerDate(profile.createdAt))
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Action button to My Tasks */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <Link
                href="/tasks"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Xem công việc của tôi
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Welcome card and invitations summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 bg-white/5 rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">Dashboard</span>
              <h2 className="text-2xl font-bold">Chào mừng quay trở lại, {profile?.fullName || "bạn"}!</h2>
              <p className="text-xs text-blue-100/90 max-w-md leading-relaxed">
                Hôm nay là một ngày tuyệt vời để tiếp tục hoàn thành các mục tiêu công việc. Theo dõi công việc cá nhân và quản lý lời mời để cùng cộng tác với đồng nghiệp.
              </p>
              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href="/tasks"
                  className="px-4 py-2 bg-white text-blue-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Xem công việc của tôi
                </Link>
                <Link
                  href="/invitations"
                  className="px-4 py-2 bg-blue-700/50 hover:bg-blue-700/80 text-white font-bold text-xs rounded-xl border border-blue-500/20 transition flex items-center gap-1.5"
                >
                  <Mail size={14} /> Hộp thư lời mời
                  {pendingInvitesCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Workspace Invites Card Summary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Building className="text-blue-500" size={18} />
              Lời mời tham gia Workspace
            </h3>
            <p className="text-xs text-slate-400 pb-4 border-b border-slate-100">
              Bạn có thể theo dõi và phản hồi các yêu cầu mời gia nhập workspace từ các nhóm/tổ chức khác tại đây.
            </p>

            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
                <Mail size={20} />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">
                {pendingInvitesCount > 0 
                  ? `Bạn có ${pendingInvitesCount} lời mời chưa xử lý` 
                  : "Hộp thư lời mời trống"}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs px-4">
                {pendingInvitesCount > 0 
                  ? "Hãy di chuyển sang trang Lời mời chuyên biệt trên Sidebar để xem chi tiết và phản hồi đồng ý hoặc từ chối."
                  : "Không có lời mời gia nhập nào đang chờ phản hồi từ bạn."}
              </p>
              <Link
                href="/invitations"
                className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 transition inline-flex items-center gap-1.5"
              >
                Đi đến Hộp thư lời mời
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
