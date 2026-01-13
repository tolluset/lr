import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  GitBranch,
  Check,
  MessageSquare,
  FileText,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { useSidebarResize } from "@/hooks/useSidebarResize";

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useSession(id!);
  const updateSession = useUpdateSession();
  const updateFileStatus = useUpdateFileStatus(id!);
  const {
    width: sidebarWidth,
    isCollapsed,
    isResizing,
    toggle: toggleSidebar,
    startResize,
  } = useSidebarResize();

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

  const handleCompleteReview = async () => {
    await updateSession.mutateAsync({ id: id!, data: { status: "completed" } });
    toast.success("리뷰가 완료되었습니다!", {
      description: `${session?.filesTotal}개 파일 리뷰 완료`,
    });
    navigate("/");
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
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            title={isCollapsed ? "Show sidebar (Cmd+B)" : "Hide sidebar (Cmd+B)"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
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
            <Button onClick={handleCompleteReview}>
              <Check className="h-4 w-4 mr-2" />
              Complete Review
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside
          className={cn(
            "border-r shrink-0 overflow-hidden transition-all duration-200",
            isResizing && "transition-none"
          )}
          style={{ width: sidebarWidth }}
        >
          {!isCollapsed && (
            <FileTree
              files={session.files}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onFileReviewed={handleFileReviewed}
            />
          )}
        </aside>

        {/* Resize handle */}
        {!isCollapsed && (
          <div
            className={cn(
              "w-1 shrink-0 cursor-col-resize transition-colors hover:bg-primary/50",
              isResizing && "bg-primary/50"
            )}
            onMouseDown={startResize}
          />
        )}

        {/* Diff viewer */}
        <main className="flex-1 overflow-hidden relative">
          {currentFile ? (
            <DiffViewer
              sessionId={id!}
              baseCommit={session.baseCommit}
              headCommit={session.headCommit}
              file={currentFile}
              repositoryPath={session.repositoryPath}
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
