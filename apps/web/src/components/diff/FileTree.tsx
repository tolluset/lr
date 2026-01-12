import { FileText, FilePlus, FileMinus, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DiffFile } from "@local-review/shared";

interface FileTreeProps {
  files: Array<DiffFile & { reviewStatus: string }>;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onFileReviewed: (path: string, reviewed: boolean) => void;
}

function FileStatusIcon({ status }: { status: DiffFile["status"] }) {
  switch (status) {
    case "added":
      return <FilePlus className="h-4 w-4 text-green-500" />;
    case "deleted":
      return <FileMinus className="h-4 w-4 text-red-500" />;
    case "renamed":
      return <FileEdit className="h-4 w-4 text-blue-500" />;
    default:
      return <FileText className="h-4 w-4 text-yellow-500" />;
  }
}

export function FileTree({
  files,
  selectedFile,
  onFileSelect,
  onFileReviewed,
}: FileTreeProps) {
  const reviewedCount = files.filter((f) => f.reviewStatus === "reviewed").length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="font-medium">Files changed</div>
        <div className="text-sm text-muted-foreground">
          {reviewedCount}/{files.length} reviewed
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.map((file) => {
            const isReviewed = file.reviewStatus === "reviewed";
            const isSelected = selectedFile === file.path;

            return (
              <div
                key={file.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                  isSelected ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => onFileSelect(file.path)}
              >
                <Checkbox
                  checked={isReviewed}
                  onCheckedChange={(checked) => onFileReviewed(file.path, !!checked)}
                  onClick={(e) => e.stopPropagation()}
                />

                <FileStatusIcon status={file.status} />

                <span className="flex-1 truncate text-sm" title={file.path}>
                  {file.path.split("/").pop()}
                </span>

                <div className="flex gap-1 text-xs font-mono">
                  {file.additions > 0 && (
                    <span className="text-green-500">+{file.additions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className="text-red-500">-{file.deletions}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
