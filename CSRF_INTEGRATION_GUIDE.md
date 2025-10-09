# CSRF Protection Integration Guide

This guide explains how CSRF protection is now integrated into your school management system and how to use it in your frontend components.

## What Changed

### Backend (API Routes)
All state-changing API routes (POST, PUT, DELETE, PATCH) are now protected with CSRF tokens using the `withCSRF` middleware wrapper:

**Protected Routes:**
- `/api/grades` - POST, PUT, DELETE
- `/api/attendance` - POST, PUT, DELETE  
- `/api/exams` - POST
- `/api/exams/[id]` - DELETE
- `/api/exams/[id]/archive` - PATCH
- `/api/homework-grading` - POST
- `/api/teacher-homework` - POST, DELETE
- `/api/upload` - POST
- `/api/upload-attachments` - POST
- `/api/messages` - POST
- `/api/announcements` - POST

### Frontend Utilities

We've added three new utilities for easy CSRF integration:

#### 1. `useCsrfToken` Hook
For React components that need manual control over CSRF tokens:

```tsx
import { useCsrfToken } from '@/hooks/useCsrfToken';

function MyComponent() {
  const { token, loading, error, refreshToken } = useCsrfToken();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  const handleSubmit = async () => {
    await fetch('/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token, // Include CSRF token
      },
      body: JSON.stringify(data)
    });
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

#### 2. `csrfFetch` Function
Drop-in replacement for `fetch` that automatically handles CSRF:

```tsx
import { csrfFetch } from '@/hooks/useCsrfToken';

// Automatically includes CSRF token for POST/PUT/DELETE/PATCH
const response = await csrfFetch('/api/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

#### 3. `apiClient` Class
High-level API client with built-in CSRF protection:

```tsx
import { apiClient } from '@/lib/api-client';

// POST (with CSRF)
const result = await apiClient.post('/api/grades', {
  studentId: '123',
  value: 95
});

// GET (no CSRF needed)
const data = await apiClient.get('/api/grades');

// DELETE (with CSRF)
await apiClient.delete('/api/grades', { id: '456' });

// File upload (with CSRF)
const formData = new FormData();
formData.append('file', file);
await apiClient.upload('/api/upload', formData);
```

## How to Update Existing Components

### Quick Migration (Recommended)

Replace `fetch` calls with `csrfFetch`:

**Before:**
```tsx
const response = await fetch('/api/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**After:**
```tsx
import { csrfFetch } from '@/hooks/useCsrfToken';

const response = await csrfFetch('/api/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Using API Client (Alternative)

**Before:**
```tsx
const response = await fetch('/api/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId, value: 95 })
});
const data = await response.json();
```

**After:**
```tsx
import { apiClient } from '@/lib/api-client';

const result = await apiClient.post('/api/grades', {
  studentId,
  value: 95
});

if (result.success) {
  console.log('Grade saved:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Components Already Updated

The following critical components have been updated to use `csrfFetch`:

- `GradeInputForm.tsx` - Grade submissions
- `AttendanceForm.tsx` - Attendance recording

## Components to Update

You should update the following components to use CSRF protection:

### High Priority
- `TeacherHomeworkCreationForm.tsx` - Homework creation
- `forms/ExamForm.tsx` - Exam scheduling
- `forms/AnnouncementForm.tsx` - Announcements
- `forms/AdminMessageForm.tsx` - Messages

### Medium Priority
- `forms/StudentForm.tsx` - Student management
- `forms/TeacherForm.tsx` - Teacher management
- `forms/ClassForm.tsx` - Class management
- `forms/SubjectForm.tsx` - Subject management

### Search for Patterns

To find components that need updating, search for:

```bash
# Find fetch calls to protected routes
grep -r "fetch.*api.*(POST|PUT|DELETE|PATCH)" src/components/

# Find fetch calls to specific protected endpoints
grep -r "fetch.*api/(grades|attendance|homework)" src/components/
```

## File Upload Components

For file uploads with FormData, use the `apiClient.upload()` method:

```tsx
import { apiClient } from '@/lib/api-client';

const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const result = await apiClient.upload('/api/upload', formData);
  
  if (result.success) {
    console.log('Upload successful:', result.data);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

## Testing CSRF Protection

1. **Test Normal Operation:**
   - Submit forms in protected routes
   - Verify they work as before

2. **Test CSRF Rejection:**
   - Open browser console
   - Try making a request without CSRF token:
   ```javascript
   fetch('/api/grades', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   });
   ```
   - Should receive 403 Forbidden error

3. **Test Token Refresh:**
   - Leave page open for extended period
   - Submit a form
   - Should automatically fetch new token if needed

## Troubleshooting

### "CSRF token missing or invalid" Error

**Cause:** Request is missing CSRF token or token is expired.

**Solution:**
- Ensure you're using `csrfFetch` or `apiClient` for protected routes
- Check that `/api/auth/csrf-token` endpoint is accessible
- Verify cookies are enabled in browser

### CSRF Token Not Being Set

**Cause:** Cookie not being set by server.

**Solution:**
- Check that `CSRF` service is properly configured
- Verify Redis is running (if using distributed storage)
- Check browser console for cookie warnings

### Upload Routes Failing

**Cause:** FormData may not include CSRF token.

**Solution:**
- Use `apiClient.upload()` method which handles CSRF automatically
- Or manually add CSRF token to FormData:
```tsx
import { getCsrfToken } from '@/hooks/useCsrfToken';

const token = await getCsrfToken();
formData.append('_csrf', token);
```

## Production Deployment

1. **Set Environment Variables:**
   ```bash
   # Required for CSRF (already in your .env)
   JWT_SECRET=your-secret-key
   REFRESH_TOKEN_SECRET=your-refresh-secret
   REDIS_URL=your-redis-url  # For distributed storage
   ```

2. **Verify CSRF Endpoint:**
   - Ensure `/api/auth/csrf-token` is accessible
   - Test it returns a valid token

3. **Monitor Security Logs:**
   - Check `SecurityLog` table for CSRF violations
   - Set up alerts for suspicious activity

## Benefits

✅ **Protection Against CSRF Attacks** - Malicious sites cannot forge requests to your API  
✅ **Automatic Token Management** - Frontend utilities handle token lifecycle  
✅ **No User Impact** - Works transparently with existing workflows  
✅ **Audit Trail** - CSRF failures are logged for security monitoring  
✅ **Distributed Support** - Works with Redis for multi-instance deployments

## Next Steps

1. Update remaining components to use `csrfFetch` or `apiClient`
2. Test thoroughly in staging environment
3. Monitor CSRF logs after deployment
4. Consider adding CSRF to additional admin-only routes if needed

