import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: string;
  charts_generated: number;
  charts_downloaded: number;
  created_at: string;
  updated_at: string;
}

export interface ExcelUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  sheet_names: string[];
  total_rows: number;
  total_columns: number;
  upload_status: string;
  created_at: string;
}

export interface ChartGeneration {
  id: string;
  user_id: string;
  upload_id: string;
  chart_type: string;
  chart_title: string;
  chart_description?: string;
  chart_config: any;
  insights: string[];
  statistics?: any;
  generation_time_ms?: number;
  created_at: string;
}

export interface ChartDownload {
  id: string;
  user_id: string;
  chart_id: string;
  download_format: string;
  download_quality: string;
  file_size_kb?: number;
  downloaded_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  files_uploaded: number;
  charts_generated: number;
  charts_downloaded: number;
  total_time_minutes?: number;
  user_agent?: string;
  ip_address?: string;
}