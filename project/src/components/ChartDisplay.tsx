import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { AIAnalysis } from '../types';
import { BarChart3, Download, Lightbulb, TrendingUp, Target, Info } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface ChartDisplayProps {
  analysis: AIAnalysis;
  onDownload?: () => void;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ analysis, onDownload }) => {
  const renderChart = () => {
    const { config } = analysis;
    
    // For combo charts, use Bar component with mixed dataset types
    if (config.type === 'combo') {
      return <Bar data={config.data} options={config.options} height={400} />;
    }
    
    switch (config.type) {
      case 'bar':
        return <Bar data={config.data} options={config.options} height={400} />;
      case 'line':
        return <Line data={config.data} options={config.options} height={400} />;
      case 'pie':
        return <Pie data={config.data} options={config.options} height={400} />;
      case 'doughnut':
        return <Doughnut data={config.data} options={config.options} height={400} />;
      default:
        return <Bar data={config.data} options={config.options} height={400} />;
    }
  };

  const downloadChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${analysis.title.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
      
      // Call the onDownload callback to track in database
      if (onDownload) {
        onDownload();
      }
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{analysis.title}</h3>
              <p className="text-sm text-blue-600 font-medium">{analysis.chartType}</p>
            </div>
          </div>
          <button
            onClick={downloadChart}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Export PNG</span>
          </button>
        </div>
        
        <p className="text-gray-700 leading-relaxed">{analysis.description}</p>
      </div>

      {/* Statistics Cards */}
      {analysis.statistics && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Key Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analysis.statistics.max && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Maximum</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatNumber(analysis.statistics.max)}</p>
              </div>
            )}
            {analysis.statistics.min && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-gray-600">Minimum</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatNumber(analysis.statistics.min)}</p>
              </div>
            )}
            {analysis.statistics.mean && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Average</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatNumber(analysis.statistics.mean)}</p>
              </div>
            )}
            {analysis.statistics.total && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-600">Total</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatNumber(analysis.statistics.total)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ height: '500px' }}>
          {renderChart()}
        </div>

        {/* Insights Section */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="text-lg font-bold text-amber-900">AI-Generated Insights</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Type Indicator */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium text-blue-800">
              Chart Type: {analysis.chartType} • Saved to Database
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};