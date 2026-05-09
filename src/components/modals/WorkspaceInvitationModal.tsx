"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
} from "@/components/ui";
import { toast } from "sonner";
import { acceptWorkspaceInvite, rejectWorkspaceInvite } from "@/lib/api/workspace";
import { Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkspaceInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  workspaceId: string;
  workspaceName: string;
  inviterName?: string;
  inviteToken: string;
}

export const WorkspaceInvitationModal: React.FC<WorkspaceInvitationModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  workspaceId,
  workspaceName,
  inviterName,
  inviteToken,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptWorkspaceInvite(workspaceId, inviteToken);
      toast.success(`Bạn đã tham gia không gian làm việc "${workspaceName}"`);
      if (onAccept) {
        onAccept();
      }
      // Use router to clear query params without full reload to avoid auth redirect race condition
      router.replace("/projects");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Không thể chấp nhận lời mời");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectWorkspaceInvite(workspaceId, inviteToken, reason);
      toast.info(`Bạn đã từ chối lời mời tham gia "${workspaceName}"`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Không thể từ chối lời mời");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-400">
            Lời mời tham gia Không gian làm việc
          </DialogTitle>
          <DialogDescription className="text-slate-300 pt-2">
            <span className="font-semibold text-white">{inviterName}</span> đã mời bạn tham gia vào không gian làm việc{" "}
            <span className="font-semibold text-white">"{workspaceName}"</span>.
          </DialogDescription>
        </DialogHeader>

        {showRejectReason && (
          <div className="py-4">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Lý do từ chối (bắt buộc)
            </label>
            <Textarea
              placeholder="Nhập lý do của bạn..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:justify-end mt-4">
          <Button
            variant="ghost"
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {showRejectReason ? "Xác nhận từ chối" : "Từ chối"}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting || showRejectReason}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAccepting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Đồng ý tham gia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
