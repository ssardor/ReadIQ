# 🚀 Deployment Checklist

Use this checklist when deploying ReadIQ to production.

## Pre-Deployment

### Local Testing
- [ ] Run `npm run build` successfully
- [ ] Test all authentication flows locally
- [ ] Verify email verification works
- [ ] Test password reset flow
- [ ] Check mobile responsiveness
- [ ] Test with different browsers (Chrome, Firefox, Safari)
- [ ] Check for console errors
- [ ] Verify all environment variables are set

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All API endpoints return expected responses
- [ ] Error handling is in place
- [ ] Security best practices followed
- [ ] Sensitive data not exposed in client code
- [ ] `.env.local` is in `.gitignore`

### Supabase Configuration
- [ ] Database migration executed
- [ ] RLS policies verified
- [ ] Email provider configured
- [ ] Service role key saved securely
- [ ] Auth settings verified
- [ ] Test user created and working

## Vercel Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - ReadIQ MVP v1"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy to Vercel

1. **Go to** https://vercel.com
2. **Click** "Add New Project"
3. **Import** your GitHub repository
4. **Configure** build settings (auto-detected for Next.js)
5. **Add Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://islicuycdgkjqbixfuyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

6. **Click** "Deploy"
7. **Wait** for deployment to complete
8. **Copy** your production URL

### 3. Update Supabase Settings

1. **Go to** Supabase Dashboard → Authentication → URL Configuration

2. **Update Site URL**:
   ```
   https://your-domain.vercel.app
   ```

3. **Update Redirect URLs** (add these):
   ```
   https://your-domain.vercel.app/verify
   https://your-domain.vercel.app/reset
   https://your-domain.vercel.app/dashboard
   https://your-domain.vercel.app/**
   ```

4. **Save** changes

### 4. Update Email Templates

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Update all links to use production URL:
   - Confirmation: `{{ .SiteURL }}/verify`
   - Reset: `{{ .SiteURL }}/reset`

## Post-Deployment Testing

### Critical Flows
- [ ] Visit production URL
- [ ] Sign up as new user (student)
- [ ] Receive verification email
- [ ] Click verification link (should redirect to production URL)
- [ ] Login with verified account
- [ ] Access dashboard
- [ ] Edit profile
- [ ] Logout
- [ ] Test password reset flow
- [ ] Sign up as mentor
- [ ] Verify mentor sees mentor dashboard

### Performance Checks
- [ ] Page load times <3s
- [ ] No console errors in production
- [ ] Mobile responsiveness works
- [ ] Images/assets load correctly
- [ ] API endpoints respond correctly

### Security Verification
- [ ] HTTPS is enabled
- [ ] Environment variables are set
- [ ] Service role key not exposed
- [ ] Protected routes redirect properly
- [ ] RLS policies working

## Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Go to Vercel Project → Settings → Domains
2. Add your domain (e.g., readiq.app)
3. Update DNS records as instructed
4. Wait for SSL certificate

### Update Supabase URLs
1. Update Site URL to `https://readiq.app`
2. Update all redirect URLs to use custom domain
3. Update email templates

## Production Environment Variables

Ensure these are set in Vercel:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Same as dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Same as dev |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | ⚠️ Keep secret! |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production URL |

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Vercel Analytics enabled
- [ ] Supabase logs monitoring configured
- [ ] Error tracking (Sentry, etc.) optional
- [ ] Uptime monitoring optional

### Regular Checks
- [ ] Monitor Supabase usage (free tier limits)
- [ ] Check email delivery success rate
- [ ] Monitor API response times
- [ ] Review user feedback

### Backup Strategy
- [ ] Supabase auto-backups enabled (paid plan)
- [ ] Export user data regularly
- [ ] Keep migration files in version control

## Scaling Considerations

### When to Upgrade
- **Email Volume**: Supabase free tier has limits
- **Database Size**: Monitor storage usage
- **API Requests**: Watch for rate limiting
- **Concurrent Users**: Monitor performance

### Optimization Tips
- Enable Vercel Edge Functions for better performance
- Add CDN for static assets
- Implement Redis caching (future)
- Set up dedicated SMTP provider

## Rollback Plan

If issues occur:

1. **Vercel**: Rollback to previous deployment
   - Go to Deployments tab
   - Click "..." on last working deployment
   - Select "Promote to Production"

2. **Supabase**: Restore from backup
   - Go to Database → Backups
   - Restore from point in time

3. **Environment Variables**: 
   - Check they match documented values
   - Verify no typos

## Security Checklist

- [ ] Environment variables are encrypted
- [ ] Service role key only used server-side
- [ ] HTTPS enforced
- [ ] RLS policies tested
- [ ] Email verification required
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] No sensitive data in logs

## Performance Optimization

### Immediate
- [ ] Vercel Edge Functions enabled
- [ ] Image optimization enabled
- [ ] Font loading optimized

### Future
- [ ] Add Redis for session caching
- [ ] Implement CDN for assets
- [ ] Database indexing optimization
- [ ] Query optimization

## Legal & Compliance

Before launching publicly:

- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Cookie consent (if in EU)
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy
- [ ] User data export feature

## Launch Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained on features
- [ ] Support email configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan tested
- [ ] Social media assets ready (optional)
- [ ] Press release ready (optional)

## Post-Launch

### Day 1
- [ ] Monitor for errors
- [ ] Check email delivery
- [ ] Verify sign-ups working
- [ ] Monitor performance

### Week 1
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Monitor analytics
- [ ] Check resource usage

### Month 1
- [ ] Review metrics
- [ ] Plan v2 features
- [ ] Optimize performance
- [ ] Scale infrastructure if needed

## Useful Commands

```bash
# Build and test production build locally
npm run build
npm start

# Check for TypeScript errors
npx tsc --noEmit

# Deploy from CLI (if Vercel CLI installed)
vercel --prod

# View production logs
vercel logs your-project-name --prod
```

## Support Resources

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Next.js Docs**: https://nextjs.org/docs
- **This Project Docs**: See README.md, SETUP.md

---

**Remember**: Test everything in production after deployment!

Good luck with your launch! 🚀
