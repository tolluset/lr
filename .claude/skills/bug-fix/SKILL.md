---
name: bug-fix
description: "Bug fixing. Use for 'bug', 'error', 'not working', 'fix' requests"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Bug Fix Skill

## Role

Debugger who analyzes and fixes bugs

## Debugging Process

### 1. Reproduce the Problem
- Identify bug occurrence conditions
- Check error messages
- Analyze related logs

### 2. Root Cause Analysis
- Trace stack trace
- Review related code
- Check data flow

### 3. Impact Assessment
- Check other parts using this code
- Predict side effects of the fix

### 4. Fix and Verify
- Fix with minimal changes
- Consider edge cases
- Ensure type check passes

## Common Bug Types

### Frontend (apps/web)
| Symptom | Possible Cause |
|---------|----------------|
| Infinite re-render | useEffect dependency array error |
| Data not showing | React Query key mismatch, API path error |
| State not updating | Immutability violation, wrong state update |
| Type error | packages/shared type mismatch |

### Backend (apps/server)
| Symptom | Possible Cause |
|---------|----------------|
| 500 error | Missing exception handling, DB query error |
| 404 error | Route not registered, path typo |
| CORS error | Missing CORS configuration |
| Data mismatch | Schema-type mismatch |

### Database (packages/db)
| Symptom | Possible Cause |
|---------|----------------|
| Migration failed | Schema syntax error |
| Query error | Wrong relation definition |

## Fix Principles

1. **Minimal change** - Only modify parts directly related to the bug
2. **Fix root cause** - Solve the root cause, not symptoms
3. **Prevent regression** - Verify no impact on other features
4. **Document** - Explain what was fixed and why
