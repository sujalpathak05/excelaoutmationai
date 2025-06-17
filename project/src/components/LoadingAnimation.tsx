import React from 'react';
import { Brain, Zap } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Analyzing your data with AI..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>AI is processing your data...</span>
        </div>
      </div>
      
      <div className="flex space-x-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};