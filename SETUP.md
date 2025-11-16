# ReadIQ Setup Guide

## Quick Start (5 minutes)

Follow these steps to get ReadIQ running on your local machine.

### 1. Database Setup

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Open your project: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx

2. **Run Database Migration**
   - Go to SQL Editor (left sidebar)
   - Click "New Query"
   - Copy and paste the contents of `supabase/migrations/001_create_users_profiles.sql`
   - Click "Run" or press Cmd/Ctrl + Enter
   - You should see: "Success. No rows returned"

3. **Verify Table Created**
   - Go to Table Editor (left sidebar)
   - You should see `users_profiles` table

4. **Get Service Role Key** (Important!)
   - Go to Project Settings → API
   - Copy the `service_role` key (keep this secret!)
   - Update `.env.local`:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

### 2. Configure Email Authentication

1. **Go to Authentication Settings**
   - In Supabase Dashboard → Authentication → URL Configuration

2. **Set Redirect URLs**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: Add these:
     - `http://localhost:3000/verify`
     - `http://localhost:3000/reset`
     - `http://localhost:3000/dashboard`

3. **Email Templates** (Optional but recommended)
   - Go to Authentication → Email Templates
   - Customize "Confirm signup" template
   - Customize "Reset password" template

4. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Ensure "Email" provider is enabled
   - ✅ "Enable email confirmations" should be ON

### 3. Run the Application

```bash
# If not already in the project directory
cd "/Users/apple/VS projects/ReadIQ folder"

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Test the Application

#### Create Test Accounts

1. **Sign up as Student**
   - Go to http://localhost:3000
   - Click "Get Started"
   - Select "I am a Student"
   - Fill in: Name, Email, Password
   - Click "Sign up"
   - Check your email for verification link

2. **Sign up as Mentor**
   - Repeat above steps but select "I am a Mentor"

3. **Verify Email**
   - Click the link in the email
   - You should be redirected to dashboard

4. **Test Login**
   - Logout
   - Login with your credentials
   - You should see the dashboard

## Common Issues & Solutions

### Issue: Email not received

**Solutions:**
1. Check spam folder
2. Check Supabase Dashboard → Authentication → Users
   - Look for your email, check `email_confirmed_at` column
3. In Supabase → Project Settings → API
   - Verify "Auto Confirm" is OFF for production

**Quick test (bypass email):**
```sql
-- In Supabase SQL Editor, manually confirm email:
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-email@example.com';
```

### Issue: "Profile not found" after login

**Solution:**
Check if profile was created in `users_profiles` table:

```sql
-- In Supabase SQL Editor:
SELECT * FROM users_profiles;
```

If empty, there might be an issue with the signup API. Check:
1. Service role key is set correctly in `.env.local`
2. RLS policies are created (run migration again if needed)

### Issue: "Unauthorized" or redirects to login

**Solutions:**
1. Clear browser cookies
2. Check browser console for errors
3. Verify `.env.local` has correct values
4. Restart dev server: `npm run dev`

### Issue: TypeScript/Build errors

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Landing page loads at http://localhost:3000
- [ ] Can navigate to signup page
- [ ] Can create student account
- [ ] Can create mentor account
- [ ] Email verification link works
- [ ] Can login after verification
- [ ] Student sees student dashboard
- [ ] Mentor sees mentor dashboard
- [ ] Can edit profile
- [ ] Can logout
- [ ] Forgot password flow works
- [ ] Can reset password via email
- [ ] Can login with new password
- [ ] Protected routes redirect to login when not authenticated

## Manual Database Inspection

Useful SQL queries for debugging:

```sql
-- View all users
SELECT * FROM auth.users;

-- View all profiles
SELECT * FROM users_profiles;

-- View user with profile (JOIN)
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.university,
  p.created_at
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.id;

-- Count users by role
SELECT role, COUNT(*) as count
FROM users_profiles
GROUP BY role;

-- Delete test user (use carefully!)
DELETE FROM auth.users WHERE email = 'test@example.com';
-- Note: This will cascade delete from users_profiles
```

## Environment Variables Reference

Your `.env.local` should have:

```env
# From Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://islicuycdgkjqbixfuyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (different key!)

# Your local URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ Security Warning:**
- NEVER commit `.env.local` to git
- NEVER share your `SUPABASE_SERVICE_ROLE_KEY`
- Use separate Supabase projects for dev/staging/production

## Next Steps

Once everything is working locally:

1. **Add Service Role Key** (if not done)
   - Update `.env.local` with actual service role key

2. **Test All Features**
   - Go through the testing checklist above

3. **Customize**
   - Update branding colors in `tailwind.config.js`
   - Modify email templates in Supabase
   - Add your logo

4. **Deploy**
   - See README.md for deployment instructions
   - Remember to update redirect URLs in Supabase for production domain

## Getting Help

If you're stuck:

1. Check browser console for JavaScript errors
2. Check terminal for server errors
3. Check Supabase logs (Dashboard → Logs)
4. Review this guide and README.md
5. Check Supabase documentation: https://supabase.com/docs

## Development Tips

```bash
# View logs while developing
npm run dev

# Build for production (test before deploy)
npm run build

# Run production build locally
npm run build && npm start

# Check for TypeScript errors
npx tsc --noEmit

# Format code (if you have prettier)
npm run format
```

---

**Ready to go?** Run `npm run dev` and visit http://localhost:3000 🚀
