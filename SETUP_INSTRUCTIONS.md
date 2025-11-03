# Fuel Logbook App - Setup Instructions

## Prerequisites
- Node.js 22.14.0
- A Supabase account
- An AWS account (for S3 and SES)

---

## IMPORTANT: Safari Email Confirmation Fix

If users are experiencing issues with Safari not redirecting after confirming their email, this has been fixed in the latest version. The app now uses a dedicated server-side callback route (`/auth/callback`) instead of client-side redirects, which is compatible with Safari's security policies.

**For existing users:** No action needed - the fix is automatically applied.

---

## Part 1: Supabase Database Setup

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Click on your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run SQL Scripts in Order
You need to run the SQL scripts in the `scripts/` folder in the following order:

#### Script 1: Create Tables (001_create_tables.sql)
1. Open the SQL Editor
2. Copy the entire contents of `scripts/001_create_tables.sql`
3. Paste it into the SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
5. Wait for confirmation that the script executed successfully

This script creates:
- `profiles` table (user profiles)
- `cars` table (vehicle information)
- `fuel_logs` table (fuel entries)
- Row Level Security (RLS) policies for data protection
- Indexes for performance

#### Script 2: Create Profile Trigger (002_create_profile_trigger.sql)
1. In the SQL Editor, clear the previous query
2. Copy the entire contents of `scripts/002_create_profile_trigger.sql`
3. Paste it into the SQL Editor
4. Click **Run**
5. Wait for confirmation

This script automatically creates a profile when a user signs up.

#### Script 3: Create Functions (003_create_functions.sql)
1. Clear the SQL Editor
2. Copy the entire contents of `scripts/003_create_functions.sql`
3. Paste it into the SQL Editor
4. Click **Run**
5. Wait for confirmation

This script creates:
- Automatic calculation of fuel efficiency (km/L)
- Automatic calculation of distance traveled
- Automatic calculation of total cost
- Timestamp update triggers

### Step 3: Verify Database Setup
1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see three tables: `profiles`, `cars`, and `fuel_logs`
3. Click on each table to verify the columns are created correctly

---

## Part 2: AWS S3 Bucket Setup (for Receipt Images)

### Step 1: Create S3 Bucket
1. Log in to AWS Console at https://console.aws.amazon.com
2. Search for **S3** in the services search bar
3. Click **Create bucket**
4. Configure the bucket:
   - **Bucket name**: Choose a unique name (e.g., `fuel-logbook-receipts-[your-name]`)
   - **AWS Region**: Choose the region closest to you (e.g., `eu-west-1` for Europe)
   - **Block Public Access settings**: Keep all boxes **checked** (we'll use signed URLs)
   - Leave other settings as default
5. Click **Create bucket**

### Step 2: Enable CORS for the Bucket
1. Click on your newly created bucket
2. Go to the **Permissions** tab
3. Scroll down to **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Paste the following CORS configuration:

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
\`\`\`

6. Click **Save changes**

### Step 3: Create IAM User for S3 Access
1. In AWS Console, search for **IAM** in the services search bar
2. Click **Users** in the left sidebar
3. Click **Create user**
4. Enter a username (e.g., `fuel-logbook-s3-user`)
5. Click **Next**
6. Select **Attach policies directly**
7. Search for and select **AmazonS3FullAccess** (or create a custom policy for better security)
8. Click **Next**, then **Create user**

### Step 4: Create Access Keys
1. Click on the user you just created
2. Go to the **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next**
7. Add a description (e.g., "Fuel Logbook App")
8. Click **Create access key**
9. **IMPORTANT**: Copy both the **Access key ID** and **Secret access key** immediately
   - You won't be able to see the secret key again
   - Store them securely

### Step 5: Add AWS Credentials to Vercel
1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following environment variables:
   - `AWS_ACCESS_KEY_ID`: Your access key ID from Step 4
   - `AWS_SECRET_ACCESS_KEY`: Your secret access key from Step 4
   - `AWS_REGION`: Your bucket region (e.g., `eu-west-1`)
   - `AWS_S3_BUCKET_NAME`: Your bucket name from Step 1

---

## Part 3: AWS SES Setup (for Custom SMTP with Supabase)

### Step 1: Verify Your Email Domain or Address
1. In AWS Console, search for **SES** (Simple Email Service)
2. Make sure you're in a supported region (e.g., `us-east-1`, `eu-west-1`)
3. Click **Verified identities** in the left sidebar
4. Click **Create identity**
5. Choose:
   - **Email address** (easier for testing) OR
   - **Domain** (for production)
6. Enter your email address or domain
7. Click **Create identity**
8. Check your email for a verification link (if using email address)
9. Click the verification link

### Step 2: Request Production Access (Optional but Recommended)
By default, SES is in "sandbox mode" and can only send to verified addresses.

1. In SES, click **Account dashboard** in the left sidebar
2. Look for the banner about sandbox mode
3. Click **Request production access**
4. Fill out the form:
   - **Mail type**: Transactional
   - **Website URL**: Your app URL
   - **Use case description**: "Sending authentication emails and fuel logbook reports for fuel logbook application"
   - **Compliance**: Confirm you comply with AWS policies
5. Submit the request (approval usually takes 24 hours)

### Step 3: Create SMTP Credentials
1. In SES, click **SMTP settings** in the left sidebar
2. Note the **SMTP endpoint** (e.g., `email-smtp.eu-west-1.amazonaws.com`)
3. Click **Create SMTP credentials**
4. Enter a username (e.g., `fuel-logbook-smtp-user`)
5. Click **Create user**
6. **IMPORTANT**: Download or copy the SMTP credentials:
   - **SMTP Username**
   - **SMTP Password**
   - You won't be able to see the password again

### Step 4: Configure Supabase with Custom SMTP
1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon in the left sidebar)
3. Click **Auth** in the settings menu
4. Scroll down to **SMTP Settings**
5. Enable **Enable Custom SMTP**
6. Fill in the details:
   - **Sender email**: Your verified email address from Step 1
   - **Sender name**: "Fuel Logbook" (or your app name)
   - **Host**: Your SMTP endpoint from Step 3 (e.g., `email-smtp.eu-west-1.amazonaws.com`)
   - **Port**: `587` (for TLS) or `465` (for SSL)
   - **Username**: Your SMTP username from Step 3
   - **Password**: Your SMTP password from Step 3
7. Click **Save**

### Step 5: Test Email Sending
1. Try signing up a new user in your app
2. Check if the confirmation email arrives
3. If emails don't arrive:
   - Check AWS SES **Sending statistics** for bounces/complaints
   - Verify your sender email is verified in SES
   - Check Supabase logs for SMTP errors

---

## Part 4: Email Export Feature (NEW)

The app now includes an **Email Logbook** feature that allows users to export their complete fuel logbook data and SARS work travel records via email.

### How It Works:
1. Users can click the "Email All Logs" button on the dashboard
2. Or click "Email Report" on individual car detail pages
3. A comprehensive HTML email report is generated with:
   - Summary statistics (total cost, fuel efficiency, work distance)
   - List of all registered vehicles
   - Complete fuel log history with all details
   - SARS work travel documentation
4. A CSV file is attached for easy import into spreadsheets
5. Email is sent to the user's registered email address

### Required Configuration:
- Supabase Custom SMTP must be configured (see Part 3 above)
- Your app must have `SUPABASE_SERVICE_ROLE_KEY` in environment variables (already set up)

### For SARS Compliance:
The email report includes:
- Work travel distance for each entry
- Total work distance summary
- Clear identification of work-related trips
- All fuel and cost documentation
- Receipt attachment status for audit purposes

---

## Part 5: Environment Variables Summary

Make sure you have these environment variables set in your Vercel project:

### Supabase (Already configured)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### AWS S3 (Add these)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`

### Optional (for development)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (e.g., `http://localhost:3000`)

---

## Part 6: Running the Application

### Development
\`\`\`bash
npm install
npm run dev
\`\`\`

### Production
Deploy to Vercel - all environment variables will be automatically available.

---

## Troubleshooting

### Safari Email Confirmation Issue
**Problem:** After clicking email confirmation link in Safari, user is redirected but sees "Something hazardous" warning.

**Solution:** This has been fixed in the latest version. The app now uses a server-side callback handler at `/auth/callback` which is compatible with Safari's security model.

**If you're still experiencing issues:**
1. Clear Safari cache and cookies
2. Try the email link in a new Safari window (not tab)
3. Ensure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is not set in production

### Database Issues
- **Error: relation does not exist**: Make sure you ran all SQL scripts in order
- **Error: permission denied**: Check that RLS policies are created correctly
- **Can't insert data**: Ensure user is authenticated and email is confirmed

### S3 Upload Issues
- **Access Denied**: Check IAM user permissions and access keys
- **CORS errors**: Verify CORS configuration in S3 bucket
- **Invalid credentials**: Regenerate access keys in IAM

### Email Issues
- **Confirmation emails not sending**: Check SES verified identities and Supabase SMTP settings
- **Logbook emails not sending**: Ensure SMTP is configured and `SUPABASE_SERVICE_ROLE_KEY` is set
- **Sandbox mode**: Request production access or verify recipient emails
- **SMTP errors**: Verify SMTP credentials and endpoint in Supabase

---

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Enable MFA** on your AWS account
4. **Regularly rotate** access keys
5. **Use least privilege** IAM policies in production
6. **Keep Supabase RLS policies** enabled at all times
7. **Store receipt images securely** in S3 with proper access controls

---

## Next Steps

After completing the setup:
1. Test user registration and email confirmation (works in all browsers including Safari)
2. Add your first car
3. Create a fuel log entry with receipt
4. Test email export feature
5. Verify SARS work travel calculations
6. Verify all receipts are converted to AVIF and stored in S3

For support, check the application logs in Vercel or Supabase dashboard.
