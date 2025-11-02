# 🔐 Authentication Setup Guide

## Overview

This app uses **Google Sign-In** for authentication and is configured for **single-user access**. Only your specific Gmail account (configured in environment variables) can access the application.

---

## 📋 Setup Steps

### Step 1: Enable Google OAuth in Supabase

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and enable it
4. You'll need to configure Google OAuth credentials:

#### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
   - You can find this in your Supabase project settings
8. Click **Create** and copy the **Client ID** and **Client Secret**

#### Configure in Supabase:

1. Back in Supabase, paste the **Client ID** and **Client Secret** into the Google provider settings
2. Click **Save**

### Step 2: Configure Your Allowed Email

Add your Gmail address to the environment variables:

#### Local Development (.env.local):

```env
ALLOWED_EMAIL=your.email@gmail.com
```

#### Netlify Deployment:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `ALLOWED_EMAIL`
   - **Value**: `your.email@gmail.com`
4. Save and redeploy your site

### Step 3: Update Row Level Security (RLS) Policies

Now that authentication is enabled, you need to update your database security to require authentication:

1. Go to **SQL Editor** in Supabase
2. Run the following SQL commands:

```sql
-- Enable Row Level Security on receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert" ON receipts;
DROP POLICY IF EXISTS "Allow public select" ON receipts;
DROP POLICY IF EXISTS "Allow public delete" ON receipts;

-- Create new policies that require authentication
-- Only authenticated users can insert receipts
CREATE POLICY "Allow authenticated insert" ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can view receipts
CREATE POLICY "Allow authenticated select" ON receipts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can delete receipts
CREATE POLICY "Allow authenticated delete" ON receipts
  FOR DELETE
  TO authenticated
  USING (true);
```

### Step 4: Test Your Setup

1. Deploy your app to Netlify (or run locally)
2. You should see the login screen
3. Enter your Gmail address and password
4. Click **Sign In**
5. You should now have access to the app!

---

## 🔒 Security Features

✅ **Single User Access**: Only your Gmail account can sign in (no signup form)  
✅ **Password Protected**: Requires password authentication  
✅ **Database Security**: RLS policies ensure only authenticated users can access data  
✅ **Session Management**: Automatic session handling with Supabase  

---

## 🚨 Troubleshooting

### "Invalid login credentials" error

- Double-check your email and password
- Make sure the user was created successfully in Supabase
- Verify email confirmations are disabled (or confirm your email if enabled)

### Can't access the app after signing in

- Check browser console for errors
- Verify your Supabase environment variables are set correctly in Netlify
- Make sure RLS policies are created correctly

### Forgot your password?

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Click the three dots → **Reset password**
4. Or delete the user and create a new one with a new password

---

## 🔄 Changing Your Email or Password

### Change Email:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click on your user
3. Update the email field
4. Save changes

### Change Password:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click on your user
3. Click **Reset password** or update the password directly
4. Save changes

---

## 📝 Important Notes

- **No Signup Form**: The app only has a login form. Users must be created manually in Supabase.
- **Single User**: This setup is designed for personal use with one Gmail account.
- **Email Confirmations**: Disabled by default for easier setup. Enable if you want extra security.
- **Session Persistence**: Your login session persists across browser refreshes.

---

## 🎯 Next Steps

After setting up authentication:

1. ✅ Create your user account in Supabase
2. ✅ Update RLS policies
3. ✅ Test login on your deployed app
4. ✅ Start scanning receipts!

---

**Need Help?** Check the Supabase documentation: https://supabase.com/docs/guides/auth

