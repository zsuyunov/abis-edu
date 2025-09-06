# Academic Year Auto-Deactivation Setup Guide

## Overview
This system automatically deactivates academic years when they reach their end date, ensuring data integrity and preventing outdated academic years from remaining active.

## Features Implemented

### 1. ✅ Fixed Back Button Issues
- **Admin View**: Fixed route from `/list/academic-years/${id}` to `/admin/list/academic-years/${id}`
- **Support Director View**: Route already correct at `/support-director/list/academic-years/${id}`
- **Main Director View**: Route already correct at `/main-director/list/academic-years/${id}`

### 2. ✅ Academic Year Progress Calculator
- **Days Passed**: Shows how many days have elapsed since the academic year started
- **Days Remaining**: Shows how many days are left until the academic year ends
- **Total Days**: Shows the total duration of the academic year
- **Progress Percentage**: Visual representation of academic year completion
- **Status Indicators**: 
  - 🎯 Ending soon (80%+ complete)
  - 📚 In progress
  - ⚠️ Overdue (past end date)

### 3. ✅ Automatic Deactivation System
- **API Endpoint**: `/api/academic-years/auto-deactivate`
- **Manual Trigger**: Admin can manually run auto-deactivation
- **Status Check**: Check which academic years need deactivation
- **Automatic Updates**: Changes academic year status from ACTIVE to INACTIVE

## How to Use

### Manual Auto-Deactivation
1. Go to **Admin > Academic Years** page
2. Look for the "Academic Year Auto-Deactivation" yellow box
3. Click **"Check Status"** to see which years need deactivation
4. Click **"Auto-Deactivate"** to process overdue academic years

### Progress Calculator
- View detailed progress on any academic year details page
- Progress bar shows visual completion status
- Color-coded indicators (blue=progress, orange=ending soon, red=overdue)

## Setting Up Automatic Cron Jobs

### Option 1: Server Cron Job (Recommended)
Add this to your server's crontab to run daily at midnight:

```bash
# Edit crontab
crontab -e

# Add this line for daily auto-deactivation at midnight
0 0 * * * curl -X POST https://yourdomain.com/api/academic-years/auto-deactivate
```

### Option 2: Vercel Cron Jobs
If using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/academic-years/auto-deactivate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Option 3: GitHub Actions (for GitHub-hosted projects)
Create `.github/workflows/auto-deactivate.yml`:

```yaml
name: Auto-deactivate Academic Years
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  deactivate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto-deactivation
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/academic-years/auto-deactivate
```

## API Endpoints

### GET `/api/academic-years/auto-deactivate`
- **Purpose**: Check status of active academic years
- **Response**: List of active years with deactivation flags
- **Use Case**: Status checking before manual deactivation

### POST `/api/academic-years/auto-deactivate`
- **Purpose**: Execute auto-deactivation of overdue academic years
- **Response**: Success message with count of deactivated years
- **Use Case**: Manual trigger or cron job execution

## Security Notes
- Only accessible to admin users
- Requires proper authentication headers
- Logs all deactivation activities
- Safe to run multiple times (idempotent)

## Monitoring
- Check logs for successful deactivations
- Monitor academic year statuses regularly
- Use the progress calculator to track year completion
- Set up alerts for overdue academic years if needed

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure user has admin role
2. **No Academic Years Found**: Check if there are active academic years
3. **Deactivation Failed**: Verify academic year dates are valid

### Manual Override
If automatic deactivation fails, you can:
1. Manually change academic year status in the database
2. Use the admin interface to archive/restore academic years
3. Check the API logs for specific error messages

## Best Practices
1. **Run Daily**: Set up cron job to run daily at midnight
2. **Monitor Logs**: Check for successful deactivations
3. **Test Manually**: Use the manual trigger to test the system
4. **Backup Data**: Ensure database backups before major changes
5. **Review Progress**: Use progress calculator to monitor year completion

## Support
For issues or questions about the auto-deactivation system:
1. Check the browser console for JavaScript errors
2. Review server logs for API errors
3. Verify academic year dates are in correct format
4. Ensure proper user permissions and authentication
