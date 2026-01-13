// API Types
export interface DiffFile {
  path: string;
  oldPath?: string;
  status: "added" | "deleted" | "modified" | "renamed";
  additions: number;
  deletions: number;
  binary?: boolean;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: "add" | "del" | "normal";
  oldLine?: number;
  newLine?: number;
  content: string;
}

export interface FileContent {
  path: string;
  oldContent: string;
  newContent: string;
  language: string;
}

export interface BranchInfo {
  current: string;
  all: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// Session types
export interface SessionWithStats {
  id: string;
  repositoryPath: string;
  baseBranch: string;
  headBranch: string;
  baseCommit: string;
  headCommit: string;
  title: string | null;
  description: string | null;
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
  filesTotal: number;
  filesReviewed: number;
  commentsCount: number;
  unresolvedCommentsCount: number;
}

// Request types
export interface CreateSessionRequest {
  repositoryPath: string;
  baseBranch: string;
  title?: string;
  description?: string;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  status?: "active" | "completed" | "archived";
}

export interface CreateCommentRequest {
  filePath: string;
  side: "old" | "new";
  lineNumber: number;
  endLineNumber?: number;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
  resolved?: boolean;
}

export interface UpdateFileStatusRequest {
  status: "pending" | "viewed" | "reviewed";
}

// Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Utility
export function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    vue: "vue",
    svelte: "svelte",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    md: "markdown",
    mdx: "mdx",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "fish",
    ps1: "powershell",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    r: "r",
    scala: "scala",
    lua: "lua",
    perl: "perl",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    clj: "clojure",
    ml: "ocaml",
    fs: "fsharp",
    nim: "nim",
    zig: "zig",
    v: "v",
    dart: "dart",
    graphql: "graphql",
    gql: "graphql",
    proto: "protobuf",
    dockerfile: "dockerfile",
    makefile: "makefile",
    cmake: "cmake",
    nginx: "nginx",
    xml: "xml",
    svg: "xml",
    ini: "ini",
    env: "dotenv",
  };
  return languageMap[ext || ""] || "plaintext";
}
