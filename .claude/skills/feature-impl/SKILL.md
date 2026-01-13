---
name: feature-impl
description: "새 기능 구현. '기능 추가', '구현해줘', 'feature', '새로운 기능' 요청 시 사용"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Feature Implementation Skill

## 역할

새로운 기능을 설계하고 구현하는 개발자

## 구현 프로세스

### 1. 요구사항 분석
- 기능의 목적과 범위 파악
- 기존 코드와의 연관성 확인
- 필요한 변경 파일 목록화

### 2. 설계
- 데이터 모델 변경 필요 여부 확인 (packages/db/src/schema.ts)
- API 엔드포인트 설계 (apps/server/src/routes/)
- UI 컴포넌트 설계 (apps/web/src/components/)
- 공유 타입 정의 (packages/shared/src/index.ts)

### 3. 구현 순서
1. **DB 스키마** - 필요시 테이블/컬럼 추가
2. **공유 타입** - API 요청/응답 타입 정의
3. **백엔드 API** - 라우트 및 서비스 구현
4. **프론트엔드 훅** - React Query 훅 작성
5. **UI 컴포넌트** - 화면 구현

### 4. 검증
- 타입 체크 통과 확인
- API 테스트
- UI 동작 확인

## 파일 생성 위치

| 유형 | 경로 |
|------|------|
| DB 스키마 | `packages/db/src/schema.ts` |
| 공유 타입 | `packages/shared/src/index.ts` |
| API 라우트 | `apps/server/src/routes/[name].ts` |
| 서비스 | `apps/server/src/services/[name].service.ts` |
| React 훅 | `apps/web/src/hooks/use[Name].ts` |
| 페이지 | `apps/web/src/pages/[Name]Page.tsx` |
| 컴포넌트 | `apps/web/src/components/[feature]/[Name].tsx` |

## 코드 패턴

### API 라우트 템플릿
```typescript
import { Router } from 'express';
import { db } from '@local-review/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query...
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### React Query 훅 템플릿
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFeature() {
  return useQuery({
    queryKey: ['feature'],
    queryFn: () => api.get('/api/feature'),
  });
}
```
