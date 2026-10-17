import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CommitSummary } from '../../types/commit';
import { soundEffects } from './SoundEffects';
import { RotateCcw, Volume2, VolumeX, Sparkles, Terminal, Award, Gamepad2, Play } from 'lucide-react';

interface CommitRunnerProps {
  commits: CommitSummary[];
  defaultBranch?: string;
  repoName: string;
  onCommitSelect?: (sha: string) => void;
}

interface Obstacle {
  id: number;
  x: number;
  label: string;
  type: 'bug' | 'legacy' | 'conflict';
  cleared: boolean;
}

interface Collectible {
  id: number;
  x: number;
  commit: CommitSummary;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export const CommitRunner: React.FC<CommitRunnerProps> = ({
  commits,
  defaultBranch = 'main',
  repoName,
  onCommitSelect,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [activeSpeech, setActiveSpeech] = useState<string | null>('// booting commit timeline...');
  const [lastCommitRevealed, setLastCommitRevealed] = useState<CommitSummary | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Runner physics
  const playerYRef = useRef<number>(0);
  const playerVYRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const trackPositionRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Track items
  const chronologicalCommits = useRef<CommitSummary[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);

  // Initialize track items
  const initTrack = useCallback(() => {
    const sorted = [...commits].reverse();
    chronologicalCommits.current = sorted;
    const total = sorted.length || 15;

    // Distribute collectibles every 280px
    collectiblesRef.current = sorted.map((c, i) => ({
      id: i,
      x: 360 + i * 270,
      commit: c,
      collected: false,
    }));

    // Distribute obstacles between commits
    const obstacleLabels = ['flaky test', 'legacy code', 'merge conflict', 'memory leak', 'null pointer', 'unhandled rejection'];
    const obstacles: Obstacle[] = [];
    for (let i = 0; i < total; i++) {
      if (i % 2 === 1) {
        obstacles.push({
          id: i,
          x: 490 + i * 270,
          label: obstacleLabels[i % obstacleLabels.length],
          type: i % 3 === 0 ? 'conflict' : i % 2 === 0 ? 'legacy' : 'bug',
          cleared: false,
        });
      }
    }
    obstaclesRef.current = obstacles;
    particlesRef.current = [];

    trackPositionRef.current = 0;
    playerYRef.current = 0;
    playerVYRef.current = 0;
    isJumpingRef.current = false;
    setScore(0);
    setCollectedCount(0);
    setGameOver(false);
    setVictory(false);
    setActiveSpeech('// entering contribution runner...');
    setLastCommitRevealed(sorted[0] || null);
  }, [commits]);

  useEffect(() => {
    initTrack();
  }, [initTrack]);

  // Jump execution
  const triggerJump = useCallback(() => {
    if (gameOver || victory) {
      initTrack();
      setIsPlaying(true);
      return;
    }

    if (!isJumpingRef.current) {
      isJumpingRef.current = true;
      playerVYRef.current = 13.5; // Jump velocity
      soundEffects.playJump();
    }
  }, [gameOver, victory, initTrack]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump]);

  // Particle explosion helper
  const spawnCollectParticles = (x: number, y: number) => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#38bdf8', '#fbbf24'];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2.5,
      });
    }
  };

  // Main Canvas & Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    const speed = 3.2; // Pixels per frame
    const playerScreenX = 140; // Fixed player screen X

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const groundY = height - 42;

      // Update physics if running
      if (isPlaying && !gameOver && !victory) {
        trackPositionRef.current += speed;
        const currentTrackX = trackPositionRef.current;

        // Player jump gravity
        if (isJumpingRef.current) {
          playerYRef.current += playerVYRef.current;
          playerVYRef.current -= 0.65; // Gravity

          if (playerYRef.current <= 0) {
            playerYRef.current = 0;
            playerVYRef.current = 0;
            isJumpingRef.current = false;
          }
        }

        // Auto-jump logic in Cinematic Mode
        if (isAutoPlay && !isJumpingRef.current) {
          const upcomingObstacle = obstaclesRef.current.find(
            (obs) => !obs.cleared && obs.x - currentTrackX > 40 && obs.x - currentTrackX < 110
          );
          if (upcomingObstacle) {
            isJumpingRef.current = true;
            playerVYRef.current = 13.5;
            soundEffects.playJump();
          }
        }

        // Check Collectibles
        collectiblesRef.current.forEach((item) => {
          if (!item.collected) {
            const itemScreenX = item.x - currentTrackX;
            if (Math.abs(itemScreenX - playerScreenX) < 34) {
              item.collected = true;
              setScore((s) => s + 100);
              setCollectedCount((c) => c + 1);
              setLastCommitRevealed(item.commit);
              soundEffects.playCommitCollect();
              spawnCollectParticles(playerScreenX + 10, groundY - playerYRef.current - 20);

              const wittyMessages = [
                '// bug fixed ✔',
                '// commit deployed mid-run',
                'caffeinated: nothing can stop developer',
                '// refactor shipped smoothly',
                'hackathon: every commit counts double',
                '// clean code passed review',
                '// zero warnings in build pipeline',
              ];
              setActiveSpeech(wittyMessages[Math.floor(Math.random() * wittyMessages.length)]);

              if (onCommitSelect) {
                onCommitSelect(item.commit.sha);
              }
            }
          }
        });

        // Check Obstacles
        obstaclesRef.current.forEach((obs) => {
          const obsScreenX = obs.x - currentTrackX;
          if (!obs.cleared && Math.abs(obsScreenX - playerScreenX) < 28) {
            if (playerYRef.current < 26) {
              if (!isAutoPlay) {
                soundEffects.playStomp();
                setGameOver(true);
                setActiveSpeech(`// build failed: ${obs.label} struck pipeline`);
                return;
              }
            } else {
              obs.cleared = true;
              setScore((s) => s + 50);
            }
          }
        });

        // Check Victory
        const lastItem = collectiblesRef.current[collectiblesRef.current.length - 1];
        if (lastItem && currentTrackX > lastItem.x + 220) {
          soundEffects.playVictory();
          setVictory(true);
          setActiveSpeech(`// all commits shipped to ${defaultBranch}!`);
          return;
        }
      }

      // ----------------- DRAWING ROUTINE -----------------
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const currentTrackX = trackPositionRef.current;

      // 1. Draw Background Contribution Graph Matrix Parallax
      const gridOffset = (currentTrackX * 0.3) % 24;
      const cols = Math.ceil(width / 24) + 2;
      const rows = 5;
      const gridShades = [
        'rgba(16, 185, 129, 0.08)',
        'rgba(16, 185, 129, 0.16)',
        'rgba(16, 185, 129, 0.28)',
        'rgba(23, 23, 23, 0.4)',
      ];

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const shadeIdx = (c * 7 + r * 13) % gridShades.length;
          ctx.fillStyle = gridShades[shadeIdx];
          const x = c * 24 - gridOffset;
          const y = 20 + r * 20;
          ctx.beginPath();
          ctx.roundRect(x, y, 14, 14, 2);
          ctx.fill();
        }
      }

      // 2. Draw Ground Track Rail
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, groundY, width, height - groundY);

      // Glowing Rail Header
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Track segments and commit hash markers
      const trackOffset = (currentTrackX * 0.8) % 100;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.font = '10px monospace';
      for (let tx = -trackOffset; tx < width; tx += 100) {
        ctx.fillRect(tx, groundY + 3, 16, 3);
        ctx.fillText('</>', tx + 30, groundY + 16);
      }

      // 3. Draw Collectibles (Commits)
      collectiblesRef.current.forEach((item) => {
        if (item.collected) return;
        const screenX = item.x - currentTrackX;
        if (screenX < -50 || screenX > width + 50) return;

        const bobY = groundY - 50 + Math.sin(Date.now() * 0.005 + item.id) * 6;

        ctx.save();
        ctx.translate(screenX, bobY);

        // Diamond commit icon
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
        ctx.fillRect(-10, -10, 20, 20);
        ctx.restore();

        // Inner symbol
        ctx.fillStyle = '#0a0a0a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('</>', 0, 0);

        // Commit SHA tag
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.commit.shortSha, 0, 18);

        ctx.restore();
      });

      // 4. Draw Obstacles (Bugs / Legacy / Conflicts)
      obstaclesRef.current.forEach((obs) => {
        const screenX = obs.x - currentTrackX;
        if (screenX < -100 || screenX > width + 100) return;

        const obsY = groundY - 26;

        ctx.save();
        ctx.translate(screenX, obsY);

        if (obs.cleared) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#262626';
          ctx.strokeStyle = '#525252';
          ctx.fillRect(-45, 0, 90, 24);
          ctx.strokeRect(-45, 0, 90, 24);
          ctx.fillStyle = '#a3a3a3';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`✓ ${obs.label}`, 0, 15);
        } else {
          ctx.fillStyle = 'rgba(159, 18, 57, 0.9)';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(-45, 0, 90, 24, 4);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#ffe4e6';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚠️ ${obs.label}`, 0, 15);
        }

        ctx.restore();
      });

      // 5. Draw Finish Flag
      if (collectiblesRef.current.length > 0) {
        const lastItem = collectiblesRef.current[collectiblesRef.current.length - 1];
        const flagX = lastItem.x - currentTrackX + 140;
        if (flagX > -50 && flagX < width + 100) {
          // Pole
          ctx.fillStyle = '#737373';
          ctx.fillRect(flagX, groundY - 50, 3, 50);

          // Flag banner
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(flagX + 3, groundY - 50);
          ctx.lineTo(flagX + 38, groundY - 40);
          ctx.lineTo(flagX + 3, groundY - 30);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0a0a0a';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('MAIN', flagX + 7, groundY - 38);
        }
      }

      // 6. Draw Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // 7. Draw Runner Character
      const runnerY = groundY - playerYRef.current;
      const isJumping = isJumpingRef.current;
      const runCycle = Math.sin(currentTrackX * 0.18);

      // Shadow on ground
      const shadowScale = Math.max(0.3, 1 - playerYRef.current / 90);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(playerScreenX, groundY + 1, 14 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Cape flutter
      const capeFlutter = Math.sin(Date.now() * 0.02) * 4;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.beginPath();
      ctx.moveTo(playerScreenX - 4, runnerY - 24);
      ctx.lineTo(playerScreenX - 16, runnerY - 14 + capeFlutter);
      ctx.lineTo(playerScreenX - 4, runnerY - 10);
      ctx.closePath();
      ctx.fill();

      // Body Armor
      ctx.fillStyle = '#262626';
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(playerScreenX - 6, runnerY - 26, 12, 16, 2);
      ctx.fill();
      ctx.stroke();

      // Armor LED Heartbeat
      ctx.fillStyle = '#34d399';
      ctx.fillRect(playerScreenX - 2, runnerY - 20, 4, 4);

      // Head / Helmet
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(playerScreenX, runnerY - 33, 7, 0, Math.PI * 2);
      ctx.fill();

      // Visor Glow
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.fillRect(playerScreenX + 1, runnerY - 35, 6, 3);
      ctx.shadowBlur = 0;

      // Running Legs
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      if (isJumping) {
        // Tucked jump legs
        ctx.beginPath();
        ctx.moveTo(playerScreenX - 3, runnerY - 10);
        ctx.lineTo(playerScreenX - 6, runnerY - 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(playerScreenX + 3, runnerY - 10);
        ctx.lineTo(playerScreenX + 6, runnerY - 4);
        ctx.stroke();
      } else {
        // Alternating run cycle legs
        const leg1Angle = runCycle * 8;
        const leg2Angle = -runCycle * 8;

        ctx.beginPath();
        ctx.moveTo(playerScreenX - 3, runnerY - 10);
        ctx.lineTo(playerScreenX - 3 - leg1Angle, runnerY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(playerScreenX + 3, runnerY - 10);
        ctx.lineTo(playerScreenX + 3 - leg2Angle, runnerY);
        ctx.stroke();
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    // Resize handling for Retina DPR
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animationRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isAutoPlay, gameOver, victory, defaultBranch, onCommitSelect]);

  const toggleMute = () => {
    soundEffects.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col space-y-4 font-mono select-none" ref={containerRef}>
      {/* Top Runner HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Score: {score}</span>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400">
            Commits: {collectedCount} / {commits.length}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-2.5 py-1 rounded text-[11px] transition border flex items-center gap-1.5 ${
              isAutoPlay
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 font-semibold'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
            title="Toggle between automatic cinematic story view and interactive runner"
          >
            <Gamepad2 className="w-3 h-3 text-emerald-400" />
            <span>{isAutoPlay ? 'Auto-Story: ON' : 'Interactive: ON (Space to Jump)'}</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            title={isMuted ? 'Unmute 8-bit sound' : 'Mute sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={initTrack}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            title="Reset Runner"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Runner Stage Display */}
      <div
        className="relative w-full h-64 sm:h-72 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-2xl flex flex-col justify-end cursor-pointer"
        onClick={triggerJump}
        title="Click or press Space to jump"
      >
        {/* Hardware Accelerated HTML5 Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Ambient Floating Speech Bubble */}
        {activeSpeech && (
          <div className="absolute top-4 left-6 z-20 px-3 py-1.5 rounded-md bg-neutral-900/90 border border-emerald-500/40 text-emerald-300 text-xs shadow-lg animate-bounce pointer-events-none">
            {activeSpeech}
          </div>
        )}

        {/* Floating Commit Details Card */}
        {lastCommitRevealed && (
          <div className="absolute top-4 right-6 z-20 max-w-xs px-3 py-2 rounded-lg bg-neutral-900/95 border border-neutral-800 text-[11px] shadow-xl space-y-1 pointer-events-none">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="font-bold text-emerald-400">{lastCommitRevealed.shortSha}</span>
              <span className="truncate">@{lastCommitRevealed.author.login || lastCommitRevealed.author.name || 'dev'}</span>
            </div>
            <div className="text-neutral-200 line-clamp-1 italic">
              &quot;{lastCommitRevealed.message}&quot;
            </div>
          </div>
        )}

        {/* Game Over / Collision Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-4 animate-fadeIn">
            <div className="p-4 rounded-lg bg-neutral-900 border border-rose-800 max-w-sm w-full space-y-2 text-left">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                <Terminal className="w-3.5 h-3.5" />
                <span>$ git push origin {defaultBranch}</span>
              </div>
              <div className="text-xs text-neutral-300">
                &gt; Build stopped by legacy code or test hazard.
              </div>
              <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                Score: {score} · Commits visited: {collectedCount}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerJump();
              }}
              className="px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-lg flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Pipeline (Space)</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {victory && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-4 animate-fadeIn">
            <div className="p-4 rounded-lg bg-neutral-900 border border-emerald-600 max-w-sm w-full space-y-2 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span>BUILD_PIPELINE_COMPLETE: {repoName}</span>
              </div>
              <div className="text-xs text-neutral-300">
                &gt; All {commits.length} commits traversed & verified.
              </div>
              <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                Final Score: {score} points.
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initTrack();
              }}
              className="px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-lg flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Replay Commit Runner</span>
            </button>
          </div>
        )}
      </div>

      {/* Terminal Real-time Git Status Stream */}
      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-400">
        <div className="flex items-center space-x-2 truncate">
          <Terminal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="text-neutral-500">$</span>
          <span className="text-neutral-300 truncate">
            {lastCommitRevealed
              ? `git checkout ${lastCommitRevealed.shortSha} -m "${lastCommitRevealed.message.slice(0, 48)}..."`
              : `git log --oneline --reverse ${defaultBranch}`}
          </span>
        </div>
        <div className="shrink-0 text-[11px] text-emerald-400 font-semibold">
          {isAutoPlay ? '[Autopilot Active]' : '[Manual Runner Mode: Press Space / Tap]'}
        </div>
      </div>
    </div>
  );
};
