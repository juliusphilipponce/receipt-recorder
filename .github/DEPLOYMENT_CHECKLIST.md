# 📋 Deployment Checklist

Use this checklist to ensure a secure and successful deployment.

## Pre-Deployment

### Code Review
- [ ] Review all changes in `SECURITY_AUDIT_REPORT.md`
- [ ] Verify no hardcoded credentials in source code
- [ ] Check that `.env.local` is NOT committed to Git
- [ ] Confirm `.env.example` is committed (safe template)

### Environment Setup
- [ ] `.env.local` file created locally
- [ ] All three environment variables set in `.env.local`:
  - [ ] `GEMINI_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`

### Local Testing
- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` successfully
- [ ] Test receipt upload and analysis
- [ ] Verify receipts save to Supabase
- [ ] Check browser console for errors

## Git & Repository

### Commit Changes
- [ ] All security fixes committed
- [ ] Commit message is descriptive
- [ ] `.gitignore` properly excludes `.env` files
- [ ] No sensitive data in commit history

### Push to Remote
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible
- [ ] Branch is up to date

## Netlify Setup

### Connect Repository
- [ ] Netlify account created/logged in
- [ ] Repository connected to Netlify
- [ ] Build settings auto-detected from `netlify.toml`

### Environment Variables
Go to: **Site settings** → **Environment variables**

- [ ] `GEMINI_API_KEY` added
  - Value: Your Gemini API key
  - No extra spaces or quotes
- [ ] `SUPABASE_URL` added
  - Value: Your Supabase project URL
  - Format: `https://your-project.supabase.co`
- [ ] `SUPABASE_ANON_KEY` added
  - Value: Your Supabase anon/public key
  - No extra spaces or quotes

### Deploy
- [ ] Click "Deploy site"
- [ ] Wait for build to complete
- [ ] Build succeeds without errors

## Post-Deployment Verification

### Functional Testing
- [ ] Site loads at Netlify URL
- [ ] No console errors in browser
- [ ] Can upload receipt image
- [ ] Receipt is analyzed by Gemini
- [ ] Receipt is saved to Supabase
- [ ] Can view saved receipts in "My Receipts" tab

### Security Verification
- [ ] Open browser DevTools → Sources
- [ ] Search for "GEMINI_API_KEY" - should NOT find actual key
- [ ] Search for "SUPABASE" - should NOT find actual credentials
- [ ] Check Network tab → Response Headers
- [ ] Verify security headers are present:
  - [ ] `X-Frame-Options`
  - [ ] `X-Content-Type-Options`
  - [ ] `X-XSS-Protection`
  - [ ] `Content-Security-Policy`

### Performance Check
- [ ] Page loads quickly
- [ ] Images upload successfully
- [ ] No network errors in DevTools
- [ ] Service Worker registers (check Console)

## Supabase Configuration

### Database Setup
- [ ] Supabase project is active
- [ ] `receipts` table exists
- [ ] Table has correct schema:
  - [ ] `id` (uuid, primary key)
  - [ ] `merchant_name` (text)
  - [ ] `date` (text)
  - [ ] `total` (numeric)
  - [ ] `items` (jsonb)
  - [ ] `unique_hash` (text, unique)
  - [ ] `created_at` (timestamp)

### Row Level Security (RLS)
- [ ] RLS is enabled on `receipts` table
- [ ] Policies configured for INSERT
- [ ] Policies configured for SELECT
- [ ] Test that policies work as expected

## API Key Security

### Gemini API Key
- [ ] API key is active in Google AI Studio
- [ ] Consider setting up API restrictions:
  - [ ] Restrict to your Netlify domain
  - [ ] Set usage quotas
- [ ] Monitor usage in Google Cloud Console

### Supabase
- [ ] Using anon key (NOT service_role key)
- [ ] RLS policies protect data
- [ ] Monitor usage in Supabase dashboard

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Enable Netlify Analytics (optional)
- [ ] Set up Supabase usage alerts
- [ ] Monitor Gemini API usage
- [ ] Bookmark Netlify deploy logs

### Documentation
- [ ] Team members have access to `DEPLOYMENT.md`
- [ ] Environment variables documented
- [ ] Troubleshooting guide reviewed

## Optional Enhancements

### User Authentication
- [ ] Consider implementing Supabase Auth
- [ ] Update RLS policies for user-specific data
- [ ] Add login/signup UI

### Rate Limiting
- [ ] Implement client-side rate limiting
- [ ] Consider Netlify Edge Functions for server-side limiting

### Analytics
- [ ] Add analytics tracking (if needed)
- [ ] Set up error monitoring (e.g., Sentry)

## Troubleshooting

If something doesn't work:

1. **Check Environment Variables**
   - Verify all three variables are set in Netlify
   - Check for typos or extra spaces
   - Redeploy after making changes

2. **Check Build Logs**
   - Review Netlify build logs for errors
   - Look for missing dependencies
   - Verify build command succeeded

3. **Check Browser Console**
   - Look for JavaScript errors
   - Check Network tab for failed requests
   - Verify API calls are working

4. **Check Supabase**
   - Verify project is active
   - Check RLS policies
   - Review database logs

## Success Criteria

Your deployment is successful when:

- ✅ Site is live at Netlify URL
- ✅ All features work correctly
- ✅ No API keys visible in source code
- ✅ Security headers are present
- ✅ No console errors
- ✅ Receipts save and load correctly

## 🎉 Deployment Complete!

Once all items are checked, your Receipt Scanner AI is live and secure!

**Next Steps:**
- Share your Netlify URL
- Monitor usage and costs
- Keep dependencies updated
- Review security regularly

---

**Need Help?**
- See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions
- See [SECURITY.md](../SECURITY.md) for security guidelines
- See [QUICK_START.md](../QUICK_START.md) for quick reference

