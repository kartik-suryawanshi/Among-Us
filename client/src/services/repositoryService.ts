import { apiClient } from './api';
import type { Repository } from '../types/repository';
import type { CommitDetail, PaginatedCommits } from '../types/commit';
import type { ContributorStats } from '../types/contributor';
import type { LanguageDistribution } from '../types/language';
import type { FileHotspotsResponse } from '../types/hotspot';
import type { CommitActivityResponse } from '../types/activity';
import type { FrequentFilesResponse } from '../types/frequentFiles';

export interface ParsedRepoTarget {
  owner: string;
  repo: string;
}

export function parseRepositoryInput(input: string): { target?: ParsedRepoTarget; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: 'Please enter a GitHub repository URL or owner/repository identifier.' };
  }

  // Check if it looks like a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.toLowerCase();

      if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        return { error: 'Only public repositories on github.com are supported in Phase 1.' };
      }

      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length < 2) {
        return { error: 'Invalid GitHub URL. Must contain both owner and repository name (e.g. github.com/owner/repo).' };
      }

      const owner = pathSegments[0];
      let repo = pathSegments[1];
      // strip optional trailing .git
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
      }

      if (!validateOwnerRepo(owner, repo)) {
        return { error: 'Invalid repository identifier format.' };
      }

      return { target: { owner, repo } };
    } catch {
      return { error: 'The provided URL is not valid.' };
    }
  }

  // Check if it's in owner/repo format
  const parts = trimmed.split('/');
  if (parts.length === 2) {
    const owner = parts[0].trim();
    let repo = parts[1].trim();
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (!validateOwnerRepo(owner, repo)) {
      return { error: 'Invalid repository identifier. Expected format: owner/repository (e.g. expressjs/express).' };
    }

    return { target: { owner, repo } };
  }

  return {
    error: 'Enter a valid GitHub URL (https://github.com/owner/repo) or identifier (owner/repo).',
  };
}

function validateOwnerRepo(owner: string, repo: string): boolean {
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-._]{0,38})$/;
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;
  return ownerRegex.test(owner) && repoRegex.test(repo);
}

export const repositoryService = {
  async getHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await apiClient.get<Repository>(`/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    return response.data;
  },

  async getActivity(owner: string, repo: string): Promise<CommitActivityResponse> {
    const res = await apiClient.get<CommitActivityResponse>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/activity`
    );
    return res.data;
  },

  async getFrequentFiles(owner: string, repo: string, sampleCommits = 20): Promise<FrequentFilesResponse> {
    const res = await apiClient.get<FrequentFilesResponse>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/frequent-files`,
      {
        params: { sample_commits: sampleCommits },
      }
    );
    return res.data;
  },

  async getContributors(owner: string, repo: string): Promise<ContributorStats> {
    const response = await apiClient.get<ContributorStats>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`
    );
    return response.data;
  },

  async getLanguages(owner: string, repo: string): Promise<LanguageDistribution> {
    const response = await apiClient.get<LanguageDistribution>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`
    );
    return response.data;
  },

  async getFileHotspots(owner: string, repo: string, limit = 12): Promise<FileHotspotsResponse> {
    const response = await apiClient.get<FileHotspotsResponse>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/hotspots`,
      { params: { limit } }
    );
    return response.data;
  },

  async getCommits(owner: string, repo: string, page = 1, perPage = 20): Promise<PaginatedCommits> {
    const response = await apiClient.get<PaginatedCommits>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
      {
        params: { page, per_page: perPage },
      }
    );
    return response.data;
  },

  async getCommit(owner: string, repo: string, sha: string): Promise<CommitDetail> {
    const response = await apiClient.get<CommitDetail>(
      `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`
    );
    return response.data;
  },
};

