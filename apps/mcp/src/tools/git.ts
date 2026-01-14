import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getGitService } from "../services/git.service.js";

// Git tools definition (8 tools)
export const gitTools: Tool[] = [
  {
    name: "git:list-branches",
    description: "List branches in the Git repository",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: {
          type: "string",
          description: "Git repository path (default: current directory)",
        },
      },
      required: [],
    },
  },
  {
    name: "git:get-diff-files",
    description: "List changed files between two commits/branches",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: {
          type: "string",
          description: "Git repository path",
        },
        base: {
          type: "string",
          description: "Base commit/branch",
        },
        head: {
          type: "string",
          description: "Target commit/branch to compare",
        },
      },
      required: ["base", "head"],
    },
  },
  {
    name: "git:get-file-content-diff",
    description: "Get file content before and after changes",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
        base: { type: "string", description: "Base commit/branch" },
        head: { type: "string", description: "Target commit/branch to compare" },
        path: { type: "string", description: "File path" },
      },
      required: ["base", "head", "path"],
    },
  },
  {
    name: "git:get-commits",
    description: "List commits between two commits/branches",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
        base: { type: "string", description: "Base commit/branch" },
        head: { type: "string", description: "Target commit/branch to compare" },
      },
      required: ["base", "head"],
    },
  },
  {
    name: "git:get-file-content",
    description: "Get file content at a specific ref",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
        ref: { type: "string", description: "Commit/branch/tag" },
        path: { type: "string", description: "File path" },
      },
      required: ["ref", "path"],
    },
  },
  {
    name: "git:get-raw-diff",
    description: "Get raw unified diff text",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
        base: { type: "string", description: "Base commit/branch" },
        head: { type: "string", description: "Target commit/branch to compare" },
        path: { type: "string", description: "Specific file only (optional)" },
      },
      required: ["base", "head"],
    },
  },
  {
    name: "git:get-working-changes",
    description: "Get staged/unstaged changed files in working directory",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
      },
      required: [],
    },
  },
  {
    name: "git:get-working-diff",
    description: "Get staged or unstaged diff in working directory",
    inputSchema: {
      type: "object",
      properties: {
        repoPath: { type: "string", description: "Git repository path" },
        type: {
          type: "string",
          enum: ["staged", "unstaged"],
          description: "staged or unstaged",
        },
        path: { type: "string", description: "Specific file only (optional)" },
      },
      required: ["type"],
    },
  },
];

// Git tool execution handler
export async function handleGitTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const repoPath = (args.repoPath as string) || process.cwd();
  const gitService = getGitService(repoPath);

  switch (name) {
    case "git:list-branches": {
      const branches = await gitService.getBranches();
      return {
        content: [{ type: "text", text: JSON.stringify(branches, null, 2) }],
      };
    }

    case "git:get-diff-files": {
      const files = await gitService.getDiffFiles(
        args.base as string,
        args.head as string
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ files }, null, 2) }],
      };
    }

    case "git:get-file-content-diff": {
      const content = await gitService.getFileContentForDiff(
        args.base as string,
        args.head as string,
        args.path as string
      );
      return {
        content: [{ type: "text", text: JSON.stringify(content, null, 2) }],
      };
    }

    case "git:get-commits": {
      const commits = await gitService.getCommitsBetween(
        args.base as string,
        args.head as string
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ commits }, null, 2) }],
      };
    }

    case "git:get-file-content": {
      const content = await gitService.getFileContent(
        args.ref as string,
        args.path as string
      );
      return {
        content: [{ type: "text", text: content }],
      };
    }

    case "git:get-raw-diff": {
      const diff = await gitService.getRawDiff(
        args.base as string,
        args.head as string,
        args.path as string | undefined
      );
      return {
        content: [{ type: "text", text: diff }],
      };
    }

    case "git:get-working-changes": {
      const changes = await gitService.getWorkingChanges();
      return {
        content: [{ type: "text", text: JSON.stringify(changes, null, 2) }],
      };
    }

    case "git:get-working-diff": {
      const type = args.type as "staged" | "unstaged";
      const path = args.path as string | undefined;
      const diff =
        type === "staged"
          ? await gitService.getStagedDiff(path)
          : await gitService.getUnstagedDiff(path);
      return {
        content: [{ type: "text", text: diff }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown git tool: ${name}` }],
        isError: true,
      };
  }
}
