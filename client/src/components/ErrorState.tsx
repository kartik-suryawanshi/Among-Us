import React from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showBackToSearch?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Repository',
  message,
  onRetry,
  showBackToSearch = true,
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-8 sm:p-10 text-center max-w-xl mx-auto shadow-xs space-y-5">
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight">{title}</h3>
        <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-center space-x-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}

        {showBackToSearch && (
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Link>
        )}
      </div>
    </div>
  );
};
