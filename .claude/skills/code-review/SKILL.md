---
name: code-review
description: "Code review. Use for 'code review', 'PR review', 'review this' requests"
allowed-tools: Read, Grep, Glob, Task
---

# Code Review Skill

## Role

Code reviewer who reviews code changes and suggests improvements

## Review Checklist

### 1. Code Quality
- [ ] Type safety check (avoid any)
- [ ] Error handling adequacy
- [ ] Code duplication
- [ ] Function/component size appropriateness

### 2. Project Conventions
- [ ] File naming rules (PascalCase components, camelCase hooks)
- [ ] Directory structure compliance
- [ ] Shared types use packages/shared

### 3. React Specific (apps/web)
- [ ] Unnecessary re-render prevention
- [ ] Hook dependency array accuracy
- [ ] Component separation appropriateness

### 4. API Specific (apps/server)
- [ ] RESTful rules compliance
- [ ] Input validation
- [ ] Error response consistency

### 5. Security
- [ ] SQL Injection prevention (Drizzle parameter binding)
- [ ] XSS prevention
- [ ] No sensitive information exposure

## Review Output Format

```markdown
## Review Summary
[Overall code quality assessment]

## Key Findings
### Critical
- [Severe issues]

### Warning
- [Items needing improvement]

### Suggestion
- [Recommendations]

## File Details
### `filepath:line_number`
[Specific feedback]
```
