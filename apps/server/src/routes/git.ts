import { Router } from "express";
import { getGitService } from "../services/git.service.js";

export function createGitRoutes(defaultRepoPath: string) {
  const router = Router();

  // Helper to get GitService from query param or default
  const getService = (repoPath?: string) => getGitService(repoPath || defaultRepoPath);

  // GET /api/git/branches?repoPath=
  router.get("/branches", async (req, res) => {
    try {
      const { repoPath } = req.query;
      const gitService = getService(repoPath as string | undefined);
      const branches = await gitService.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff?base=&head=&repoPath=
  router.get("/diff", async (req, res) => {
    try {
      const { base, head, repoPath } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const gitService = getService(repoPath as string | undefined);
      const files = await gitService.getDiffFiles(base as string, head as string);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff/file?base=&head=&path=&repoPath=
  router.get("/diff/file", async (req, res) => {
    try {
      const { base, head, path: filePath, repoPath } = req.query;

      if (!base || !head || !filePath) {
        return res.status(400).json({ error: "base, head, and path are required" });
      }

      const gitService = getService(repoPath as string | undefined);
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

  // GET /api/git/commits?base=&head=&repoPath=
  router.get("/commits", async (req, res) => {
    try {
      const { base, head, repoPath } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const gitService = getService(repoPath as string | undefined);
      const commits = await gitService.getCommitsBetween(base as string, head as string);
      res.json({ commits });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/file?ref=&path=&repoPath=
  router.get("/file", async (req, res) => {
    try {
      const { ref, path: filePath, repoPath } = req.query;

      if (!ref || !filePath) {
        return res.status(400).json({ error: "ref and path are required" });
      }

      const gitService = getService(repoPath as string | undefined);
      const content = await gitService.getFileContent(ref as string, filePath as string);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/diff/raw?base=&head=&path=&repoPath=
  router.get("/diff/raw", async (req, res) => {
    try {
      const { base, head, path: filePath, repoPath } = req.query;

      if (!base || !head) {
        return res.status(400).json({ error: "base and head are required" });
      }

      const gitService = getService(repoPath as string | undefined);
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

  // GET /api/git/working-changes?repoPath=
  router.get("/working-changes", async (req, res) => {
    try {
      const { repoPath } = req.query;
      const gitService = getService(repoPath as string | undefined);
      const changes = await gitService.getWorkingChanges();
      res.json(changes);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/git/working-diff?type=staged|unstaged&path=&repoPath=
  router.get("/working-diff", async (req, res) => {
    try {
      const { type, path: filePath, repoPath } = req.query;

      if (!type || (type !== "staged" && type !== "unstaged")) {
        return res.status(400).json({ error: "type must be 'staged' or 'unstaged'" });
      }

      const gitService = getService(repoPath as string | undefined);
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
