import React, { useEffect, useState } from 'react';
import { RepositorySearch } from '../components/RepositorySearch';
import { repositoryService } from '../services/repositoryService';
import { CheckCircle2, ShieldCheck, Database, GitCommit } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;
    repositoryService
      .getHealth()
      .then(() => {
        if (isMounted) setBackendStatus('healthy');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('offline');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Main Heading and Description */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'healthy'
                  ? 'bg-emerald-600'
                  : backendStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>
              {backendStatus === 'healthy'
                ? 'Backend connected and operational'
                : backendStatus === 'offline'
                ? 'Backend service unreachable'
                : 'Connecting to backend...'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            Explore a GitHub repository
          </h1>
          <p className="text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
            View commit history and inspect changes in public repositories.
          </p>
        </div>

        {/* Search Field */}
        <div className="flex justify-center">
          <RepositorySearch />
        </div>

        {/* Explanatory Empty State */}
        <div className="pt-6 border-t border-neutral-200">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              How repository exploration works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                <div className="font-semibold text-neutral-900 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Public GitHub Data</span>
                </div>
                <p>
                  Fetches live repository metadata directly through our Express backend using GitHub REST endpoints.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                <div className="font-semibold text-neutral-900 flex items-center space-x-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Commit Inspection</span>
                </div>
                <p>
                  Browse chronological commit history, inspect full SHAs, authors, commit messages, and file additions or deletions.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                <div className="font-semibold text-neutral-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Read-Only & Safe</span>
                </div>
                <p>
                  No accounts, no write permissions, and no user tokens required. Only public repository data is accessed.
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-neutral-500 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Enter a full repository URL or an owner/repository identifier above to begin.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
