import { supabase } from '../lib/supabase';
import type { ExcelData, AIAnalysis } from '../types';
import type { ExcelUpload, ChartGeneration, ChartDownload, UserSession } from '../lib/supabase';

export class DatabaseService {
  // User Profile Management
  static async createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    phoneNumber: string
  ) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Excel Upload Management
  static async saveExcelUpload(
    userId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    excelData: ExcelData[]
  ): Promise<ExcelUpload> {
    const sheetNames = excelData.map(sheet => sheet.sheetName);
    const totalRows = excelData.reduce((sum, sheet) => sum + sheet.rows.length, 0);
    const totalColumns = Math.max(...excelData.map(sheet => sheet.headers.length));

    const { data, error } = await supabase
      .from('excel_uploads')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        sheet_names: sheetNames,
        total_rows: totalRows,
        total_columns: totalColumns
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserUploads(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('excel_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Chart Generation Management
  static async saveChartGeneration(
    userId: string,
    uploadId: string,
    analysis: AIAnalysis,
    generationTimeMs?: number
  ): Promise<ChartGeneration> {
    const { data, error } = await supabase
      .from('chart_generations')
      .insert({
        user_id: userId,
        upload_id: uploadId,
        chart_type: analysis.chartType.toLowerCase().replace(' chart', ''),
        chart_title: analysis.title,
        chart_description: analysis.description,
        chart_config: analysis.config,
        insights: analysis.insights,
        statistics: analysis.statistics,
        generation_time_ms: generationTimeMs
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserCharts(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('chart_generations')
      .select(`
        *,
        excel_uploads (
          file_name,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getChartsByUpload(uploadId: string) {
    const { data, error } = await supabase
      .from('chart_generations')
      .select('*')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Chart Download Tracking
  static async trackChartDownload(
    userId: string,
    chartId: string,
    format = 'png',
    quality = 'high',
    fileSizeKb?: number
  ): Promise<ChartDownload> {
    const { data, error } = await supabase
      .from('chart_downloads')
      .insert({
        user_id: userId,
        chart_id: chartId,
        download_format: format,
        download_quality: quality,
        file_size_kb: fileSizeKb
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getDownloadHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chart_downloads')
      .select(`
        *,
        chart_generations (
          chart_title,
          chart_type
        )
      `)
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Session Management
  static async startUserSession(userId: string, userAgent?: string): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserSession(
    sessionId: string,
    updates: {
      files_uploaded?: number;
      charts_generated?: number;
      charts_downloaded?: number;
      session_end?: string;
      total_time_minutes?: number;
    }
  ) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics
  static async getAnalyticsSummary(days = 30) {
    const { data, error } = await supabase
      .from('analytics_summary')
      .select('*')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getUserStats(userId: string) {
    const { data: profile } = await this.getUserProfile(userId);
    const { data: uploads } = await supabase
      .from('excel_uploads')
      .select('id')
      .eq('user_id', userId);
    
    const { data: charts } = await supabase
      .from('chart_generations')
      .select('chart_type')
      .eq('user_id', userId);

    const { data: downloads } = await supabase
      .from('chart_downloads')
      .select('id')
      .eq('user_id', userId);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(1)
      .single();

    return {
      profile,
      totalUploads: uploads?.length || 0,
      totalCharts: charts?.length || 0,
      totalDownloads: downloads?.length || 0,
      chartTypeBreakdown: charts?.reduce((acc: any, chart) => {
        acc[chart.chart_type] = (acc[chart.chart_type] || 0) + 1;
        return acc;
      }, {}) || {},
      recentActivity: recentActivity || null
    };
  }

  // Cleanup old data
  static async cleanupOldData(daysOld = 90) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    
    // Delete old sessions
    await supabase
      .from('user_sessions')
      .delete()
      .lt('session_start', cutoffDate);

    // Delete old uploads and related data
    const { data: oldUploads } = await supabase
      .from('excel_uploads')
      .select('id')
      .lt('created_at', cutoffDate);

    if (oldUploads && oldUploads.length > 0) {
      const uploadIds = oldUploads.map(upload => upload.id);
      
      // Delete related charts and downloads
      await supabase
        .from('chart_generations')
        .delete()
        .in('upload_id', uploadIds);
    }
  }
}