import React from 'react';
import { Star, GitFork, ExternalLink, GitBranch, Calendar, Play } from 'lucide-react';
import type { Repository } from '../types/repository';

interface RepositoryHeaderProps {
  repository: Repository;
  onOpenStory?: () => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({ repository, onOpenStory }) => {
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center flex-wrap gap-2">
            <img
              src={repository.owner.avatarUrl}
              alt={repository.owner.login}
              className="w-7 h-7 rounded border border-neutral-200 bg-neutral-100"
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
              <a
                href={repository.owner.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {repository.owner.login}
              </a>
              <span className="text-neutral-300 font-normal">/</span>
              <span>{repository.name}</span>
            </h1>
            {repository.isFork && (
              <span className="px-2 py-0.5 text-xs font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded">
                Fork
              </span>
            )}
          </div>

          {repository.description ? (
            <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
              {repository.description}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 italic">
              No repository description provided.
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onOpenStory && (
            <button
              type="button"
              onClick={onOpenStory}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-900 rounded transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Story</span>
            </button>
          )}
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </a>
        </div>
      </div>

      {/* Metadata and Real Stats Row */}
      <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-600">
        <div className="flex items-center space-x-1.5" title="Actual stargazers count">
          <Star className="w-4 h-4 text-neutral-500" />
          <span className="font-semibold text-neutral-800">{formatNumber(repository.starsCount)}</span>
          <span className="text-neutral-500">stars</span>
        </div>

        <div className="flex items-center space-x-1.5" title="Actual forks count">
          <GitFork className="w-4 h-4 text-neutral-500" />
          <span className="font-semibold text-neutral-800">{formatNumber(repository.forksCount)}</span>
          <span className="text-neutral-500">forks</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <GitBranch className="w-4 h-4 text-neutral-500" />
          <span className="text-neutral-500">Default branch:</span>
          <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
            {repository.defaultBranch}
          </span>
        </div>

        {repository.language && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-neutral-800">{repository.language}</span>
          </div>
        )}

        <div className="flex items-center space-x-1.5" title="Repository creation date">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-500">Created:</span>
          <span>{formatDate(repository.createdAt)}</span>
        </div>

        <div className="flex items-center space-x-1.5" title="Repository last updated date">
          <span className="text-neutral-500">Updated:</span>
          <span>{formatDate(repository.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
