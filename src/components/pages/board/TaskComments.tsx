"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Image as ImageIcon, Trash2, Reply, Smile, Loader2, X } from "lucide-react";
import { 
  getTaskComments, 
  addTaskComment, 
  deleteTaskComment, 
  toggleCommentReaction, 
  type TaskComment 
} from "@/lib/api/task";
import { toast } from "sonner";

interface TaskCommentsProps {
  taskId: string;
  currentUserId?: string;
  userFullName?: string;
  userAvatarUrl?: string;
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

export function TaskComments({ taskId, currentUserId, userFullName, userAvatarUrl }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<TaskComment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
    }
  };

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
    const date = new Date(dateStr);
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
              <span className="text-[10px] text-slate-400 cursor-default" title={new Date(comment.createdAt).toLocaleString("vi-VN")}>
                {formatTime(comment.createdAt)}
              </span>

              <div className="relative group/react">
                <button 
                  onClick={() => handleReact(comment.id, myReaction || "LIKE")}
                  className={`text-[10px] font-bold transition ${reactionColor}`}
                >
                  {reactionLabel}
                </button>
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
              </div>

              {!isReply && (
                <button onClick={() => setReplyTo(comment)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition">
                  Trả lời
                </button>
              )}

              {isMe && (
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

  return (
    <div className="border-t border-slate-100 px-5 py-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MessageSquare size={16} />
        <span>Bình luận</span>
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>

      <div className="mb-6">
        <CommentForm />
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto animate-spin text-slate-300" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-400">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
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
