import React from 'react';
import type { CommitSummary } from '../types/commit';
import { GitCommit, GitMerge } from 'lucide-react';

interface VisualTimelineProps {
  commits: CommitSummary[];
  onSelectCommit: (commit: CommitSummary) => void;
  selectedCommitSha: string | null;
  filteredAuthor: string | null;
}

export const VisualTimeline: React.FC<VisualTimelineProps> = ({
  commits,
  onSelectCommit,
  selectedCommitSha,
  filteredAuthor,
}) => {
  const displayedCommits = filteredAuthor
    ? commits.filter((c) => {
        const login = c.author.login || c.committer.login || '';
        const name = c.author.name || '';
        return (
          login.toLowerCase() === filteredAuthor.toLowerCase() ||
          name.toLowerCase().includes(filteredAuthor.toLowerCase())
        );
      })
    : commits;

  if (displayedCommits.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center text-xs text-neutral-500">
        No commits found for the active filter.
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Commit Timeline
        </h2>
        <span className="text-xs text-neutral-500 font-mono">
          {displayedCommits.length} commits
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-neutral-200 space-y-3">
        {displayedCommits.map((commit) => {
          const isSelected = selectedCommitSha === commit.sha;
          const isMerge = commit.parentShas && commit.parentShas.length > 1;
          const authorName = commit.author.name || commit.author.login || 'Unknown';
          const commitDate = commit.author.date ? new Date(commit.author.date) : null;

          return (
            <div key={commit.sha} className="relative text-left">
              {/* Timeline node */}
              <div
                className={`absolute -left-6 top-3 w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-500'
                }`}
              >
                {isMerge ? (
                  <GitMerge className="w-2.5 h-2.5" />
                ) : (
                  <GitCommit className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Commit card */}
              <div
                onClick={() => onSelectCommit(commit)}
                className={`rounded border p-3 cursor-pointer transition text-left ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {commit.author.avatarUrl ? (
                      <img
                        src={commit.author.avatarUrl}
                        alt={authorName}
                        className="w-4 h-4 rounded border border-neutral-200 shrink-0"
                      />
                    ) : null}
                    <span className="font-medium text-neutral-800">
                      {authorName}
                    </span>
                    {commit.author.login && (
                      <span className="text-neutral-400 text-[11px]">
                        @{commit.author.login}
                      </span>
                    )}
                    {isMerge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-100 text-neutral-700 border border-neutral-200">
                        merge
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                    {commitDate && (
                      <span>
                        {commitDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    <span className="px-1 py-0.2 rounded bg-neutral-100 border border-neutral-200 text-neutral-700">
                      {commit.shortSha}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-900 leading-snug line-clamp-2">
                  {commit.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
