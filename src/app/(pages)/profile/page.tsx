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
  Key,
  Lock,
} from "lucide-react";
import { getMyProfile, changePassword, updateProfile, type UserData } from "@/lib/api/auth";
import { getMyInvitations, type WorkspaceInviteResponse } from "@/lib/api/workspace";
import { toast } from "sonner";
import { parseServerDate } from "@/lib/helper/formatTime";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [invitations, setInvitations] = useState<WorkspaceInviteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit name states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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

  const handleSaveName = async () => {
    if (!editNameValue.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    if (editNameValue.trim().length < 2) {
      toast.error("Tên phải từ 2 ký tự");
      return;
    }
    try {
      setIsSavingName(true);
      const updatedProfile = await updateProfile(editNameValue.trim());
      setProfile(updatedProfile);
      useAuthStore.setState({ user: updatedProfile });
      toast.success("Cập nhật tên thành công");
      setIsEditingName(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật tên");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ mật khẩu");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    
    try {
      setIsChangingPassword(true);
      const currentRefreshToken = useAuthStore.getState().refreshToken || "";
      await changePassword(currentPassword, newPassword, confirmPassword, logoutOtherSessions, currentRefreshToken);
      
      if (logoutOtherSessions) {
        toast.success("Đổi mật khẩu thành công và đã đăng xuất các thiết bị khác!");
      } else {
        toast.success("Đổi mật khẩu thành công!");
      }
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLogoutOtherSessions(false);
    } catch (error: any) {
      toast.error(error.message || "Không thể đổi mật khẩu");
    } finally {
      setIsChangingPassword(false);
    }
  };

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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="text-blue-600" size={26} />
          Trang Cá Nhân
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Xem thông tin chi tiết tài khoản của bạn và điều hướng nhanh đến các khu vực làm việc.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Side: Profile Information Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />

            {/* Profile Avatar Block */}
            <div className="flex flex-col items-center text-center pt-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4 ring-4 ring-blue-50 dark:ring-blue-950/50">
                {profile?.fullName?.substring(0, 2).toUpperCase() || "U"}
              </div>
              
              <div className="flex items-center justify-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] text-center"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-1 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 transition"
                    >
                      {isSavingName ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[11px] font-bold px-1">Lưu</span>}
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-[11px] font-bold px-1"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{profile?.fullName || "Người dùng"}</h3>
                    <button
                      onClick={() => {
                        setEditNameValue(profile?.fullName || "");
                        setIsEditingName(true);
                      }}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Chỉnh sửa tên"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">@{profile?.username || "username"}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold mt-3.5">
                <Shield size={12} />
                Thành viên
              </div>
            </div>

            {/* Details List */}
            <div className="mt-8 space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                  <Mail size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate mt-0.5">{profile?.email || "--"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngày tham gia hệ thống</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-0.5">
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
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-6">
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 bg-white/5 rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">Dashboard</span>
              <h2 className="text-xl sm:text-2xl font-bold">Chào mừng quay trở lại, {profile?.fullName || "bạn"}!</h2>
              <p className="text-xs text-blue-100/90 max-w-md leading-relaxed">
                Hôm nay là một ngày tuyệt vời để tiếp tục hoàn thành các mục tiêu công việc. Theo dõi công việc cá nhân và quản lý lời mời để cùng cộng tác với đồng nghiệp.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/tasks"
                  className="w-full sm:w-auto text-center justify-center flex items-center px-4 py-2 bg-white text-blue-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Xem công việc của tôi
                </Link>
                <Link
                  href="/invitations"
                  className="w-full sm:w-auto text-center justify-center flex items-center px-4 py-2 bg-blue-700/50 dark:bg-blue-900/40 hover:bg-blue-700/80 dark:hover:bg-blue-900/60 text-white font-bold text-xs rounded-xl border border-blue-500/20 transition gap-1.5"
                >
                  <Mail size={14} /> Hộp thư lời mời
                  {pendingInvitesCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  )}
                </Link>
              </div>
            </div>
          </div>


          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
              <Key className="text-amber-500" size={18} />
              Bảo mật tài khoản
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 pb-4 border-b border-slate-100 dark:border-slate-800">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
            </p>

            <form onSubmit={handleChangePassword} className="pt-4 max-w-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={14} className="text-slate-400 dark:text-slate-550" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition"
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={14} className="text-slate-400 dark:text-slate-550" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition"
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={14} className="text-slate-400 dark:text-slate-550" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition"
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  id="logout-sessions"
                  type="checkbox"
                  checked={logoutOtherSessions}
                  onChange={(e) => setLogoutOtherSessions(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="logout-sessions" className="text-xs text-slate-600 dark:text-slate-400 leading-tight cursor-pointer">
                  <span className="font-semibold block text-slate-700 dark:text-slate-350">Đăng xuất khỏi các thiết bị khác</span>
                  Đóng tất cả các phiên đăng nhập khác, chỉ duy trì phiên hiện tại.
                </label>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-70"
              >
                {isChangingPassword && <Loader2 size={14} className="animate-spin" />}
                Đổi mật khẩu
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
