# 🚨 IMMEDIATE NEXT STEPS - Fix Database Errors

## Current Situation

✅ **Code is updated** - All security features are implemented  
✅ **Prisma client regenerated** - New client includes security fields  
❌ **Database NOT updated** - Tables missing new security columns  

**Result**: App compiles but will show errors when accessing database until migration is applied.

---

## 🔧 How to Fix (Choose One Option)

### Option A: Run Migration in Neon Dashboard (Recommended)

**Best for**: Production database, safest approach

1. **Go to Neon Dashboard**: https://console.neon.tech/

2. **Select your project**: `beruniy-app-production`

3. **Click "SQL Editor"**

4. **Copy and paste** the contents of `migration-security-manual.sql`

5. **Click "Run"**

6. **Verify**: Check that new tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('RefreshToken', 'SecurityLog');
   ```

7. **Restart your app** (if deployed on Render, it will auto-restart)

---

### Option B: Use Prisma Migrate (If you have direct access)

**Best for**: If you can connect to database directly

```bash
# Create migration
npx prisma migrate dev --name security_hardening

# This will:
# 1. Create migration file
# 2. Apply it to database
# 3. Update Prisma client
```

**Note**: This requires `DATABASE_URL` in `.env` to be accessible from your machine. If Neon database is behind a firewall or sleeping, use Option A instead.

---

## ⚡ Quick Test (After Migration)

Test that security features work:

### 1. Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_PHONE","password":"YOUR_PASSWORD"}'
```

Expected: Returns `accessToken` and sets cookies

### 2. Check Database
```sql
-- Should return rows, not errors
SELECT COUNT(*) FROM "RefreshToken";
SELECT COUNT(*) FROM "SecurityLog";

-- Check if columns exist
SELECT "tokenVersion", "mfaEnabled", "failedLoginAttempts" 
FROM "Admin" LIMIT 1;
```

---

## 🔍 Current Error Explanation

The errors you're seeing:
```
Invalid `prisma.teacher.count()` invocation
Engine is not yet connected
```

**Why**: Prisma client expects columns that don't exist yet in database.

**Solution**: Run the migration (Option A or B above).

**After migration**: Errors will disappear and security features will work.

---

## 📝 What Was Added to Database

### New Columns (all user tables):
- `tokenVersion` - For instant session invalidation
- `mfaEnabled`, `mfaSecret` - Multi-factor auth
- `lastPasswordChange` - Track password updates
- `failedLoginAttempts` - Brute force protection
- `accountLockedUntil` - Account lockout
- `lastLoginAt`, `lastLoginIp` - Login tracking
- `passwordResetToken`, `passwordResetExpires` - Secure password reset

### New Tables:
- `RefreshToken` - Stores rotating refresh tokens (hashed)
- `SecurityLog` - Audit trail of all security events

### New Enums:
- `SecurityEventType` - Types of security events
- `SecurityEventStatus` - Success/failure/warning

---

## ⚠️ Important Notes

1. **Backup first**: Always backup database before running migrations
2. **Test in dev**: If possible, test migration on a dev database first
3. **Downtime**: Migration typically takes 5-30 seconds
4. **Existing users**: Will continue working (backward compatible)
5. **No data loss**: Migration only ADDS columns/tables

---

## 🆘 If Something Goes Wrong

### Migration fails?
- Check SQL syntax in migration file
- Ensure you have write permissions
- Check Neon dashboard for error messages

### Still seeing errors after migration?
- Restart your dev server: `npm run dev`
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `npx prisma generate`

### Need to rollback?
- Neon has automatic backups (check dashboard)
- Or manually drop new columns/tables (see rollback.sql if needed)

---

## ✅ Checklist

Before proceeding:
- [ ] I have backed up the database
- [ ] I understand what the migration does
- [ ] I'm ready to apply changes to production

After migration:
- [ ] No errors in console
- [ ] Login works
- [ ] New tables exist (`RefreshToken`, `SecurityLog`)
- [ ] Can see `tokenVersion` column in user tables

---

## 📞 Next Steps After Migration

Once migration is successful:

1. **Test authentication**: Try logging in
2. **Enable MFA**: Set up MFA for your admin account
3. **Monitor logs**: Check `SecurityLog` table
4. **Deploy to production**: See `QUICKSTART_SECURITY.md`

---

**Remember**: The migration is safe - it only ADDS new fields, it doesn't modify or delete any existing data.

**Need help?** Check `MIGRATION_GUIDE.md` for detailed troubleshooting.

