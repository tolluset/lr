# lr(local-review)

![Demo Screenshot](images/demo.png)


Simple code reviewer in local

## Key Features

- Base Branch Selection – Choose a base branch when creating a review session
- Diff Viewer – Display code diffs using @pierre/diffs (split / unified layouts)
- Line-by-Line Comments – Add comments to specific lines, reply to comments, and mark them as resolved
- File Review Status – Checkbox to mark each file as reviewed
- Session Management – Create, list, and update the status of review sessions
- SQLite Persistence – All data is stored in .local-review.db

## Project Structure

```
local-review/
├── apps/
│   ├── web/         # React + Vite + Tailwind + shadcn/ui
│   └── server/      # Express API
├── packages/
│   ├── db/          # Drizzle ORM + SQLite
│   └── shared/      # Shared types
```

## Usage

### Install dependencies
```bash
pnpm install
```

### Rebuild better-sqlite3 (Node.js v24+ 사용 시 필수)
Node.js v24 이상에서는 better-sqlite3의 prebuilt 바이너리가 제공되지 않아 직접 컴파일이 필요함.

```bash
# node-gyp 글로벌 설치 (없는 경우)
pnpm add -g node-gyp

# better-sqlite3 네이티브 바이너리 빌드 (프로젝트 루트에서 실행)
node-gyp rebuild -C node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
```

### Run DB migrations (execute from the git repository root)
DATABASE_URL=./.local-review.db pnpm --filter @local-review/db migrate

### Start the server
REPO_PATH=$(pwd) DATABASE_URL=$(pwd)/.local-review.db pnpm --filter @local-review/server dev

### Start the web app (in a separate terminal)
pnpm --filter @local-review/web dev


Open http://localhost:5176
 in your browser.
You can start a new review session by clicking the “New Review” button.
