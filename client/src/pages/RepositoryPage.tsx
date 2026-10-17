import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repositoryService } from '../services/repositoryService';
import { formatApiError } from '../services/api';
import type { Repository } from '../types/repository';
import type { CommitSummary, CommitDetail } from '../types/commit';
import type { ContributorStats } from '../types/contributor';
import type { LanguageDistribution } from '../types/language';
import type { FileHotspot } from '../types/hotspot';
import type { CommitActivityResponse } from '../types/activity';
import type { FrequentFilesResponse } from '../types/frequentFiles';
import { RepositoryHeader } from '../components/RepositoryHeader';
import { RepositorySearch } from '../components/RepositorySearch';
import { ContributorStatsView } from '../components/ContributorStatsView';
import { CommitActivityTimeline } from '../components/CommitActivityTimeline';
import { FrequentFilesTable } from '../components/FrequentFilesTable';
import { VisualTimeline } from '../components/VisualTimeline';
import { FileHotspotsView } from '../components/FileHotspotsView';
import { LanguageBreakdownView } from '../components/LanguageBreakdownView';
import { CommitList } from '../components/CommitList';
import { CommitDetails } from '../components/CommitDetails';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { GitStoryPlayer } from '../components/GitStoryPlayer';
import { ArrowLeft, Play } from 'lucide-react';

export const RepositoryPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  // Core repository and commits state
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);

  // Advanced metadata state
  const [contributorStats, setContributorStats] = useState<ContributorStats | null>(null);
  const [languages, setLanguages] = useState<LanguageDistribution | null>(null);
  const [hotspots, setHotspots] = useState<FileHotspot[]>([]);
  const [analyzedCommitsCount, setAnalyzedCommitsCount] = useState<number>(0);
  const [activity, setActivity] = useState<CommitActivityResponse | null>(null);
  const [frequentFilesData, setFrequentFilesData] = useState<FrequentFilesResponse | null>(null);

  // Loading and Error states
  const [isLoadingRepo, setIsLoadingRepo] = useState<boolean>(true);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Interactive filters and views
  const [selectedAuthorLogin, setSelectedAuthorLogin] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // Selected commit for detail inspection
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadRepositoryData = useCallback(async (currentOwner: string, currentRepo: string) => {
    setIsLoadingRepo(true);
    setIsLoadingCommits(true);
    setIsLoadingStats(true);
    setRepoError(null);
    setSelectedCommitSha(null);
    setCommitDetail(null);
    setSelectedAuthorLogin(null);
    setActivity(null);
    setFrequentFilesData(null);
    setPage(1);

    try {
      // 1. Fetch Repository Overview
      const repoData = await repositoryService.getRepository(currentOwner, currentRepo);
      setRepository(repoData);
      setIsLoadingRepo(false);

      // 2. Fetch Initial Commits
      try {
        const commitsData = await repositoryService.getCommits(currentOwner, currentRepo, 1, 30);
        setCommits(commitsData.commits);
        setHasMore(commitsData.hasMore);
      } catch (commitsErr) {
        console.error('Error fetching commits:', commitsErr);
      } finally {
        setIsLoadingCommits(false);
      }

      // 3. Fetch Contributor, Language, Hotspot, Activity, and Frequent Files in parallel
      try {
        const [contribRes, langRes, hotspotRes, activityRes, frequentRes] = await Promise.allSettled([
          repositoryService.getContributors(currentOwner, currentRepo),
          repositoryService.getLanguages(currentOwner, currentRepo),
          repositoryService.getFileHotspots(currentOwner, currentRepo, 10),
          repositoryService.getActivity(currentOwner, currentRepo),
          repositoryService.getFrequentFiles(currentOwner, currentRepo, 20),
        ]);

        if (contribRes.status === 'fulfilled') {
          setContributorStats(contribRes.value);
        }
        if (langRes.status === 'fulfilled') {
          setLanguages(langRes.value);
        }
        if (hotspotRes.status === 'fulfilled') {
          setHotspots(hotspotRes.value.files || []);
          setAnalyzedCommitsCount(hotspotRes.value.analyzedCommitsCount || 0);
        }
        if (activityRes.status === 'fulfilled') {
          setActivity(activityRes.value);
        }
        if (frequentRes.status === 'fulfilled') {
          setFrequentFilesData(frequentRes.value);
        }
      } catch (statsErr) {
        console.error('Error fetching supplementary analytics:', statsErr);
      } finally {
        setIsLoadingStats(false);
      }
    } catch (err) {
      setRepoError(formatApiError(err));
      setIsLoadingRepo(false);
      setIsLoadingCommits(false);
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (owner && repo) {
      loadRepositoryData(owner, repo);
    }
  }, [owner, repo, loadRepositoryData]);

  // Load more commits pagination
  const handleLoadMore = async () => {
    if (!owner || !repo || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await repositoryService.getCommits(owner, repo, nextPage, 25);
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
          submessage="Connecting to the backend to retrieve repository data and commits."
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
            if (owner && repo) loadRepositoryData(owner, repo);
          }}
        />
      </div>
    );
  }

  const filteredCommits = selectedAuthorLogin
    ? commits.filter((c) => {
        const login = c.author.login || c.committer.login || '';
        const name = c.author.name || '';
        return (
          login.toLowerCase() === selectedAuthorLogin.toLowerCase() ||
          name.toLowerCase().includes(selectedAuthorLogin.toLowerCase())
        );
      })
    : commits;

  return (
    <div className="py-6 space-y-6">
      {/* Top action bar: back link, play story trigger, and compact search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsStoryOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-300 rounded shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Launch interactive repository story trailer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
            <span>Play Story Mode</span>
          </button>
          <div className="w-full sm:w-80">
            <RepositorySearch compact />
          </div>
        </div>
      </div>

      {/* 1. Repository Overview Header */}
      <RepositoryHeader
        repository={repository}
        onOpenStory={() => setIsStoryOpen(true)}
      />

      {/* 2. Contributor Breakdown & Work Share */}
      <ContributorStatsView
        contributors={contributorStats?.contributors || []}
        totalContributions={contributorStats?.totalContributions || commits.length}
        selectedAuthorLogin={selectedAuthorLogin}
        onSelectAuthor={setSelectedAuthorLogin}
        isLoading={isLoadingStats}
      />

      {/* 3. Commit Activity Velocity Timeline (52-week & day-of-week) */}
      <CommitActivityTimeline
        activity={activity}
        isLoading={isLoadingStats}
      />

      {/* 4. Two-Column Grid: Frequently Changed Files / Hotspots & Language Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          {isLoadingStats || (frequentFilesData && frequentFilesData.files && frequentFilesData.files.length > 0) ? (
            <FrequentFilesTable
              data={frequentFilesData}
              isLoading={isLoadingStats}
            />
          ) : (
            <FileHotspotsView
              hotspots={hotspots}
              analyzedCommitsCount={analyzedCommitsCount}
              isLoading={isLoadingStats}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <LanguageBreakdownView
            distribution={languages}
            isLoading={isLoadingStats}
          />
        </div>
      </div>

      {/* 5. Commit History & Timeline Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Commit History
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {selectedAuthorLogin ? (
                <span>
                  Showing {filteredCommits.length} commits by <strong>@{selectedAuthorLogin}</strong>
                </span>
              ) : (
                <span>
                  Displaying {commits.length} commits on branch <code className="font-mono text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded">{repository.defaultBranch}</code>
                </span>
              )}
            </p>
          </div>

          {/* View mode toggle */}
          <div className="inline-flex items-center p-0.5 bg-neutral-100 border border-neutral-200 rounded text-xs font-medium text-neutral-600 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'timeline'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              Timeline
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'hover:text-neutral-900'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Commit List / Timeline with Side Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={selectedCommitSha ? 'lg:col-span-7' : 'lg:col-span-12'}>
            {isLoadingCommits ? (
              <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
                <LoadingState
                  message="Fetching commit history..."
                  submessage="Loading chronological commits from the default branch."
                />
              </div>
            ) : viewMode === 'timeline' ? (
              <VisualTimeline
                commits={filteredCommits}
                selectedCommitSha={selectedCommitSha}
                onSelectCommit={handleSelectCommit}
                filteredAuthor={selectedAuthorLogin}
              />
            ) : (
              <CommitList
                commits={filteredCommits}
                selectedCommitSha={selectedCommitSha}
                onSelectCommit={handleSelectCommit}
                hasMore={hasMore && !selectedAuthorLogin}
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

      {/* 6. Interactive GitStory Cinematic Story Player */}
      <GitStoryPlayer
        repository={repository}
        commits={commits}
        contributors={contributorStats}
        languages={languages}
        frequentFiles={frequentFilesData}
        activity={activity}
        isOpen={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
      />
    </div>
  );
};
