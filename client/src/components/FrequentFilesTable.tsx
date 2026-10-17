import React from 'react';
import type { FrequentFilesResponse } from '../types/frequentFiles';
import { FileCode } from 'lucide-react';

interface FrequentFilesTableProps {
  data: FrequentFilesResponse | null;
  isLoading?: boolean;
}

export const FrequentFilesTable: React.FC<FrequentFilesTableProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3 animate-pulse">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="space-y-2">
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  if (!data || !data.files || data.files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
      {/* Title & Metadata note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-neutral-700" />
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Code Churn & Hotspots
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <span>Sampled {data.analyzedCommits} commits</span>
          <span>•</span>
          <span>{data.totalUniqueFiles} unique files touched</span>
        </div>
      </div>

      {/* Structured Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono text-[11px]">
              <th className="pb-2 font-medium">File Path</th>
              <th className="pb-2 font-medium text-right">Modifications</th>
              <th className="pb-2 font-medium text-right">Additions</th>
              <th className="pb-2 font-medium text-right">Deletions</th>
              <th className="pb-2 font-medium text-right">Total Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono">
            {data.files.map((file, idx) => {
              return (
                <tr key={file.filename} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 pr-4 text-neutral-900 max-w-xs sm:max-w-md truncate">
                    <span className="text-neutral-400 mr-2 font-sans text-[11px]">#{idx + 1}</span>
                    <span className="font-semibold text-neutral-800">{file.filename}</span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-neutral-800">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                      {file.modifications} {file.modifications === 1 ? 'commit' : 'commits'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-emerald-700">
                    +{file.additions}
                  </td>
                  <td className="py-2.5 text-right text-rose-700">
                    -{file.deletions}
                  </td>
                  <td className="py-2.5 text-right font-medium text-neutral-600">
                    {file.changes} lines
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.note && (
        <div className="pt-2 text-[11px] text-neutral-400 font-mono">
          {data.note}
        </div>
      )}
    </div>
  );
};
