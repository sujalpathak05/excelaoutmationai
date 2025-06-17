import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { DatabaseService } from '../services/databaseService';
import { BarChart3, Download, FileSpreadsheet, TrendingUp, Calendar, LogOut, User as UserIcon, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserDashboardProps {
  user: User;
}

interface UserStats {
  profile: {
    full_name: string;
    email: string;
    phone_number: string;
    created_at: string;
  };
  totalUploads: number;
  totalCharts: number;
  totalDownloads: number;
  chartTypeBreakdown: { [key: string]: number };
  recentActivity: any;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentCharts, setRecentCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userStats, charts] = await Promise.all([
        DatabaseService.getUserStats(user.id),
        DatabaseService.getUserCharts(user.id, 5)
      ]);
      
      setStats(userStats);
      setRecentCharts(charts || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();

    // Subscribe to real-time changes
    const uploadsSubscription = supabase
      .channel('excel_uploads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'excel_uploads',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Upload change detected:', payload);
          loadUserData();
        }
      )
      .subscribe();

    const chartsSubscription = supabase
      .channel('chart_generations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chart_generations',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Chart change detected:', payload);
          loadUserData();
        }
      )
      .subscribe();

    const downloadsSubscription = supabase
      .channel('chart_downloads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chart_downloads',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Download change detected:', payload);
          loadUserData();
        }
      )
      .subscribe();

    const profileSubscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Profile change detected:', payload);
          loadUserData();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      uploadsSubscription.unsubscribe();
      chartsSubscription.unsubscribe();
      downloadsSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [user.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {stats?.profile?.full_name || user.email}!
          </h2>
          <p className="text-gray-600">Here's your chart analytics overview</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Profile Details */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-900">{stats?.profile?.full_name || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{stats?.profile?.email || user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{stats?.profile?.phone_number || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Breakdown */}
      {stats?.chartTypeBreakdown && Object.keys(stats.chartTypeBreakdown).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Types Generated</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.chartTypeBreakdown).map(([type, count]) => (
              <div key={type} className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 capitalize">{type}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Charts */}
      {recentCharts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Charts</h3>
          <div className="space-y-3">
            {recentCharts.map((chart) => (
              <div key={chart.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{chart.chart_title}</p>
                    <p className="text-sm text-gray-600 capitalize">{chart.chart_type} Chart</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(chart.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};