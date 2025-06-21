import React, { useState } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { UserDashboard } from './components/UserDashboard';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { ChartSelector } from './components/ChartSelector';
import { LoadingAnimation } from './components/LoadingAnimation';
import { ExcelParser } from './services/excelParser';
import { DatabaseService } from './services/databaseService';
import { ExcelData } from './types';
import { User } from '@supabase/supabase-js';
import { FileSpreadsheet, BarChart3, Sparkles, AlertTriangle } from 'lucide-react';

function AppContent({ user }: { user: User }) {
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<ExcelData | null>(null);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setExcelData([]);
    setSelectedSheet(null);
    setCurrentUploadId(null);

    try {
      const sheets = await ExcelParser.parseFile(file);
      setExcelData(sheets);
      
      if (sheets.length > 0) {
        setSelectedSheet(sheets[0]);
        
        // Save upload to database
        const upload = await DatabaseService.saveExcelUpload(
          user.id,
          file.name,
          file.size,
          file.type,
          sheets
        );
        setCurrentUploadId(upload.id);
      }
    } catch (err) {
      setError('Failed to parse Excel file. Please ensure it\'s a valid Excel or CSV file.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetApp = () => {
    setExcelData([]);
    setSelectedSheet(null);
    setCurrentUploadId(null);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-xl">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Excel Chart Analyzer</h1>
                <p className="text-xs sm:text-sm text-gray-600">AI-powered multi-chart visualization</p>
              </div>
            </div>
            <button
              onClick={resetApp}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* User Dashboard */}
        <UserDashboard user={user} />

        {excelData.length === 0 ? (
          /* Upload Section */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Multi-Chart Excel Analyzer
              </h2>
              <p className="text-lg text-gray-600">
                Upload your Excel file and get Bar, Line, Pie, and Combo charts with detailed analysis and database storage
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} isLoading={isUploading} />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Bar Charts</h3>
                <p className="text-sm text-gray-600">Compare values across categories</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Line Charts</h3>
                <p className="text-sm text-gray-600">Show trends and patterns</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pie Charts</h3>
                <p className="text-sm text-gray-600">Visualize proportions</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 border-2 border-orange-600 rounded"></div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Combo Charts</h3>
                <p className="text-sm text-gray-600">Multiple metrics together</p>
              </div>
            </div>
          </div>
        ) : (
          /* Data Analysis Section */
          <div className="space-y-8">
            {/* Sheet Selection */}
            {excelData.length > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Sheet</h3>
                <div className="flex flex-wrap gap-2">
                  {excelData.map((sheet, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSheet(sheet)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedSheet === sheet
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sheet.sheetName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data Table - Only show on desktop */}
            <div className="hidden sm:block">
              {selectedSheet && <DataTable data={selectedSheet} />}
            </div>

            {/* Unified Chart Generation */}
            {selectedSheet && currentUploadId && (
              <ChartSelector
                data={selectedSheet}
                userId={user.id}
                uploadId={currentUploadId}
              />
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthWrapper>
        {(user) => <AppContent user={user} />}
      </AuthWrapper>
      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-800 font-medium">
          This AI made by Uplakshy Pathak
        </div>
      </footer>
    </div>
  );
}

export default App;