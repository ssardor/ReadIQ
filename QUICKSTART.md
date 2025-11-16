# 🚀 ReadIQ - Quick Start

Welcome to **ReadIQ MVP Auth & Landing (v1)**!

## What You Have

✅ Complete authentication system (signup, login, password reset)  
✅ Role-based access (Student & Mentor)  
✅ Email verification flow  
✅ Protected dashboard with SSR  
✅ Profile management  
✅ Fully responsive design  
✅ Production-ready codebase  

## 5-Minute Setup

### 1️⃣ Install Dependencies (Already Done!)
```bash
npm install
```
✅ Installed: Next.js, React, TypeScript, Supabase, Tailwind CSS

### 2️⃣ Configure Supabase

**Open SUPABASE_SETUP.md** and follow these 3 steps:

1. **Run database migration** (SQL Editor → paste migration file)
2. **Get service role key** (Settings → API → copy service_role)
3. **Set redirect URLs** (Auth → URL Config → add verify/reset URLs)

**Update `.env.local`:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 3️⃣ Start Development Server
```bash
npm run dev
```

Open **http://localhost:3000** 🎉

## First Test

1. Visit http://localhost:3000
2. Click "Get Started"
3. Create a **Student** account
4. Check your email
5. Click verification link
6. Login and see dashboard!

## Project Structure

```
ReadIQ folder/
├── 📄 README.md              ← Full documentation
├── 📄 SETUP.md               ← Detailed setup guide
├── 📄 SUPABASE_SETUP.md      ← Database setup
├── 📄 QUICKSTART.md          ← This file!
│
├── 📁 pages/                 ← All pages
│   ├── index.tsx            ← Landing page
│   ├── signup.tsx           ← Registration
│   ├── login.tsx            ← Login
│   ├── dashboard.tsx        ← Protected dashboard
│   ├── profile.tsx          ← User profile
│   ├── forgot.tsx           ← Password reset request
│   ├── reset.tsx            ← New password form
│   ├── verify.tsx           ← Email verification
│   └── api/auth/            ← Backend endpoints
│
├── 📁 components/            ← Reusable components
│   ├── LandingHero.tsx
│   ├── DashboardHeader.tsx
│   ├── RoleToggle.tsx
│   └── Toast.tsx
│
├── 📁 lib/                   ← Core libraries
│   ├── supabaseClient.ts    ← Client-side Supabase
│   ├── supabaseServer.ts    ← Server-side Supabase
│   └── types.ts             ← TypeScript types
│
├── 📁 utils/                 ← Utilities
│   └── validation.ts        ← Form validation
│
└── 📁 supabase/migrations/   ← Database schema
    └── 001_create_users_profiles.sql
```

## Available Pages

| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing page | ❌ Public |
| `/signup` | Registration | ❌ Public |
| `/login` | Login | ❌ Public |
| `/forgot` | Password reset request | ❌ Public |
| `/reset` | Set new password | ❌ Public |
| `/verify` | Email confirmation | ❌ Public |
| `/dashboard` | Role-based dashboard | ✅ Protected |
| `/profile` | Edit user profile | ✅ Protected |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create user profile |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/request-password-reset` | POST | Send reset email |
| `/api/health` | GET | Health check |

## Key Features Explained

### 🔐 Authentication Flow

```
Sign Up → Email Sent → Click Link → Email Verified → Login → Dashboard
```

### 👤 User Roles

- **Student**: Takes quizzes, tracks progress (v2 feature)
- **Mentor**: Creates quizzes, views results (v2 feature)

### 🛡️ Security

- Server-side session validation
- Row Level Security (RLS) on database
- Email verification required
- Protected routes with SSR
- Service role key server-only

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build

# Troubleshooting
rm -rf .next            # Clear Next.js cache
rm -rf node_modules     # Clear dependencies
npm install              # Reinstall
```

## Need Help?

1. **Setup issues?** → Check `SETUP.md`
2. **Database issues?** → Check `SUPABASE_SETUP.md`
3. **General info?** → Check `README.md`
4. **Errors?** → Check browser console and terminal

## What's Next?

- [ ] Complete Supabase setup
- [ ] Test all authentication flows
- [ ] Customize branding (colors, logo)
- [ ] Deploy to Vercel
- [ ] Build v2 features (quizzes!)

## Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

**Ready?** Run `npm run dev` and visit http://localhost:3000

Questions? Check the other documentation files! 📚
