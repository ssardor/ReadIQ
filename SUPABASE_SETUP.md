# Supabase Configuration Checklist

## ✅ Required Steps

### 1. Run SQL Migration
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy/paste from: supabase/migrations/001_create_users_profiles.sql
-- This creates the users_profiles table with RLS policies
```

### 2. Get API Keys
```
Dashboard → Project Settings → API

✅ Copy these to .env.local:
- Project URL → NEXT_PUBLIC_SUPABASE_URL
- anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY  
- service_role key → SUPABASE_SERVICE_ROLE_KEY (⚠️ Keep secret!)
```

### 3. Configure Authentication
```
Dashboard → Authentication → URL Configuration

Site URL: http://localhost:3000

Redirect URLs (add these):
- http://localhost:3000/verify
- http://localhost:3000/reset
- http://localhost:3000/dashboard
- http://localhost:3000/**
```

### 4. Email Provider Settings
```
Dashboard → Authentication → Providers → Email

✅ Email provider: ENABLED
✅ Confirm email: ENABLED (important!)
✅ Secure email change: ENABLED (recommended)
```

### 5. Email Templates (Optional)
```
Dashboard → Authentication → Email Templates

Customize:
- Confirm signup
- Reset password
- Magic Link (if using)

Variables available: {{ .Token }}, {{ .Email }}, {{ .Data.* }}
```

## 🚀 Quick Test

After setup, test with SQL:

```sql
-- Check if table exists
SELECT * FROM users_profiles LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users_profiles';
-- Should return: rowsecurity = true

-- View policies
SELECT * FROM pg_policies 
WHERE tablename = 'users_profiles';
-- Should see 3 policies: view own, update own, service insert
```

## 📧 Email Configuration (Production)

For production, configure SMTP:

```
Dashboard → Project Settings → Auth → SMTP Settings

Use custom SMTP provider (SendGrid, AWS SES, etc.)
Or use Supabase's built-in email (rate limited)
```

## 🔒 Security Checklist

- [ ] RLS enabled on users_profiles table
- [ ] Service role key not exposed to client
- [ ] Email confirmation required
- [ ] Strong password policy configured
- [ ] Rate limiting enabled
- [ ] Redirect URLs whitelist configured

## 🐛 Troubleshooting

**Can't create account:**
- Check email provider is enabled
- Verify SQL migration ran successfully
- Check service_role key in .env.local

**Email not received:**
- Check spam folder
- Verify email provider configuration
- Check Supabase logs for email errors

**Can't login after signup:**
- Email must be confirmed first
- Check email_confirmed_at in auth.users table
- For dev: manually confirm in SQL Editor

**Profile not found:**
- Check users_profiles table has data
- Verify RLS policies allow access
- Check API route /api/auth/signup works

## 📊 Useful Supabase Queries

```sql
-- View all users and profiles
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.university
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Count by role
SELECT role, COUNT(*) FROM users_profiles GROUP BY role;

-- Recent signups (last 24 hours)
SELECT * FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Unverified emails
SELECT email, created_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL;
```

## 🔗 Quick Links

- **Your Project**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx
- **SQL Editor**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/editor
- **Auth Users**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/auth/users
- **Table Editor**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/editor
- **Logs**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/logs
- **API Settings**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/settings/api

---

**Need Help?** Check SETUP.md for detailed troubleshooting.
