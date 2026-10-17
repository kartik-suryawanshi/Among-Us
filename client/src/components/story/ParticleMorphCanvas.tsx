import React, { useEffect, useRef, useState } from 'react';

export type MorphShape = 'code' | 'git' | 'database' | 'atom' | 'terminal';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  baseColor: string;
}

interface ParticleMorphCanvasProps {
  initialShape?: MorphShape;
  accentColor?: string;
  className?: string;
  interactive?: boolean;
}

export const ParticleMorphCanvas: React.FC<ParticleMorphCanvasProps> = ({
  initialShape = 'code',
  accentColor = '#10b981',
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentShape, setCurrentShape] = useState<MorphShape>(initialShape);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Generate target point coordinates for shapes normalized to width and height
  const generateShapePoints = (shape: MorphShape, count: number, w: number, h: number): [number, number][] => {
    const points: [number, number][] = [];
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.38;

    if (shape === 'code') {
      // '<' bracket (left)
      const bracketCount = Math.floor(count * 0.38);
      for (let i = 0; i < bracketCount; i++) {
        const t = (i / bracketCount) * 2 - 1; // -1 to 1
        const x = cx - scale * 0.8 + Math.abs(t) * scale * 0.5;
        const y = cy + t * scale * 0.7;
        points.push([x, y]);
      }

      // '>' bracket (right)
      for (let i = 0; i < bracketCount; i++) {
        const t = (i / bracketCount) * 2 - 1;
        const x = cx + scale * 0.8 - Math.abs(t) * scale * 0.5;
        const y = cy + t * scale * 0.7;
        points.push([x, y]);
      }

      // '/' slash (center)
      const slashCount = count - points.length;
      for (let i = 0; i < slashCount; i++) {
        const t = (i / slashCount) * 2 - 1;
        const x = cx + t * scale * 0.25;
        const y = cy - t * scale * 0.75;
        points.push([x, y]);
      }
    } else if (shape === 'git') {
      // Git tree branching: main branch vertical line, 3 circular nodes, and curve
      const nodeCount = 35;
      // Node 1: Root commit
      const rootX = cx - scale * 0.4;
      const rootY = cy + scale * 0.5;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        points.push([rootX + Math.cos(angle) * (scale * 0.16), rootY + Math.sin(angle) * (scale * 0.16)]);
      }

      // Node 2: Main HEAD commit
      const headX = cx - scale * 0.4;
      const headY = cy - scale * 0.5;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        points.push([headX + Math.cos(angle) * (scale * 0.16), headY + Math.sin(angle) * (scale * 0.16)]);
      }

      // Node 3: Feature Branch commit
      const branchX = cx + scale * 0.4;
      const branchY = cy;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        points.push([branchX + Math.cos(angle) * (scale * 0.16), branchY + Math.sin(angle) * (scale * 0.16)]);
      }

      // Main trunk line
      const trunkCount = Math.floor((count - points.length) * 0.5);
      for (let i = 0; i < trunkCount; i++) {
        const t = i / trunkCount;
        points.push([rootX, rootY - t * (rootY - headY)]);
      }

      // Branch curve from root to branch node and back to head
      const curveCount = count - points.length;
      for (let i = 0; i < curveCount; i++) {
        const t = i / curveCount;
        // Bezier curve root -> branch -> head
        const u = 1 - t;
        const x = u * u * rootX + 2 * u * t * (cx + scale * 0.5) + t * t * headX;
        const y = u * u * rootY + 2 * u * t * branchY + t * t * headY;
        points.push([x, y]);
      }
    } else if (shape === 'database') {
      // Cylinder with 3 horizontal ellipses and 2 vertical sides
      const ellipseCount = Math.floor(count * 0.22);
      // Top ellipse
      for (let i = 0; i < ellipseCount; i++) {
        const angle = (i / ellipseCount) * Math.PI * 2;
        points.push([cx + Math.cos(angle) * (scale * 0.7), cy - scale * 0.5 + Math.sin(angle) * (scale * 0.22)]);
      }
      // Middle ellipse
      for (let i = 0; i < ellipseCount; i++) {
        const angle = (i / ellipseCount) * Math.PI * 2;
        points.push([cx + Math.cos(angle) * (scale * 0.7), cy + Math.sin(angle) * (scale * 0.22)]);
      }
      // Bottom ellipse
      for (let i = 0; i < ellipseCount; i++) {
        const angle = (i / ellipseCount) * Math.PI * 2;
        points.push([cx + Math.cos(angle) * (scale * 0.7), cy + scale * 0.5 + Math.sin(angle) * (scale * 0.22)]);
      }
      // Vertical sides
      const sideCount = Math.floor((count - points.length) / 2);
      for (let i = 0; i < sideCount; i++) {
        const t = (i / sideCount) * scale;
        points.push([cx - scale * 0.7, cy - scale * 0.5 + t]);
        points.push([cx + scale * 0.7, cy - scale * 0.5 + t]);
      }
      // Fill remaining
      while (points.length < count) {
        points.push([cx + (Math.random() - 0.5) * scale, cy + (Math.random() - 0.5) * scale]);
      }
    } else if (shape === 'atom') {
      // Nucleus in center
      const nucleusCount = 30;
      for (let i = 0; i < nucleusCount; i++) {
        const r = Math.random() * (scale * 0.12);
        const theta = Math.random() * Math.PI * 2;
        points.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r]);
      }

      // 3 elliptical orbit rings rotated by 0, 60, 120 deg
      const ringCount = Math.floor((count - nucleusCount) / 3);
      const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];

      for (const rot of angles) {
        for (let i = 0; i < ringCount; i++) {
          const t = (i / ringCount) * Math.PI * 2;
          const a = scale * 0.85; // Major axis
          const b = scale * 0.28; // Minor axis
          const ex = Math.cos(t) * a;
          const ey = Math.sin(t) * b;

          const rx = ex * Math.cos(rot) - ey * Math.sin(rot);
          const ry = ex * Math.sin(rot) + ey * Math.cos(rot);
          points.push([cx + rx, cy + ry]);
        }
      }

      while (points.length < count) {
        points.push([cx, cy]);
      }
    } else {
      // Terminal box outline + '> _' prompt
      const borderCount = Math.floor(count * 0.65);
      const w2 = scale * 0.9;
      const h2 = scale * 0.65;

      for (let i = 0; i < borderCount; i++) {
        const perimeter = (w2 * 2 + h2 * 2) * 2;
        const pos = (i / borderCount) * perimeter;
        let x = 0;
        let y = 0;

        if (pos < w2 * 2) {
          x = cx - w2 + pos;
          y = cy - h2;
        } else if (pos < w2 * 2 + h2 * 2) {
          x = cx + w2;
          y = cy - h2 + (pos - w2 * 2);
        } else if (pos < w2 * 4 + h2 * 2) {
          x = cx + w2 - (pos - (w2 * 2 + h2 * 2));
          y = cy + h2;
        } else {
          x = cx - w2;
          y = cy + h2 - (pos - (w2 * 4 + h2 * 2));
        }
        points.push([x, y]);
      }

      // Inside '> _' prompt
      const promptCount = count - points.length;
      const px = cx - scale * 0.5;
      const py = cy;

      for (let i = 0; i < Math.floor(promptCount * 0.5); i++) {
        const t = (i / (promptCount * 0.5)) * 2 - 1;
        points.push([px + Math.abs(t) * (scale * 0.18), py + t * (scale * 0.18)]);
      }

      for (let i = points.length; i < count; i++) {
        const t = (i - points.length) / (count - points.length);
        points.push([px + scale * 0.3 + t * (scale * 0.25), py + scale * 0.18]);
      }
    }

    return points.slice(0, count);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display resolution adjustment
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const PARTICLE_COUNT = 480;
    const targets = generateShapePoints(currentShape, PARTICLE_COUNT, width, height);

    // Initialize particles if empty
    if (particlesRef.current.length === 0) {
      particlesRef.current = targets.map(([tx, ty]) => {
        const colors = [accentColor, '#38bdf8', '#a855f7', '#fbbf24', '#f8fafc'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        return {
          x: width / 2 + (Math.random() - 0.5) * 80,
          y: height / 2 + (Math.random() - 0.5) * 80,
          vx: 0,
          vy: 0,
          targetX: tx,
          targetY: ty,
          color: chosenColor,
          size: Math.random() * 1.5 + 1.2,
          baseColor: chosenColor,
        };
      });
    } else {
      // Update targets for current particles
      particlesRef.current.forEach((p, idx) => {
        if (targets[idx]) {
          p.targetX = targets[idx][0];
          p.targetY = targets[idx][1];
        }
      });
    }

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Spring towards target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;

        p.vx += dx * 0.045;
        p.vy += dy * 0.045;

        // Damping
        p.vx *= 0.78;
        p.vy *= 0.78;

        // Mouse repulsion
        if (interactive && mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          const repelRadius = 65;

          if (dist < repelRadius && dist > 0) {
            const force = (repelRadius - dist) / repelRadius;
            p.vx += (mdx / dist) * force * 4.5;
            p.vy += (mdy / dist) * force * 4.5;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Render particle dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentShape, accentColor, interactive]);

  // Handle mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  const shapes: MorphShape[] = ['code', 'git', 'database', 'atom', 'terminal'];

  const cycleShape = () => {
    const idx = shapes.indexOf(currentShape);
    const next = shapes[(idx + 1) % shapes.length];
    setCurrentShape(next);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={cycleShape}
        className="w-full h-full cursor-pointer select-none"
        title="Click to morph particle constellation"
      />
      <div className="absolute bottom-2 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-800 text-[10px] font-mono text-neutral-400 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Morph Shape: {currentShape.toUpperCase()} (Click canvas to cycle)</span>
      </div>
    </div>
  );
};
