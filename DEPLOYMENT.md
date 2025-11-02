# 🚀 Deployment Guide for Receipt Scanner AI

This guide will help you securely deploy your Receipt Scanner AI application to Netlify.

## 📋 Prerequisites

1. A [Netlify](https://www.netlify.com/) account
2. Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Your Supabase credentials from [Supabase Dashboard](https://app.supabase.com/)

## 🔐 Security Best Practices

### ✅ What We've Implemented

1. **Environment Variables**: All sensitive keys are stored in `.env` files (never committed to Git)
2. **Build-time Injection**: Vite injects environment variables during build
3. **Git Protection**: `.gitignore` excludes all `.env` files
4. **Security Headers**: Netlify configuration includes security headers
5. **Template File**: `.env.example` provides a template without sensitive data

### ⚠️ Important Security Notes

- **NEVER** commit `.env` or `.env.local` files to Git
- **NEVER** hardcode API keys in your source code
- The Supabase anon key is safe to expose in client-side code (it's designed for that)
- However, ensure your Supabase Row Level Security (RLS) policies are properly configured

## 📦 Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Secure environment variable configuration"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider and select your repository
   - Netlify will auto-detect the build settings from `netlify.toml`

3. **Configure Environment Variables**
   - In Netlify dashboard, go to: **Site settings** → **Environment variables**
   - Add the following variables:
     
     | Variable Name | Value | Where to Get It |
     |--------------|-------|-----------------|
     | `GEMINI_API_KEY` | Your Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
     | `SUPABASE_URL` | Your Supabase URL | [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) |
     | `SUPABASE_ANON_KEY` | Your Supabase anon key | [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) |

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your application
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize your site**
   ```bash
   netlify init
   ```

4. **Set environment variables**
   ```bash
   netlify env:set GEMINI_API_KEY "your_gemini_api_key"
   netlify env:set SUPABASE_URL "your_supabase_url"
   netlify env:set SUPABASE_ANON_KEY "your_supabase_anon_key"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## 🔧 Local Development Setup

1. **Copy the example environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and add your actual credentials**
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 🛡️ Supabase Security Configuration

### Row Level Security (RLS)

Ensure your Supabase `receipts` table has proper RLS policies:

```sql
-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert receipts (adjust based on your needs)
CREATE POLICY "Allow public insert" ON receipts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read receipts (adjust based on your needs)
CREATE POLICY "Allow public read" ON receipts
  FOR SELECT
  TO anon
  USING (true);

-- If you want user-specific receipts, you'll need authentication
-- and policies based on auth.uid()
```

### API Key Restrictions (Optional but Recommended)

For production, consider:

1. **Gemini API Key**: Set up API key restrictions in Google Cloud Console
   - Restrict to specific domains (your Netlify domain)
   - Set usage quotas

2. **Supabase**: 
   - Configure RLS policies based on your security requirements
   - Consider implementing authentication for user-specific data
   - Monitor usage in Supabase dashboard

## 🔍 Verifying Your Deployment

After deployment, verify that:

1. ✅ The app loads without errors
2. ✅ Receipt scanning works (Gemini API is accessible)
3. ✅ Receipts are saved to Supabase
4. ✅ No API keys are visible in the browser's source code (check DevTools → Sources)
5. ✅ Security headers are present (check DevTools → Network → Response Headers)

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set in Netlify
- Verify the build command in `netlify.toml` matches your `package.json`

### API Keys Not Working
- Ensure environment variables are set correctly (no extra spaces)
- Redeploy after adding/changing environment variables
- Check browser console for specific error messages

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure RLS policies allow the operations you're attempting

## 📚 Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/environment-variables/overview/)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Google AI Studio API Keys](https://ai.google.dev/gemini-api/docs/api-key)

## 🎉 Success!

Once deployed, your Receipt Scanner AI will be live and secure! Share your Netlify URL with others to let them use your app.

Remember to monitor your API usage and costs in both Google AI Studio and Supabase dashboards.

