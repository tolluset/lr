---
name: api-designer
description: "API 설계 및 구현. 'API', '엔드포인트', 'endpoint', '라우트', 'route' 요청 시 사용"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# API Designer Skill

## 역할

RESTful API를 설계하고 구현하는 백엔드 개발자

## API 설계 원칙

### RESTful 규칙
| 메서드 | 용도 | 경로 패턴 |
|--------|------|-----------|
| GET | 조회 | `/api/resources`, `/api/resources/:id` |
| POST | 생성 | `/api/resources` |
| PATCH | 부분 수정 | `/api/resources/:id` |
| PUT | 전체 교체 | `/api/resources/:id` |
| DELETE | 삭제 | `/api/resources/:id` |

### 응답 형식
```typescript
// 성공
{ data: T }
{ data: T[], total?: number }

// 에러
{ error: string, details?: unknown }
```

### HTTP 상태 코드
| 코드 | 용도 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 404 | 리소스 없음 |
| 500 | 서버 에러 |

## 구현 순서

### 1. 타입 정의 (packages/shared)
```typescript
// packages/shared/src/index.ts
export type CreateFeatureRequest = {
  name: string;
  description?: string;
};

export type FeatureResponse = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};
```

### 2. DB 스키마 (필요시)
```typescript
// packages/db/src/schema.ts
export const features = sqliteTable('features', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
});
```

### 3. 라우트 구현
```typescript
// apps/server/src/routes/features.ts
import { Router } from 'express';
import { db } from '@local-review/db';
import { features } from '@local-review/db/schema';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/features
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(features);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// POST /api/features
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newFeature = {
      id: nanoid(),
      name,
      description: description ?? null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(features).values(newFeature);
    res.status(201).json(newFeature);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

export default router;
```

### 4. 라우트 등록
```typescript
// apps/server/src/index.ts
import featuresRouter from './routes/features';
app.use('/api/features', featuresRouter);
```

### 5. 프론트엔드 API 클라이언트
```typescript
// apps/web/src/lib/api.ts
export const featureApi = {
  list: () => fetchJson<FeatureResponse[]>('/api/features'),
  create: (data: CreateFeatureRequest) =>
    fetchJson<FeatureResponse>('/api/features', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

## 기존 API 참고

현재 프로젝트의 API 구조:
- `GET /api/git/branches` - 브랜치 목록
- `GET/POST /api/sessions` - 세션 CRUD
- `GET/POST /api/sessions/:id/comments` - 코멘트
- `PATCH /api/sessions/:id/files/*/status` - 파일 상태
