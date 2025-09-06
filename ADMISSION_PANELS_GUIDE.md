# Admission Panels Implementation Guide

## Overview

This implementation adds two new user roles and panels to the school management system:

1. **Main Admission Panel** - Full multi-branch admission management
2. **Support Admission Panel** - Branch-limited admission management

## User Roles

### Main Admission (`MAIN_ADMISSION`)
- Can manage Students and Parents across **ALL branches**
- Has branch selection dropdown when creating/editing
- Full CRUD operations for all branches
- Dashboard shows system-wide statistics

### Support Admission (`SUPPORT_ADMISSION`)
- Can manage Students and Parents only in their **assigned branch**
- Branch field is auto-locked to their assigned branch
- Full CRUD operations but scoped to assigned branch only
- Dashboard shows branch-specific statistics

## Panel Features

Both panels include the following sections:
- **Dashboard** - Analytics and statistics
- **Students** - Student management with CRUD operations
- **Parents** - Parent management with CRUD operations
- **Announcements** - Create and manage announcements
- **Events** - Create and manage events
- **Messages** - Send and manage messages
- **Profile** - User profile management
- **Settings** - Panel configuration

## Security Implementation

### Authentication & Authorization
- Added `main_admission` and `support_admission` roles to auth system
- Updated middleware to handle new role routing
- Proper JWT token validation with role checking

### Branch Restrictions (Support Admission)
- **Backend Enforcement**: All API endpoints check user's assigned branch
- **Frontend Restrictions**: Branch dropdowns hidden/locked for Support Admission
- **Database Filtering**: WHERE clauses always include branchId for Support Admission
- **CRUD Validation**: Prevents creating/editing records for other branches

## API Endpoints

### Main Admission APIs
- `/api/main-admission/dashboard` - Multi-branch dashboard statistics
- `/api/main-admission/students` - All-branch student management
- `/api/main-admission/parents` - All-branch parent management
- `/api/main-admission/events` - All-branch event management
- `/api/main-admission/messages` - All-branch message management
- `/api/main-admission/profile` - User profile management
- `/api/main-admission/settings` - User settings management

### Support Admission APIs
- `/api/support-admission/dashboard` - Branch-specific dashboard statistics
- `/api/support-admission/students` - Branch-limited student management
- `/api/support-admission/parents` - Branch-limited parent management
- `/api/support-admission/events` - Branch-limited event management
- `/api/support-admission/messages` - Branch-limited message management
- `/api/support-admission/profile` - User profile management
- `/api/support-admission/branch-info` - Get assigned branch information

## User Creation

Create admission users through the Admin Panel → Users section:

1. Navigate to Admin Panel → Users
2. Click "Create User"
3. Fill in user details
4. Set position to either `MAIN_ADMISSION` or `SUPPORT_ADMISSION`
5. For Support Admission: **Must assign a branch** in the branchId field
6. Set phone number and password for login

## Login Process

1. Users login with phone number + password
2. System checks user role from database
3. Automatic redirect based on role:
   - `MAIN_ADMISSION` → `/main-admission`
   - `SUPPORT_ADMISSION` → `/support-admission`

## UI/UX Features

### Visual Distinction
- **Main Admission**: Green/Emerald color scheme
- **Support Admission**: Purple/Indigo color scheme
- Clear panel labeling and role identification

### Performance Features
- Lazy loading for charts and data
- Pagination for large datasets
- Loading animations and states
- Error handling with user-friendly messages

### Modern Analytics
- Dashboard charts for enrollment trends
- Student demographics visualization
- Parent distribution analytics
- Real-time statistics

## Branch Enforcement Examples

### Main Admission (No Restrictions)
```javascript
// Can create students for ANY branch
const student = await prisma.student.create({
  data: {
    // ... student data
    branchId: anyBranchId  // ✅ Allowed
  }
});
```

### Support Admission (Branch Restricted)
```javascript
// Can only create students for assigned branch
const student = await prisma.student.create({
  data: {
    // ... student data
    branchId: assignedBranchId  // ✅ Only assigned branch allowed
  }
});

// Attempting other branch throws error
if (branchId !== assignedBranchId) {
  throw new Error("Unauthorized - Cannot create for other branches");
}
```

## File Structure

```
src/
├── app/
│   ├── (main-admission)/           # Main Admission Panel routes
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard
│   │   ├── students/page.tsx
│   │   ├── parents/page.tsx
│   │   ├── events/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   ├── (support-admission)/        # Support Admission Panel routes  
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard
│   │   ├── students/page.tsx
│   │   ├── parents/page.tsx
│   │   ├── events/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── main-admission/         # Main Admission APIs
│       └── support-admission/      # Support Admission APIs
├── components/
│   ├── MainAdmissionMenu.tsx       # Main Admission sidebar menu
│   ├── SupportAdmissionMenu.tsx    # Support Admission sidebar menu
│   ├── dashboard/                  # Dashboard components
│   │   ├── MainAdmissionDashboard.tsx
│   │   └── SupportAdmissionDashboard.tsx
│   └── admission/                  # Admission management components
│       ├── MainAdmissionStudents.tsx
│       ├── SupportAdmissionStudents.tsx
│       ├── MainAdmissionParents.tsx
│       ├── SupportAdmissionParents.tsx
│       ├── MainAdmissionEvents.tsx
│       ├── SupportAdmissionEvents.tsx
│       ├── MainAdmissionMessages.tsx
│       ├── MainAdmissionProfile.tsx
│       ├── MainAdmissionSettings.tsx
│       └── SupportAdmissionProfile.tsx
```

## Security Checklist

- ✅ Role-based authentication implemented
- ✅ Middleware routing protection
- ✅ API endpoint authorization
- ✅ Branch restriction enforcement
- ✅ Frontend UI restrictions
- ✅ Database query filtering
- ✅ CRUD operation validation
- ✅ JWT token verification

## New Features Implemented

### Events Management
- **Main Admission**: Can create/manage events across all branches
- **Support Admission**: Can only create/manage events for assigned branch
- Features: Event creation, editing, status management, deletion
- Filters: Branch, status, date range

### Messages Management
- **Main Admission**: Can send messages to users across all branches
- **Support Admission**: Can only send messages within assigned branch
- Features: Message composition, recipient selection, priority levels
- Status tracking: Sent, Delivered, Read

### Profile Management
- **Both Panels**: Personal information editing, password changes
- **Main Admission**: Multi-branch profile visibility
- **Support Admission**: Branch-specific profile information
- Features: Edit personal details, change password, view account info

### Settings Management
- **Both Panels**: Comprehensive user preferences
- Categories: Notifications, Privacy, Preferences, Security
- Features: Toggle switches, dropdown selections, reset to defaults
- Persistent storage with database backup

## Next Steps

1. Test user creation and login flow
2. Verify branch restrictions work correctly
3. Test all CRUD operations for each section
4. Implement export/report features with branch scope
5. Add audit logging for admission activities
6. Add real-time notifications for new admissions
7. Implement advanced analytics and reporting

## Troubleshooting

### Common Issues

1. **"No branch assigned to user"** - Ensure Support Admission users have branchId set
2. **"Unauthorized" errors** - Check user role and branch assignment
3. **Missing menu items** - Verify role-based menu rendering
4. **API failures** - Check network requests and authentication headers
5. **Settings not saving** - Verify database schema for userSettings table

### Debug Mode

Enable debug logging by checking:
- Browser console for frontend errors
- Server logs for API endpoint errors
- Database query logs for data filtering issues
- Network tab for API request/response details

## Performance Considerations

- Pagination implemented for all list views
- Lazy loading for dashboard components
- Optimized database queries with proper indexing
- Caching for frequently accessed data
- Efficient state management with React hooks

## Security Best Practices

- All API endpoints validate user role and permissions
- Branch restrictions enforced at database level
- Input validation and sanitization
- Proper error handling without information leakage
- Session management with configurable timeouts
