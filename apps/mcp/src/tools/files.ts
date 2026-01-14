import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";
import type { Db } from "@local-review/db";
import { fileReviewStatus, activityLogs } from "@local-review/db";

// Files tools definition (3 tools)
export const filesTools: Tool[] = [
  {
    name: "files:list",
    description: "List file review statuses in a session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "files:update-status",
    description: "Update file review status",
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
        status: {
          type: "string",
          enum: ["pending", "viewed", "reviewed"],
          description: "New status",
        },
      },
      required: ["sessionId", "filePath", "status"],
    },
  },
  {
    name: "activities:list",
    description: "List activity logs in a session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID",
        },
        limit: {
          type: "number",
          description: "Max count (default: 50)",
        },
      },
      required: ["sessionId"],
    },
  },
];

// Files tool execution handler
export async function handleFilesTool(
  name: string,
  args: Record<string, unknown>,
  db: Db
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "files:list": {
      const { sessionId } = args as { sessionId: string };

      const files = await db
        .select()
        .from(fileReviewStatus)
        .where(eq(fileReviewStatus.sessionId, sessionId))
        .orderBy(fileReviewStatus.filePath);

      return {
        content: [{ type: "text", text: JSON.stringify({ files }, null, 2) }],
      };
    }

    case "files:update-status": {
      const { sessionId, filePath, status } = args as {
        sessionId: string;
        filePath: string;
        status: "pending" | "viewed" | "reviewed";
      };

      const now = new Date();
      const updates: Record<string, unknown> = {
        status,
      };

      if (status === "reviewed") {
        updates.reviewedAt = now;
      }

      // Check existing file status
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
        // Create new
        await db.insert(fileReviewStatus).values({
          id: nanoid(),
          sessionId,
          filePath,
          status,
          reviewedAt: status === "reviewed" ? now : undefined,
          createdAt: now,
        });
      } else {
        // Update
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

      // Activity log
      if (status === "reviewed") {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId,
          action: "file_reviewed",
          targetType: "file",
          targetId: filePath,
          metadata: { status },
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

      return {
        content: [{ type: "text", text: JSON.stringify(file, null, 2) }],
      };
    }

    case "activities:list": {
      const { sessionId, limit = 50 } = args as { sessionId: string; limit?: number };

      const activities = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.sessionId, sessionId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);

      return {
        content: [{ type: "text", text: JSON.stringify({ activities }, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown files tool: ${name}` }],
        isError: true,
      };
  }
}
