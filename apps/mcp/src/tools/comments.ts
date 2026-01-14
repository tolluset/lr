import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import type { Db } from "@local-review/db";
import { lineComments, activityLogs } from "@local-review/db";

// Comments tools definition (5 tools)
export const commentsTools: Tool[] = [
  {
    name: "comments:list",
    description: "List comments in a session (can filter by file)",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID",
        },
        filePath: {
          type: "string",
          description: "Specific file only (optional)",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "comments:create",
    description: "Create a new comment",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID",
        },
        filePath: {
          type: "string",
          description: "File path",
        },
        side: {
          type: "string",
          enum: ["old", "new"],
          description: "old (before change) or new (after change)",
        },
        lineNumber: {
          type: "number",
          description: "Line number",
        },
        content: {
          type: "string",
          description: "Comment content",
        },
        endLineNumber: {
          type: "number",
          description: "End line for range comments (optional)",
        },
        parentId: {
          type: "string",
          description: "Parent comment ID for replies (optional)",
        },
      },
      required: ["sessionId", "filePath", "side", "lineNumber", "content"],
    },
  },
  {
    name: "comments:update",
    description: "Update a comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID",
        },
        content: {
          type: "string",
          description: "New content",
        },
        resolved: {
          type: "boolean",
          description: "Resolved status",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "comments:delete",
    description: "Delete a comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "comments:toggle-resolve",
    description: "Toggle comment resolved status",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID",
        },
      },
      required: ["id"],
    },
  },
];

// Comments tool execution handler
export async function handleCommentsTool(
  name: string,
  args: Record<string, unknown>,
  db: Db
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "comments:list": {
      const { sessionId, filePath } = args as { sessionId: string; filePath?: string };

      let comments;
      if (filePath) {
        comments = await db
          .select()
          .from(lineComments)
          .where(
            and(
              eq(lineComments.sessionId, sessionId),
              eq(lineComments.filePath, filePath)
            )
          )
          .orderBy(lineComments.lineNumber, lineComments.createdAt);
      } else {
        comments = await db
          .select()
          .from(lineComments)
          .where(eq(lineComments.sessionId, sessionId))
          .orderBy(lineComments.filePath, lineComments.lineNumber, lineComments.createdAt);
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ comments }, null, 2) }],
      };
    }

    case "comments:create": {
      const { sessionId, filePath, side, lineNumber, content, endLineNumber, parentId } = args as {
        sessionId: string;
        filePath: string;
        side: "old" | "new";
        lineNumber: number;
        content: string;
        endLineNumber?: number;
        parentId?: string;
      };

      const commentId = nanoid();
      const now = new Date();

      await db.insert(lineComments).values({
        id: commentId,
        sessionId,
        filePath,
        side,
        lineNumber,
        endLineNumber,
        content,
        parentId,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      });

      // Activity log
      await db.insert(activityLogs).values({
        id: nanoid(),
        sessionId,
        action: "comment_added",
        targetType: "comment",
        targetId: commentId,
        metadata: { filePath, lineNumber },
        createdAt: now,
      });

      const [comment] = await db
        .select()
        .from(lineComments)
        .where(eq(lineComments.id, commentId));

      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }

    case "comments:update": {
      const { id, content, resolved } = args as {
        id: string;
        content?: string;
        resolved?: boolean;
      };

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (content !== undefined) updates.content = content;
      if (resolved !== undefined) {
        updates.resolved = resolved;
        updates.resolvedAt = resolved ? new Date() : null;
      }

      await db.update(lineComments).set(updates).where(eq(lineComments.id, id));

      const [comment] = await db.select().from(lineComments).where(eq(lineComments.id, id));

      if (resolved !== undefined && comment) {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId: comment.sessionId,
          action: "comment_resolved",
          targetType: "comment",
          targetId: id,
          metadata: { resolved },
          createdAt: new Date(),
        });
      }

      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }

    case "comments:delete": {
      const { id } = args as { id: string };
      await db.delete(lineComments).where(eq(lineComments.id, id));
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, deletedId: id }) }],
      };
    }

    case "comments:toggle-resolve": {
      const { id } = args as { id: string };

      const [existing] = await db
        .select()
        .from(lineComments)
        .where(eq(lineComments.id, id));

      if (!existing) {
        return {
          content: [{ type: "text", text: `Comment not found: ${id}` }],
          isError: true,
        };
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

      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown comments tool: ${name}` }],
        isError: true,
      };
  }
}
