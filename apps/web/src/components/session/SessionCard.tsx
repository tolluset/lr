import { Link } from "react-router-dom";
import { GitBranch, MessageSquare, FileText, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { SessionWithStats } from "@local-review/shared";
import { useDeleteSession } from "@/hooks/useSessions";

interface SessionCardProps {
  session: SessionWithStats;
}

export function SessionCard({ session }: SessionCardProps) {
  const deleteSession = useDeleteSession();

  const progress =
    session.filesTotal > 0
      ? Math.round((session.filesReviewed / session.filesTotal) * 100)
      : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Delete this review session?")) {
      deleteSession.mutate(session.id);
    }
  };

  return (
    <Link to={`/session/${session.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {session.title || `Review: ${session.baseBranch}...${session.headBranch}`}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <GitBranch className="h-3 w-3" />
                {session.baseBranch} → {session.headBranch}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  session.status === "completed"
                    ? "success"
                    : session.status === "archived"
                    ? "secondary"
                    : "outline"
                }
              >
                {session.status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {session.filesReviewed}/{session.filesTotal} files
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {session.commentsCount} comments
                {session.unresolvedCommentsCount > 0 && (
                  <span className="text-yellow-500">
                    ({session.unresolvedCommentsCount} unresolved)
                  </span>
                )}
              </span>
            </div>
            <span>{formatRelativeTime(session.createdAt)}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
