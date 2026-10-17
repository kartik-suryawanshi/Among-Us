import React, { useState } from 'react';
import { ExternalLink, Copy, Check, FileCode, Plus, Minus, X, AlertCircle } from 'lucide-react';
import type { CommitDetail } from '../types/commit';

interface CommitDetailsProps {
  commitDetail: CommitDetail | null;
  isLoading: boolean;
  error: string | null;
  onClose?: () => void;
}

export const CommitDetails: React.FC<CommitDetailsProps> = ({
  commitDetail,
  isLoading,
  error,
  onClose,
}) => {
  const [copiedSha, setCopiedSha] = useState(false);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'Unavailable';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="h-5 bg-neutral-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded w-20 animate-pulse" />
        </div>
        <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-neutral-100 rounded w-1/2 animate-pulse" />
        <div className="pt-4 space-y-2">
          <div className="h-10 bg-neutral-50 rounded animate-pulse" />
          <div className="h-10 bg-neutral-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-5 text-sm text-red-700 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-red-900">Failed to load commit details</p>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!commitDetail) {
    return null;
  }

  const { stats, files } = commitDetail;
  const authorName = commitDetail.author.name || commitDetail.author.login || 'Unavailable';
  const committerName = commitDetail.committer.name || commitDetail.committer.login || 'Unavailable';
  const showDifferentCommitter = committerName !== 'Unavailable' && committerName !== authorName;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Commit Details
          </span>
          <span className="text-neutral-300">•</span>
          <span className="font-mono text-xs font-medium text-neutral-700">
            {commitDetail.shortSha}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleCopySha(commitDetail.sha)}
            title="Copy full commit SHA"
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
          >
            {copiedSha ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                <span>Copy SHA</span>
              </>
            )}
          </button>

          <a
            href={commitDetail.htmlUrl}
            target="_blank"
            rel="noreferrer"
            title="View on GitHub"
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close commit details"
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Full Message */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Commit Message
          </h2>
          <pre className="text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded p-3.5 font-sans whitespace-pre-wrap leading-relaxed">
            {commitDetail.message}
          </pre>
        </div>

        {/* Commit Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1.5">
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">Author</span>
            <div className="flex items-center space-x-2">
              {commitDetail.author.avatarUrl && (
                <img
                  src={commitDetail.author.avatarUrl}
                  alt={authorName}
                  className="w-5 h-5 rounded-full border border-neutral-200"
                />
              )}
              <span className="font-medium text-neutral-800 text-sm">{authorName}</span>
            </div>
            {commitDetail.author.email && (
              <p className="text-neutral-500 truncate">{commitDetail.author.email}</p>
            )}
            <p className="text-neutral-500">
              Authored on {formatDateTime(commitDetail.author.date)}
            </p>
          </div>

          <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1.5">
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
              {showDifferentCommitter ? 'Committer' : 'Verification and SHA'}
            </span>
            {showDifferentCommitter ? (
              <>
                <div className="flex items-center space-x-2">
                  {commitDetail.committer.avatarUrl && (
                    <img
                      src={commitDetail.committer.avatarUrl}
                      alt={committerName}
                      className="w-5 h-5 rounded-full border border-neutral-200"
                    />
                  )}
                  <span className="font-medium text-neutral-800 text-sm">{committerName}</span>
                </div>
                <p className="text-neutral-500">
                  Committed on {formatDateTime(commitDetail.committer.date)}
                </p>
              </>
            ) : (
              <div>
                <p className="text-neutral-500">Full Commit SHA:</p>
                <p className="font-mono text-neutral-800 break-all select-all font-medium pt-0.5">
                  {commitDetail.sha}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change Statistics */}
        {stats && (
          <div className="flex items-center flex-wrap gap-4 pt-2 pb-1 border-t border-b border-neutral-100 text-xs">
            <span className="font-medium text-neutral-700">Changes:</span>
            <span className="inline-flex items-center text-emerald-700 font-medium">
              <Plus className="w-3.5 h-3.5 mr-0.5" />
              {stats.additions} {stats.additions === 1 ? 'addition' : 'additions'}
            </span>
            <span className="inline-flex items-center text-red-700 font-medium">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              {stats.deletions} {stats.deletions === 1 ? 'deletion' : 'deletions'}
            </span>
            <span className="text-neutral-500">
              {files.length} {files.length === 1 ? 'file changed' : 'files changed'}
            </span>
          </div>
        )}

        {/* Changed Files */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
            <span>Changed Files ({files.length})</span>
          </h2>

          {files.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No changed file details returned for this commit.
            </p>
          ) : (
            <div className="border border-neutral-200 rounded divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {files.map((file, idx) => (
                <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-3">
                    <FileCode className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="font-mono text-neutral-800 truncate" title={file.filename}>
                      {file.filename}
                    </span>
                    {file.previousFilename && (
                      <span className="text-[11px] text-neutral-400 truncate">
                        (renamed from {file.previousFilename})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${
                        file.status === 'added'
                          ? 'bg-emerald-100 text-emerald-800'
                          : file.status === 'removed'
                          ? 'bg-red-100 text-red-800'
                          : file.status === 'renamed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {file.status}
                    </span>

                    <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                      {file.additions > 0 && (
                        <span className="text-emerald-700">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="text-red-700">-{file.deletions}</span>
                      )}
                      {file.additions === 0 && file.deletions === 0 && (
                        <span className="text-neutral-400">0</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
