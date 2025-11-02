# ⚡ Quick Start Guide

## 🚀 Deploy to Netlify in 5 Minutes

### Step 1: Get Your API Keys

1. **Gemini API Key**
   - Go to: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Supabase Credentials**
   - Go to: https://app.supabase.com/project/_/settings/api
   - Copy your "Project URL"
   - Copy your "anon/public" key

### Step 2: Push to Git

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3: Deploy to Netlify

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider and repository
4. Netlify will auto-detect settings from `netlify.toml`

### Step 4: Add Environment Variables

In Netlify dashboard, go to: **Site settings** → **Environment variables**

Add these three variables:

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key from Step 1 |
| `SUPABASE_URL` | Your Supabase URL from Step 1 |
| `SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1 |

### Step 5: Deploy!

Click "Deploy site" and wait for the build to complete.

---

## 💻 Run Locally

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Edit .env.local and add your keys
# (Use your favorite text editor)

# 3. Install dependencies
npm install

# 4. Run the app
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

---

## 🔧 Environment Variables Template

Your `.env.local` should look like this:

```env
GEMINI_API_KEY=AIzaSy...your_actual_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your_actual_key
```

---

## ✅ Verify Deployment

After deployment, check:

1. ✅ App loads at your Netlify URL
2. ✅ You can upload a receipt image
3. ✅ Receipt is analyzed (Gemini works)
4. ✅ Receipt is saved (Supabase works)
5. ✅ You can view saved receipts

---

## 🆘 Troubleshooting

### Build Fails
- Check that all 3 environment variables are set in Netlify
- Verify no typos in variable names

### "Supabase not configured" message
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Verify no extra spaces in the values
- Redeploy after adding variables

### Receipt analysis fails
- Check `GEMINI_API_KEY` is set correctly
- Verify the API key is active in Google AI Studio
- Check browser console for specific error messages

### Receipts don't save
- Verify Supabase credentials are correct
- Check that your Supabase project is active
- Ensure the `receipts` table exists in your database

---

## 📚 Need More Help?

- **Full Deployment Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security Information:** See [SECURITY.md](SECURITY.md)
- **Security Audit Report:** See [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)

---

## 🎉 That's It!

Your Receipt Scanner AI is now live and secure!

Share your Netlify URL with others to let them use your app.

