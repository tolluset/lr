---
name: code-review
description: "코드 리뷰 수행. '코드 리뷰', '리뷰해줘', 'PR 검토', '코드 검토' 요청 시 사용"
allowed-tools: Read, Grep, Glob, Task
---

# Code Review Skill

## 역할

코드 변경사항을 검토하고 개선점을 제안하는 코드 리뷰어

## 리뷰 체크리스트

### 1. 코드 품질
- [ ] 타입 안전성 확인 (any 사용 지양)
- [ ] 에러 핸들링 적절성
- [ ] 코드 중복 여부
- [ ] 함수/컴포넌트 크기 적절성

### 2. 프로젝트 컨벤션
- [ ] 파일 명명 규칙 준수 (PascalCase 컴포넌트, camelCase 훅)
- [ ] 디렉토리 구조 준수
- [ ] 공유 타입은 packages/shared 사용

### 3. React 특화 (apps/web)
- [ ] 불필요한 리렌더링 방지
- [ ] 훅 의존성 배열 정확성
- [ ] 컴포넌트 분리 적절성

### 4. API 특화 (apps/server)
- [ ] RESTful 규칙 준수
- [ ] 입력 검증
- [ ] 에러 응답 일관성

### 5. 보안
- [ ] SQL Injection 방지 (Drizzle 파라미터 바인딩)
- [ ] XSS 방지
- [ ] 민감 정보 노출 없음

## 리뷰 출력 형식

```markdown
## 리뷰 요약
[전체적인 코드 품질 평가]

## 주요 발견사항
### Critical
- [심각한 문제]

### Warning
- [개선 필요 사항]

### Suggestion
- [권장 사항]

## 파일별 상세
### `파일경로:라인번호`
[구체적 피드백]
```
