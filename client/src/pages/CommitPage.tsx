import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repositoryService } from '../services/repositoryService';
import { formatApiError } from '../services/api';
import type { CommitDetail } from '../types/commit';
import { CommitDetails } from '../components/CommitDetails';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ArrowLeft, GitBranch } from 'lucide-react';

export const CommitPage: React.FC = () => {
  const { owner, repo, sha } = useParams<{ owner: string; repo: string; sha: string }>();

  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo || !sha) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    repositoryService
      .getCommit(owner, repo, sha)
      .then((data) => {
        if (isMounted) {
          setCommitDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(formatApiError(err));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [owner, repo, sha]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState
          message="Loading commit details..."
          submessage={`Retrieving commit ${sha?.substring(0, 7)} from ${owner}/${repo}.`}
        />
      </div>
    );
  }

  if (error || !commitDetail) {
    return (
      <div className="py-12">
        <ErrorState
          title="Commit Inaccessible"
          message={error || 'The requested commit details could not be found.'}
          showBackToSearch={false}
        />
        <div className="text-center mt-4">
          <Link
            to={`/repositories/${owner}/${repo}`}
            className="text-xs text-neutral-600 hover:text-neutral-900 underline underline-offset-2"
          >
            Return to repository commit history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Explorer
        </Link>
        <span>/</span>
        <Link to={`/repositories/${owner}/${repo}`} className="hover:text-neutral-900 font-medium text-neutral-700">
          {owner}/{repo}
        </Link>
        <span>/</span>
        <span className="font-mono text-neutral-800">{commitDetail.shortSha}</span>
      </div>

      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <Link
          to={`/repositories/${owner}/${repo}`}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {owner}/{repo} commits</span>
        </Link>

        <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
          <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
          <span>Dedicated Commit Inspector</span>
        </div>
      </div>

      <CommitDetails
        commitDetail={commitDetail}
        isLoading={false}
        error={null}
      />
    </div>
  );
};
