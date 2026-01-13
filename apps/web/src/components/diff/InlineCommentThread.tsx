import { useState } from "react";
import { Check, Trash2, Reply, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "@/components/comment/CommentForm";
import { formatRelativeTime } from "@/lib/utils";
import type { LineComment } from "@/lib/api";

interface InlineCommentThreadProps {
  comments: LineComment[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
}

export function InlineCommentThread({
  comments,
  onResolve,
  onDelete,
  onReply,
}: InlineCommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Group comments by parent
  const rootComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);
  const repliesMap = new Map<string, LineComment[]>();
  replies.forEach((reply) => {
    const existing = repliesMap.get(reply.parentId!) || [];
    repliesMap.set(reply.parentId!, [...existing, reply]);
  });

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 border-l-2 border-primary/50 py-2 px-3 my-1">
      {/* Header */}
      <button
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <MessageSquare className="h-3 w-3" />
        <span>
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
          {unresolvedCount > 0 && unresolvedCount !== comments.length && (
            <span className="text-yellow-500 ml-1">
              ({unresolvedCount} unresolved)
            </span>
          )}
        </span>
        <span className="ml-auto">{isExpanded ? "−" : "+"}</span>
      </button>

      {/* Comments */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {rootComments.map((comment) => {
            const commentReplies = repliesMap.get(comment.id) || [];

            return (
              <div
                key={comment.id}
                className={`p-2 rounded bg-background/50 ${comment.resolved ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {comment.resolved && (
                      <Badge variant="secondary" className="text-xs mb-1">
                        Resolved
                      </Badge>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onResolve(comment.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => {
                        if (confirm("Delete this comment?")) {
                          onDelete(comment.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Replies */}
                {commentReplies.length > 0 && (
                  <div className="mt-2 ml-3 border-l pl-2 space-y-2">
                    {commentReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`text-sm ${reply.resolved ? "opacity-60" : ""}`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {reply.content}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(reply.createdAt)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => onResolve(reply.id)}
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={() => {
                              if (confirm("Delete this reply?")) {
                                onDelete(reply.id);
                              }
                            }}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
          })}
        </div>
      )}
    </div>
  );
}
