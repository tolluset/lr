import simpleGit, { SimpleGit, DiffResultTextFile } from "simple-git";
import type { DiffFile, BranchInfo, CommitInfo, FileContent } from "@local-review/shared";
import { detectLanguage } from "@local-review/shared";

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async getBranches(): Promise<BranchInfo> {
    const branchSummary = await this.git.branchLocal();
    return {
      current: branchSummary.current,
      all: branchSummary.all,
    };
  }

  async getCurrentBranch(): Promise<string> {
    const branchSummary = await this.git.branchLocal();
    return branchSummary.current;
  }

  async getCommitHash(ref: string): Promise<string> {
    const result = await this.git.revparse([ref]);
    return result.trim();
  }

  async getMergeBase(base: string, head: string): Promise<string> {
    try {
      const result = await this.git.raw(["merge-base", base, head]);
      return result.trim();
    } catch {
      // If no merge base, use base directly
      return await this.getCommitHash(base);
    }
  }

  async getCommitsBetween(base: string, head: string): Promise<CommitInfo[]> {
    const log = await this.git.log({ from: base, to: head });
    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
    }));
  }

  async getDiffFiles(base: string, head: string): Promise<DiffFile[]> {
    const diffSummary = await this.git.diffSummary([base, head]);

    return diffSummary.files.map((file) => {
      const textFile = file as DiffResultTextFile;
      let status: DiffFile["status"] = "modified";

      if ("binary" in file && file.binary) {
        return {
          path: file.file,
          status: "modified" as const,
          additions: 0,
          deletions: 0,
          binary: true,
        };
      }

      // Detect status based on insertions/deletions
      if (textFile.insertions > 0 && textFile.deletions === 0) {
        // Check if file exists in base
        status = "added";
      } else if (textFile.deletions > 0 && textFile.insertions === 0) {
        status = "deleted";
      }

      return {
        path: file.file,
        status,
        additions: textFile.insertions || 0,
        deletions: textFile.deletions || 0,
      };
    });
  }

  async getFileContent(ref: string, filePath: string): Promise<string> {
    try {
      return await this.git.show([`${ref}:${filePath}`]);
    } catch {
      return "";
    }
  }

  async getFileContentForDiff(
    base: string,
    head: string,
    filePath: string
  ): Promise<FileContent> {
    const [oldContent, newContent] = await Promise.all([
      this.getFileContent(base, filePath),
      this.getFileContent(head, filePath),
    ]);

    return {
      path: filePath,
      oldContent,
      newContent,
      language: detectLanguage(filePath),
    };
  }

  async getRawDiff(base: string, head: string, filePath?: string): Promise<string> {
    const args = [base, head];
    if (filePath) {
      args.push("--", filePath);
    }
    return await this.git.diff(args);
  }

  async isValidRef(ref: string): Promise<boolean> {
    try {
      await this.git.revparse([ref]);
      return true;
    } catch {
      return false;
    }
  }

  async getStagedFiles(): Promise<DiffFile[]> {
    const diffSummary = await this.git.diffSummary(["--cached"]);

    return diffSummary.files.map((file) => {
      const textFile = file as DiffResultTextFile;
      let status: DiffFile["status"] = "modified";

      if ("binary" in file && file.binary) {
        return {
          path: file.file,
          status: "modified" as const,
          additions: 0,
          deletions: 0,
          binary: true,
        };
      }

      if (textFile.insertions > 0 && textFile.deletions === 0) {
        status = "added";
      } else if (textFile.deletions > 0 && textFile.insertions === 0) {
        status = "deleted";
      }

      return {
        path: file.file,
        status,
        additions: textFile.insertions || 0,
        deletions: textFile.deletions || 0,
      };
    });
  }

  async getUnstagedFiles(): Promise<DiffFile[]> {
    const diffSummary = await this.git.diffSummary();

    return diffSummary.files.map((file) => {
      const textFile = file as DiffResultTextFile;
      let status: DiffFile["status"] = "modified";

      if ("binary" in file && file.binary) {
        return {
          path: file.file,
          status: "modified" as const,
          additions: 0,
          deletions: 0,
          binary: true,
        };
      }

      if (textFile.insertions > 0 && textFile.deletions === 0) {
        status = "added";
      } else if (textFile.deletions > 0 && textFile.insertions === 0) {
        status = "deleted";
      }

      return {
        path: file.file,
        status,
        additions: textFile.insertions || 0,
        deletions: textFile.deletions || 0,
      };
    });
  }

  async getStagedDiff(filePath?: string): Promise<string> {
    const args = ["--cached"];
    if (filePath) {
      args.push("--", filePath);
    }
    return await this.git.diff(args);
  }

  async getUnstagedDiff(filePath?: string): Promise<string> {
    const args: string[] = [];
    if (filePath) {
      args.push("--", filePath);
    }
    return await this.git.diff(args);
  }

  async getWorkingChanges(): Promise<{
    staged: DiffFile[];
    unstaged: DiffFile[];
  }> {
    const [staged, unstaged] = await Promise.all([
      this.getStagedFiles(),
      this.getUnstagedFiles(),
    ]);
    return { staged, unstaged };
  }
}

// GitService instance cache (per path)
const gitServiceCache = new Map<string, GitService>();

export function getGitService(repoPath: string): GitService {
  let service = gitServiceCache.get(repoPath);
  if (!service) {
    service = new GitService(repoPath);
    gitServiceCache.set(repoPath, service);
  }
  return service;
}
