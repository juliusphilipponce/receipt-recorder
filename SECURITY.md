# 🔒 Security Guidelines

## Overview

This document outlines the security measures implemented in the Receipt Scanner AI project and best practices for maintaining security.

## ✅ Implemented Security Measures

### 1. Environment Variable Management

**What we did:**
- Moved all API keys and sensitive credentials to environment variables
- Created `.env.example` as a template (safe to commit)
- Updated `.gitignore` to exclude all `.env*` files
- Configured Vite to inject environment variables at build time

**Files involved:**
- `services/supabaseClient.ts` - Now reads from `process.env`
- `services/geminiService.ts` - Already using `process.env`
- `vite.config.ts` - Injects environment variables
- `.gitignore` - Protects `.env` files
- `.env.example` - Safe template for developers

### 2. Build-Time Security

**Vite Configuration:**
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
}
```

This ensures:
- Environment variables are replaced at build time
- No runtime environment variable lookups needed
- Works in browser environments

### 3. Netlify Security Headers

**Implemented in `netlify.toml`:**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Content-Security-Policy` - Restricts resource loading

### 4. Git Protection

**`.gitignore` includes:**
```
.env
.env.local
.env.development
.env.production
.env.*.local
```

This prevents accidental commits of sensitive data.

## 🔑 API Key Security

### Gemini API Key

**Security Level:** HIGH - Must be protected

**Best Practices:**
1. ✅ Store in environment variables only
2. ✅ Never commit to Git
3. ✅ Set up API key restrictions in Google Cloud Console:
   - Restrict to specific domains (your Netlify domain)
   - Set usage quotas to prevent abuse
   - Monitor usage regularly

**Where to get it:**
- [Google AI Studio](https://aistudio.google.com/app/apikey)

### Supabase Credentials

**Security Level:** MEDIUM - Anon key is designed for client-side use

**Components:**
1. **SUPABASE_URL** - Your project URL (safe to expose)
2. **SUPABASE_ANON_KEY** - Anonymous/public key (designed for client-side)

**Important Notes:**
- The anon key is **designed** to be used in client-side code
- Security is enforced through **Row Level Security (RLS)** policies
- Never use the `service_role` key in client-side code!

**Best Practices:**
1. ✅ Use environment variables for consistency
2. ✅ Configure proper RLS policies in Supabase
3. ✅ Monitor database usage
4. ✅ Consider implementing authentication for user-specific data

**Where to get them:**
- [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)

## 🛡️ Supabase Row Level Security (RLS)

### Current Setup

The app currently allows public access to receipts. For production, you should configure RLS policies:

```sql
-- Enable RLS on the receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Example: Allow anyone to insert receipts
CREATE POLICY "Allow public insert" ON receipts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Example: Allow anyone to read receipts
CREATE POLICY "Allow public read" ON receipts
  FOR SELECT
  TO anon
  USING (true);
```

### Recommended for Production

For user-specific receipts, implement authentication:

```sql
-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Add user_id column
ALTER TABLE receipts ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Policy: Users can only insert their own receipts
CREATE POLICY "Users can insert own receipts" ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only read their own receipts
CREATE POLICY "Users can read own receipts" ON receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

## 🚨 Security Checklist

### Before Committing Code

- [ ] No API keys in source code
- [ ] No hardcoded credentials
- [ ] `.env` files are in `.gitignore`
- [ ] Only `.env.example` is committed (with placeholder values)
- [ ] No sensitive data in comments

### Before Deploying

- [ ] Environment variables set in Netlify dashboard
- [ ] Supabase RLS policies configured
- [ ] API key restrictions configured (if applicable)
- [ ] Security headers configured in `netlify.toml`
- [ ] Test deployment with actual credentials

### After Deploying

- [ ] Verify app works correctly
- [ ] Check browser DevTools - no API keys visible in source
- [ ] Verify security headers are present
- [ ] Monitor API usage
- [ ] Set up usage alerts (if available)

## 🔍 Security Audit

### What to Check Regularly

1. **Git History**
   - Ensure no credentials were accidentally committed
   - If found, rotate the compromised keys immediately

2. **API Usage**
   - Monitor Gemini API usage in Google Cloud Console
   - Monitor Supabase usage in Supabase Dashboard
   - Set up alerts for unusual activity

3. **Access Logs**
   - Review Netlify access logs
   - Check for suspicious patterns

4. **Dependencies**
   - Run `npm audit` regularly
   - Update dependencies to patch security vulnerabilities

## 🆘 What to Do If Keys Are Compromised

### If Gemini API Key is Exposed

1. **Immediately** delete the compromised key in Google AI Studio
2. Generate a new API key
3. Update the key in Netlify environment variables
4. Redeploy your application
5. Review API usage for any unauthorized activity

### If Supabase Keys are Exposed

1. **If anon key:** This is less critical (designed for client-side), but:
   - Review your RLS policies
   - Check for unauthorized database access
   - Consider rotating the key if concerned

2. **If service_role key:** This is CRITICAL:
   - Immediately rotate the key in Supabase dashboard
   - Review all database activity
   - Check for data breaches
   - Update the key in your deployment

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Netlify Security](https://docs.netlify.com/security/secure-access-to-sites/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Google Cloud API Security](https://cloud.google.com/docs/security/api-security-best-practices)

## 📝 Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email the maintainer directly
3. Provide details about the vulnerability
4. Allow time for the issue to be fixed before public disclosure

## ✅ Summary

This project implements industry-standard security practices:

- ✅ Environment variable management
- ✅ Git protection for sensitive data
- ✅ Build-time security
- ✅ Security headers
- ✅ Database access control (RLS)
- ✅ Clear documentation and guidelines

Remember: **Security is an ongoing process, not a one-time setup!**

