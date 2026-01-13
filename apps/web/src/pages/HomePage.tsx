import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, GitBranch, FolderEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionCard } from "@/components/session/SessionCard";
import { CreateSessionDialog } from "@/components/session/CreateSessionDialog";
import { useSessions } from "@/hooks/useSessions";
import { useWorkingChanges } from "@/hooks/useWorkingChanges";

function WorkingChangesCard() {
  const { data: changes, isLoading } = useWorkingChanges();

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderEdit className="h-5 w-5" />
            Working Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const stagedCount = changes?.staged.length || 0;
  const unstagedCount = changes?.unstaged.length || 0;
  const totalChanges = stagedCount + unstagedCount;

  if (totalChanges === 0) {
    return null;
  }

  return (
    <Card className="mb-8 hover:border-primary/50 transition-colors">
      <Link to="/working">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderEdit className="h-5 w-5" />
            Working Changes
          </CardTitle>
          <CardDescription>
            {totalChanges} file{totalChanges !== 1 ? "s" : ""} with uncommitted changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            {stagedCount > 0 && (
              <span className="text-green-500">
                {stagedCount} staged
              </span>
            )}
            {unstagedCount > 0 && (
              <span className="text-yellow-500">
                {unstagedCount} unstaged
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: sessions, isLoading, error } = useSessions();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            <h1 className="text-xl font-bold">Local Review</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Review
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Working Changes Card */}
        <WorkingChangesCard />

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            Failed to load sessions. Make sure the server is running.
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review Sessions</h2>
            <div className="grid gap-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No review sessions yet</h2>
            <p className="text-muted-foreground mb-4">
              Start a new code review to compare branches and leave comments.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Your First Review
            </Button>
          </div>
        )}
      </main>

      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
