# Supabase Database Setup for VAPR

This guide will help you set up the Supabase database for storing camera configurations.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - **Name**: verve-recorder (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to you
4. Click "Create new project" and wait for it to initialize

## 2. Create the Cameras Table

1. In your Supabase project dashboard, go to the **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension (Supabase uses gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing table if you need to recreate it
DROP TABLE IF EXISTS cameras CASCADE;

-- Create cameras table with all required fields
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  rtsp_url TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX idx_cameras_created_at ON cameras(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for local use)
-- NOTE: For production, you should implement proper authentication and more restrictive policies
CREATE POLICY "Allow all operations on cameras" ON cameras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cameras_updated_at
  BEFORE UPDATE ON cameras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL

## 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Find the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## 4. Configure Environment Variables

1. In your VAPR project root, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the values with your actual Supabase URL and anon key

## 5. Restart Your Development Server

```bash
npm run dev
```

## 6. Test the Integration

1. Open your VAPR application at `http://localhost:3000`
2. Click the "+ Add Camera" button
3. Fill in camera details and submit
4. Go to your Supabase dashboard → **Table Editor** → **cameras**
5. You should see your camera record in the database!

## Database Schema

The `cameras` table has the following structure:

| Column       | Type      | Description                                       |
| ------------ | --------- | ------------------------------------------------- |
| `id`         | UUID      | Unique identifier for the camera (auto-generated) |
| `name`       | TEXT      | Display name of the camera                        |
| `rtsp_url`   | TEXT      | RTSP stream URL                                   |
| `created_at` | TIMESTAMP | When the camera was added (auto-generated)        |
| `updated_at` | TIMESTAMP | When the camera was last modified (auto-updated)  |

## Security Notes

⚠️ **Important**: The current setup uses a permissive policy that allows all operations without authentication. This is suitable for local development but **NOT recommended for production**.

For production use, you should:

1. Implement user authentication
2. Update the RLS policies to restrict access based on user identity
3. Consider adding additional validation and constraints

## Troubleshooting

### Issue: "Failed to fetch cameras"

- Check that your `.env.local` file exists and has the correct values
- Verify your Supabase URL and anon key are correct
- Ensure your Supabase project is running (check the dashboard)

### Issue: "Failed to create camera"

- Check that the `cameras` table was created correctly in Supabase
- Verify RLS policies are set up properly
- Check the browser console for detailed error messages

### Issue: "Environment variables are not set"

- Restart your development server after creating `.env.local`
- Make sure the environment variables start with `NEXT_PUBLIC_`
- Check that there are no typos in the variable names

## Migration from localStorage

The application will automatically migrate from localStorage to Supabase. However, **existing cameras in localStorage will NOT be automatically migrated**. You'll need to:

1. Note down your existing camera configurations (if any)
2. Re-add them using the "+ Add Camera" button
3. They will now be saved to Supabase instead of localStorage

## Next Steps

- **Backup**: Consider setting up regular backups of your Supabase database
- **Authentication**: For multi-user scenarios, implement Supabase Auth
- **Monitoring**: Use Supabase's built-in monitoring tools to track database usage
