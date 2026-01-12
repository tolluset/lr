import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";
import type { Db } from "@local-review/db";
import { lineComments, activityLogs } from "@local-review/db";
import type { CreateCommentRequest, UpdateCommentRequest } from "@local-review/shared";

export function createCommentRoutes(db: Db) {
  const router = Router();

  // GET /api/sessions/:sessionId/comments - List session comments
  router.get("/:sessionId/comments", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { filePath } = req.query;

      let query = db
        .select()
        .from(lineComments)
        .where(eq(lineComments.sessionId, sessionId))
        .orderBy(lineComments.filePath, lineComments.lineNumber, lineComments.createdAt);

      if (filePath) {
        query = db
          .select()
          .from(lineComments)
          .where(
            and(
              eq(lineComments.sessionId, sessionId),
              eq(lineComments.filePath, filePath as string)
            )
          )
          .orderBy(lineComments.lineNumber, lineComments.createdAt);
      }

      const comments = await query;
      res.json({ comments });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/sessions/:sessionId/comments - Create comment
  router.post("/:sessionId/comments", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const body: CreateCommentRequest = req.body;

      if (!body.filePath || !body.side || body.lineNumber === undefined || !body.content) {
        return res.status(400).json({
          error: "filePath, side, lineNumber, and content are required",
        });
      }

      const commentId = nanoid();
      const now = new Date();

      await db.insert(lineComments).values({
        id: commentId,
        sessionId,
        filePath: body.filePath,
        side: body.side,
        lineNumber: body.lineNumber,
        endLineNumber: body.endLineNumber,
        content: body.content,
        parentId: body.parentId,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      });

      // Log activity
      await db.insert(activityLogs).values({
        id: nanoid(),
        sessionId,
        action: "comment_added",
        targetType: "comment",
        targetId: commentId,
        metadata: { filePath: body.filePath, lineNumber: body.lineNumber },
        createdAt: now,
      });

      const [comment] = await db
        .select()
        .from(lineComments)
        .where(eq(lineComments.id, commentId));

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PATCH /api/comments/:id - Update comment
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body: UpdateCommentRequest = req.body;

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.content !== undefined) updates.content = body.content;
      if (body.resolved !== undefined) {
        updates.resolved = body.resolved;
        if (body.resolved) {
          updates.resolvedAt = new Date();
        } else {
          updates.resolvedAt = null;
        }
      }

      await db.update(lineComments).set(updates).where(eq(lineComments.id, id));

      const [comment] = await db.select().from(lineComments).where(eq(lineComments.id, id));

      if (body.resolved !== undefined) {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId: comment.sessionId,
          action: "comment_resolved",
          targetType: "comment",
          targetId: id,
          metadata: { resolved: body.resolved },
          createdAt: new Date(),
        });
      }

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // DELETE /api/comments/:id - Delete comment
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(lineComments).where(eq(lineComments.id, id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/comments/:id/resolve - Toggle resolve status
  router.post("/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;

      const [existing] = await db
        .select()
        .from(lineComments)
        .where(eq(lineComments.id, id));

      if (!existing) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const newResolved = !existing.resolved;

      await db
        .update(lineComments)
        .set({
          resolved: newResolved,
          resolvedAt: newResolved ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(lineComments.id, id));

      await db.insert(activityLogs).values({
        id: nanoid(),
        sessionId: existing.sessionId,
        action: "comment_resolved",
        targetType: "comment",
        targetId: id,
        metadata: { resolved: newResolved },
        createdAt: new Date(),
      });

      const [comment] = await db.select().from(lineComments).where(eq(lineComments.id, id));

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
