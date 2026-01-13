# Local Review (lr)

로컬 코드 리뷰 시스템 - 로컬 환경에서 Git diff 기반 코드 리뷰를 수행할 수 있는 도구

## 프로젝트 구조

```
local-review/
├── apps/
│   ├── web/                 # React 프론트엔드 (port 5173)
│   │   ├── src/
│   │   │   ├── components/  # UI 컴포넌트
│   │   │   │   ├── diff/    # DiffViewer, FileTree, CommentThread
│   │   │   │   ├── session/ # CreateSessionDialog, SessionCard
│   │   │   │   └── ui/      # shadcn/ui 컴포넌트
│   │   │   ├── hooks/       # React Query 훅
│   │   │   ├── lib/         # API 클라이언트, 유틸
│   │   │   └── pages/       # HomePage, SessionPage
│   │   └── vite.config.ts
│   │
│   └── server/              # Express 백엔드 (port 3001)
│       └── src/
│           ├── routes/      # git.ts, sessions.ts, comments.ts, files.ts
│           ├── services/    # git.service.ts
│           └── index.ts     # 서버 엔트리
│
├── packages/
│   ├── db/                  # 데이터베이스 레이어
│   │   ├── src/
│   │   │   ├── schema.ts    # Drizzle 테이블 정의
│   │   │   └── index.ts     # createDb, 스키마 export
│   │   └── drizzle/         # 마이그레이션 파일
│   │
│   └── shared/              # 공유 타입
│       └── src/index.ts     # API 타입, detectLanguage()
│
├── turbo.json               # Turbo 빌드 설정
├── pnpm-workspace.yaml      # 워크스페이스 정의
└── .local-review.db         # SQLite 데이터베이스 (런타임 생성)
```

## 기술 스택

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: SQLite with Drizzle ORM (better-sqlite3)
- **Git**: simple-git
- **Build**: Turbo (monorepo), pnpm
- **Diff Rendering**: @pierre/diffs

## 데이터베이스 스키마

```sql
reviewSessions        -- 리뷰 세션
  id                  -- nanoid
  baseBranch          -- 비교 기준 브랜치
  headBranch          -- 현재 브랜치
  baseCommit          -- 기준 커밋 해시
  headCommit          -- 헤드 커밋 해시
  title, description
  status              -- active | completed | archived
  createdAt, updatedAt

fileReviewStatus      -- 파일별 리뷰 상태
  sessionId           -- FK -> reviewSessions
  filePath
  status              -- pending | viewed | reviewed

lineComments          -- 라인 코멘트
  sessionId           -- FK -> reviewSessions
  filePath
  lineNumber
  side                -- old | new
  content
  resolved            -- boolean
  parentId            -- 스레드용 (nullable)
  createdAt, updatedAt

activityLogs          -- 활동 로그
  sessionId           -- FK -> reviewSessions
  action              -- session_created | file_reviewed | comment_added | ...
  details             -- JSON
  createdAt
```

## API 엔드포인트

### Git (`/api/git`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/branches` | 브랜치 목록 |
| GET | `/diff?base=&head=` | 변경 파일 목록 |
| GET | `/diff/file?base=&head=&path=` | 파일 양쪽 내용 |
| GET | `/diff/raw?base=&head=&path=` | Raw unified diff |
| GET | `/commits?base=&head=` | 커밋 목록 |
| GET | `/file?ref=&path=` | 특정 ref의 파일 내용 |

### Sessions (`/api/sessions`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 세션 목록 (stats 포함) |
| POST | `/` | 세션 생성 `{ baseBranch, title?, description? }` |
| GET | `/:id` | 세션 상세 + 파일 목록 |
| PATCH | `/:id` | 수정 `{ title?, description?, status? }` |
| DELETE | `/:id` | 세션 삭제 |

### Comments (`/api/sessions/:sessionId/comments`, `/api/comments`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/sessions/:id/comments?filePath=` | 코멘트 목록 |
| POST | `/sessions/:id/comments` | 코멘트 생성 |
| PATCH | `/comments/:id` | 코멘트 수정 |
| DELETE | `/comments/:id` | 코멘트 삭제 |
| POST | `/comments/:id/resolve` | 해결 토글 |

### Files (`/api/sessions/:sessionId/files`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 파일 상태 목록 |
| PATCH | `/*/status` | 상태 업데이트 `{ status }` |

## 핵심 파일 가이드

| 파일 | 역할 |
|------|------|
| `apps/server/src/services/git.service.ts` | simple-git 래퍼, 모든 Git 명령 |
| `apps/server/src/routes/sessions.ts` | 세션 CRUD, 통계 계산 |
| `apps/web/src/lib/api.ts` | fetch 래퍼, gitApi/sessionApi/commentApi/fileApi |
| `apps/web/src/hooks/useSessions.ts` | 세션 React Query 훅 |
| `apps/web/src/hooks/useDiff.ts` | Diff 데이터 훅 |
| `apps/web/src/components/diff/DiffViewer.tsx` | @pierre/diffs 렌더링 |
| `apps/web/src/components/diff/FileTree.tsx` | 파일 목록 사이드바 |
| `apps/web/src/pages/SessionPage.tsx` | 메인 리뷰 화면 |
| `packages/db/src/schema.ts` | Drizzle 테이블/관계 정의 |
| `packages/shared/src/index.ts` | 모든 공유 타입 |

## 데이터 플로우

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

## 개발 명령어

```bash
pnpm install          # 의존성 설치
pnpm dev              # 전체 개발 서버 (web + server)
pnpm build            # 전체 빌드
pnpm db:generate      # Drizzle 스키마 변경 후 마이그레이션 생성
pnpm db:migrate       # 마이그레이션 실행
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `REPO_PATH` | `.` (현재 디렉토리) | 리뷰 대상 Git 저장소 |
| `DATABASE_URL` | `.local-review.db` | SQLite 파일 경로 |
| `PORT` | `3001` | 백엔드 서버 포트 |

## 패키지 의존성

```
@local-review/web
    └── @local-review/shared

@local-review/server
    ├── @local-review/db
    └── @local-review/shared

@local-review/db (standalone)
@local-review/shared (standalone)
```

## 코드 컨벤션

### TypeScript
- 엄격한 타입 사용 (`strict: true`)
- 공유 타입은 `packages/shared`에 정의
- 타입 alias 선호 (interface보다)

### React
- 함수형 컴포넌트만 사용
- 훅: `src/hooks/` (use* 접두사)
- UI 컴포넌트: `src/components/ui/` (shadcn/ui)
- 페이지: `src/pages/`

### 명명 규칙
- 컴포넌트: PascalCase (`SessionCard.tsx`)
- 훅: camelCase (`useSessions.ts`)
- 라우트/서비스: camelCase (`sessions.ts`, `git.service.ts`)

### API
- RESTful 패턴
- 라우트: `apps/server/src/routes/`
- 서비스: `apps/server/src/services/`

## 주요 워크플로우

### 세션 생성
1. HomePage → "New Review" 클릭
2. CreateSessionDialog에서 baseBranch 선택
3. POST /api/sessions → 현재 브랜치와 diff 파일 자동 감지
4. fileReviewStatus 레코드 생성
5. SessionPage로 이동

### 코드 리뷰
1. FileTree에서 파일 선택
2. DiffViewer에서 diff 확인
3. 라인 클릭 → CommentForm → 코멘트 작성
4. 파일 체크박스로 reviewed 표시
5. 세션 상태를 completed로 변경
