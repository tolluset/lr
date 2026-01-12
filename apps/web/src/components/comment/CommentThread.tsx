import { useState } from "react";
import { Check, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./CommentForm";
import { formatRelativeTime } from "@/lib/utils";
import type { LineComment } from "@/lib/api";

interface CommentThreadProps {
  comments: LineComment[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
}

export function CommentThread({
  comments,
  onResolve,
  onDelete,
  onReply,
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Group comments by parent
  const rootComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);
  const repliesMap = new Map<string, LineComment[]>();
  replies.forEach((reply) => {
    const existing = repliesMap.get(reply.parentId!) || [];
    repliesMap.set(reply.parentId!, [...existing, reply]);
  });

  const renderComment = (comment: LineComment, isReply = false) => {
    const commentReplies = repliesMap.get(comment.id) || [];

    return (
      <div
        key={comment.id}
        className={`p-3 rounded-md ${isReply ? "ml-4 border-l-2" : "bg-card border"} ${
          comment.resolved ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">
                Line {comment.lineNumber} ({comment.side})
              </span>
              {comment.resolved && (
                <Badge variant="success" className="text-xs">
                  Resolved
                </Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isReply && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onResolve(comment.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => {
                if (confirm("Delete this comment?")) {
                  onDelete(comment.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Replies */}
        {commentReplies.length > 0 && (
          <div className="mt-2 space-y-2">
            {commentReplies.map((reply) => renderComment(reply, true))}
          </div>
        )}

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-2">
            <CommentForm
              onSubmit={(content) => {
                onReply(comment.id, content);
                setReplyingTo(null);
              }}
              onCancel={() => setReplyingTo(null)}
              placeholder="Write a reply..."
              submitLabel="Reply"
            />
          </div>
        )}
      </div>
    );
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">{rootComments.map((comment) => renderComment(comment))}</div>
  );
}
