import { useState, useEffect, useCallback, useMemo } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import { Columns, Rows } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CommentForm } from "@/components/comment/CommentForm";
import { LineHoverButton } from "./LineHoverButton";
import { InlineCommentThread } from "./InlineCommentThread";
import { useRawDiff } from "@/hooks/useDiff";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useToggleResolve,
} from "@/hooks/useComments";
import type { DiffFile } from "@local-review/shared";
import type { LineComment } from "@/lib/api";

interface DiffViewerProps {
  sessionId: string;
  baseCommit: string;
  headCommit: string;
  file: DiffFile & { reviewStatus: string };
}

export function DiffViewer({ sessionId, baseCommit, headCommit, file }: DiffViewerProps) {
  const [layout, setLayout] = useState<"split" | "unified">("split");
  const [selectedLine, setSelectedLine] = useState<{
    side: "old" | "new";
    lineNumber: number;
  } | null>(null);

  const { data: diffData, isLoading } = useRawDiff(baseCommit, headCommit, file.path);
  const { data: comments = [] } = useComments(sessionId, file.path);
  const createComment = useCreateComment(sessionId);
  const deleteComment = useDeleteComment(sessionId);
  const toggleResolve = useToggleResolve(sessionId);

  // Reset selected line when file changes
  useEffect(() => {
    setSelectedLine(null);
  }, [file.path]);

  const handleAddComment = async (content: string) => {
    if (!selectedLine) return;
    await createComment.mutateAsync({
      filePath: file.path,
      side: selectedLine.side,
      lineNumber: selectedLine.lineNumber,
      content,
    });
    setSelectedLine(null);
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    const parent = comments.find((c) => c.id === parentId);
    if (!parent) return;
    await createComment.mutateAsync({
      filePath: file.path,
      side: parent.side,
      lineNumber: parent.lineNumber,
      content: replyContent,
      parentId,
    });
  };

  const handleLineSelect = useCallback(
    (line: { lineNumber: number; side: "old" | "new" }) => {
      setSelectedLine(line);
    },
    []
  );

  // Group comments by line for lineAnnotations
  const lineAnnotations = useMemo(() => {
    const grouped = new Map<string, LineComment[]>();
    comments.forEach((comment) => {
      const key = `${comment.side}-${comment.lineNumber}`;
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, comment]);
    });

    return Array.from(grouped.entries()).map(([_key, lineComments]) => {
      const rootComment = lineComments.find((c) => !c.parentId);
      if (!rootComment) return null;

      return {
        side: rootComment.side === "new" ? "additions" : "deletions",
        lineNumber: rootComment.lineNumber,
        metadata: lineComments,
      };
    }).filter(Boolean) as Array<{
      side: "additions" | "deletions";
      lineNumber: number;
      metadata: LineComment[];
    }>;
  }, [comments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading diff...
      </div>
    );
  }

  if (!diffData?.diff) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No changes in this file
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <div className="font-mono text-sm truncate flex-1" title={file.path}>
          {file.path}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-green-500">+{file.additions}</span>
            <span className="text-red-500">-{file.deletions}</span>
          </div>
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={(value) => value && setLayout(value as "split" | "unified")}
            size="sm"
          >
            <ToggleGroupItem value="split" aria-label="Split view">
              <Columns className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="unified" aria-label="Unified view">
              <Rows className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-fit">
          <PatchDiff
            patch={diffData.diff}
            options={{
              diffStyle: layout,
              enableHoverUtility: true,
              onLineNumberClick: ({ lineNumber, annotationSide }) => {
                handleLineSelect({
                  lineNumber,
                  side: annotationSide === "additions" ? "new" : "old",
                });
              },
            }}
            lineAnnotations={lineAnnotations}
            renderAnnotation={({ metadata }) => (
              <InlineCommentThread
                comments={metadata}
                onResolve={(id) => toggleResolve.mutate(id)}
                onDelete={(id) => deleteComment.mutate(id)}
                onReply={handleReply}
              />
            )}
            renderHoverUtility={(getHoveredLine) => (
              <LineHoverButton
                getHoveredLine={getHoveredLine}
                onAddComment={handleLineSelect}
              />
            )}
          />
        </div>

        {/* Add comment form */}
        {selectedLine && (
          <div className="sticky bottom-0 left-0 right-0 border-t p-4 bg-background shadow-lg">
            <div className="text-xs text-muted-foreground mb-2">
              Adding comment to line {selectedLine.lineNumber} ({selectedLine.side})
            </div>
            <CommentForm
              onSubmit={handleAddComment}
              onCancel={() => setSelectedLine(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
