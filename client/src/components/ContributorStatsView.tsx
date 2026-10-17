import React from 'react';
import type { Contributor } from '../types/contributor';
import { Users, X } from 'lucide-react';

interface ContributorStatsViewProps {
  contributors: Contributor[];
  totalContributions: number;
  selectedAuthorLogin: string | null;
  onSelectAuthor: (login: string | null) => void;
  isLoading?: boolean;
}

export const ContributorStatsView: React.FC<ContributorStatsViewProps> = ({
  contributors,
  totalContributions,
  selectedAuthorLogin,
  onSelectAuthor,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-neutral-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  if (!contributors || contributors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-neutral-700" />
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Contributors
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            ({contributors.length} total, {totalContributions} commits)
          </span>
        </div>

        {selectedAuthorLogin && (
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-300 px-2.5 py-1 rounded text-xs text-neutral-800">
            <span>Filter: @{selectedAuthorLogin}</span>
            <button
              onClick={() => onSelectAuthor(null)}
              className="text-neutral-500 hover:text-neutral-900 p-0.5"
              title="Clear author filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Distribution Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-neutral-100 rounded overflow-hidden flex">
          {contributors.map((c, i) => {
            const shades = [
              'bg-neutral-800',
              'bg-neutral-600',
              'bg-neutral-500',
              'bg-neutral-400',
              'bg-neutral-300',
            ];
            const shadeClass = shades[i % shades.length];
            const displayName = c.login ? `@${c.login}` : (c.name || 'Anonymous');
            return (
              <div
                key={c.login || `bar-${c.id || i}`}
                className={`${shadeClass} transition-opacity hover:opacity-80 ${c.login ? 'cursor-pointer' : ''}`}
                style={{ width: `${Math.max(c.percentage, 2)}%` }}
                title={`${displayName}: ${c.contributions} commits (${c.percentage}%)`}
                onClick={() => {
                  if (c.login) {
                    onSelectAuthor(selectedAuthorLogin === c.login ? null : c.login);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Contributors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contributors.map((c, idx) => {
          const isSelected = Boolean(
            selectedAuthorLogin &&
            c.login &&
            selectedAuthorLogin.toLowerCase() === c.login.toLowerCase()
          );
          const displayName = c.login ? `@${c.login}` : (c.name || 'Anonymous');

          return (
            <div
              key={c.login || `contrib-card-${c.id || idx}`}
              onClick={() => {
                if (c.login) {
                  onSelectAuthor(isSelected ? null : c.login);
                }
              }}
              className={`rounded-lg p-3.5 border transition text-left ${
                c.login ? 'cursor-pointer' : 'cursor-default'
              } ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-neutral-500">
                  #{idx + 1}
                </span>
                <span className="text-xs font-semibold text-neutral-900">
                  {c.percentage}%
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <img
                  src={c.avatarUrl || 'https://github.com/ghost.png'}
                  alt={displayName}
                  className="w-8 h-8 rounded border border-neutral-200 bg-neutral-100 object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-neutral-900 truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {c.contributions} {c.contributions === 1 ? 'commit' : 'commits'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
