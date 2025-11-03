# Supabase Auth Configuration Guide for Email Confirmation

This guide will help you configure Supabase Authentication to properly handle email confirmation links and redirect users to the sign-in page after email verification.

## Problem

When users click the email confirmation link from Supabase Auth, they receive an error:
\`\`\`
http://localhost:3000/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
\`\`\`

This happens because:
1. The redirect URL in Supabase Auth settings is not configured correctly
2. Email links may be expiring before they're used
3. The callback route is not properly registered in Supabase

## Solution: Step-by-Step Configuration

### Step 1: Access Your Supabase Project Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **"my-new-fuel-logbook-app"** project
3. Click on **Settings** in the left sidebar (gear icon)
4. Select **Authentication** from the settings menu
5. Click on the **Providers** tab

### Step 2: Configure Email Provider Settings

1. In the **Providers** section, find and click on **Email**
2. Ensure "Enable Email provider" is toggled **ON**
3. Look for the following settings:

#### a) **Email Confirmation Settings**
- Ensure "Confirm email" is **enabled**
- Set "Email change token expiry" to a reasonable time (e.g., 24 hours)
- Set "Email confirmation token expiry" to **24 hours or more** (default may be too short)

#### b) **Email Link Settings**
- Look for "Email link expiry duration" and set it to **24 hours**
- This ensures users have enough time to click the link

### Step 3: Configure Redirect URLs (CRITICAL)

1. Go back to **Settings > Authentication**
2. Click on the **URL Configuration** tab
3. You'll see two sections: **Site URL** and **Redirect URLs**

#### a) **Set Site URL**
1. Click on the **Site URL** field
2. For **Development**: Enter `http://localhost:3000`
3. For **Production**: Enter your deployed domain (e.g., `https://my-fuel-logbook.vercel.app`)
4. Click **Save**

#### b) **Add Redirect URLs**
1. Scroll down to **Redirect URLs** section
2. Click **Add URL**
3. Add the following redirect URLs:

**For Development:**
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/auth/sign-up`
- `http://localhost:3000/auth/login`

**For Production:**
- `https://my-fuel-logbook.vercel.app/auth/callback`
- `https://my-fuel-logbook.vercel.app/dashboard`
- `https://my-fuel-logbook.vercel.app/auth/sign-up`
- `https://my-fuel-logbook.vercel.app/auth/login`

**For Both:**
- `http://localhost:3000/auth/auth-error`
- `https://my-fuel-logbook.vercel.app/auth/auth-error`

1. Click **Save** after each URL addition

### Step 4: Verify Environment Variables

Ensure your Supabase environment variables are correctly set:

1. Go to **Settings > API** in your Supabase project
2. Copy your:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. In your v0 project, verify these are set in the **Vars** section (left sidebar):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Configure Email Templates (Optional but Recommended)

1. Go to **Authentication > Email Templates** in Supabase
2. Click on **Confirm signup** template
3. Ensure the redirect URL includes the callback route:
   \`\`\`
   {{ .SiteURL }}/auth/callback?code={{ .TokenHash }}&type=signup
   \`\`\`
4. For **Recovery email**, use:
   \`\`\`
   {{ .SiteURL }}/auth/callback?code={{ .TokenHash }}&type=recovery
   \`\`\`
5. Click **Save**

### Step 6: Test Email Confirmation (Local Development)

1. Start your app: `pnpm dev`
2. Go to `http://localhost:3000`
3. Click **Sign Up**
4. Enter your email and password
5. You should see "Check your email to confirm your signup"
6. **Check your email** for the confirmation link from Supabase
7. **Click the confirmation link**
8. You should be redirected to `/auth/callback` which then redirects to `/dashboard`

### Step 7: Troubleshooting

If you still see the `otp_expired` error:

#### Issue: Link is expired
- **Solution**: Increase "Email confirmation token expiry" to 24 or 48 hours in Email provider settings
- Users may not check their email immediately

#### Issue: Still getting error after clicking link
1. Clear browser cookies:
   - Open DevTools (F12)
   - Application > Cookies > Delete all for localhost:3000
   - Refresh the page

2. Check the callback route is correct:
   - Verify `/auth/callback/route.ts` exists
   - Check that it has the `proxy` function exported

3. Verify redirect URLs are added:
   - Make sure `http://localhost:3000/auth/callback` is in your Redirect URLs list
   - Make sure your domain is set in Site URL

#### Issue: Works in Chrome but not Safari
- This is now fixed! The callback route handles it server-side
- Make sure you're using the latest version of the app

#### Issue: "Email link is invalid"
- Possible causes:
  1. The email was sent before redirect URLs were configured
  2. The token has been modified or corrupted
  3. The user is using a different device/browser
- **Solution**: Ask the user to request a new signup or password reset

### Step 8: Production Deployment

Before deploying to production:

1. Go to Supabase **Settings > Authentication > URL Configuration**
2. Set **Site URL** to your production domain
3. Add all production redirect URLs (see Step 3b)
4. Deploy your app to Vercel
5. Test email confirmation with your production URL

## Email Configuration Summary

Your email confirmation flow should look like this:

\`\`\`
User clicks "Sign Up"
         ↓
User enters email & password
         ↓
Email sent by Supabase with link to: 
http://localhost:3000/auth/callback?code=...&type=signup
         ↓
User clicks email link
         ↓
Browser loads /auth/callback
         ↓
Server-side code exchanges code for session
         ↓
User redirected to /dashboard (authenticated!)
\`\`\`

## Common Configuration Mistakes

❌ **Don't:** Use `localhost:3000/auth/callback?next=/dashboard` as a redirect URL
✅ **Do:** Add both `localhost:3000/auth/callback` AND `localhost:3000/dashboard` as separate redirect URLs

❌ **Don't:** Set Site URL to `http://localhost:3000/auth/callback`
✅ **Do:** Set Site URL to `http://localhost:3000` (just the domain)

❌ **Don't:** Use http for production (use https)
✅ **Do:** Always use `https://your-domain.com` for production URLs

## Need Help?

If you're still having issues:
1. Check the browser console for error messages (F12)
2. Check Supabase logs: Settings > Logs > Auth
3. Verify all environment variables are set correctly
4. Make sure the `/auth/callback` route exists in your Next.js app
