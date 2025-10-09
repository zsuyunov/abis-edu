# CSRF Protection Implementation Guide

## 🎯 Goal
Protect all 138 API routes from Cross-Site Request Forgery (CSRF) attacks by implementing token-based verification on all state-changing operations (POST, PUT, DELETE, PATCH).

---

## ✅ What's Already Done

1. **CSRF Token Service** (`src/lib/security/csrf.ts`)
   - Redis-backed token storage
   - Constant-time comparison
   - 1-hour token expiry

2. **CSRF Middleware** (`src/lib/security/csrf-middleware.ts`)
   - `withCSRF()` - Enforces CSRF validation
   - `withCSRFLogging()` - Logs failures but doesn't block (for gradual rollout)
   - `validateCSRF()` - Manual validation helper

3. **CSRF Token Endpoint** (`/api/auth/csrf-token`)
   - GET endpoint to fetch CSRF token for current session
   - Returns token + usage instructions

4. **Monitoring** (`src/lib/security/monitoring.ts`)
   - Detects CSRF attack patterns
   - Alerts on suspicious activity

---

## 📝 How to Apply CSRF Protection

### Option 1: Using Middleware (Recommended)

**Before:**
```typescript
// src/app/api/grades/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... route logic
  return NextResponse.json({ success: true });
}
```

**After:**
```typescript
// src/app/api/grades/route.ts
import { withCSRF } from '@/lib/security';

export const POST = withCSRF(async (request: NextRequest) => {
  const body = await request.json();
  // ... route logic
  return NextResponse.json({ success: true });
});
```

That's it! The middleware automatically:
- Extracts session ID from auth token
- Validates CSRF token from header or query param
- Returns 403 if invalid
- Proceeds to your handler if valid

### Option 2: Manual Validation

```typescript
import { validateCSRF } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Manual CSRF check
  const isValid = await validateCSRF(request);
  if (!isValid) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    );
  }
  
  // ... rest of route logic
}
```

### Option 3: Gradual Rollout (Logging Only)

```typescript
import { withCSRFLogging } from '@/lib/security';

// Logs CSRF failures but doesn't block requests
export const POST = withCSRFLogging(async (request: NextRequest) => {
  // ... route logic
});
```

---

## 🎯 Routes That NEED CSRF Protection

### Priority 1: Critical (Apply Immediately)

| Route | Method | Reason |
|-------|--------|--------|
| `/api/grades/route.ts` | POST, PUT, DELETE | Student grade modification |
| `/api/attendance/route.ts` | POST, PUT, DELETE | Attendance records |
| `/api/exams/**/route.ts` | POST, PUT, DELETE, PATCH | Exam management |
| `/api/teachers/route.ts` | POST, PUT, DELETE | Teacher data |
| `/api/students/route.ts` | POST, PUT, DELETE | Student data |
| `/api/admin/*/route.ts` | POST, PUT, DELETE, PATCH | Admin operations |
| `/api/homework-grading/route.ts` | POST, PUT | Grade submissions |
| `/api/teacher-homework/grade/route.ts` | POST, PUT | Homework grading |

### Priority 2: Important (Apply Soon)

| Route | Method | Reason |
|-------|--------|--------|
| `/api/messages/route.ts` | POST, DELETE | Messaging |
| `/api/announcements/route.ts` | POST, PUT, DELETE | Announcements |
| `/api/events/route.ts` | POST, PUT, DELETE | Events |
| `/api/complaints/route.ts` | POST, PUT | Complaints |
| `/api/documents/route.ts` | POST, DELETE | Document management |
| `/api/upload/route.ts` | POST | File uploads |

### Priority 3: Low Risk (Apply When Possible)

| Route | Method | Reason |
|-------|--------|--------|
| `/api/*/export/route.ts` | GET/POST | Export operations |
| `/api/*/analytics/route.ts` | GET | Read-only analytics |
| `/api/student/profile/update/route.ts` | PUT | Profile updates |
| `/api/teacher/profile/update/route.ts` | PUT | Profile updates |

### Routes That DON'T Need CSRF

| Route | Method | Reason |
|-------|--------|--------|
| `/api/auth/login` | POST | Already rate-limited, uses credentials |
| `/api/auth/logout` | POST | Already has token validation |
| `/api/auth/refresh` | POST | Uses refresh token (separate protection) |
| `/api/auth/csrf-token` | GET | Returns CSRF token itself |
| All GET-only routes | GET | Read-only, safe methods |

---

## 🔧 Frontend Integration

### Step 1: Fetch CSRF Token on App Load

```typescript
// In your Next.js layout or app initialization
useEffect(() => {
  async function fetchCSRFToken() {
    const response = await fetch('/api/auth/csrf-token');
    const data = await response.json();
    
    // Store in memory or context (NOT localStorage - security risk)
    setCSRFToken(data.token);
  }
  
  if (isAuthenticated) {
    fetchCSRFToken();
  }
}, [isAuthenticated]);
```

### Step 2: Include Token in Requests

**Option A: Header (Recommended)**
```typescript
await fetch('/api/grades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken, // ← Add this
  },
  body: JSON.stringify(gradeData),
});
```

**Option B: Query Parameter (For forms)**
```typescript
const url = `/api/grades?csrf_token=${csrfToken}`;
await fetch(url, {
  method: 'POST',
  body: formData,
});
```

### Step 3: Handle CSRF Errors

```typescript
const response = await fetch('/api/grades', {
  method: 'POST',
  headers: {
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify(data),
});

if (response.status === 403) {
  const error = await response.json();
  if (error.code === 'CSRF_INVALID') {
    // CSRF token expired - refresh it
    await fetchCSRFToken();
    // Retry the request
  }
}
```

---

## 🧪 Testing CSRF Protection

### Test 1: Valid Token
```bash
# 1. Get CSRF token
curl -c cookies.txt http://localhost:3000/api/auth/login \
  -d '{"phone":"+998901234567","password":"test123"}' \
  -H "Content-Type: application/json"

curl -b cookies.txt http://localhost:3000/api/auth/csrf-token

# 2. Use token in request (should succeed)
curl -b cookies.txt http://localhost:3000/api/grades \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_TOKEN_HERE" \
  -d '{"studentId":"1","value":95}'
```

### Test 2: Missing Token
```bash
# Should return 403
curl -b cookies.txt http://localhost:3000/api/grades \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"studentId":"1","value":95}'
```

### Test 3: Invalid Token
```bash
# Should return 403
curl -b cookies.txt http://localhost:3000/api/grades \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: invalid_token_123" \
  -d '{"studentId":"1","value":95}'
```

---

## 📋 Implementation Checklist

### Phase 1: Infrastructure (✅ DONE)
- [x] CSRF token service with Redis backend
- [x] CSRF middleware helper
- [x] CSRF token generation endpoint
- [x] Security monitoring for CSRF attacks

### Phase 2: Apply to Critical Routes (🔄 IN PROGRESS)
- [ ] Apply `withCSRF()` to `/api/grades/*`
- [ ] Apply `withCSRF()` to `/api/attendance/*`
- [ ] Apply `withCSRF()` to `/api/exams/*`
- [ ] Apply `withCSRF()` to `/api/homework-grading/*`
- [ ] Apply `withCSRF()` to `/api/teachers/*`
- [ ] Apply `withCSRF()` to `/api/students/*`
- [ ] Apply `withCSRF()` to `/api/admin/*`

### Phase 3: Frontend Integration
- [ ] Add CSRF token fetch on app load
- [ ] Update all POST/PUT/DELETE fetch calls to include token
- [ ] Add error handling for CSRF failures
- [ ] Test all forms and data mutations

### Phase 4: Gradual Rollout
1. **Week 1**: Apply to Priority 1 routes with logging only (`withCSRFLogging`)
2. **Week 2**: Monitor logs, fix false positives
3. **Week 3**: Enable enforcement (`withCSRF`) on Priority 1
4. **Week 4**: Repeat for Priority 2 and 3

---

## ⚡ Quick Start (Apply to Your First Route)

1. **Pick a route** (e.g., `src/app/api/grades/route.ts`)

2. **Add import:**
   ```typescript
   import { withCSRF } from '@/lib/security';
   ```

3. **Wrap POST handler:**
   ```typescript
   export const POST = withCSRF(async (request: NextRequest) => {
     // existing code unchanged
   });
   ```

4. **Test it:**
   ```bash
   # Get token
   curl http://localhost:3000/api/auth/csrf-token -b cookies.txt
   
   # Use token
   curl http://localhost:3000/api/grades -X POST \
     -H "x-csrf-token: TOKEN" -b cookies.txt
   ```

5. **Repeat for other methods:**
   ```typescript
   export const PUT = withCSRF(async (request: NextRequest) => { ... });
   export const DELETE = withCSRF(async (request: NextRequest) => { ... });
   ```

---

## 🚨 Common Issues & Solutions

### Issue: "CSRF check skipped: No session ID found"
**Cause**: Route accessed without authentication  
**Solution**: Ensure user is logged in, or use `withCSRFLogging()` for public endpoints

### Issue: "CSRF validation failed"
**Cause**: Token expired or missing  
**Solution**: Refresh CSRF token on frontend, retry request

### Issue: Token works sometimes, fails other times
**Cause**: Multiple server instances with in-memory storage  
**Solution**: Ensure Redis is configured (already done in your setup)

### Issue: All POST requests fail after implementing CSRF
**Cause**: Frontend not sending tokens  
**Solution**: Update frontend to fetch and include CSRF tokens

---

## 📊 Monitoring CSRF Protection

### Check Security Logs
```sql
SELECT * FROM "SecurityLog" 
WHERE "details" LIKE '%CSRF%' 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Monitor CSRF Failures
```typescript
// In your admin dashboard
const csrfFailures = await prisma.securityLog.count({
  where: {
    details: { contains: 'CSRF validation failed' },
    createdAt: { gte: last24Hours },
  },
});
```

### Alert on CSRF Attack Patterns
The monitoring system automatically detects:
- Multiple CSRF failures from same IP
- Spike in CSRF failures (possible attack)
- CSRF failures on sensitive endpoints

---

## ✅ Success Criteria

Your CSRF implementation is complete when:
1. ✅ All state-changing routes use `withCSRF()` or manual validation
2. ✅ Frontend fetches CSRF token on login
3. ✅ Frontend includes token in all POST/PUT/DELETE requests
4. ✅ Tests pass for valid/invalid/missing tokens
5. ✅ Monitoring shows < 1% CSRF failures (legitimate users)
6. ✅ No security alerts for CSRF attack patterns

---

## 📚 Additional Resources

- [OWASP CSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double-Submit Cookie Pattern](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token)
- Your implementation: `src/lib/security/csrf.ts`
- Middleware: `src/lib/security/csrf-middleware.ts`

---

*Questions? Check the troubleshooting section or review the security monitoring logs.*

