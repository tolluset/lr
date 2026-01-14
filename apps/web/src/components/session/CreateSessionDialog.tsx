import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranches } from "@/hooks/useBranches";
import { useCreateSession } from "@/hooks/useSessions";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {
  const navigate = useNavigate();
  const createSession = useCreateSession();

  const [repositoryPath, setRepositoryPath] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [title, setTitle] = useState("");

  const { data: branches, isLoading: branchesLoading, error: branchesError } = useBranches(repositoryPath);
  const currentBranch = branches?.current || "HEAD";

  // Check if baseBranch is valid, otherwise set to first branch
  useEffect(() => {
    if (branches?.all.length && !branches.all.includes(baseBranch)) {
      setBaseBranch(branches.all[0]);
    }
  }, [branches, baseBranch]);

  const handleCreate = async () => {
    if (!repositoryPath) return;
    try {
      const session = await createSession.mutateAsync({
        repositoryPath,
        baseBranch,
        title: title || undefined,
      });
      onOpenChange(false);
      navigate(`/session/${session.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const isValidRepo = branches && !branchesError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Review Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Repository Path</Label>
            <Input
              value={repositoryPath}
              onChange={(e) => setRepositoryPath(e.target.value)}
              placeholder="/path/to/git/repository"
            />
            {branchesError && repositoryPath && (
              <p className="text-sm text-destructive">
                Invalid git repository path
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Base Branch</Label>
            <Select
              value={baseBranch}
              onValueChange={setBaseBranch}
              disabled={branchesLoading || !isValidRepo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select base branch" />
              </SelectTrigger>
              <SelectContent>
                {branches?.all.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Current Branch (HEAD)</Label>
            <Input value={currentBranch} disabled className="text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createSession.isPending || !isValidRepo || !repositoryPath}
          >
            {createSession.isPending ? "Creating..." : "Start Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
