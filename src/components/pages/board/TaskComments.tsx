"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, Image as ImageIcon, Trash2, Reply, Smile, Loader2, X } from "lucide-react";
import { 
  getTaskComments, 
  addTaskComment, 
  deleteTaskComment, 
  toggleCommentReaction, 
  getTaskActivities,
  type TaskComment,
  type TaskActivity
} from "@/lib/api/task";
import { toast } from "sonner";
import { useRealtime } from "@/providers/RealtimeProvider";
import { parseServerDate } from "@/lib/helper/formatTime";

interface TaskCommentsProps {
  taskId: string;
  refreshTrigger?: number;
  currentUserId?: string;
  userFullName?: string;
  userAvatarUrl?: string;
  canComment?: boolean;
  boardMembers?: Array<{
    userId?: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  }>;
}

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Thích" },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
  { type: "CARE", emoji: "🥰", label: "Thương thương" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Buồn" },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];

const COMMON_EMOJIS = ["😀", "😂", "🥰", "😍", "🤩", "😘", "😜", "🤑", "🤔", "🙄", "😭", "😤", "😡", "😱", "🥳", "😇", "👍", "👎", "❤️", "🔥", "✨", "🎉", "🙏", "💪", "🚀", "💡", "✅", "❌", "💯", "🌟"];

export function TaskComments({ taskId, refreshTrigger, currentUserId, userFullName, userAvatarUrl, canComment = true, boardMembers = [] }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<TaskComment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const { lastCommentUpdate, boardVersion } = useRealtime();

  useEffect(() => {
    loadCommentsAndActivities();
  }, [taskId, boardVersion, refreshTrigger]);

  useEffect(() => {
    if (lastCommentUpdate?.taskId === taskId) {
      console.log("Realtime comment update detected for task:", taskId);
      loadCommentsAndActivities();
    }
  }, [lastCommentUpdate, taskId]);

  const loadCommentsAndActivities = async () => {
    setLoading(true);
    try {
      const [commentsData, activitiesData] = await Promise.all([
        getTaskComments(taskId).catch(err => {
          console.error("Failed to load comments", err);
          return [];
        }),
        getTaskActivities(taskId).catch(err => {
          console.error("Failed to load activities", err);
          return [];
        })
      ]);
      setComments(commentsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to load comments or activities", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = loadCommentsAndActivities;

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await deleteTaskComment(commentToDelete);
      loadComments();
      toast.success("Đã xóa bình luận");
    } catch (error) {
      toast.error("Không thể xóa bình luận");
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleReact = async (commentId: string, type: string) => {
    try {
      await toggleCommentReaction(commentId, type);
      loadComments();
    } catch (error) {
      toast.error("Lỗi khi tương tác");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = parseServerDate(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0 || diffInSeconds < 60) return "Vừa xong";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày`;

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const CommentForm = ({ 
    parentId, 
    mention, 
    onCancel 
  }: { 
    parentId?: string; 
    mention?: string; 
    onCancel?: () => void 
  }) => {
    const [formContent, setFormContent] = useState("");
    const [formImage, setFormImage] = useState<File | null>(null);
    const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
    const [formShowEmojiPicker, setFormShowEmojiPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formFileInputRef = useRef<HTMLInputElement>(null);

    const handleFormImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setFormImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formContent.trim() && !formImage) return;

      setIsSubmitting(true);
      try {
        await addTaskComment(taskId, formContent, formImage || undefined, parentId, userFullName, userAvatarUrl);
        setFormContent("");
        setFormImage(null);
        setFormImagePreview(null);
        setFormShowEmojiPicker(false);
        loadComments();
        if (onCancel) onCancel();
        toast.success(parentId ? "Đã trả lời bình luận" : "Đã thêm bình luận");
      } catch (error) {
        toast.error("Không thể gửi bình luận");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex gap-2">
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 overflow-hidden ${parentId ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"}`}>
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt={userFullName} className="h-full w-full object-cover" />
          ) : (
            (userFullName || "U").charAt(0).toUpperCase()
          )}
        </div>
        
        <form onSubmit={handleFormSubmit} className="flex-1">
          <div className="relative rounded-2xl border border-slate-200 bg-white transition-all focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
            <div className="flex flex-col px-3 py-2">
              <div className="flex flex-wrap items-center gap-1">
                {mention && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                    {mention}
                    <button type="button" onClick={onCancel} className="hover:text-sky-900">
                      <X size={10} />
                    </button>
                  </span>
                )}
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={parentId ? "Viết câu trả lời..." : "Viết bình luận..."}
                  rows={mention ? 1 : 2}
                  className="flex-1 resize-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  autoFocus={!!parentId}
                />
              </div>
            </div>
            
            {formImagePreview && (
              <div className="relative m-2 w-20 overflow-hidden rounded-xl border border-slate-200">
                <img src={formImagePreview} alt="Preview" className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFormImage(null); setFormImagePreview(null); }}
                  className="absolute top-1 right-1 rounded-full bg-slate-900/50 p-0.5 text-white hover:bg-slate-900"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-2 py-1.5 rounded-b-2xl">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => formFileInputRef.current?.click()}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <ImageIcon size={16} />
                </button>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFormShowEmojiPicker(!formShowEmojiPicker)}
                    className={`rounded-lg p-1.5 transition ${formShowEmojiPicker ? "bg-sky-100 text-sky-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                  >
                    <Smile size={16} />
                  </button>
                  
                  {formShowEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-20 animate-in fade-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-6 gap-1">
                        {COMMON_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormContent(prev => prev + emoji)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-50 transition hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={formFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFormImageChange}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || (!formContent.trim() && !formImage)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const CommentItem = ({ 
    comment, 
    isReply = false, 
    parentName 
  }: { 
    comment: TaskComment; 
    isReply?: boolean; 
    parentName?: string 
  }) => {
    const isMe = currentUserId === comment.userId;
    const myReaction = comment.myReactions?.[0];
    const reactionInfo = myReaction ? REACTIONS.find(r => r.type === myReaction) : null;
    const reactionLabel = reactionInfo ? reactionInfo.label : "Thích";
    
    const REACTION_COLORS: Record<string, string> = {
      LIKE: "text-sky-600",
      LOVE: "text-rose-600",
      CARE: "text-yellow-500",
      HAHA: "text-yellow-500",
      WOW: "text-yellow-500",
      SAD: "text-yellow-500",
      ANGRY: "text-orange-600",
    };
    const reactionColor = myReaction ? REACTION_COLORS[myReaction] : "text-slate-500 hover:text-slate-700";

    return (
      <div className={`relative ${isReply ? "mt-2" : "mt-4"}`}>
        {isReply && <div className="absolute -left-[21px] -top-2 bottom-0 w-[2px] bg-slate-100" />}
        {isReply && <div className="absolute -left-[21px] top-4 h-4 w-4 rounded-bl-xl border-b-2 border-l-2 border-slate-100" />}

        <div className="group flex gap-2">
          <div className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 overflow-hidden transition-all ${isReply ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"}`}>
            {comment.userAvatarUrl ? (
              <img src={comment.userAvatarUrl} alt={comment.userFullName} className="h-full w-full object-cover" />
            ) : (
              (comment.userFullName || "U").charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-block max-w-full rounded-2xl bg-slate-50 px-3 py-1.5 shadow-sm relative">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-900">
                  {isMe ? "Bạn" : (comment.userFullName || "Người dùng")}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap leading-snug">
                {parentName && <span className="font-bold text-slate-900 mr-1 cursor-pointer hover:underline">{parentName}</span>}
                {comment.content}
              </p>
              
              {comment.imageUrl && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <img src={comment.imageUrl} alt="Comment attachment" className="max-h-60 w-auto object-contain" />
                </div>
              )}
              
              <div className="absolute -bottom-2 -right-2 flex -space-x-1 translate-y-1/4">
                 {REACTIONS.map((r) => {
                    const count = comment.reactionCounts?.[r.type] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={r.type} className="flex h-4 items-center gap-0.5 rounded-full bg-white px-1 shadow-sm border border-slate-100 text-[9px]">
                        <span>{r.emoji}</span>
                        <span className="font-medium text-slate-500">{count}</span>
                      </div>
                    );
                 })}
              </div>
            </div>
            
            <div className="mt-1 flex items-center gap-3 px-1">
              <span className="text-[10px] text-slate-400 cursor-default" title={parseServerDate(comment.createdAt).toLocaleString("vi-VN")}>
                {formatTime(comment.createdAt)}
              </span>

              <div className="relative group/react">
                <button 
                  onClick={() => canComment && handleReact(comment.id, myReaction || "LIKE")}
                  className={`text-[10px] font-bold transition ${canComment ? reactionColor : "text-slate-400 cursor-default"}`}
                >
                  {reactionLabel}
                </button>
                {canComment && (
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/react:flex items-center gap-1 rounded-full bg-white p-1 shadow-[0_4px_15px_rgba(0,0,0,0.15)] border border-slate-100 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300 before:absolute before:top-full before:left-0 before:right-0 before:h-2 before:content-['']">
                    {REACTIONS.map((r, idx) => (
                      <button
                        key={r.type}
                        onClick={() => handleReact(comment.id, r.type)}
                        className="hover:scale-150 hover:-translate-y-2 transition-all duration-200 p-1.5 text-xl group/emoji relative"
                        title={r.label}
                        style={{ transitionDelay: `${idx * 30}ms` }}
                      >
                        <span>{r.emoji}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {canComment && !isReply && (
                <button onClick={() => setReplyTo(comment)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition">
                  Trả lời
                </button>
              )}

              {canComment && isMe && (
                <button onClick={() => setCommentToDelete(comment.id)} className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-rose-400 hover:text-rose-600 transition">
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {replyTo?.id === comment.id && (
          <div className="ml-8 mt-2">
            <CommentForm parentId={comment.id} mention={comment.userFullName} onCancel={() => setReplyTo(null)} />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-9 border-l-2 border-slate-100 pl-4">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply parentName={comment.userFullName} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatActivityTime = (dateStr: string) => {
    const date = parseServerDate(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day} thg ${month}, ${year}`;
  };

  const renderActivityText = (activity: TaskActivity) => {
    const member = boardMembers?.find(m => m.userId === activity.userId);
    const userName = member?.fullName || member?.email || "Một người dùng";
    
    let metadata: any = {};
    if (activity.metadata) {
      try {
        metadata = JSON.parse(activity.metadata);
      } catch (e) {
        console.error("Failed to parse activity metadata", e);
      }
    }

    switch (activity.type) {
      case "TASK_CREATED":
        return `${userName} đã tạo thẻ này`;
      case "TASK_MOVED":
        return `${userName} đã thêm thẻ này vào danh sách ${metadata?.listName || ""}`;
      case "TASK_DESCRIPTION_UPDATED":
        return `${userName} đã cập nhật mô tả của thẻ này`;
      case "CHECKLIST_CREATED":
        return `${userName} đã thêm danh sách công việc ${metadata?.checklistName || ""} vào thẻ này`;
      case "CHECKLIST_UPDATED": {
        const action = metadata?.action;
        const clName = metadata?.checklistName || "Công việc";
        const itName = metadata?.itemName || "";
        if (action === "add_item") {
          const assigneeId = metadata?.assigneeId;
          let suffix = "";
          if (assigneeId) {
            const member = boardMembers?.find(m => m.userId === assigneeId);
            const assigneeName = member ? (member.fullName || member.email) : "một thành viên";
            suffix = ` (chỉ định cho ${assigneeName})`;
          }
          return `${userName} đã thêm công việc "${itName}" vào danh sách ${clName}${suffix}`;
        }
        if (action === "update_item") {
          if (metadata?.completed) {
            return `${userName} đã hoàn thành công việc "${itName}" trong danh sách ${clName}`;
          } else {
            return `${userName} đã đánh dấu chưa hoàn thành công việc "${itName}" trong danh sách ${clName}`;
          }
        }
        if (action === "edit_item") {
          const newItemName = metadata?.newItemName || "";
          return `${userName} đã đổi tên công việc "${itName}" thành "${newItemName}" trong danh sách ${clName}`;
        }
        if (action === "assign_item") {
          const assigneeId = metadata?.assigneeId;
          if (assigneeId && assigneeId !== "") {
            const member = boardMembers?.find(m => m.userId === assigneeId);
            const assigneeName = member ? (member.fullName || member.email) : "một thành viên";
            return `${userName} đã chỉ định ${assigneeName} thực hiện công việc "${itName}" trong danh sách ${clName}`;
          } else {
            return `${userName} đã bỏ chỉ định thực hiện công việc "${itName}" trong danh sách ${clName}`;
          }
        }
        if (action === "delete_item") {
          return `${userName} đã xóa công việc "${itName}" khỏi danh sách ${clName}`;
        }
        if (action === "delete_checklist") {
          return `${userName} đã xóa danh sách công việc ${clName}`;
        }
        return `${userName} đã cập nhật danh sách công việc ${clName}`;
      }
      case "ATTACHMENT_ADDED":
        return `${userName} đã đính kèm tài liệu ${metadata?.fileName || ""}`;
      case "MEMBER_ADDED": {
        const targetMember = boardMembers?.find(m => m.userId === metadata?.memberId);
        const targetName = targetMember?.fullName || targetMember?.email || "Một thành viên";
        return `${userName} đã thêm ${targetName} vào thẻ này`;
      }
      case "MEMBER_REMOVED": {
        const targetMember = boardMembers?.find(m => m.userId === metadata?.memberId);
        const targetName = targetMember?.fullName || targetMember?.email || "Một thành viên";
        return `${userName} đã gỡ ${targetName} khỏi thẻ này`;
      }
      case "TASK_UPDATED": {
        const changes: string[] = [];
        if (metadata?.title) {
          changes.push(`đổi tiêu đề thành "${metadata.title}"`);
        }
        if (metadata?.status) {
          const statusLabels: Record<string, string> = {
            TODO: "Việc cần làm",
            IN_PROGRESS: "Đang làm",
            DONE: "Đã xong",
            ARCHIVED: "Lưu trữ"
          };
          const statusLabel = statusLabels[metadata.status] || metadata.status;
          changes.push(`đổi trạng thái thành "${statusLabel}"`);
        }
        if (metadata?.priority) {
          const priorityLabels: Record<string, string> = {
            NONE: "Không",
            LOWEST: "Rất thấp",
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            HIGHEST: "Rất cao",
            URGENT: "Khẩn cấp"
          };
          const priorityLabel = priorityLabels[metadata.priority] || metadata.priority;
          changes.push(`đổi độ ưu tiên thành "${priorityLabel}"`);
        }
        if (metadata?.dueDate) {
          if (metadata.dueDate === "none") {
            changes.push("gỡ bỏ hạn xử lý");
          } else {
            changes.push(`thay đổi hạn xử lý thành ${formatActivityTime(metadata.dueDate)}`);
          }
        }
        
        if (changes.length === 0) {
          return `${userName} đã cập nhật thẻ này`;
        }
        return `${userName} đã ${changes.join(", ")}`;
      }
      default:
        return `${userName} đã thực hiện hoạt động ${activity.type}`;
    }
  };

  const ActivityItem = ({ activity }: { activity: TaskActivity }) => {
    const member = boardMembers?.find(m => m.userId === activity.userId);
    const userFullName = member?.fullName || member?.email || "Người dùng";
    const userAvatarUrl = member?.avatarUrl || "";

    return (
      <div className="mt-4 flex gap-2 items-start pl-1">
        <div className="flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 overflow-hidden h-7 w-7 text-[10px]">
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt={userFullName} className="h-full w-full object-cover" />
          ) : (
            userFullName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 leading-snug">
            {renderActivityText(activity)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5" title={parseServerDate(activity.createdAt).toLocaleString("vi-VN")}>
            {formatActivityTime(activity.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  const combinedFeed = useMemo(() => {
    const feedComments = comments.map(c => ({
      feedId: `comment-${c.id}`,
      feedType: "comment" as const,
      createdAt: c.createdAt,
      data: c
    }));

    const visibleActivities = showAllActivities ? activities : activities.slice(0, 2);
    const feedActivities = visibleActivities.map(a => ({
      feedId: `activity-${a.id}`,
      feedType: "activity" as const,
      createdAt: a.createdAt,
      data: a
    }));

    return [...feedComments, ...feedActivities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comments, activities, showAllActivities]);

  return (
    <div className="border-t border-slate-100 px-5 py-6">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span>Bình luận và Hoạt động</span>
          {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
        </div>
        {activities.length > 2 && (
          <button
            onClick={() => setShowAllActivities(!showAllActivities)}
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition"
          >
            {showAllActivities ? "Ẩn chi tiết" : "Xem chi tiết"}
          </button>
        )}
      </div>

      {canComment && (
        <div className="mb-6">
          <CommentForm />
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto animate-spin text-slate-300" />
        </div>
      ) : combinedFeed.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-400">Chưa có bình luận hay hoạt động nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {combinedFeed.map((item) => (
            item.feedType === "comment" ? (
              <CommentItem key={item.feedId} comment={item.data} />
            ) : (
              <ActivityItem key={item.feedId} activity={item.data} />
            )
          ))}
        </div>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900">Xóa bình luận?</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCommentToDelete(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
