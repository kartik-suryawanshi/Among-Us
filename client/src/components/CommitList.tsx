import React from 'react';
import type { CommitSummary } from '../types/commit';
import { CommitRow } from './CommitRow';
import { Loader2, GitCommit } from 'lucide-react';

interface CommitListProps {
  commits: CommitSummary[];
  selectedCommitSha: string | null;
  onSelectCommit: (commit: CommitSummary) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export const CommitList: React.FC<CommitListProps> = ({
  commits,
  selectedCommitSha,
  onSelectCommit,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) => {
  if (commits.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-10 text-center space-y-2">
        <GitCommit className="w-8 h-8 text-neutral-400 mx-auto" />
        <h3 className="text-base font-semibold text-neutral-800">No Commits Found</h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          This repository does not have any public commits available on its default branch.
        </p>
      </div>
    );
  }

  // Group commits by date (e.g. "October 9, 2026")
  const groupedCommits: { [dateStr: string]: CommitSummary[] } = {};
  commits.forEach((commit) => {
    let groupKey = 'Undated Commits';
    if (commit.author.date) {
      try {
        const d = new Date(commit.author.date);
        groupKey = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(d);
      } catch {
        groupKey = 'Undated Commits';
      }
    }
    if (!groupedCommits[groupKey]) {
      groupedCommits[groupKey] = [];
    }
    groupedCommits[groupKey].push(commit);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Commit History
          </h2>
          <p className="text-xs text-neutral-500">
            Chronological commit records on the default branch.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
          {commits.length} {commits.length === 1 ? 'commit loaded' : 'commits loaded'}
        </span>
      </div>

      <div className="space-y-5">
        {Object.entries(groupedCommits).map(([dateLabel, groupItems]) => (
          <div key={dateLabel} className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-neutral-300" />
              <span>Commits on {dateLabel}</span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg shadow-xs overflow-hidden">
              {groupItems.map((commit) => (
                <CommitRow
                  key={commit.sha}
                  commit={commit}
                  isSelected={selectedCommitSha === commit.sha}
                  onSelect={onSelectCommit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-medium text-neutral-800 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 rounded-md shadow-xs disabled:opacity-50 transition-colors"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading older commits...</span>
              </>
            ) : (
              <span>Load More Commits</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
