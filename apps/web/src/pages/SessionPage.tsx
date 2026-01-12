import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  Check,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileTree } from "@/components/diff/FileTree";
import { DiffViewer } from "@/components/diff/DiffViewer";
import { useSession, useUpdateSession } from "@/hooks/useSessions";
import { useUpdateFileStatus } from "@/hooks/useFileStatus";

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useSession(id!);
  const updateSession = useUpdateSession();
  const updateFileStatus = useUpdateFileStatus(id!);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Auto-select first file
  if (session?.files && session.files.length > 0 && !selectedFile) {
    setSelectedFile(session.files[0].path);
  }

  const handleFileReviewed = (filePath: string, reviewed: boolean) => {
    updateFileStatus.mutate({
      filePath,
      data: { status: reviewed ? "reviewed" : "pending" },
    });
  };

  const handleStatusChange = (status: "active" | "completed" | "archived") => {
    updateSession.mutate({ id: id!, data: { status } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-destructive">Failed to load session</div>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const currentFile = session.files.find((f) => f.path === selectedFile);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">
              {session.title || `Review: ${session.baseBranch}...${session.headBranch}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              {session.baseBranch} → {session.headBranch}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {session.filesReviewed}/{session.filesTotal}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {session.commentsCount}
              {session.unresolvedCommentsCount > 0 && (
                <span className="text-yellow-500">
                  ({session.unresolvedCommentsCount})
                </span>
              )}
            </span>
          </div>

          {/* Status selector */}
          <Select value={session.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Complete review button */}
          {session.status === "active" && session.filesReviewed === session.filesTotal && (
            <Button onClick={() => handleStatusChange("completed")}>
              <Check className="h-4 w-4 mr-2" />
              Complete Review
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside className="w-72 border-r shrink-0 overflow-hidden">
          <FileTree
            files={session.files}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onFileReviewed={handleFileReviewed}
          />
        </aside>

        {/* Diff viewer */}
        <main className="flex-1 overflow-hidden relative">
          {currentFile ? (
            <DiffViewer
              sessionId={id!}
              baseCommit={session.baseCommit}
              headCommit={session.headCommit}
              file={currentFile}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view diff
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
