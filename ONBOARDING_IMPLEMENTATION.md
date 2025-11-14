# Onboarding Implementation Guide

## ✅ Completed

### 1. Database Migration
- Added `onboarding_completed_at` column to `organizations` table
- Added `industry` column to `organizations` table
- Added `size` column to `organizations` table
- Created indexes for efficient queries
- Migration script: `infra/migrations/run_onboarding_migrations.sql`

### 2. API Endpoints
- `POST /api/org/onboarding/complete` - Mark onboarding as complete and save data
- `GET /api/org/onboarding/status` - Check if organization has completed onboarding

### 3. Frontend Updates
- Updated onboarding pages to check organization status
- Updated onboarding flow to save data to database
- Organization-level onboarding completion (all users in org skip after first completion)

### 4. Data Storage
- Organization data (name, industry, size) → `organizations` table
- Brand data (website, social media, description) → `brand_sources` table

## 🔍 Verification Steps

### 1. Verify Migration
Run this in Supabase SQL Editor to verify columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN ('onboarding_completed_at', 'industry', 'size');
```

You should see:
- `onboarding_completed_at` (timestamp with time zone, nullable)
- `industry` (text, nullable)
- `size` (text, nullable)

### 2. Test Onboarding Flow

1. **Sign up as a new user**
   - Go to `/login`
   - Sign in with Google or email
   - Should be redirected to `/onboarding/bootstrap`

2. **Complete onboarding**
   - Fill in organization name, industry, size
   - Fill in brand information (website, social media, description)
   - Click "Enter Dashboard"

3. **Verify data was saved**
   ```sql
   -- Check organization data
   SELECT id, name, industry, size, onboarding_completed_at
   FROM organizations
   WHERE onboarding_completed_at IS NOT NULL
   ORDER BY onboarding_completed_at DESC
   LIMIT 1;

   -- Check brand sources
   SELECT organization_id, type, url, raw_text
   FROM brand_sources
   WHERE organization_id = '<your-org-id>'
   ORDER BY created_at DESC;
   ```

4. **Test skip onboarding**
   - Sign in as a different user
   - Add them to the same organization
   - They should skip onboarding and go straight to dashboard

### 3. Test API Endpoints

#### Check Onboarding Status
```bash
curl -X GET "http://localhost:3000/api/org/onboarding/status" \
  -H "Cookie: sb-<project-ref>-auth-token=<your-session-cookie>"
```

Expected response:
```json
{
  "isComplete": false,
  "completedAt": null,
  "orgId": "<org-id>"
}
```

#### Complete Onboarding
```bash
curl -X POST "http://localhost:3000/api/org/onboarding/complete" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project-ref>-auth-token=<your-session-cookie>" \
  -d '{
    "organizationData": {
      "name": "My Company",
      "industry": "Café",
      "size": "1-10 employees"
    },
    "brandData": {
      "website": "https://example.com",
      "instagram": "@mybrand",
      "facebook": "https://facebook.com/mybrand",
      "twitter": "@mybrand",
      "description": "A cozy café with great music"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "orgId": "<org-id>"
}
```

## 🔐 RLS Policies

The existing RLS policies should work correctly:
- **Organizations table**: `lyra_org_update_admin` policy requires `owner` or `admin` role
- **New users**: Get `owner` role when they bootstrap their organization
- **Brand sources**: `lyra_brand_sources_insert` policy allows any org member to insert

## 📝 Notes

### Organization-Level Onboarding
- Once an organization completes onboarding, **all users** in that organization skip onboarding
- This is organization-level, not user-level
- New users joining an organization that has completed onboarding will skip the flow

### Data Persistence
- All onboarding data is stored in the database
- Organization data is stored in `organizations` table
- Brand data is stored in `brand_sources` table
- Data persists across devices and browsers

### Error Handling
- If API call fails, onboarding still completes (user is redirected to dashboard)
- Errors are logged to console for debugging
- Brand source insertions don't fail the request if they error

## 🚀 Next Steps

1. **Test the flow** with a new user account
2. **Verify data** is being saved correctly
3. **Test skip onboarding** with a second user in the same organization
4. **Monitor logs** for any errors during onboarding completion

## 🐛 Troubleshooting

### Migration didn't run
- Check Supabase dashboard SQL Editor for errors
- Verify columns exist using the verification query above

### RLS Policy blocking updates
- Verify user has `owner` or `admin` role in organization
- Check `user_memberships` table for user's role

### Brand sources not saving
- Check `brand_sources` table for inserted records
- Verify RLS policy allows insertions
- Check console logs for errors

### Onboarding status not working
- Verify API endpoint is accessible
- Check user has organization membership
- Verify organization exists in database

