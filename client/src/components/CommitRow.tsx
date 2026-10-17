import React from 'react';
import { ChevronRight, User } from 'lucide-react';
import type { CommitSummary } from '../types/commit';

interface CommitRowProps {
  commit: CommitSummary;
  isSelected?: boolean;
  onSelect: (commit: CommitSummary) => void;
}

export const CommitRow: React.FC<CommitRowProps> = ({
  commit,
  isSelected = false,
  onSelect,
}) => {
  const formatCommitTime = (dateString: string | null): string => {
    if (!dateString) return 'Date unknown';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Get primary message line (title)
  const fullMessage = commit.message || '(No commit message)';
  const firstLine = fullMessage.split('\n')[0];
  const hasExtraLines = fullMessage.includes('\n');

  const authorDisplayName = commit.author.name || commit.author.login || 'Unknown author';

  return (
    <div
      onClick={() => onSelect(commit)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(commit);
        }
      }}
      className={`group flex items-start justify-between p-3.5 sm:px-4 sm:py-3 border-b border-neutral-100 last:border-b-0 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-emerald-50/60 border-l-2 border-l-emerald-600'
          : 'hover:bg-neutral-50/80 bg-white'
      }`}
    >
      <div className="flex items-start space-x-3 min-w-0 pr-4">
        {commit.author.avatarUrl ? (
          <img
            src={commit.author.avatarUrl}
            alt={authorDisplayName}
            className="w-5 h-5 rounded-full border border-neutral-200 mt-0.5 shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mt-0.5 shrink-0 text-neutral-500">
            <User className="w-3 h-3" />
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-sm font-medium tracking-tight truncate block ${
                isSelected ? 'text-emerald-950 font-semibold' : 'text-neutral-900'
              }`}
              title={fullMessage}
            >
              {firstLine}
            </span>
            {hasExtraLines && (
              <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1 rounded select-none">
                ...
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-2.5 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{authorDisplayName}</span>
            <span>committed on {formatCommitTime(commit.author.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 pt-0.5">
        <span
          className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200 group-hover:border-neutral-300"
          title={`Full SHA: ${commit.sha}`}
        >
          {commit.shortSha}
        </span>
        <button
          type="button"
          aria-label="Inspect commit details"
          className="p-1 text-neutral-400 group-hover:text-neutral-800 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-emerald-700' : ''}`} />
        </button>
      </div>
    </div>
  );
};
