# Fuel Logbook App - Troubleshooting Guide

## Issue 1: S3 Receipts Return "AccessDenied" Error

### Problem
When viewing fuel logs, receipt images show "AccessDenied" XML error instead of displaying.

### Root Causes

1. **S3 Bucket CORS Not Configured** (Most Common)
   - Your S3 bucket blocks cross-origin requests from your app domain
   
2. **IAM Permissions Insufficient**
   - The AWS credentials don't have `GetObject` permission for receipts
   
3. **Bucket Policy Restricts Access**
   - Public access is blocked at the bucket level

4. **S3 URL Path Issues** (Extra Folders)
   - S3 key path contains unexpected folder structure

### Solution

#### Step 1: Fix S3 CORS Configuration

1. Go to **AWS S3 Console** → Select your fuel logbook bucket
2. Click **Permissions** tab
3. Scroll to **CORS** section
4. Click **Edit CORS Configuration**
5. Replace with this policy:

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://yourdomain.com",
      "https://*.yourdomain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
\`\`\`

**Important**: Replace `https://yourdomain.com` with your actual production domain.

6. Click **Save changes**

#### Step 2: Verify IAM Permissions

1. Go to **AWS IAM Console** → **Users** → Select the user
2. Click **Permissions** tab
3. Verify the attached policy has:

\`\`\`json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::your-bucket-name/receipts/*"
}
\`\`\`

If missing, add this inline policy and save.

#### Step 3: Check Bucket Policy

1. Go to **S3 Console** → Your bucket → **Permissions** tab
2. Scroll to **Bucket policy**
3. If it's very restrictive, consider adding:

\`\`\`json
{
  "Sid": "AllowPublicRead",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::your-bucket-name/receipts/*",
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": ["0.0.0.0/0"]
    }
  }
}
\`\`\`

#### Step 4: Verify S3 Key Structure

The correct S3 key format should be:
\`\`\`
receipts/{userId}/{carId}/{logId}-{timestamp}.avif
\`\`\`

**NOT**:
\`\`\`
receipts/user-123/car-456/log-789/receipts/extra-folder/file.avif
\`\`\`

Check your upload endpoint (`app/api/upload-receipt/route.ts`) to ensure no extra folders are being added.

#### Step 5: Test Receipt Display

1. Add a new fuel log with a receipt
2. Wait for upload to complete
3. View the fuel log details
4. Image should display without errors

---

## Issue 2: Per-Vehicle Efficiency Not Calculated

### Problem
Average fuel efficiency (km/L) shows the same value for all vehicles instead of per-vehicle average.

### Root Cause
The dashboard calculates a **global average** across all vehicles, while individual car pages show **per-car averages** (which is correct).

### Solution

**This is by design**. Here's where each calculation happens:

**Dashboard (`/app/dashboard/page.tsx`)**:
- Shows "Avg. Efficiency Across all vehicles" - intentionally global
- Useful for overall fleet performance

**Individual Car Page (`/app/dashboard/cars/[id]/page.tsx`)**:
- Shows accurate **per-vehicle efficiency** - calculated only from that car's logs
- This is the reliable metric for individual vehicle tracking

### To Verify Per-Vehicle Efficiency Works:

1. Go to **Dashboard**
2. Click **View Details** on a specific car
3. The "Avg. Efficiency" shown on the car detail page is per-vehicle only
4. This value is calculated from only that car's fuel logs

---

## Issue 3: Fuel Tank Capacity Not Showing

### Problem
After adding fuel tank capacity to vehicle registration, it doesn't appear on the vehicle page.

### Solution

#### Step 1: Update Database

Run this SQL script in **Supabase SQL Editor**:

\`\`\`sql
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS fuel_tank_capacity DECIMAL(5, 2);
\`\`\`

#### Step 2: Re-register or Edit Your Vehicle

1. Add a new vehicle to include the fuel tank capacity
2. Or manually update existing vehicles:
   - Go to Supabase Dashboard → `cars` table
   - Edit each car and fill in `fuel_tank_capacity`

#### Step 3: Verify Display

1. Go to your vehicle detail page
2. Under the vehicle name, you should see: `Year • Registration • 60L Tank`

---

## Issue 4: Receipt Uploads Create Extra S3 Folders

### Problem
Receipt files are being uploaded to nested folder structures like:
\`\`\`
receipts/user-123/car-456/receipts/extra-folder/file.avif
\`\`\`

### Root Cause
The S3 key generation is adding extra folder segments.

### Solution

The upload route has been fixed in `app/api/upload-receipt/route.ts` to use the correct path format:

\`\`\`typescript
const s3Key = `receipts/${user.id}/${carId}/${logId || uuidv4()}-${timestamp}.avif`
\`\`\`

After deployment:
1. Old receipts with incorrect paths remain as-is (still accessible)
2. New receipts upload to the correct path
3. Old receipts can be manually moved in S3 or deleted if desired

---

## Issue 5: Email Report Not Sending

### Problem
"Email report failed" or no email received.

### Root Causes

1. **Supabase SMTP Not Configured**
   - Email configuration missing in Supabase project settings

2. **Environment Variables Missing**
   - `SUPABASE_SERVICE_ROLE_KEY` not set

3. **Email Function Not Working**
   - Supabase email API endpoint returning errors

### Solution

#### Step 1: Configure Supabase Email

See **SUPABASE_AUTH_SETUP.md** for complete email configuration steps.

#### Step 2: Verify Environment Variables

In Vercel dashboard, confirm these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Step 3: Test Email Sending

1. Go to Dashboard
2. Click "Email All Logs" button
3. Check spam/promotions folder if not in inbox
4. Check Vercel/server logs for errors

---

## Issue 6: Export PDF Not Converting to PDF

### Problem
Downloaded file is HTML, not PDF.

### Solution

The app exports as **HTML** which can be converted to PDF using several methods:

#### Method 1: Browser Print to PDF (Easiest)
1. Click **"Download Logbook"** button
2. File opens in browser
3. Press **Ctrl+P** (or Cmd+P on Mac)
4. Select "Save as PDF"
5. Choose location and save

#### Method 2: Online HTML to PDF Converter
1. Click **"Download Logbook"** button
2. Go to https://cloudconvert.com/html-to-pdf
3. Upload the downloaded HTML file
4. Click **Convert**
5. Download the PDF

#### Method 3: Command Line (Puppeteer/Wkhtmltopdf)
If you're technical, convert locally:

\`\`\`bash
# Using wkhtmltopdf
wkhtmltopdf fuel-logbook.html fuel-logbook.pdf

# Using Puppeteer (Node.js)
npm install puppeteer
node -e "const puppeteer = require('puppeteer'); (async () => { const browser = await puppeteer.launch(); const page = await browser.newPage(); await page.goto('file:///path/to/fuel-logbook.html'); await page.pdf({path: 'fuel-logbook.pdf'}); await browser.close(); })();"
\`\`\`

---

## Issue 7: Lock/Delete Not Working

### Problem
Can't lock or delete fuel log entries.

### Solution

#### Locking Issues:
1. Ensure you're authenticated (logged in)
2. Refresh the page if button appears disabled
3. Check browser console for errors (F12)

#### Deletion Issues:
1. **Cannot delete locked entries** - This is intentional for protection
2. Click "Unlock" button first
3. Then click "Delete"
4. Type exactly `DELETE` (uppercase) in confirmation dialog
5. Click "Delete" button

#### Still Not Working?
Check server logs in Vercel dashboard for database errors.

---

## Issue 8: Fuel Log Not Calculating Efficiency

### Problem
New fuel log shows efficiency as empty or "-".

### Root Cause
Efficiency is only calculated if there's a **previous fuel log** for that vehicle.

### Solution

1. **First fuel log**: Efficiency will always be empty (no previous reading to compare)
2. **Second fuel log onwards**: Efficiency will calculate automatically
3. The calculation needs:
   - Previous odometer reading
   - Current odometer reading
   - Liters added in current log

### Verify:
1. Add first fuel log (efficiency will be "-")
2. Add second fuel log with higher odometer (efficiency will calculate)
3. Subsequent logs will always show efficiency

---

## General Troubleshooting Steps

### 1. Check Logs
- Vercel Dashboard → Logs
- Look for error messages starting with `[v0]`

### 2. Verify Authentication
- Try logging out and back in
- Check browser developer tools (F12) → Network tab

### 3. Check Database
- Go to Supabase Dashboard
- Verify your tables have data
- Check Row Level Security (RLS) policies

### 4. Clear Cache
- Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Clear browser cookies for the app

### 5. Check Environment Variables
- Vercel Dashboard → Settings → Environment Variables
- Verify all required variables are set
- Re-deploy after changes

---

## Need More Help?

1. Check **SETUP_INSTRUCTIONS.md** for initial setup steps
2. Check **SUPABASE_AUTH_SETUP.md** for authentication issues
3. Review server logs in Vercel dashboard
4. Contact AWS support for S3-specific issues
