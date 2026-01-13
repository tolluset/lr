import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GitBranch } from "lucide-react";
import { PatchDiff } from "@pierre/diffs/react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkingChanges, useWorkingDiff } from "@/hooks/useWorkingChanges";
import { useSidebarResize } from "@/hooks/useSidebarResize";
import { cn } from "@/lib/utils";
import type { DiffFile } from "@local-review/shared";
import { Columns, Rows, PanelLeft, PanelLeftClose, FilePlus, FileMinus, FileEdit, FileQuestion } from "lucide-react";

type DiffType = "staged" | "unstaged";

function getStatusIcon(status: DiffFile["status"]) {
  switch (status) {
    case "added":
      return <FilePlus className="h-4 w-4 text-green-500" />;
    case "deleted":
      return <FileMinus className="h-4 w-4 text-red-500" />;
    case "renamed":
      return <FileEdit className="h-4 w-4 text-blue-500" />;
    case "modified":
      return <FileEdit className="h-4 w-4 text-yellow-500" />;
    default:
      return <FileQuestion className="h-4 w-4 text-muted-foreground" />;
  }
}

export function WorkingChangesPage() {
  const { data: changes, isLoading, error } = useWorkingChanges();
  const [activeTab, setActiveTab] = useState<DiffType>("staged");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [layout, setLayout] = useState<"split" | "unified">("split");

  const {
    width: sidebarWidth,
    isCollapsed,
    isResizing,
    toggle: toggleSidebar,
    startResize,
  } = useSidebarResize();

  const currentFiles = useMemo(() => {
    if (!changes) return [];
    return activeTab === "staged" ? changes.staged : changes.unstaged;
  }, [changes, activeTab]);

  const currentFile = currentFiles.find((f) => f.path === selectedFile);

  // Auto-select first file when tab changes
  if (currentFiles.length > 0 && !currentFiles.find((f) => f.path === selectedFile)) {
    setSelectedFile(currentFiles[0].path);
  }

  const { data: diffData, isLoading: isDiffLoading } = useWorkingDiff(
    activeTab,
    selectedFile || undefined
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading working changes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-destructive">Failed to load working changes</div>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const stagedCount = changes?.staged.length || 0;
  const unstagedCount = changes?.unstaged.length || 0;
  const totalChanges = stagedCount + unstagedCount;

  if (totalChanges === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground" />
        <div className="text-xl font-semibold">No working changes</div>
        <p className="text-muted-foreground">Your working directory is clean.</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

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
            <h1 className="font-semibold">Working Changes</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              {stagedCount} staged, {unstagedCount} unstaged
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <aside
          className={cn(
            "border-r shrink-0 overflow-hidden transition-all duration-200 flex flex-col",
            isResizing && "transition-none"
          )}
          style={{ width: sidebarWidth }}
        >
          {!isCollapsed && (
            <>
              {/* Tabs */}
              <div className="p-2 border-b">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DiffType)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="staged" className="flex-1">
                      Staged ({stagedCount})
                    </TabsTrigger>
                    <TabsTrigger value="unstaged" className="flex-1">
                      Unstaged ({unstagedCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* File list */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {currentFiles.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No {activeTab} changes
                    </div>
                  ) : (
                    currentFiles.map((file) => (
                      <button
                        key={file.path}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-accent/50 text-sm",
                          selectedFile === file.path && "bg-accent"
                        )}
                        onClick={() => setSelectedFile(file.path)}
                      >
                        {getStatusIcon(file.status)}
                        <span className="truncate flex-1" title={file.path}>
                          {file.path}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          <span className="text-green-500">+{file.additions}</span>{" "}
                          <span className="text-red-500">-{file.deletions}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
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
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentFile ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
                <div className="font-mono text-sm truncate flex-1" title={currentFile.path}>
                  {currentFile.path}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500">+{currentFile.additions}</span>
                    <span className="text-red-500">-{currentFile.deletions}</span>
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
              <div className="flex-1 overflow-auto">
                {isDiffLoading ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Loading diff...
                  </div>
                ) : diffData?.diff ? (
                  <div className="min-w-fit">
                    <PatchDiff
                      patch={diffData.diff}
                      options={{
                        diffStyle: layout,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No changes in this file
                  </div>
                )}
              </div>
            </>
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
