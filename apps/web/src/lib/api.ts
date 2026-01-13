import type {
  BranchInfo,
  DiffFile,
  FileContent,
  CommitInfo,
  SessionWithStats,
  CreateSessionRequest,
  UpdateSessionRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  UpdateFileStatusRequest,
} from "@local-review/shared";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Git API
export const gitApi = {
  getBranches: () => fetchJson<BranchInfo>("/git/branches"),

  getDiff: (base: string, head: string) =>
    fetchJson<{ files: DiffFile[] }>(`/git/diff?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`),

  getFileContent: (base: string, head: string, path: string) =>
    fetchJson<FileContent>(
      `/git/diff/file?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}&path=${encodeURIComponent(path)}`
    ),

  getRawDiff: (base: string, head: string, path?: string) =>
    fetchJson<{ diff: string }>(
      `/git/diff/raw?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}${path ? `&path=${encodeURIComponent(path)}` : ""}`
    ),

  getCommits: (base: string, head: string) =>
    fetchJson<{ commits: CommitInfo[] }>(
      `/git/commits?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`
    ),

  getWorkingChanges: () =>
    fetchJson<{ staged: DiffFile[]; unstaged: DiffFile[] }>("/git/working-changes"),

  getWorkingDiff: (type: "staged" | "unstaged", path?: string) =>
    fetchJson<{ diff: string }>(
      `/git/working-diff?type=${type}${path ? `&path=${encodeURIComponent(path)}` : ""}`
    ),
};

// Session API
export interface SessionDetail extends SessionWithStats {
  files: Array<DiffFile & { reviewStatus: string; reviewedAt?: Date }>;
}

export const sessionApi = {
  list: () => fetchJson<{ sessions: SessionWithStats[] }>("/sessions"),

  get: (id: string) => fetchJson<SessionDetail>(`/sessions/${id}`),

  create: (data: CreateSessionRequest) =>
    fetchJson<SessionWithStats>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSessionRequest) =>
    fetchJson<SessionWithStats>(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJson<void>(`/sessions/${id}`, {
      method: "DELETE",
    }),
};

// Comment types
export interface LineComment {
  id: string;
  sessionId: string;
  filePath: string;
  side: "old" | "new";
  lineNumber: number;
  endLineNumber?: number;
  content: string;
  resolved: boolean;
  resolvedAt?: Date;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comment API
export const commentApi = {
  list: (sessionId: string, filePath?: string) => {
    const url = filePath
      ? `/sessions/${sessionId}/comments?filePath=${encodeURIComponent(filePath)}`
      : `/sessions/${sessionId}/comments`;
    return fetchJson<{ comments: LineComment[] }>(url);
  },

  create: (sessionId: string, data: CreateCommentRequest) =>
    fetchJson<LineComment>(`/sessions/${sessionId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateCommentRequest) =>
    fetchJson<LineComment>(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJson<void>(`/comments/${id}`, {
      method: "DELETE",
    }),

  toggleResolve: (id: string) =>
    fetchJson<LineComment>(`/comments/${id}/resolve`, {
      method: "POST",
    }),
};

// File status types
export interface FileStatus {
  id: string;
  sessionId: string;
  filePath: string;
  status: "pending" | "viewed" | "reviewed";
  reviewedAt?: Date;
  createdAt: Date;
}

// File API
export const fileApi = {
  list: (sessionId: string) =>
    fetchJson<{ files: FileStatus[] }>(`/sessions/${sessionId}/files`),

  updateStatus: (sessionId: string, filePath: string, data: UpdateFileStatusRequest) =>
    fetchJson<FileStatus>(`/sessions/${sessionId}/files/${encodeURIComponent(filePath)}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
