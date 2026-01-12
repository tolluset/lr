import express from "express";
import cors from "cors";
import path from "path";
import { createDb } from "@local-review/db";
import { createGitRoutes } from "./routes/git.js";
import { createSessionRoutes } from "./routes/sessions.js";
import { createCommentRoutes } from "./routes/comments.js";
import { createFileRoutes } from "./routes/files.js";
import { GitService } from "./services/git.service.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Repository path - current working directory or specified via env
const REPO_PATH = process.env.REPO_PATH || process.cwd();
const DB_PATH = process.env.DATABASE_URL || path.join(REPO_PATH, ".local-review.db");

// Initialize services
const db = createDb(DB_PATH);
const gitService = new GitService(REPO_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/git", createGitRoutes(gitService));
app.use("/api/sessions", createSessionRoutes(db, gitService, REPO_PATH));
app.use("/api/sessions", createCommentRoutes(db));
app.use("/api/sessions", createFileRoutes(db));
app.use("/api/comments", createCommentRoutes(db));

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", repoPath: REPO_PATH });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Repository: ${REPO_PATH}`);
});
