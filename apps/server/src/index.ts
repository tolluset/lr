import express from "express";
import cors from "cors";
import path from "path";
import { execSync } from "child_process";
import { createDb } from "@local-review/db";
import { createGitRoutes } from "./routes/git.js";
import { createSessionRoutes } from "./routes/sessions.js";
import { createCommentRoutes } from "./routes/comments.js";
import { createFileRoutes } from "./routes/files.js";

function getGitRoot(): string {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
  } catch {
    return process.cwd();
  }
}

const app = express();
const PORT = process.env.PORT || 6776;

// Default repository path - git root or specified via env
const DEFAULT_REPO_PATH = process.env.REPO_PATH || getGitRoot();
const DB_PATH = process.env.DATABASE_URL || path.join(DEFAULT_REPO_PATH, ".local-review.db");

// Initialize services
const db = createDb(DB_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/git", createGitRoutes(DEFAULT_REPO_PATH));
app.use("/api/sessions", createSessionRoutes(db));
app.use("/api/sessions", createCommentRoutes(db));
app.use("/api/sessions", createFileRoutes(db));
app.use("/api/comments", createCommentRoutes(db));

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", defaultRepoPath: DEFAULT_REPO_PATH });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Default Repository: ${DEFAULT_REPO_PATH}`);
});
