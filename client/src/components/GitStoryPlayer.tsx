import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Repository } from '../types/repository';
import type { CommitSummary } from '../types/commit';
import type { ContributorStats } from '../types/contributor';
import type { LanguageDistribution } from '../types/language';
import type { FrequentFilesResponse } from '../types/frequentFiles';
import type { CommitActivityResponse } from '../types/activity';
import { ParticleMorphCanvas } from './story/ParticleMorphCanvas';
import { CommitRunner } from './story/CommitRunner';
import { soundEffects } from './story/SoundEffects';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
  GitCommit,
  Users,
  Activity,
  FileCode,
  Copy,
  Check,
  Terminal,
  Layers,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Gamepad2,
} from 'lucide-react';

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

export interface GitStoryPlayerProps {
  repository: Repository;
  commits: CommitSummary[];
  contributors: ContributorStats | null;
  languages: LanguageDistribution | null;
  frequentFiles: FrequentFilesResponse | null;
  activity: CommitActivityResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

type ChapterId = 'genesis' | 'stack' | 'timeline' | 'team' | 'velocity';

interface Chapter {
  id: ChapterId;
  label: string;
  durationMs: number;
}

export const GitStoryPlayer: React.FC<GitStoryPlayerProps> = ({
  repository,
  commits,
  contributors,
  languages,
  frequentFiles,
  activity,
  isOpen,
  onClose,
}) => {
  // Sort commits chronologically (oldest to newest) for storytelling
  const chronologicalCommits = useMemo(() => {
    return [...commits].reverse();
  }, [commits]);

  const chapters: Chapter[] = useMemo(() => [
    { id: 'genesis', label: '1. Genesis', durationMs: 4500 },
    { id: 'stack', label: '2. Stack', durationMs: 5000 },
    { id: 'timeline', label: '3. Commit Reel', durationMs: Math.max(8000, chronologicalCommits.length * 900) },
    { id: 'team', label: '4. Builders', durationMs: 5000 },
    { id: 'velocity', label: '5. Summary', durationMs: 6000 },
  ], [chronologicalCommits.length]);

  const totalDurationMs = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + ch.durationMs, 0);
  }, [chapters]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timelineMode, setTimelineMode] = useState<'runner' | 'cards'>('runner');
  const [svgCopied, setSvgCopied] = useState<boolean>(false);
  const [markdownCopied, setMarkdownCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(0);

  // Determine current chapter and commit index based on elapsedMs
  const { currentChapter, chapterProgress, commitIndex } = useMemo(() => {
    let accumulated = 0;
    let ch = chapters[0];
    let chProgress = 0;

    for (const chapter of chapters) {
      if (elapsedMs < accumulated + chapter.durationMs) {
        ch = chapter;
        chProgress = (elapsedMs - accumulated) / chapter.durationMs;
        break;
      }
      accumulated += chapter.durationMs;
    }

    if (elapsedMs >= totalDurationMs) {
      ch = chapters[chapters.length - 1];
      chProgress = 1;
    }

    // In timeline chapter, calculate current active commit
    let cIdx = 0;
    if (ch.id === 'timeline' && chronologicalCommits.length > 0) {
      cIdx = Math.min(
        chronologicalCommits.length - 1,
        Math.floor(chProgress * chronologicalCommits.length)
      );
    }

    return {
      currentChapter: ch,
      chapterProgress: Math.max(0, Math.min(1, chProgress)),
      commitIndex: cIdx,
    };
  }, [elapsedMs, chapters, totalDurationMs, chronologicalCommits.length]);

  // Animation Loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) * playbackSpeed;
      lastTickRef.current = now;

      setElapsedMs((prev) => {
        const next = prev + delta;
        if (next >= totalDurationMs) {
          setIsPlaying(false);
          return totalDurationMs;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, totalDurationMs]);

  const skipForward = useCallback(() => {
    setElapsedMs((prev) => Math.min(totalDurationMs, prev + 2500 * playbackSpeed));
  }, [totalDurationMs, playbackSpeed]);

  const skipBackward = useCallback(() => {
    setElapsedMs((prev) => Math.max(0, prev - 2500 * playbackSpeed));
  }, [playbackSpeed]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipBackward();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, skipForward, skipBackward]);

  // Jump to specific chapter
  const jumpToChapter = (chapterId: ChapterId) => {
    soundEffects.playBlip();
    let acc = 0;
    for (const ch of chapters) {
      if (ch.id === chapterId) {
        setElapsedMs(acc + 10);
        return;
      }
      acc += ch.durationMs;
    }
  };

  const handleReset = () => {
    setElapsedMs(0);
    setIsPlaying(true);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setElapsedMs(fraction * totalDurationMs);
  };

  // Generate dynamic SMIL SVG badge (inspired by Ananya Goswami's README trailer post)
  const generatedSmilSvg = useMemo(() => {
    const topLang = languages?.languages?.[0]?.language || repository.language || 'Code';
    const topAuthor = contributors?.contributors?.[0]?.login || 'Contributor';
    const totalC = activity?.totalCommits || commits.length || 0;
    const repoTitle = `${repository.owner.login}/${repository.name}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="150" viewBox="0 0 560 150">
  <defs>
    <style>
      .mono { font-family: 'SF Mono', Consolas, Menlo, monospace; }
      .bold { font-weight: 700; }
      .dim { fill: #94a3b8; font-size: 11px; }
      .highlight { fill: #38bdf8; font-size: 13px; }
      .white { fill: #f8fafc; font-size: 14px; }
      .brand { fill: #10b981; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
    </style>
  </defs>
  <rect width="100%" height="100%" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1.5" />
  <rect x="18" y="18" width="6" height="6" rx="1" fill="#10b981">
    <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
  </rect>
  <text x="32" y="24" class="mono brand">GITSTORY LIVE REEL</text>
  <text x="510" y="24" text-anchor="end" class="mono dim">BRANCH: ${repository.defaultBranch}</text>
  <line x1="18" y1="36" x2="542" y2="36" stroke="#1e293b" stroke-width="1" />
  <g id="frame-repo">
    <text x="24" y="66" class="mono white bold">${repoTitle}</text>
    <text x="24" y="88" class="mono dim">Stack: ${topLang} | Stars: ${repository.starsCount} | Forks: ${repository.forksCount}</text>
    <text x="24" y="112" class="mono highlight">Recorded History: ${totalC} Commits by ${contributors?.totalContributors || 1} Builders</text>
    <text x="24" y="132" class="mono dim">Lead Contributor: @${topAuthor} | Busiest Day: ${activity?.byDayOfWeek ? Object.entries(activity.byDayOfWeek).sort((a,b)=>b[1]-a[1])[0]?.[0] : 'Active'}</text>
  </g>
</svg>`;
  }, [repository, languages, contributors, activity, commits.length]);

  const handleCopySvg = () => {
    navigator.clipboard.writeText(generatedSmilSvg);
    setSvgCopied(true);
    setTimeout(() => setSvgCopied(false), 2000);
  };

  const { formattedCreationDate, daysActive } = useMemo(() => {
    try {
      const cDate = new Date(repository.createdAt);
      const valid = !isNaN(cDate.getTime());
      const formatted = valid
        ? cDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Inception';
      const uDate = new Date(repository.updatedAt || repository.createdAt);
      const uTime = !isNaN(uDate.getTime()) ? uDate.getTime() : cDate.getTime();
      const diffDays = Math.max(1, Math.floor((uTime - cDate.getTime()) / (1000 * 60 * 60 * 24)));
      return { formattedCreationDate: formatted, daysActive: diffDays };
    } catch {
      return { formattedCreationDate: 'Inception', daysActive: 1 };
    }
  }, [repository.createdAt, repository.updatedAt]);

  const handleCopyMarkdown = () => {
    const rawUrl = `https://raw.githubusercontent.com/${repository.owner.login}/${repository.name}/main/gitstory-badge.svg`;
    const snippet = `[![GitStory Live Reel](${rawUrl})](https://github.com/${repository.owner.login}/${repository.name})`;
    navigator.clipboard.writeText(snippet);
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentCommit = chronologicalCommits[commitIndex] || chronologicalCommits[0];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 ${
          isFullscreen ? 'h-full max-w-none rounded-none border-none' : 'max-h-[92vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/60 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-semibold text-neutral-200 truncate">
              GitStory Cinematic Trailer: {repository.owner.login}/{repository.name}
            </span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
              Chapter: {currentChapter.label}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                soundEffects.isMuted = !isMuted;
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Speed selector */}
            <div className="inline-flex rounded border border-neutral-800 bg-neutral-900 p-0.5 text-[11px] font-mono">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded transition ${
                    playbackSpeed === spd
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title="Close Story Player (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chapter Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-neutral-800 bg-neutral-950 px-5 py-2 text-xs font-mono scrollbar-none gap-2 shrink-0">
          {chapters.map((ch) => {
            const isActive = currentChapter.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => jumpToChapter(ch.id)}
                className={`px-3 py-1 rounded transition whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Cinema Screen Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-center min-h-[380px] bg-radial from-neutral-900/40 via-neutral-950 to-neutral-950">
          {/* CHAPTER 1: GENESIS / BOOT-UP */}
          {currentChapter.id === 'genesis' && (
            <div className="max-w-4xl mx-auto w-full space-y-6 text-left animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>REPO_INITIALIZATION_SEQUENCE</span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                  $ ./gitstory.sh --boot --live
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: Dynamic 60fps Vector Particle Morphing Constellation */}
                <div className="md:col-span-5 h-64 sm:h-72 rounded-xl border border-neutral-800 bg-neutral-950/80 p-2 flex items-center justify-center relative overflow-hidden shadow-xl">
                  <ParticleMorphCanvas initialShape="code" accentColor="#10b981" className="w-full h-full" />
                </div>

                {/* Right: Retro Terminal System Info & Inception Details */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                      {repository.owner.login}/<span className="text-emerald-400">{repository.name}</span>
                    </h1>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      {repository.description || 'Public GitHub repository repository development chronicle.'}
                    </p>
                  </div>

                  {/* Terminal System Info Block */}
                  <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/70 font-mono text-xs space-y-2">
                    <div className="text-[11px] text-emerald-400 font-semibold border-b border-neutral-800 pb-1 flex items-center justify-between">
                      <span>System Architecture Specs</span>
                      <span className="text-neutral-500 font-normal">v1.0.0</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                      <div>
                        <span className="text-neutral-500">Inception: </span>
                        <span className="text-neutral-200">{formattedCreationDate}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Age: </span>
                        <span className="text-emerald-400">{daysActive} days</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Default Branch: </span>
                        <span className="text-neutral-200">{repository.defaultBranch}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Ecosystem: </span>
                        <span className="text-neutral-200">{repository.language || 'Multi-stack'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Commits: </span>
                        <span className="text-neutral-200">{activity?.totalCommits || commits.length}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Stars / Forks: </span>
                        <span className="text-neutral-200">{repository.starsCount} / {repository.forksCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Genesis Commit Teaser */}
                  {chronologicalCommits[0] && (
                    <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-900/40 font-mono text-[11px] space-y-1">
                      <div className="text-neutral-500 flex items-center justify-between">
                        <span>Genesis Commit (git init)</span>
                        <span className="text-emerald-400 font-bold">{chronologicalCommits[0].shortSha}</span>
                      </div>
                      <div className="text-neutral-200 truncate italic">
                        &quot;{chronologicalCommits[0].message}&quot;
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHAPTER 2: TECH STACK UNIVERSE */}
          {currentChapter.id === 'stack' && (
            <div className="max-w-2xl mx-auto w-full space-y-6 text-left animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>CODEBASE_COMPOSITION_ANALYSIS</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-bold font-mono text-white">
                  Technology Stack Spectrum
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Distribution of programming languages detected in the default branch.
                </p>
              </div>

              {languages && languages.languages && languages.languages.length > 0 ? (
                <div className="space-y-4 font-mono">
                  {/* Visual Stack Proportion Bar */}
                  <div className="h-3.5 w-full bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800 p-0.5">
                    {languages.languages.map((l) => (
                      <div
                        key={l.language}
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(l.percentage, 2)}%`,
                          backgroundColor: LANGUAGE_COLORS[l.language] || '#64748b',
                        }}
                        title={`${l.language}: ${l.percentage}%`}
                      />
                    ))}
                  </div>

                  {/* Language rows with progress meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {languages.languages.slice(0, 6).map((lang, idx) => (
                      <div
                        key={lang.language}
                        className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: LANGUAGE_COLORS[lang.language] || '#64748b' }}
                            />
                            <span className="font-semibold text-neutral-200">{lang.language}</span>
                          </div>
                          <span className="text-neutral-400 font-bold">{lang.percentage}%</span>
                        </div>

                        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${lang.percentage}%`,
                              backgroundColor: LANGUAGE_COLORS[lang.language] || '#64748b',
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-neutral-400">
                          <span>Rank #{idx + 1}</span>
                          <span>{(lang.bytes / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400 font-mono">
                  No language data available.
                </div>
              )}
            </div>
          )}

          {/* CHAPTER 3: CHRONOLOGICAL COMMIT REEL & COMMIT-RUNNER */}
          {currentChapter.id === 'timeline' && (
            <div className="max-w-4xl mx-auto w-full space-y-4 text-left animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                  <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>COMMIT_TIMELINE_STORY_ENGINE</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="inline-flex rounded border border-neutral-800 bg-neutral-900 p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setTimelineMode('runner')}
                      className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
                        timelineMode === 'runner'
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Commit-Runner</span>
                    </button>
                    <button
                      onClick={() => setTimelineMode('cards')}
                      className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
                        timelineMode === 'cards'
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Cinematic Cards</span>
                    </button>
                  </div>
                </div>
              </div>

              {timelineMode === 'runner' ? (
                <CommitRunner
                  commits={chronologicalCommits}
                  defaultBranch={repository.defaultBranch}
                  repoName={`${repository.owner.login}/${repository.name}`}
                />
              ) : (
                currentCommit ? (
                  <div className="space-y-4 font-mono">
                    {/* Active Commit Card */}
                    <div className="p-5 sm:p-6 rounded-xl border border-neutral-700 bg-neutral-900/90 shadow-xl space-y-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3 text-xs">
                        <div className="flex items-center space-x-2.5">
                          {currentCommit.author.avatarUrl ? (
                            <img
                              src={currentCommit.author.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded border border-neutral-700 object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 text-xs">
                              @
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">
                              {currentCommit.author.name || currentCommit.author.login || 'Committer'}
                            </div>
                            {currentCommit.author.login && (
                              <div className="text-[11px] text-neutral-400">
                                @{currentCommit.author.login}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400">
                          <span>
                            {currentCommit.author.date
                              ? new Date(currentCommit.author.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-emerald-400 font-bold">
                            {currentCommit.shortSha}
                          </span>
                        </div>
                      </div>

                      {/* Commit Message */}
                      <div className="text-sm sm:text-base text-neutral-100 font-medium leading-relaxed font-sans">
                        &quot;{currentCommit.message}&quot;
                      </div>

                      {/* Commit Diff Impact / Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-neutral-400 border-t border-neutral-800/80">
                        <span className="text-neutral-300">
                          Author: <span className="text-white font-medium">{currentCommit.author.name || currentCommit.author.login || 'Unknown'}</span>
                        </span>
                        {currentCommit.parentShas && currentCommit.parentShas.length > 0 ? (
                          <span className="text-neutral-400">
                            Parent: <code className="text-neutral-300 font-mono">{currentCommit.parentShas[0].slice(0, 7)}</code>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Genesis Commit (Initial Tree)</span>
                        )}
                      </div>
                    </div>

                    {/* Pipeline Step Track */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-neutral-400">
                        <span>Timeline Progression</span>
                        <span>{Math.round(chapterProgress * 100)}% through history</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(2, chapterProgress * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* CHAPTER 4: MAINTAINERS & TEAM IMPACT */}
          {currentChapter.id === 'team' && (
            <div className="max-w-2xl mx-auto w-full space-y-6 text-left animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>CONTRIBUTOR_FORCE_BREAKDOWN</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-bold font-mono text-white">
                  The Builders & Maintainers
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Share of commits and impact delivered across the project lifecycle.
                </p>
              </div>

              {contributors && contributors.contributors && contributors.contributors.length > 0 ? (
                <div className="space-y-3 font-mono">
                  {contributors.contributors.slice(0, 4).map((c, i) => (
                    <div
                      key={c.login}
                      className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-xs font-bold text-neutral-400 w-4">#{i + 1}</span>
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full border border-neutral-700 object-cover shrink-0"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">@{c.login}</div>
                          <div className="text-[11px] text-neutral-400">
                            {c.contributions} {c.contributions === 1 ? 'commit' : 'commits'} • {c.badge || 'Contributor'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-400">{c.percentage}%</div>
                        <div className="text-[10px] text-neutral-400">work share</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400 font-mono">
                  No contributor records found.
                </div>
              )}
            </div>
          )}

          {/* CHAPTER 5: SUMMARY & README BADGE GENERATOR */}
          {currentChapter.id === 'velocity' && (
            <div className="max-w-2xl mx-auto w-full space-y-6 text-left animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>STORY_SUMMARY_AND_README_CARD</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-bold font-mono text-white">
                  Project Story Summary
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Continuous development velocity and exportable live SVG badge for your README.
                </p>
              </div>

              {/* Churn & Velocity Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                  <div className="text-[11px] text-neutral-400">Total Commits</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {activity?.totalCommits || commits.length}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                  <div className="text-[11px] text-neutral-400">Contributors</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {contributors?.totalContributors || 1}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-neutral-400">Hotspot File</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 truncate">
                    {frequentFiles?.files?.[0]?.filename || 'src/main'}
                  </div>
                </div>
              </div>

              {/* Dynamic SMIL Animated SVG Preview (LinkedIn Post Inspired) */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Live SMIL SVG Badge for README.md</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySvg}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] flex items-center gap-1 transition"
                    >
                      {svgCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{svgCopied ? 'SVG Copied' : 'Copy SVG'}</span>
                    </button>
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] flex items-center gap-1 transition"
                    >
                      {markdownCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{markdownCopied ? 'Markdown Copied' : 'Copy Markdown'}</span>
                    </button>
                  </div>
                </div>

                {/* SVG Render Box */}
                <div
                  className="rounded-lg border border-neutral-800 p-2 bg-neutral-950 flex justify-center overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: generatedSmilSvg }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Playback & Scrubber Controls */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900/80 space-y-3 shrink-0">
          {/* Scrubber slider */}
          <div className="flex items-center space-x-3 text-xs font-mono text-neutral-400">
            <span className="w-12 text-left">
              {(elapsedMs / 1000).toFixed(1)}s
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={totalDurationMs > 0 ? elapsedMs / totalDurationMs : 0}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <span className="w-12 text-right">
              {(totalDurationMs / 1000).toFixed(1)}s
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400 font-mono hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">Space</kbd> to toggle,{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">←</kbd>/
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">→</kbd> to scrub
            </div>

            <div className="flex items-center space-x-2 mx-auto sm:mx-0">
              <button
                onClick={handleReset}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Restart Story"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={skipBackward}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Previous step (Left Arrow)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition shadow-lg"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={skipForward}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Next step (Right Arrow)"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-[11px] font-mono text-neutral-400">
                {currentChapter.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
