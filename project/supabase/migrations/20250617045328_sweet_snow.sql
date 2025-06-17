/*
  # Chart Analytics Database Schema

  1. New Tables
    - `users` - User authentication and profiles
    - `excel_uploads` - Track uploaded Excel files
    - `chart_generations` - Store generated chart configurations
    - `chart_downloads` - Track chart download analytics
    - `user_sessions` - Track user activity sessions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for analytics (optional)

  3. Features
    - File upload tracking
    - Chart generation history
    - Download analytics
    - User session management
    - Performance metrics
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free',
  charts_generated integer DEFAULT 0,
  charts_downloaded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create excel_uploads table
CREATE TABLE IF NOT EXISTS excel_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  sheet_names text[] NOT NULL,
  total_rows integer NOT NULL,
  total_columns integer NOT NULL,
  upload_status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Create chart_generations table
CREATE TABLE IF NOT EXISTS chart_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES excel_uploads(id) ON DELETE CASCADE,
  chart_type text NOT NULL, -- 'bar', 'line', 'pie', 'combo'
  chart_title text NOT NULL,
  chart_description text,
  chart_config jsonb NOT NULL, -- Store complete Chart.js config
  insights text[] NOT NULL,
  statistics jsonb, -- Store calculated statistics
  generation_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create chart_downloads table
CREATE TABLE IF NOT EXISTS chart_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chart_id uuid REFERENCES chart_generations(id) ON DELETE CASCADE,
  download_format text DEFAULT 'png',
  download_quality text DEFAULT 'high',
  file_size_kb integer,
  downloaded_at timestamptz DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  files_uploaded integer DEFAULT 0,
  charts_generated integer DEFAULT 0,
  charts_downloaded integer DEFAULT 0,
  total_time_minutes integer,
  user_agent text,
  ip_address inet
);

-- Create analytics summary table
CREATE TABLE IF NOT EXISTS analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date DEFAULT CURRENT_DATE,
  total_users integer DEFAULT 0,
  total_uploads integer DEFAULT 0,
  total_charts_generated integer DEFAULT 0,
  total_downloads integer DEFAULT 0,
  popular_chart_types jsonb DEFAULT '{}',
  avg_generation_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User profiles: Users can read/update their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Excel uploads: Users can manage their own uploads
CREATE POLICY "Users can read own uploads"
  ON excel_uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON excel_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads"
  ON excel_uploads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chart generations: Users can manage their own charts
CREATE POLICY "Users can read own charts"
  ON chart_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charts"
  ON chart_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own charts"
  ON chart_generations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chart downloads: Users can manage their own downloads
CREATE POLICY "Users can read own downloads"
  ON chart_downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON chart_downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User sessions: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Analytics summary: Public read access for dashboard
CREATE POLICY "Public can read analytics summary"
  ON analytics_summary
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_excel_uploads_user_id ON excel_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_excel_uploads_created_at ON excel_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_chart_generations_user_id ON chart_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_generations_upload_id ON chart_generations(upload_id);
CREATE INDEX IF NOT EXISTS idx_chart_generations_chart_type ON chart_generations(chart_type);
CREATE INDEX IF NOT EXISTS idx_chart_generations_created_at ON chart_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_chart_downloads_user_id ON chart_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_downloads_chart_id ON chart_downloads(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_downloads_downloaded_at ON chart_downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date);

-- Create functions for analytics

-- Function to update user profile stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'chart_generations' THEN
    UPDATE user_profiles 
    SET charts_generated = charts_generated + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF TG_TABLE_NAME = 'chart_downloads' THEN
    UPDATE user_profiles 
    SET charts_downloaded = charts_downloaded + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_user_charts_generated
  AFTER INSERT ON chart_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_charts_downloaded
  AFTER INSERT ON chart_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to update analytics summary daily
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void AS $$
DECLARE
  today_date date := CURRENT_DATE;
BEGIN
  INSERT INTO analytics_summary (
    date,
    total_users,
    total_uploads,
    total_charts_generated,
    total_downloads,
    popular_chart_types,
    avg_generation_time_ms
  )
  SELECT 
    today_date,
    (SELECT COUNT(DISTINCT user_id) FROM excel_uploads WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM excel_uploads WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM chart_generations WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM chart_downloads WHERE DATE(downloaded_at) = today_date),
    (SELECT jsonb_object_agg(chart_type, count) 
     FROM (
       SELECT chart_type, COUNT(*) as count 
       FROM chart_generations 
       WHERE DATE(created_at) = today_date 
       GROUP BY chart_type
     ) chart_counts),
    (SELECT AVG(generation_time_ms)::integer FROM chart_generations WHERE DATE(created_at) = today_date)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_uploads = EXCLUDED.total_uploads,
    total_charts_generated = EXCLUDED.total_charts_generated,
    total_downloads = EXCLUDED.total_downloads,
    popular_chart_types = EXCLUDED.popular_chart_types,
    avg_generation_time_ms = EXCLUDED.avg_generation_time_ms;
END;
$$ LANGUAGE plpgsql;