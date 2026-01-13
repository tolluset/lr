import { Router } from "express";
import type { GitService } from "../services/git.service.js";

export function createGitRoutes(gitService: GitService) {
  const router = Router();

  // GET /api/git/branches
  router.get("/branches", async (_, res) => {
    try {
      const branches = await gitService.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff?base=&head=
  router.get("/diff", async (req, res) => {
    try {
      const { base, head } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const files = await gitService.getDiffFiles(base as string, head as string);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff/file?base=&head=&path=
  router.get("/diff/file", async (req, res) => {
    try {
      const { base, head, path: filePath } = req.query;

      if (!base || !head || !filePath) {
        return res.status(400).json({ error: "base, head, and path are required" });
      }

      const content = await gitService.getFileContentForDiff(
        base as string,
        head as string,
        filePath as string
      );
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/commits?base=&head=
  router.get("/commits", async (req, res) => {
    try {
      const { base, head } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const commits = await gitService.getCommitsBetween(base as string, head as string);
      res.json({ commits });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/file?ref=&path=
  router.get("/file", async (req, res) => {
    try {
      const { ref, path: filePath } = req.query;

      if (!ref || !filePath) {
        return res.status(400).json({ error: "ref and path are required" });
      }

      const content = await gitService.getFileContent(ref as string, filePath as string);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff/raw?base=&head=&path=
  router.get("/diff/raw", async (req, res) => {
    try {
      const { base, head, path: filePath } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const rawDiff = await gitService.getRawDiff(
        base as string,
        head as string,
        filePath as string | undefined
      );
      res.json({ diff: rawDiff });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/working-changes
  router.get("/working-changes", async (_, res) => {
    try {
      const changes = await gitService.getWorkingChanges();
      res.json(changes);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/working-diff?type=staged|unstaged&path=
  router.get("/working-diff", async (req, res) => {
    try {
      const { type, path: filePath } = req.query;

      if (!type || (type !== "staged" && type !== "unstaged")) {
        return res.status(400).json({ error: "type must be 'staged' or 'unstaged'" });
      }

      const diff =
        type === "staged"
          ? await gitService.getStagedDiff(filePath as string | undefined)
          : await gitService.getUnstagedDiff(filePath as string | undefined);

      res.json({ diff });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
