# HR System Implementation

## Overview

The HR System provides two distinct panels for human resources management:

1. **Main HR Panel** - Multi-branch HR management with full access
2. **Support HR Panel** - Branch-limited HR management with restricted access

## Features Implemented

### 🎯 Main HR Panel (`/main-hr`)
- **Access Level**: Full multi-branch access
- **Capabilities**:
  - Dashboard with statistics across all branches
  - Teachers management (all branches)
  - Users management (all branches)
  - Announcements (can send to any branch)
  - Events (can create for any branch)
  - Messages (can send to any branch)
  - Profile and Settings management

### 🏢 Support HR Panel (`/support-hr`)
- **Access Level**: Single branch limited access
- **Capabilities**:
  - Dashboard with statistics for assigned branch only
  - Teachers management (own branch only)
  - Users management (own branch only)
  - Announcements (own branch only)
  - Events (own branch only)
  - Messages (own branch only)
  - Profile and Settings management

## Authentication & Authorization

### User Roles
- `main_hr`: Full multi-branch HR access
- `support_hr`: Branch-limited HR access

### Login Flow
1. Users login with phone number + password
2. System detects role from User table position field
3. Redirects to appropriate panel:
   - Main HR → `/main-hr`
   - Support HR → `/support-hr`

### RBAC (Role-Based Access Control)
- **Backend APIs** enforce branch filtering
- **Main HR**: No branch restrictions
- **Support HR**: Automatic filtering by `branchId`
- **UI Components**: Different branch selector visibility

## Database Structure

### User Table Updates
```sql
-- HR positions in UserPosition enum
MAIN_HR
SUPPORT_HR
```

### Key Relationships
- **Main HR**: `branchId` can be `null` (multi-branch access)
- **Support HR**: `branchId` must be set (single branch access)

## API Endpoints

### Main HR APIs
- `GET /api/main-hr/dashboard` - Multi-branch statistics
- `GET /api/main-hr/teachers` - All teachers across branches
- `GET /api/main-hr/users` - All users across branches
- `POST /api/main-hr/teachers` - Create teacher (any branch)
- `POST /api/main-hr/users` - Create user (any branch)

### Support HR APIs
- `GET /api/support-hr/dashboard` - Single branch statistics
- `GET /api/support-hr/teachers` - Teachers in assigned branch only
- `GET /api/support-hr/users` - Users in assigned branch only
- `POST /api/support-hr/teachers` - Create teacher (own branch only)
- `POST /api/support-hr/users` - Create user (own branch only)

## Security Features

### Backend Enforcement
```typescript
// Example RBAC enforcement
const userRole = request.headers.get("x-user-role");
const branchId = request.headers.get("x-branch-id");

if (userRole === "support_hr") {
  // Enforce branch filtering
  whereClause.branchId = parseInt(branchId);
}
```

### Frontend Protection
- Route-based access control via middleware
- Role-specific menu items
- Branch selector visibility control
- API request filtering

## User Management

### HR User Creation
```javascript
// Main HR - can assign any branch
position: 'MAIN_HR',
branchId: null // or specific branch

// Support HR - limited to assigned branch  
position: 'SUPPORT_HR',
branchId: specificBranchId
```

### Seeded Users
The system includes pre-seeded HR users for testing:

```
Main HR:
  📞 Phone: +998901234590
  🔑 Password: hr123456
  🌐 Access: All branches

Support HR:
  📞 Phone: +998901234591
  🔑 Password: hr123456
  🏢 Branch: Main Campus

Support HR (Branch 2):
  📞 Phone: +998901234592
  🔑 Password: hr123456
  🏢 Branch: SB
```

## UI/UX Features

### Visual Distinction
- **Main HR Panel**: Blue theme, "Main HR Panel" branding
- **Support HR Panel**: Orange theme, "Support HR Panel" branding

### Loading States
- Skeleton loaders for all data fetching
- Loading animations during CRUD operations
- Progress indicators for form submissions

### Branch Management
- **Main HR**: Branch dropdown selector in forms
- **Support HR**: Branch field auto-locked to assigned branch
- Branch-specific filtering and statistics

### Responsive Design
- Mobile-first responsive layout
- Collapsible sidebar navigation
- Touch-friendly interface elements

## Performance Optimizations

### Caching Strategy
- API responses cached for dashboard statistics
- Pagination for large data sets
- Lazy loading for heavy components

### Database Optimization
- Indexed queries for branch filtering
- Efficient joins for related data
- Pagination with proper LIMIT/OFFSET

## Error Handling

### Backend Validation
- Role verification on all endpoints
- Branch permission checks
- Input sanitization and validation

### Frontend Error Management
- Toast notifications for errors
- Form validation with user feedback
- Graceful error boundaries

## File Structure

```
src/
├── app/
│   ├── (main-hr)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── main-hr/
│   │       ├── page.tsx (dashboard)
│   │       ├── teachers/page.tsx
│   │       ├── users/page.tsx
│   │       ├── announcements/page.tsx
│   │       ├── events/page.tsx
│   │       ├── messages/page.tsx
│   │       ├── profile/page.tsx
│   │       └── settings/page.tsx
│   ├── (support-hr)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── support-hr/
│   │       ├── page.tsx (dashboard)
│   │       ├── teachers/page.tsx
│   │       ├── users/page.tsx
│   │       ├── announcements/page.tsx
│   │       ├── events/page.tsx
│   │       ├── messages/page.tsx
│   │       ├── profile/page.tsx
│   │       └── settings/page.tsx
│   └── api/
│       ├── main-hr/
│       │   ├── dashboard/route.ts
│       │   ├── teachers/route.ts
│       │   └── users/route.ts
│       └── support-hr/
│           ├── dashboard/route.ts
│           ├── teachers/route.ts
│           └── users/route.ts
```

## Testing

### Test HR Users
Run the seeding script to create test users:
```bash
node prisma/seed-hr-users.js
```

### Login Testing
1. Login as Main HR: `+998901234590` / `hr123456`
2. Login as Support HR: `+998901234591` / `hr123456`
3. Verify role-based redirects and permissions

## Future Enhancements

### Planned Features
- [ ] Advanced filtering and search
- [ ] Export functionality (Excel, PDF)
- [ ] Bulk operations for user management
- [ ] Audit logs for HR actions
- [ ] Email notifications
- [ ] Advanced reporting dashboard
- [ ] Integration with payroll systems

### Performance Improvements
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] CDN for static assets
- [ ] API rate limiting

## Troubleshooting

### Common Issues

1. **Role Redirect Issues**
   - Check middleware configuration
   - Verify JWT token contains correct role
   - Ensure role mapping in `roleRoutes`

2. **Branch Access Problems**
   - Verify user `branchId` assignment
   - Check API RBAC enforcement
   - Confirm middleware headers

3. **Menu Items Not Showing**
   - Check `Menu.tsx` role visibility
   - Verify `userRole` prop passing
   - Confirm role detection logic

### Debug Commands
```bash
# Check user roles in database
npx prisma studio

# View JWT token contents
# Use browser dev tools → Application → Cookies → auth_token

# Test API endpoints
curl -H "x-user-role: main_hr" /api/main-hr/dashboard
```

## Support

For technical support or questions about the HR system implementation, please contact the development team or refer to the main project documentation.
