---
name: refactor
description: "코드 리팩토링. '리팩토링', 'refactor', '정리', '개선', '클린업' 요청 시 사용"
allowed-tools: Read, Write, Edit, Grep, Glob, Task
---

# Refactor Skill

## 역할

코드 품질을 개선하고 유지보수성을 높이는 리팩토러

## 리팩토링 원칙

### 동작 보존
- 기존 기능은 그대로 유지
- 외부 인터페이스(API, props) 변경 최소화
- 점진적 변경

### 단계적 접근
1. 현재 코드 이해
2. 테스트 가능하면 테스트 작성
3. 작은 단위로 리팩토링
4. 각 단계마다 동작 확인

## 리팩토링 패턴

### 컴포넌트 분리
**Before**
```tsx
function BigComponent() {
  // 200줄의 코드...
}
```

**After**
```tsx
function BigComponent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
```

### 커스텀 훅 추출
**Before**
```tsx
function Component() {
  const [data, setData] = useState();
  useEffect(() => { /* 복잡한 로직 */ }, []);
  // ...
}
```

**After**
```tsx
function useComplexLogic() {
  const [data, setData] = useState();
  useEffect(() => { /* 복잡한 로직 */ }, []);
  return { data };
}

function Component() {
  const { data } = useComplexLogic();
}
```

### 타입 통합
**Before**
```typescript
// 여러 파일에 중복된 타입
type Session = { id: string; title: string; }
```

**After**
```typescript
// packages/shared/src/index.ts
export type Session = { id: string; title: string; }
```

### 서비스 레이어 분리
**Before**
```typescript
router.get('/', async (req, res) => {
  // 복잡한 비즈니스 로직이 라우트에...
});
```

**After**
```typescript
// services/feature.service.ts
export async function getFeatures() { /* 로직 */ }

// routes/feature.ts
router.get('/', async (req, res) => {
  const result = await getFeatures();
  res.json(result);
});
```

## 프로젝트별 리팩토링 포인트

### apps/web
- 큰 컴포넌트 → 작은 컴포넌트로 분리
- 반복 로직 → 커스텀 훅으로 추출
- 인라인 스타일 → Tailwind 클래스

### apps/server
- 라우트 내 로직 → 서비스로 분리
- 중복 검증 → 미들웨어로 추출
- 하드코딩 → 상수/환경변수로

### packages/shared
- 중복 타입 → 통합
- 유틸 함수 공유
