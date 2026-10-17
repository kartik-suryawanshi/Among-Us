import React from 'react';
import type { FileHotspot } from '../types/hotspot';
import { FileText } from 'lucide-react';

interface FileHotspotsViewProps {
  hotspots: FileHotspot[];
  analyzedCommitsCount: number;
  isLoading?: boolean;
}

export const FileHotspotsView: React.FC<FileHotspotsViewProps> = ({
  hotspots,
  analyzedCommitsCount,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-neutral-200 rounded" />
        <div className="space-y-2">
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  if (!hotspots || hotspots.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-neutral-700" />
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Frequently Modified Files
          </h2>
        </div>
        <span className="text-xs text-neutral-500 font-mono">
          Last {analyzedCommitsCount} commits
        </span>
      </div>

      {/* Files List */}
      <div className="divide-y divide-neutral-100">
        {hotspots.map((file) => {
          return (
            <div
              key={file.filename}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs text-neutral-900 truncate">
                  {file.filename}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Primary author: {file.primaryAuthor}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-neutral-600 font-mono text-[11px]">
                <span className="text-emerald-700">+{file.additions}</span>
                <span className="text-rose-700">-{file.deletions}</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {file.changesCount} {file.changesCount === 1 ? 'revision' : 'revisions'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
