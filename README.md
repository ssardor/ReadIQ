# ReadIQ MVP Auth & Landing (v1)

Quick 5-minute reading comprehension assessments designed by educators to help students improve reading skills and track progress effectively.

## 🚀 Features

- **Landing Page**: Hero section with value proposition and call-to-action
- **Authentication System**:
  - Email/password signup with role selection (Student/Mentor)
  - Email verification flow
  - Login/logout functionality
  - Password reset via email
- **Protected Dashboard**: Role-based access for students and mentors
- **Profile Management**: Edit user profile information
- **Server-Side Rendering**: Protected routes with SSR authentication
- **Mobile Responsive**: Fully responsive design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel + Supabase

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Git

## 🏗️ Project Structure

```
ReadIQ folder/
├── components/          # Reusable React components
│   ├── DashboardHeader.tsx
│   ├── LandingHero.tsx
│   ├── RoleToggle.tsx
│   └── Toast.tsx
├── lib/                 # Library code
│   ├── supabaseClient.ts    # Client-side Supabase
│   ├── supabaseServer.ts    # Server-side Supabase
│   └── types.ts             # TypeScript types
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   │   ├── auth/
│   │   │   ├── me.ts
│   │   │   ├── signup.ts
│   │   │   └── request-password-reset.ts
│   │   └── health.ts
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx       # Landing page
│   ├── signup.tsx      # Registration
│   ├── login.tsx       # Login
│   ├── dashboard.tsx   # Protected dashboard
│   ├── profile.tsx     # User profile
│   ├── forgot.tsx      # Forgot password
│   ├── reset.tsx       # Reset password
│   └── verify.tsx      # Email verification
├── styles/              # Global styles
├── supabase/           # Database migrations
│   └── migrations/
├── utils/              # Utility functions
│   └── validation.ts
├── .env.local          # Environment variables (not in git)
├── .env.example        # Example environment variables
├── package.json
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
cd "/Users/apple/VS projects/ReadIQ folder"
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and keys

#### Run Database Migration
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration script from `supabase/migrations/001_create_users_profiles.sql`

This will create:
- `users_profiles` table
- Row Level Security policies
- Necessary triggers and indexes

#### Configure Email Settings
1. In Supabase Dashboard → Authentication → Email Templates
2. Customize confirmation and password reset email templates
3. Set redirect URLs:
   - Confirmation URL: `http://localhost:3000/verify`
   - Password reset URL: `http://localhost:3000/reset`

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://islicuycdgkjqbixfuyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ Important**: Never commit your `.env.local` file. The `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side.

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Application

### Manual Testing Checklist

1. **Landing Page**
   - [ ] Visit http://localhost:3000
   - [ ] Check responsive design (mobile/desktop)
   - [ ] Click "Get Started" → redirects to /signup
   - [ ] Click "Login" → redirects to /login

2. **Registration Flow**
   - [ ] Sign up as Student with valid email
   - [ ] Sign up as Mentor with valid email
   - [ ] Test form validation (invalid email, weak password, etc.)
   - [ ] Check email inbox for verification link

3. **Email Verification**
   - [ ] Click verification link from email
   - [ ] Should redirect to /verify?status=success
   - [ ] Then auto-redirect to /dashboard

4. **Login Flow**
   - [ ] Login with verified account
   - [ ] Try login before verification (should fail)
   - [ ] Test "Forgot Password" link

5. **Dashboard**
   - [ ] Student sees student dashboard
   - [ ] Mentor sees mentor dashboard
   - [ ] Header shows correct name and role
   - [ ] Try accessing /dashboard without login (should redirect to /login)

6. **Profile Page**
   - [ ] Navigate to /profile from dashboard
   - [ ] Edit name and university
   - [ ] Save changes
   - [ ] Verify changes persist

7. **Password Reset**
   - [ ] Request password reset from /forgot
   - [ ] Check email for reset link
   - [ ] Click link and set new password
   - [ ] Login with new password

8. **Logout**
   - [ ] Click logout button
   - [ ] Should redirect to /login
   - [ ] Verify cannot access /dashboard

## 🔒 Security Features

- Email verification required before dashboard access
- Server-side session validation using Supabase Auth
- Row Level Security (RLS) policies on database
- HttpOnly cookies for session management
- Password strength validation (min 8 chars + number)
- Service role key kept server-side only
- CSRF protection via Next.js
- Input validation and sanitization

## 📦 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)

5. Deploy!

### Update Supabase Settings

After deployment, update redirect URLs in Supabase:
- Confirmation URL: `https://your-domain.vercel.app/verify`
- Password reset URL: `https://your-domain.vercel.app/reset`

## 🐛 Troubleshooting

### Email not received
- Check spam folder
- Verify Supabase email settings
- Confirm email authentication is enabled in Supabase

### Login redirects to /login repeatedly
- Clear browser cookies
- Check if email is verified
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart your IDE/editor
- Run `npm run build` to check for build errors

### Database errors
- Ensure migration was run successfully
- Check RLS policies are enabled
- Verify service role key is correct

## 📝 API Endpoints

- `POST /api/auth/signup` - Create user profile after Supabase signup
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/request-password-reset` - Send password reset email
- `GET /api/health` - Health check endpoint

## 👥 User Roles

- **Student**: Can take quizzes and track progress (v2 feature)
- **Mentor**: Can create quizzes and view student results (v2 feature)

## 🗺️ Roadmap (Future Versions)

### v2 - Quiz Flow
- Quiz creation interface for mentors
- Quiz taking interface for students
- Real-time results
- Progress tracking and analytics

### v3 - Advanced Features
- AI-powered question generation
- QR code for quiz sharing
- Live leaderboards
- Detailed analytics dashboard
- SSO/LDAP integration

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

This is a MVP project. For improvements:
1. Create an issue describing the feature/bug
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase documentation
- Create an issue in the repository

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
