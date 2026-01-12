import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import type { Db } from "@local-review/db";
import { fileReviewStatus, activityLogs } from "@local-review/db";
import type { UpdateFileStatusRequest } from "@local-review/shared";

export function createFileRoutes(db: Db) {
  const router = Router();

  // GET /api/sessions/:sessionId/files - List files with status
  router.get("/:sessionId/files", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const files = await db
        .select()
        .from(fileReviewStatus)
        .where(eq(fileReviewStatus.sessionId, sessionId))
        .orderBy(fileReviewStatus.filePath);

      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PATCH /api/sessions/:sessionId/files/:filePath/status - Update file status
  router.patch("/:sessionId/files/*/status", async (req, res) => {
    try {
      const { sessionId } = req.params;
      // Extract file path from wildcard - everything after 'files/' and before '/status'
      const filePath = req.params[0];
      const body: UpdateFileStatusRequest = req.body;

      if (!body.status) {
        return res.status(400).json({ error: "status is required" });
      }

      const now = new Date();
      const updates: Record<string, unknown> = {
        status: body.status,
      };

      if (body.status === "reviewed") {
        updates.reviewedAt = now;
      }

      // Check if file status exists
      const [existing] = await db
        .select()
        .from(fileReviewStatus)
        .where(
          and(
            eq(fileReviewStatus.sessionId, sessionId),
            eq(fileReviewStatus.filePath, filePath)
          )
        );

      if (!existing) {
        // Create new file status record
        await db.insert(fileReviewStatus).values({
          id: nanoid(),
          sessionId,
          filePath,
          status: body.status,
          reviewedAt: body.status === "reviewed" ? now : undefined,
          createdAt: now,
        });
      } else {
        await db
          .update(fileReviewStatus)
          .set(updates)
          .where(
            and(
              eq(fileReviewStatus.sessionId, sessionId),
              eq(fileReviewStatus.filePath, filePath)
            )
          );
      }

      // Log activity
      if (body.status === "reviewed") {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId,
          action: "file_reviewed",
          targetType: "file",
          targetId: filePath,
          metadata: { status: body.status },
          createdAt: now,
        });
      }

      const [file] = await db
        .select()
        .from(fileReviewStatus)
        .where(
          and(
            eq(fileReviewStatus.sessionId, sessionId),
            eq(fileReviewStatus.filePath, filePath)
          )
        );

      res.json(file);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/sessions/:sessionId/activities - Get session activities
  router.get("/:sessionId/activities", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;

      const activities = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.sessionId, sessionId))
        .orderBy(activityLogs.createdAt)
        .limit(Number(limit));

      res.json({ activities });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
