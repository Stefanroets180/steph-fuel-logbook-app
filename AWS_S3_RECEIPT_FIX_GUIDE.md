# AWS S3 Receipt Access - Step-by-Step Fix Guide

## Problem Summary
Receipt images return "AccessDenied" XML error when viewing fuel logs in the app.

---

## Step 1: Verify S3 Bucket Exists

1. Open **AWS Console** → Search for **S3**
2. Click **Buckets** in left sidebar
3. Verify your fuel logbook bucket exists
4. Note the exact bucket name (you'll need it)

---

## Step 2: Configure CORS (Most Important!)

**CORS allows your app to access S3 files from the browser.**

### Steps:

1. In S3 Buckets list, click your bucket name
2. Click **Permissions** tab
3. Scroll down to **CORS** section
4. Click **Edit** button
5. Delete any existing CORS rules
6. Paste this configuration:

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://my-fuel-app.vercel.app",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
\`\`\`

**Replace origins with your actual domains:**
- Development: Keep `http://localhost:3000`
- Production: Add your Vercel deployment URL (e.g., `https://my-fuel-app.vercel.app`)

7. Click **Save changes**

---

## Step 3: Check IAM User Permissions

1. Go to **AWS IAM Console**
2. Click **Users** in left sidebar
3. Find your user (usually "fuel-logbook-app" or similar)
4. Click on the user name
5. Click **Permissions** tab
6. Look for a policy containing:

\`\`\`json
"s3:GetObject"
"s3:PutObject"
"s3:DeleteObject"
\`\`\`

**If not found:**
1. Click **Add permissions** → **Create inline policy**
2. Select **JSON** tab
3. Paste this policy:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FuelLogbookS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
\`\`\`

**Replace `your-bucket-name` with your actual bucket name.**

4. Click **Review policy**
5. Give it a name: `FuelLogbookS3Access`
6. Click **Create policy**

---

## Step 4: Verify Bucket Policy

1. Still in S3 Buckets list, click your bucket name
2. Click **Permissions** tab
3. Scroll to **Bucket policy**
4. If policy is very restrictive, click **Edit**
5. Ensure it allows GetObject:

Check if this statement exists:

\`\`\`json
{
  "Sid": "PublicReadGetObject",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::your-bucket-name/*"
}
\`\`\`

If not, add it to the policy and save.

---

## Step 5: Check Block Public Access Settings

1. In S3 Buckets, click your bucket name
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit**

The recommended settings for file access:
- ✓ Block public access to buckets and objects granted through **new** access control lists (ACLs) — Checked
- ✓ Block public access to buckets and objects granted through **any** access control lists (ACLs) — Checked
- ☐ Block public access to buckets and objects granted through **new** public bucket or access point policies — **Unchecked** (allows GetObject)
- ☐ Block public access to buckets and objects granted through **any** public bucket or access point policies — **Unchecked** (allows GetObject)

5. Click **Save changes**

---

## Step 6: Check S3 Key Path Structure

The receipts should be stored at:
\`\`\`
receipts/{userId}/{carId}/{logId}-{timestamp}.avif
\`\`\`

**NOT** with extra nested folders like:
\`\`\`
receipts/user-123/car-456/receipts/subfolder/file.avif  ❌ WRONG
\`\`\`

To verify:
1. Go to S3 bucket
2. Click **Objects** tab
3. Navigate to `receipts/` folder
4. You should see user ID folders directly
5. Inside each user ID folder, car ID folders
6. Inside car folders, AVIF files with format `{logId}-{timestamp}.avif`

If you see extra folders, the upload endpoint needs fixing (see app/api/upload-receipt/route.ts).

---

## Step 7: Verify Environment Variables

In **Vercel Dashboard**:

1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Verify these exist and have correct values:
   - `AWS_REGION` - e.g., `us-east-1`
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
   - `AWS_S3_BUCKET_NAME` - Your bucket name

4. If missing or incorrect:
   - Update the values
   - Click **Save**
   - Go to **Deployments** and trigger a redeploy

---

## Step 8: Test Receipt Upload and Display

1. Go to your app dashboard
2. Select a vehicle → Click "Add Fuel Log"
3. Upload a receipt image (JPEG, PNG, etc.)
4. Complete the fuel log form
5. Click **Add Fuel Log**
6. Wait for "Successfully uploaded" message
7. Click "View Details" on the fuel log
8. Receipt image should display without errors

---

## Still Getting AccessDenied?

### Checklist:

- [ ] CORS configuration saved in S3 bucket
- [ ] Your app domain added to CORS AllowedOrigins
- [ ] IAM user has s3:GetObject permission
- [ ] Bucket policy allows public GetObject access
- [ ] Block public access settings correct
- [ ] Environment variables set in Vercel
- [ ] App redeployed after changes
- [ ] Browser cache cleared (Ctrl+Shift+R)

### If Still Failing:

1. **Check S3 Bucket Public Access:**
   - Bucket → Permissions → Scroll down
   - See "Public access" indicator
   - Should show "Objects can be public"

2. **Check Object ACL:**
   - Go to S3 Buckets → Click bucket
   - Click Objects → receipts/ folder
   - Select a .avif file
   - Click Object ACL
   - Ensure "Everyone (public access)" has "Read" permission

3. **Check CloudFront (if using):**
   - If using CloudFront, update its distribution
   - May need cache invalidation: `/receipts/*`

---

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| CORS errors in console | Check CORS config in S3, add your domain |
| 403 Forbidden | Fix IAM permissions and bucket policy |
| 404 Not Found | Verify S3 key path structure is correct |
| Mixed content warning | Use HTTPS URL, not HTTP |
| Image won't load | Clear browser cache, check file exists in S3 |

---

## AWS CLI Check (Optional)

If you're comfortable with CLI, verify with:

\`\`\`bash
# Check if file exists in S3
aws s3 ls s3://your-bucket-name/receipts/ --recursive

# Check CORS configuration
aws s3api get-bucket-cors --bucket your-bucket-name

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
\`\`\`

Replace `your-bucket-name` with your actual bucket name.

---

## After Fix Verification

Once fixed:
1. Upload a new receipt
2. View fuel log details
3. Receipt image displays clearly
4. No XML error messages
5. Image can be saved from right-click menu

**All receipts now working!**
