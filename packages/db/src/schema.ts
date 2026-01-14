import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Review sessions
export const reviewSessions = sqliteTable("review_sessions", {
  id: text("id").primaryKey(),
  repositoryPath: text("repository_path").notNull(),
  baseBranch: text("base_branch").notNull(),
  headBranch: text("head_branch").notNull(),
  baseCommit: text("base_commit").notNull(),
  headCommit: text("head_commit").notNull(),
  title: text("title"),
  description: text("description"),
  status: text("status", { enum: ["active", "completed", "archived"] })
    .default("active")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Per-file review status
export const fileReviewStatus = sqliteTable(
  "file_review_status",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => reviewSessions.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    status: text("status", {
      enum: ["pending", "viewed", "reviewed"],
    })
      .default("pending")
      .notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("idx_file_review_session").on(table.sessionId, table.filePath)]
);

// Line comments
export const lineComments = sqliteTable(
  "line_comments",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => reviewSessions.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    side: text("side", { enum: ["old", "new"] }).notNull(),
    lineNumber: integer("line_number").notNull(),
    endLineNumber: integer("end_line_number"),
    content: text("content").notNull(),
    resolved: integer("resolved", { mode: "boolean" }).default(false).notNull(),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    parentId: text("parent_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("idx_line_comments_file").on(table.sessionId, table.filePath)]
);

// Activity logs
export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => reviewSessions.id, { onDelete: "cascade" }),
    action: text("action", {
      enum: [
        "session_created",
        "file_reviewed",
        "comment_added",
        "comment_resolved",
        "status_changed",
        "session_completed",
      ],
    }).notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("idx_activity_session").on(table.sessionId, table.createdAt)]
);

// Type extraction
export type ReviewSession = typeof reviewSessions.$inferSelect;
export type NewReviewSession = typeof reviewSessions.$inferInsert;
export type FileReviewStatus = typeof fileReviewStatus.$inferSelect;
export type NewFileReviewStatus = typeof fileReviewStatus.$inferInsert;
export type LineComment = typeof lineComments.$inferSelect;
export type NewLineComment = typeof lineComments.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
