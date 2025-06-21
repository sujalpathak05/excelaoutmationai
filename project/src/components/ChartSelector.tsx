import React, { useState } from 'react';
import { ExcelData, AIAnalysis } from '../types';
import { ChartGenerator } from '../services/chartGenerator';
import { DatabaseService } from '../services/databaseService';
import { LoadingAnimation } from './LoadingAnimation';
import { ChartDisplay } from './ChartDisplay';
import { BarChart3, LineChart, PieChart, TrendingUp, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChartSelectorProps {
  data: ExcelData;
  userId: string;
  uploadId: string;
}

export const ChartSelector: React.FC<ChartSelectorProps> = ({ data, userId, uploadId }) => {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [chartIds, setChartIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartTypes = [
    { type: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
    { type: 'line', name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
    { type: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
    { type: 'combo', name: 'Combo Chart', icon: TrendingUp, description: 'Multiple metrics with dual axes' }
  ];

  const generateAllCharts = async () => {
    setIsGenerating(true);
    setError(null);
    setAnalyses([]);
    setChartIds([]);

    try {
      const allAnalyses: AIAnalysis[] = [];
      const allChartIds: string[] = [];
      
      // Generate different chart types based on data
      for (let i = 0; i < 4; i++) {
        const startTime = Date.now();
        const analysis = await ChartGenerator.generateChartConfig(data);
        const generationTime = Date.now() - startTime;
        
        // Modify chart type for variety
        const modifiedAnalysis = { ...analysis };
        switch (i) {
          case 0:
            modifiedAnalysis.config.type = 'bar';
            modifiedAnalysis.chartType = 'Bar Chart';
            modifiedAnalysis.title = modifiedAnalysis.title.replace(/Analysis|Distribution/, 'Bar Chart Analysis');
            break;
          case 1:
            modifiedAnalysis.config.type = 'line';
            modifiedAnalysis.chartType = 'Line Chart';
            modifiedAnalysis.title = modifiedAnalysis.title.replace(/Analysis|Distribution/, 'Trend Analysis');
            modifiedAnalysis.config.data.datasets[0].borderColor = '#3B82F6';
            modifiedAnalysis.config.data.datasets[0].backgroundColor = 'transparent';
            modifiedAnalysis.config.data.datasets[0].borderWidth = 3;
            modifiedAnalysis.config.data.datasets[0].fill = false;
            modifiedAnalysis.config.data.datasets[0].tension = 0.4;
            break;
          case 2:
            if (modifiedAnalysis.config.data.labels.length <= 8) {
              modifiedAnalysis.config.type = 'pie';
              modifiedAnalysis.chartType = 'Pie Chart';
              modifiedAnalysis.title = modifiedAnalysis.title.replace(/Analysis|Distribution/, 'Pie Chart Distribution');
              modifiedAnalysis.config.data.datasets[0].backgroundColor = [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
              ].slice(0, modifiedAnalysis.config.data.labels.length);
            }
            break;
          case 3:
            modifiedAnalysis.config.type = 'doughnut';
            modifiedAnalysis.chartType = 'Doughnut Chart';
            modifiedAnalysis.title = modifiedAnalysis.title.replace(/Analysis|Distribution/, 'Doughnut Chart');
            if (modifiedAnalysis.config.data.labels.length <= 8) {
              modifiedAnalysis.config.data.datasets[0].backgroundColor = [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
              ].slice(0, modifiedAnalysis.config.data.labels.length);
            }
            break;
        }
        
        // Save chart to database
        const savedChart = await DatabaseService.saveChartGeneration(
          userId,
          uploadId,
          modifiedAnalysis,
          generationTime
        );
        
        allAnalyses.push(modifiedAnalysis);
        allChartIds.push(savedChart.id);
      }
      
      setAnalyses(allAnalyses);
      setChartIds(allChartIds);
    } catch (err) {
      setError('Failed to generate charts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChartDownload = async (chartIndex: number) => {
    if (chartIds[chartIndex]) {
      try {
        // Get canvas and calculate file size
        const canvas = document.querySelector('canvas');
        let fileSizeKb = 0;
        
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          fileSizeKb = Math.round((dataUrl.length * 0.75) / 1024); // Approximate size in KB
        }
        
        // Track download in database
        await DatabaseService.trackChartDownload(
          userId,
          chartIds[chartIndex],
          'png',
          'high',
          fileSizeKb
        );
      } catch (error) {
        console.error('Error tracking download:', error);
      }
    }
  };

  const nextChart = () => {
    setCurrentIndex((prev) => (prev + 1) % analyses.length);
  };

  const prevChart = () => {
    setCurrentIndex((prev) => (prev - 1 + analyses.length) % analyses.length);
  };

  if (isGenerating) {
    return <LoadingAnimation message="Generating multiple chart types and saving to database..." />;
  }

  if (analyses.length === 0) {
    return (
      <>
        <div className="w-full text-center py-4 flex flex-col items-center space-y-4">
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {chartTypes.map((chart, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <chart.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{chart.name}</h3>
                  <p className="text-xs text-gray-600">{chart.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full max-w-sm mx-auto hidden sm:block">
            <button
              onClick={generateAllCharts}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Generate All Chart Types & Save to Database</span>
            </button>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 px-4">
              AI will create Bar, Line, Pie, and Combo charts and save them to your personal dashboard
            </p>
          </div>
        </div>
        {/* Mobile fixed bottom button */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/50 backdrop-blur-sm border-t border-gray-200 z-50">
          <button
            onClick={generateAllCharts}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate All Chart Types</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Chart Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Chart {currentIndex + 1} of {analyses.length}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevChart}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={analyses.length <= 1}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={nextChart}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={analyses.length <= 1}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex flex-wrap gap-2">
          {analyses.map((analysis, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentIndex === index
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {analysis.chartType}
            </button>
          ))}
        </div>
      </div>

      {/* Current Chart Display */}
      {analyses[currentIndex] && (
        <ChartDisplay 
          analysis={analyses[currentIndex]} 
          onDownload={() => handleChartDownload(currentIndex)}
        />
      )}

      {/* Generate New Charts Button */}
      <div className="text-center">
        <button
          onClick={generateAllCharts}
          className="inline-flex items-center space-x-2 px-4 py-3 text-base sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full max-w-sm mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Regenerate All Charts</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};