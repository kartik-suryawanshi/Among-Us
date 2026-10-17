import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { parseRepositoryInput } from '../services/repositoryService';

interface RepositorySearchProps {
  initialValue?: string;
  isLoading?: boolean;
  onSearch?: (owner: string, repo: string) => void;
  compact?: boolean;
}

export const RepositorySearch: React.FC<RepositorySearchProps> = ({
  initialValue = '',
  isLoading = false,
  onSearch,
  compact = false,
}) => {
  const [input, setInput] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = parseRepositoryInput(input);
    if (parsed.error || !parsed.target) {
      setValidationError(parsed.error || 'Please enter a valid GitHub repository.');
      return;
    }

    const { owner, repo } = parsed.target;
    if (onSearch) {
      onSearch(owner, repo);
    } else {
      navigate(`/repositories/${owner}/${repo}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setValidationError(null);
    const parsed = parseRepositoryInput(suggestion);
    if (parsed.target) {
      if (onSearch) {
        onSearch(parsed.target.owner, parsed.target.repo);
      } else {
        navigate(`/repositories/${parsed.target.owner}/${parsed.target.repo}`);
      }
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Search another repository (e.g. expressjs/express)..."
            disabled={isLoading}
            className="w-full pl-9 pr-24 py-2 text-sm bg-white border border-neutral-300 rounded-md text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-neutral-100 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 px-3 py-1 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Inspect'}
          </button>
        </div>
        {validationError && (
          <p className="mt-1.5 text-xs text-red-600">{validationError}</p>
        )}
      </form>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <Search className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="https://github.com/expressjs/express or expressjs/express"
            disabled={isLoading}
            autoFocus
            aria-label="GitHub repository URL or identifier"
            className="w-full pl-11 pr-28 py-3 text-base bg-white border border-neutral-300 rounded-md text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-neutral-100 shadow-sm transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Fetching...' : 'Explore'}
          </button>
        </div>

        {validationError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {validationError}
          </div>
        )}
      </form>

      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs text-neutral-500">
        <span className="font-medium text-neutral-600">Sample repositories:</span>
        <button
          type="button"
          onClick={() => handleSuggestionClick('expressjs/express')}
          className="text-neutral-700 hover:text-emerald-700 underline underline-offset-2 decoration-neutral-300 hover:decoration-emerald-700"
        >
          expressjs/express
        </button>
        <span className="text-neutral-300">•</span>
        <button
          type="button"
          onClick={() => handleSuggestionClick('facebook/react')}
          className="text-neutral-700 hover:text-emerald-700 underline underline-offset-2 decoration-neutral-300 hover:decoration-emerald-700"
        >
          facebook/react
        </button>
        <span className="text-neutral-300">•</span>
        <button
          type="button"
          onClick={() => handleSuggestionClick('torvalds/linux')}
          className="text-neutral-700 hover:text-emerald-700 underline underline-offset-2 decoration-neutral-300 hover:decoration-emerald-700"
        >
          torvalds/linux
        </button>
      </div>
    </div>
  );
};
