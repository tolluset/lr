import { useState } from "react";
import { Plus, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/session/SessionCard";
import { CreateSessionDialog } from "@/components/session/CreateSessionDialog";
import { useSessions } from "@/hooks/useSessions";

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
