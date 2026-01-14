import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { nanoid } from "nanoid";
import { eq, desc, sql } from "drizzle-orm";
import type { Db } from "@local-review/db";
import {
  reviewSessions,
  fileReviewStatus,
  lineComments,
  activityLogs,
} from "@local-review/db";
import { getGitService } from "../services/git.service.js";

// Sessions tools definition (5 tools)
export const sessionsTools: Tool[] = [
  {
    name: "sessions:list",
    description: "List all code review sessions (with stats)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "sessions:create",
    description: "Create a new code review session",
    inputSchema: {
      type: "object",
      properties: {
        repositoryPath: {
          type: "string",
          description: "Git repository path",
        },
        baseBranch: {
          type: "string",
          description: "Base branch to compare (e.g., main, develop)",
        },
        title: {
          type: "string",
          description: "Session title (optional)",
        },
        description: {
          type: "string",
          description: "Session description (optional)",
        },
      },
      required: ["repositoryPath", "baseBranch"],
    },
  },
  {
    name: "sessions:get",
    description: "Get session details and file list",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Session ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sessions:update",
    description: "Update session info (title, description, status)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Session ID",
        },
        title: {
          type: "string",
          description: "New title",
        },
        description: {
          type: "string",
          description: "New description",
        },
        status: {
          type: "string",
          enum: ["active", "completed", "archived"],
          description: "New status",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "sessions:delete",
    description: "Delete session",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Session ID",
        },
      },
      required: ["id"],
    },
  },
];

// Sessions tool execution handler
export async function handleSessionsTool(
  name: string,
  args: Record<string, unknown>,
  db: Db
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "sessions:list": {
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

      return {
        content: [{ type: "text", text: JSON.stringify({ sessions: sessionsWithStats }, null, 2) }],
      };
    }

    case "sessions:create": {
      const { repositoryPath, baseBranch, title, description } = args as {
        repositoryPath: string;
        baseBranch: string;
        title?: string;
        description?: string;
      };

      const gitService = getGitService(repositoryPath);

      // Get current branch and commit hash
      const headBranch = await gitService.getCurrentBranch();
      const baseCommit = await gitService.getCommitHash(baseBranch);
      const headCommit = await gitService.getCommitHash(headBranch);

      const sessionId = nanoid();
      const now = new Date();

      await db.insert(reviewSessions).values({
        id: sessionId,
        repositoryPath,
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

      // Get changed files and create file status records
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

      // Activity log
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...session,
                filesTotal: files.length,
                filesReviewed: 0,
                commentsCount: 0,
                unresolvedCommentsCount: 0,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "sessions:get": {
      const { id } = args as { id: string };

      const [session] = await db
        .select()
        .from(reviewSessions)
        .where(eq(reviewSessions.id, id));

      if (!session) {
        return {
          content: [{ type: "text", text: `Session not found: ${id}` }],
          isError: true,
        };
      }

      const gitService = getGitService(session.repositoryPath);

      // Get file statuses
      const files = await db
        .select()
        .from(fileReviewStatus)
        .where(eq(fileReviewStatus.sessionId, id));

      // Get Git diff files
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

      // Comment stats
      const [commentsStats] = await db
        .select({
          total: sql<number>`count(*)`,
          unresolved: sql<number>`sum(case when ${lineComments.resolved} = 0 then 1 else 0 end)`,
        })
        .from(lineComments)
        .where(eq(lineComments.sessionId, id));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...session,
                files: filesWithInfo,
                filesTotal: filesWithInfo.length,
                filesReviewed: files.filter((f) => f.status === "reviewed").length,
                commentsCount: commentsStats?.total || 0,
                unresolvedCommentsCount: commentsStats?.unresolved || 0,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "sessions:update": {
      const { id, title, description, status } = args as {
        id: string;
        title?: string;
        description?: string;
        status?: "active" | "completed" | "archived";
      };

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;

      await db.update(reviewSessions).set(updates).where(eq(reviewSessions.id, id));

      if (status) {
        await db.insert(activityLogs).values({
          id: nanoid(),
          sessionId: id,
          action: status === "completed" ? "session_completed" : "status_changed",
          targetType: "session",
          targetId: id,
          metadata: { newStatus: status },
          createdAt: new Date(),
        });
      }

      const [session] = await db
        .select()
        .from(reviewSessions)
        .where(eq(reviewSessions.id, id));

      return {
        content: [{ type: "text", text: JSON.stringify(session, null, 2) }],
      };
    }

    case "sessions:delete": {
      const { id } = args as { id: string };
      await db.delete(reviewSessions).where(eq(reviewSessions.id, id));
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, deletedId: id }) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown sessions tool: ${name}` }],
        isError: true,
      };
  }
}
