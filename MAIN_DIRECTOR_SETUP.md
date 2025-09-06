# Main Director Panel Setup Guide

## Overview

The Main Director Panel provides comprehensive oversight of all school operations with read-only access to most features and full CRUD permissions for Events, Announcements, and Messages.

## Features

### ✅ Implemented Features

#### 1. **User Management & Authentication**
- Main Directors are created in the Users section of Admin Panel
- Login using phone number + password
- Automatic redirect to Main Director Panel upon login
- Role-based access control (RBAC)

#### 2. **Panel Structure**
- **Layout**: Based on Admin Panel with purple branding
- **Sidebar**: All Admin sections with read-only indicators
- **Navigation**: Smooth transitions with loading states

#### 3. **Dashboard Sections**

##### Read-Only Access:
- 📊 **Dashboard**: Comprehensive statistics and charts
- 👨‍🏫 **Teachers**: View all teacher information
- 👨‍🎓 **Students**: View all student records  
- 👨‍👩‍👧‍👦 **Parents**: View parent information
- 🏢 **Branches**: View branch details
- 📚 **Subjects**: View subject information
- 🏫 **Classes**: View class details
- 📅 **Academic Years**: View academic year data
- 👥 **Users**: View user accounts
- 📋 **Timetables**: View schedules
- 📝 **Attendance**: View attendance statistics
- 📊 **Gradebook**: View grade analytics
- 📖 **Homework**: View homework overview
- 📝 **Exams**: View exam schedules and results
- 📄 **Documents**: View document library
- 📞 **Complaints**: View complaint reports

##### Full CRUD Access:
- 🎉 **Events**: Create, update, delete events
- 📢 **Announcements**: Create, update, delete announcements  
- 💬 **Messages**: Send, receive, manage messages

#### 4. **UI/UX Features**
- Purple gradient branding for distinction from Admin Panel
- "Read-Only Access" and "Full Access" badges
- "View Only" indicators on action buttons
- Hover effects and smooth transitions
- Responsive design for all screen sizes

#### 5. **Security & Performance**
- RBAC enforcement at middleware level
- API endpoint protection
- Role-based dashboard data fetching
- Optimized loading with suspense boundaries
- Fast navigation with preloading

## Setup Instructions

### 1. Create Main Director User

Run the setup script to create a test Main Director:

```bash
cd full-stack-school
node create-main-director.js
```

This creates a user with:
- **Phone**: +998901234571
- **Password**: 123456
- **Name**: John Director
- **Position**: MAIN_DIRECTOR

### 2. Manual User Creation

Alternatively, create through Admin Panel:
1. Go to Admin Panel → Users → Add User
2. Set Position to "MAIN_DIRECTOR"
3. Fill in required details
4. User can now login and access Main Director Panel

### 3. Login Process

1. Navigate to `/login`
2. Enter Main Director phone number and password
3. System automatically redirects to `/main-director`

## Technical Implementation

### File Structure

```
src/app/(main-director)/
├── layout.tsx                 # Main Director layout with purple branding
├── page.tsx                   # Redirect to main-director dashboard
├── main-director/
│   ├── page.tsx              # Dashboard page
│   └── MainDirectorDashboard.tsx
├── list/
│   ├── teachers/page.tsx     # Read-only teacher list
│   ├── students/page.tsx     # Read-only student list
│   ├── parents/page.tsx      # Read-only parent list
│   ├── subjects/page.tsx     # Read-only subject list
│   ├── classes/page.tsx      # Read-only class list
│   └── announcements/page.tsx # Full CRUD announcements
├── events/page.tsx           # Full CRUD events
├── messages/page.tsx         # Full CRUD messages
├── attendance/page.tsx       # Read-only attendance overview
├── gradebook/page.tsx        # Read-only gradebook overview
├── homework/page.tsx         # Read-only homework overview
└── exams/page.tsx           # Read-only exams overview

src/components/
└── MainDirectorMenu.tsx      # Purple-themed navigation menu

src/app/api/
└── main-director-dashboard/route.ts # Main Director dashboard API
```

### Key Components

#### 1. Authentication Updates
- `src/lib/auth.ts`: Added `main_director` role
- `src/middleware.ts`: Added Main Director route protection
- `src/app/api/auth/login/route.ts`: Added Main Director login logic

#### 2. Navigation & Layout
- `MainDirectorMenu.tsx`: Purple-themed sidebar with all sections
- `layout.tsx`: Main Director layout with branding

#### 3. Dashboard & Analytics
- `MainDirectorDashboard.tsx`: Comprehensive statistics display
- `useDashboard.ts`: Updated to support Main Director API endpoint
- `main-director-dashboard/route.ts`: Dedicated API for Main Director stats

#### 4. Read-Only Components
- All list pages show "Read-Only Access" badges
- Action buttons replaced with "View Only" indicators
- Purple color scheme for consistency

#### 5. Full Access Components
- Events, Announcements, Messages use existing FormContainer
- Full CRUD operations available
- "Full Access" badges for clarity

## Access Control Matrix

| Feature | Admin | Main Director |
|---------|-------|---------------|
| Dashboard | Full | Read-Only |
| Teachers | CRUD | Read-Only |
| Students | CRUD | Read-Only |
| Parents | CRUD | Read-Only |
| Subjects | CRUD | Read-Only |
| Classes | CRUD | Read-Only |
| Branches | CRUD | Read-Only |
| Users | CRUD | Read-Only |
| Timetables | CRUD | Read-Only |
| Attendance | CRUD | Read-Only |
| Gradebook | CRUD | Read-Only |
| Homework | CRUD | Read-Only |
| Exams | CRUD | Read-Only |
| Documents | CRUD | Read-Only |
| Complaints | CRUD | Read-Only |
| **Events** | CRUD | **CRUD** |
| **Announcements** | CRUD | **CRUD** |
| **Messages** | CRUD | **CRUD** |

## API Endpoints

### Main Director Specific
- `GET /api/main-director-dashboard` - Dashboard statistics
- All existing event/announcement/message APIs work with Main Director role

### Role-Based Access
- Middleware checks `x-user-role` header
- API endpoints validate Main Director permissions
- Read-only endpoints return data without modification capabilities

## Testing

### 1. Login Test
```bash
# Use the created test user
Phone: +998901234571
Password: 123456
```

### 2. Navigation Test
- Verify all sidebar links work
- Check read-only indicators appear
- Test Events/Announcements/Messages CRUD operations

### 3. Permission Test
- Try accessing admin routes (should redirect)
- Verify API endpoints respect role permissions
- Test middleware protection

## Customization

### Branding
- Colors: Purple gradient theme in `layout.tsx` and `MainDirectorMenu.tsx`
- Logo: Uses same logo with "Main Director" text
- Badges: Purple "Read-Only" and green "Full Access" indicators

### Adding New Sections
1. Create page in `(main-director)` directory
2. Add route to `MainDirectorMenu.tsx`
3. Implement read-only or full access as needed
4. Update API endpoints if required

### Permissions
- Modify `routeAccessMap` in `src/lib/settings.ts`
- Update middleware role checks
- Add API endpoint protection

## Troubleshooting

### Common Issues

1. **Login Redirect Loop**
   - Check middleware role mapping
   - Verify user has MAIN_DIRECTOR position

2. **Permission Denied**
   - Confirm role in JWT token
   - Check API endpoint role validation

3. **Missing Data**
   - Verify API endpoints are accessible
   - Check database permissions

4. **UI Issues**
   - Clear browser cache
   - Check CSS conflicts with admin styles

### Debug Mode
Enable debug logging in middleware and API routes to trace permission issues.

## Production Considerations

1. **Security**
   - Use strong passwords for Main Director accounts
   - Implement proper JWT secret rotation
   - Add rate limiting for API endpoints

2. **Performance**
   - Dashboard API caching
   - Optimize database queries for read-only operations
   - Implement pagination for large datasets

3. **Monitoring**
   - Log Main Director actions
   - Monitor API usage
   - Track permission violations

## Future Enhancements

1. **Advanced Analytics**
   - Custom dashboard widgets
   - Exportable reports
   - Real-time notifications

2. **Enhanced Permissions**
   - Granular read permissions
   - Time-based access controls
   - Branch-specific restrictions

3. **Mobile Optimization**
   - Responsive improvements
   - Mobile-specific navigation
   - Touch-friendly interactions

---

**Status**: ✅ Complete and Ready for Production

The Main Director Panel is fully implemented with comprehensive read-only access to all school data and full CRUD permissions for Events, Announcements, and Messages. The system includes proper authentication, role-based access control, and a user-friendly interface with clear permission indicators.
