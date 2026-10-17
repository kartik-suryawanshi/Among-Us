import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching repository from GitHub...',
  submessage = 'Contacting the Express API backend to retrieve public repository data.',
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
      <div className="flex justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-neutral-900">{message}</h3>
        <p className="text-sm text-neutral-500">{submessage}</p>
      </div>
    </div>
  );
};
