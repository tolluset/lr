# Local Review (lr)

Local Code Review System - A tool for performing Git diff-based code reviews in local environments

## Project Structure

```
local-review/
├── apps/
│   ├── web/                 # React frontend (port 6777)
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   │   ├── diff/    # DiffViewer, FileTree, CommentThread
│   │   │   │   ├── session/ # CreateSessionDialog, SessionCard
│   │   │   │   └── ui/      # shadcn/ui components
│   │   │   ├── hooks/       # React Query hooks
│   │   │   ├── lib/         # API client, utilities
│   │   │   └── pages/       # HomePage, SessionPage
│   │   └── vite.config.ts
│   │
│   └── server/              # Express backend (port 6776)
│       └── src/
│           ├── routes/      # git.ts, sessions.ts, comments.ts, files.ts
│           ├── services/    # git.service.ts
│           └── index.ts     # Server entry
│
├── packages/
│   ├── db/                  # Database layer
│   │   ├── src/
│   │   │   ├── schema.ts    # Drizzle table definitions
│   │   │   └── index.ts     # createDb, schema export
│   │   └── drizzle/         # Migration files
│   │
│   └── shared/              # Shared types
│       └── src/index.ts     # API types, detectLanguage()
│
├── turbo.json               # Turbo build config
├── pnpm-workspace.yaml      # Workspace definition
└── .local-review.db         # SQLite database (created at runtime)
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: SQLite with Drizzle ORM (better-sqlite3)
- **Git**: simple-git
- **Build**: Turbo (monorepo), pnpm
- **Diff Rendering**: @pierre/diffs

## Database Schema

```sql
reviewSessions        -- Review sessions
  id                  -- nanoid
  baseBranch          -- Base comparison branch
  headBranch          -- Current branch
  baseCommit          -- Base commit hash
  headCommit          -- Head commit hash
  title, description
  status              -- active | completed | archived
  createdAt, updatedAt

fileReviewStatus      -- Per-file review status
  sessionId           -- FK -> reviewSessions
  filePath
  status              -- pending | viewed | reviewed

lineComments          -- Line comments
  sessionId           -- FK -> reviewSessions
  filePath
  lineNumber
  side                -- old | new
  content
  resolved            -- boolean
  parentId            -- For threads (nullable)
  createdAt, updatedAt

activityLogs          -- Activity logs
  sessionId           -- FK -> reviewSessions
  action              -- session_created | file_reviewed | comment_added | ...
  details             -- JSON
  createdAt
```

## API Endpoints

### Git (`/api/git`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/branches` | List branches |
| GET | `/diff?base=&head=` | List changed files |
| GET | `/diff/file?base=&head=&path=` | File content (both sides) |
| GET | `/diff/raw?base=&head=&path=` | Raw unified diff |
| GET | `/commits?base=&head=` | List commits |
| GET | `/file?ref=&path=` | File content at specific ref |

### Sessions (`/api/sessions`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List sessions (with stats) |
| POST | `/` | Create session `{ baseBranch, title?, description? }` |
| GET | `/:id` | Session details + file list |
| PATCH | `/:id` | Update `{ title?, description?, status? }` |
| DELETE | `/:id` | Delete session |

### Comments (`/api/sessions/:sessionId/comments`, `/api/comments`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions/:id/comments?filePath=` | List comments |
| POST | `/sessions/:id/comments` | Create comment |
| PATCH | `/comments/:id` | Update comment |
| DELETE | `/comments/:id` | Delete comment |
| POST | `/comments/:id/resolve` | Toggle resolved |

### Files (`/api/sessions/:sessionId/files`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List file statuses |
| PATCH | `/*/status` | Update status `{ status }` |

## Key Files Guide

| File | Role |
|------|------|
| `apps/server/src/services/git.service.ts` | simple-git wrapper, all Git commands |
| `apps/server/src/routes/sessions.ts` | Session CRUD, stats calculation |
| `apps/web/src/lib/api.ts` | fetch wrapper, gitApi/sessionApi/commentApi/fileApi |
| `apps/web/src/hooks/useSessions.ts` | Session React Query hooks |
| `apps/web/src/hooks/useDiff.ts` | Diff data hooks |
| `apps/web/src/components/diff/DiffViewer.tsx` | @pierre/diffs rendering |
| `apps/web/src/components/diff/FileTree.tsx` | File list sidebar |
| `apps/web/src/pages/SessionPage.tsx` | Main review screen |
| `packages/db/src/schema.ts` | Drizzle table/relation definitions |
| `packages/shared/src/index.ts` | All shared types |

## Data Flow

```
[Web UI] ─── React Query ───→ [API Client]
                                   │
                                   ↓ fetch
[Express Routes] ←──────────── /api/*
       │
       ├─→ [GitService] ←→ Git Repository (REPO_PATH)
       │
       └─→ [Drizzle ORM] ←→ SQLite (.local-review.db)
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev servers (web + server)
pnpm build            # Build all packages
pnpm db:generate      # Generate migrations after schema changes
pnpm db:migrate       # Run migrations
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REPO_PATH` | `.` (current directory) | Target Git repository for review |
| `DATABASE_URL` | `.local-review.db` | SQLite file path |
| `PORT` | `6776` | Backend server port |

## Package Dependencies

```
@local-review/web
    └── @local-review/shared

@local-review/server
    ├── @local-review/db
    └── @local-review/shared

@local-review/db (standalone)
@local-review/shared (standalone)
```

## Code Conventions

### TypeScript
- Strict types (`strict: true`)
- Shared types defined in `packages/shared`
- Prefer type aliases over interfaces

### React
- Functional components only
- Hooks: `src/hooks/` (use* prefix)
- UI components: `src/components/ui/` (shadcn/ui)
- Pages: `src/pages/`

### Naming
- Components: PascalCase (`SessionCard.tsx`)
- Hooks: camelCase (`useSessions.ts`)
- Routes/Services: camelCase (`sessions.ts`, `git.service.ts`)

### API
- RESTful patterns
- Routes: `apps/server/src/routes/`
- Services: `apps/server/src/services/`

## Main Workflows

### Creating a Session
1. HomePage → Click "New Review"
2. Select baseBranch in CreateSessionDialog
3. POST /api/sessions → Auto-detect current branch and diff files
4. Create fileReviewStatus records
5. Navigate to SessionPage

### Code Review
1. Select file in FileTree
2. View diff in DiffViewer
3. Click line → CommentForm → Write comment
4. Mark file as reviewed via checkbox
5. Change session status to completed
