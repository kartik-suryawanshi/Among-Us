import React from 'react';
import type { LanguageDistribution } from '../types/language';
import { Code } from 'lucide-react';

interface LanguageBreakdownViewProps {
  distribution: LanguageDistribution | null;
  isLoading?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Makefile: '#427819',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Swift: '#F05138',
};

export const LanguageBreakdownView: React.FC<LanguageBreakdownViewProps> = ({
  distribution,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3 animate-pulse">
        <div className="h-4 w-28 bg-neutral-200 rounded" />
        <div className="h-2 w-full bg-neutral-100 rounded" />
      </div>
    );
  }

  if (!distribution || distribution.languages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-neutral-700" />
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Languages
          </h2>
        </div>
        <span className="text-xs text-neutral-500 font-mono">
          {(distribution.totalBytes / 1024).toFixed(1)} KB
        </span>
      </div>

      <div className="h-2 w-full bg-neutral-100 rounded overflow-hidden flex">
        {distribution.languages.map((lang) => {
          const color = LANGUAGE_COLORS[lang.language] || '#64748b';
          return (
            <div
              key={lang.language}
              className="h-full"
              style={{
                width: `${Math.max(lang.percentage, 1)}%`,
                backgroundColor: color,
              }}
              title={`${lang.language}: ${lang.percentage}%`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1 text-xs text-neutral-700">
        {distribution.languages.map((lang) => {
          const color = LANGUAGE_COLORS[lang.language] || '#64748b';
          return (
            <div key={lang.language} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-neutral-900">{lang.language}</span>
              <span className="text-neutral-500 text-[11px] font-mono">{lang.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
