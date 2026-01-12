import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, desc, sql, and } from "drizzle-orm";
import type { Db } from "@local-review/db";
import {
  reviewSessions,
  fileReviewStatus,
  lineComments,
  activityLogs,
} from "@local-review/db";
import type { GitService } from "../services/git.service.js";
import type { CreateSessionRequest, UpdateSessionRequest } from "@local-review/shared";

export function createSessionRoutes(db: Db, gitService: GitService, repoPath: string) {
  const router = Router();

  // GET /api/sessions - List all sessions
  router.get("/", async (_, res) => {
    try {
      const sessions = await db
        .select({
          id: reviewSessions.id,
          repositoryPath: reviewSessions.repositoryPath,
          baseBranch: reviewSessions.baseBranch,
          headBranch: reviewSessions.headBranch,
          baseCommit: reviewSessions.baseCommit,
          headCommit: reviewSessions.headCommit,
          title: reviewSessions.title,
          description: reviewSessions.description,
          status: reviewSessions.status,
          createdAt: reviewSessions.createdAt,
          updatedAt: reviewSessions.updatedAt,
        })
        .from(reviewSessions)
        .orderBy(desc(reviewSessions.createdAt));

      // Get stats for each session
      const sessionsWithStats = await Promise.all(
        sessions.map(async (session) => {
          const [filesStats] = await db
            .select({
              total: sql<number>`count(*)`,
              reviewed: sql<number>`sum(case when ${fileReviewStatus.status} = 'reviewed' then 1 else 0 end)`,
            })
            .from(fileReviewStatus)
            .where(eq(fileReviewStatus.sessionId, session.id));

          const [commentsStats] = await db
            .select({
              total: sql<number>`count(*)`,
              unresolved: sql<number>`sum(case when ${lineComments.resolved} = 0 then 1 else 0 end)`,
            })
            .from(lineComments)
            .where(eq(lineComments.sessionId, session.id));

          return {
            ...session,
            filesTotal: filesStats?.total || 0,
            filesReviewed: filesStats?.reviewed || 0,
            commentsCount: commentsStats?.total || 0,
            unresolvedCommentsCount: commentsStats?.unresolved || 0,
          };
        })
      );

      res.json({ sessions: sessionsWithStats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/sessions - Create new session
  router.post("/", async (req, res) => {
    try {
      const body: CreateSessionRequest = req.body;
      const { baseBranch, title, description } = body;

      if (!baseBranch) {
        return res.status(400).json({ error: "baseBranch is required" });
      }

      // Get current branch and commit hashes
      const headBranch = await gitService.getCurrentBranch();
      const baseCommit = await gitService.getCommitHash(baseBranch);
      const headCommit = await gitService.getCommitHash(headBranch);

      const sessionId = nanoid();
      const now = new Date();

      await db.insert(reviewSessions).values({
        id: sessionId,
        repositoryPath: repoPath,
        baseBranch,
        headBranch,
        baseCommit,
        headCommit,
        title: title || `Review: ${baseBranch}...${headBranch}`,
        description,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      // Get diff files and create file status records
      const files = await gitService.getDiffFiles(baseCommit, headCommit);

      if (files.length > 0) {
        await db.insert(fileReviewStatus).values(
          files.map((file) => ({
            id: nanoid(),
            sessionId,
            filePath: file.path,
            status: "pending" as const,
            createdAt: now,
          }))
        );
      }

      // Log activity
      await db.insert(activityLogs).values({
        id: nanoid(),
        sessionId,
        action: "session_created",
        targetType: "session",
        targetId: sessionId,
        metadata: { filesCount: files.length },
        createdAt: now,
      });

      const [session] = await db
        .select()
        .from(reviewSessions)
        .where(eq(reviewSessions.id, sessionId));

      res.status(201).json({
        ...session,
        filesTotal: files.length,
        filesReviewed: 0,
        commentsCount: 0,
        unresolvedCommentsCount: 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/sessions/:id - Get session details
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [session] = await db
        .select()
        .from(reviewSessions)
        .where(eq(reviewSessions.id, id));

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Get files with status
      const files = await db
        .select()
        .from(fileReviewStatus)
        .where(eq(fileReviewStatus.sessionId, id));

      // Get diff files from git
      const diffFiles = await gitService.getDiffFiles(
        session.baseCommit,
        session.headCommit
      );

      // Merge file info with review status
      const filesWithInfo = diffFiles.map((diffFile) => {
        const status = files.find((f) => f.filePath === diffFile.path);
        return {
          ...diffFile,
          reviewStatus: status?.status || "pending",
          reviewedAt: status?.reviewedAt,
        };
      });

      // Get comments stats
      const [commentsStats] = await db
        .select({
          total: sql<number>`count(*)`,
          unresolved: sql<number>`sum(case when ${lineComments.resolved} = 0 then 1 else 0 end)`,
        })
        .from(lineComments)
        .where(eq(lineComments.sessionId, id));

      res.json({
        ...session,
        files: filesWithInfo,
        filesTotal: filesWithInfo.length,
        filesReviewed: files.filter((f) => f.status === "reviewed").length,
        commentsCount: commentsStats?.total || 0,
        unresolvedCommentsCount: commentsStats?.unresolved || 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PATCH /api/sessions/:id - Update session
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body: UpdateSessionRequest = req.body;

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status;

      await db.update(reviewSessions).set(updates).where(eq(reviewSessions.id, id));

      if (body.status) {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId: id,
          action: body.status === "completed" ? "session_completed" : "status_changed",
          targetType: "session",
          targetId: id,
          metadata: { newStatus: body.status },
          createdAt: new Date(),
        });
      }

      const [session] = await db
        .select()
        .from(reviewSessions)
        .where(eq(reviewSessions.id, id));

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // DELETE /api/sessions/:id - Delete session
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(reviewSessions).where(eq(reviewSessions.id, id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
