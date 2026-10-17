import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repositoryService } from '../services/repositoryService';
import { formatApiError } from '../services/api';
import type { Repository } from '../types/repository';
import type { CommitSummary, CommitDetail } from '../types/commit';
import { RepositoryHeader } from '../components/RepositoryHeader';
import { RepositorySearch } from '../components/RepositorySearch';
import { CommitList } from '../components/CommitList';
import { CommitDetails } from '../components/CommitDetails';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ArrowLeft } from 'lucide-react';

export const RepositoryPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const [isLoadingRepo, setIsLoadingRepo] = useState<boolean>(true);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Selected commit for detail view
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadRepositoryAndCommits = useCallback(async (currentOwner: string, currentRepo: string) => {
    setIsLoadingRepo(true);
    setIsLoadingCommits(true);
    setRepoError(null);
    setSelectedCommitSha(null);
    setCommitDetail(null);
    setPage(1);

    try {
      // 1. Fetch Repository Metadata
      const repoData = await repositoryService.getRepository(currentOwner, currentRepo);
      setRepository(repoData);
      setIsLoadingRepo(false);

      // 2. Fetch Initial Commits Page
      try {
        const commitsData = await repositoryService.getCommits(currentOwner, currentRepo, 1, 20);
        setCommits(commitsData.commits);
        setHasMore(commitsData.hasMore);
      } catch (commitsErr) {
        // Repository exists, but commits failed or are restricted
        console.error('Error fetching commits:', commitsErr);
      } finally {
        setIsLoadingCommits(false);
      }
    } catch (err) {
      setRepoError(formatApiError(err));
      setIsLoadingRepo(false);
      setIsLoadingCommits(false);
    }
  }, []);

  useEffect(() => {
    if (owner && repo) {
      loadRepositoryAndCommits(owner, repo);
    }
  }, [owner, repo, loadRepositoryAndCommits]);

  // Load more commits
  const handleLoadMore = async () => {
    if (!owner || !repo || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await repositoryService.getCommits(owner, repo, nextPage, 20);
      setCommits((prev) => [...prev, ...data.commits]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more commits:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Inspect / Select commit
  const handleSelectCommit = async (commit: CommitSummary) => {
    if (!owner || !repo) return;

    // Toggle close if already selected
    if (selectedCommitSha === commit.sha) {
      setSelectedCommitSha(null);
      setCommitDetail(null);
      return;
    }

    setSelectedCommitSha(commit.sha);
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const detail = await repositoryService.getCommit(owner, repo, commit.sha);
      setCommitDetail(detail);
    } catch (err) {
      setDetailError(formatApiError(err));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCommitSha(null);
    setCommitDetail(null);
  };

  if (isLoadingRepo) {
    return (
      <div className="py-12">
        <LoadingState
          message={`Loading ${owner}/${repo}...`}
          submessage="Connecting to the Express backend to retrieve public repository data and commits."
        />
      </div>
    );
  }

  if (repoError || !repository) {
    return (
      <div className="py-12">
        <ErrorState
          title="Repository Inaccessible"
          message={repoError || 'The requested repository could not be found.'}
          onRetry={() => {
            if (owner && repo) loadRepositoryAndCommits(owner, repo);
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Top action bar: back link and compact search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>

        <div className="w-full sm:w-80">
          <RepositorySearch compact />
        </div>
      </div>

      {/* Repository Overview Header */}
      <RepositoryHeader repository={repository} />

      {/* Main Content Layout: Commits History with side-by-side or stacked Commit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dominant Commit History Column */}
        <div className={selectedCommitSha ? 'lg:col-span-7' : 'lg:col-span-12'}>
          {isLoadingCommits ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
              <LoadingState
                message="Fetching commit history..."
                submessage="Loading chronological commits from the default branch."
              />
            </div>
          ) : (
            <CommitList
              commits={commits}
              selectedCommitSha={selectedCommitSha}
              onSelectCommit={handleSelectCommit}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
            />
          )}
        </div>

        {/* Selected Commit Details Column */}
        {selectedCommitSha && (
          <div className="lg:col-span-5 sticky top-4">
            <CommitDetails
              commitDetail={commitDetail}
              isLoading={isLoadingDetail}
              error={detailError}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
};
