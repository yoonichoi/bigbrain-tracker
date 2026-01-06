# Supabase Setup Guide

## 1️⃣ Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click "New Project"
4. Fill in:
   - **Name**: bigbrain-tracker
   - **Database Password**: (save this!)
   - **Region**: Northeast Asia (Tokyo) - 가장 가까운 서버
5. Wait for project creation (~2 minutes)

## 2️⃣ Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** (or Cmd/Ctrl + Enter)
5. ✅ You should see "Success. No rows returned"

## 3️⃣ Get API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

## 4️⃣ Configure Local Environment

1. Create `.env` file in project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
   VITE_REGISTER_CODE=YOUR_REGISTER_CODE_HERE
   ```

## 5️⃣ Test Database

In Supabase SQL Editor, test the setup:

```sql
-- Check tables
SELECT * FROM users;
SELECT * FROM checkins;

-- Test user stats function
SELECT * FROM get_user_stats('테스트유저');
```

## 6️⃣ Security Settings (Optional but Recommended)

In Supabase Dashboard → **Authentication** → **Settings**:

- Disable email confirmations (we're using password-only auth)
- Set JWT expiry to something reasonable

## ✅ Done!

Your Supabase backend is ready. Now you can:

```bash
npm install
npm run dev
```

---

## 📊 Database Structure

### `users` table
- `id`: UUID (primary key)
- `username`: TEXT (unique)
- `password`: TEXT
- `created_at`: TIMESTAMP

### `checkins` table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key → users)
- `username`: TEXT
- `date`: TEXT (format: MM/DD)
- `problem`: TEXT
- `created_at`: TIMESTAMP
- UNIQUE(username, date) - prevents duplicate checkins

---

## 🔒 Security Notes

- RLS (Row Level Security) is enabled
- All tables use policies for access control
- Passwords are stored as plain text (4-digit PIN) - consider bcrypt for production
- The `anon` key is safe to use in frontend (public)

