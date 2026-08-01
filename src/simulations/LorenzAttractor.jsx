import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Eye, GitBranch } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const DEFAULT_PARAMS = { sigma: 10, rho: 28, beta: 8 / 3 };
const MAX_TRAIL = 2000;
const DT = 0.005;
const STEPS_PER_FRAME = 6;

function rk4Step(x, y, z, sigma, rho, beta, dt) {
  const f = (x0, y0, z0) => ({
    dx: sigma * (y0 - x0),
    dy: x0 * (rho - z0) - y0,
    dz: x0 * y0 - beta * z0,
  });
  const k1 = f(x, y, z);
  const k2 = f(x + (dt / 2) * k1.dx, y + (dt / 2) * k1.dy, z + (dt / 2) * k1.dz);
  const k3 = f(x + (dt / 2) * k2.dx, y + (dt / 2) * k2.dy, z + (dt / 2) * k2.dz);
  const k4 = f(x + dt * k3.dx, y + dt * k3.dy, z + dt * k3.dz);
  return {
    x: x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    z: z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz),
  };
}

function project(x, y, z, rotY, rotX, scale, cx, cy) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  return { px: cx + x1 * scale, py: cy + y2 * scale, depth: z2 };
}

function makeTrajectories(n) {
  return Array.from({ length: n }, (_, i) => ({
    x: 0.1 + i * 0.01,
    y: 0.0 + i * 0.01,
    z: 0.0,
    trail: [],
  }));
}

const TRAIL_COLORS = ['#22d3ee', '#f472b6', '#4ade80', '#fb923c'];

const LorenzAttractor = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dimensions = useContainerDimensions(containerRef);
  const reqRef = useRef(null);

  const simRef = useRef({
    trajectories: makeTrajectories(4),
    rotY: 0.5,
    rotX: -0.4,
    params: { ...DEFAULT_PARAMS },
    paused: false,
    showAxes: true,
    numTrails: 4,
  });

  const [sigma, setSigma] = useState(DEFAULT_PARAMS.sigma);
  const [rho, setRho] = useState(DEFAULT_PARAMS.rho);
  const [beta, setBeta] = useState(parseFloat(DEFAULT_PARAMS.beta.toFixed(3)));
  const [paused, setPaused] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [numTrails, setNumTrails] = useState(4);

  useEffect(() => { simRef.current.params = { sigma, rho, beta }; }, [sigma, rho, beta]);
  useEffect(() => { simRef.current.paused = paused; }, [paused]);
  useEffect(() => { simRef.current.showAxes = showAxes; }, [showAxes]);
  useEffect(() => {
    simRef.current.numTrails = numTrails;
    simRef.current.trajectories = makeTrajectories(numTrails);
  }, [numTrails]);

  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const onMouseDown = (e) => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }; };
  const onMouseMove = (e) => {
    if (!dragRef.current.active) return;
    simRef.current.rotY += (e.clientX - dragRef.current.lastX) * 0.006;
    simRef.current.rotX += (e.clientY - dragRef.current.lastY) * 0.006;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };
  const onMouseUp = () => { dragRef.current.active = false; };

  const onTouchStart = (e) => { const t = e.touches[0]; dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY }; };
  const onTouchMove = (e) => {
    if (!dragRef.current.active) return;
    const t = e.touches[0];
    simRef.current.rotY += (t.clientX - dragRef.current.lastX) * 0.006;
    simRef.current.rotX += (t.clientY - dragRef.current.lastY) * 0.006;
    dragRef.current.lastX = t.clientX;
    dragRef.current.lastY = t.clientY;
  };
  const onTouchEnd = () => { dragRef.current.active = false; };

  const reset = useCallback(() => {
    simRef.current.trajectories = makeTrajectories(simRef.current.numTrails);
    simRef.current.rotY = 0.5;
    simRef.current.rotX = -0.4;
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !dimensions.width) return;
    c.width = dimensions.width;
    c.height = dimensions.height;
    const ctx = c.getContext('2d');

    const loop = () => {
      const { trajectories, rotY, rotX, params, paused: isPaused, showAxes: axesOn } = simRef.current;
      const { sigma: s, rho: r, beta: b } = params;
      const W = c.width, H = c.height;
      const cx = W * 0.5, cy = H * 0.48;
      const scale = Math.min(W, H) / 70;

      if (!isPaused) {
        for (const traj of trajectories) {
          for (let i = 0; i < STEPS_PER_FRAME; i++) {
            const n = rk4Step(traj.x, traj.y, traj.z, s, r, b, DT);
            traj.x = n.x; traj.y = n.y; traj.z = n.z;
            traj.trail.push({ x: n.x, y: n.y, z: n.z });
          }
          if (traj.trail.length > MAX_TRAIL) traj.trail.splice(0, traj.trail.length - MAX_TRAIL);
        }
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      if (axesOn) {
        const axisLen = 20;
        const axesDef = [
          { vec: [axisLen, 0, 0], color: '#ef4444', label: 'X' },
          { vec: [0, axisLen, 0], color: '#22d3ee', label: 'Y' },
          { vec: [0, 0, axisLen], color: '#4ade80', label: 'Z' },
        ];
        const orig = project(0, 0, 25, rotY, rotX, scale, cx, cy);
        axesDef.forEach(({ vec, color, label }) => {
          const tip = project(vec[0], vec[1], 25 + vec[2], rotY, rotX, scale, cx, cy);
          ctx.beginPath(); ctx.moveTo(orig.px, orig.py); ctx.lineTo(tip.px, tip.py);
          ctx.strokeStyle = color + '88'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = color; ctx.font = 'bold 10px monospace';
          ctx.fillText(label, tip.px + 3, tip.py - 3);
        });
      }

      const toRender = trajectories
        .map((traj, i) => {
          if (traj.trail.length < 2) return null;
          const mid = traj.trail[Math.floor(traj.trail.length / 2)];
          const p = project(mid.x, mid.y, mid.z, rotY, rotX, scale, cx, cy);
          return { traj, colorIndex: i, depth: p.depth };
        })
        .filter(Boolean)
        .sort((a, bx) => a.depth - bx.depth);

      for (const { traj, colorIndex } of toRender) {
        const trail = traj.trail;
        const color = TRAIL_COLORS[colorIndex % TRAIL_COLORS.length];
        const len = trail.length;
        ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        const CHUNK = 40;
        for (let start = 0; start < len - 1; start += CHUNK) {
          const end = Math.min(start + CHUNK, len - 1);
          const alpha = 0.05 + (start / len) * 0.9;
          ctx.beginPath();
          ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          const p0 = project(trail[start].x, trail[start].y, trail[start].z, rotY, rotX, scale, cx, cy);
          ctx.moveTo(p0.px, p0.py);
          for (let i = start + 1; i <= end; i++) {
            const p = project(trail[i].x, trail[i].y, trail[i].z, rotY, rotX, scale, cx, cy);
            ctx.lineTo(p.px, p.py);
          }
          ctx.stroke();
        }
        const head = project(traj.x, traj.y, traj.z, rotY, rotX, scale, cx, cy);
        ctx.beginPath(); ctx.arc(head.px, head.py, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
        ctx.fill(); ctx.shadowBlur = 0;
      }

      ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(148,163,184,0.55)';
      ctx.fillText(`\u03c3 = ${s.toFixed(2)}   \u03c1 = ${r.toFixed(2)}   \u03b2 = ${b.toFixed(3)}`, 12, H - 10);

      if (trajectories.length >= 2 && trajectories[0].trail.length > 0) {
        const dx = trajectories[0].x - trajectories[1].x;
        const dy = trajectories[0].y - trajectories[1].y;
        const dz = trajectories[0].z - trajectories[1].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const label = dist > 5 ? 'CHAOTISCH' : dist > 0.5 ? 'DIVERGIERT' : 'KOH\u00c4RENT';
        const col = dist > 5 ? '#f87171' : dist > 0.5 ? '#fb923c' : '#4ade80';
        ctx.fillStyle = col; ctx.font = 'bold 10px monospace';
        ctx.fillText(`\u0394 = ${dist.toFixed(2)}  ${label}`, W - 180, H - 10);
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [dimensions]);

  const Slider = ({ label, value, min, max, step, onChange, color }) => (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold font-mono" style={{ color }}>{label}</span>
        <span className="text-[10px] text-slate-500 font-mono">{value.toFixed(3)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1" style={{ accentColor: color }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      <div className="flex-1 relative min-h-0 cursor-grab active:cursor-grabbing" ref={containerRef}>
        <canvas ref={canvasRef} className="block w-full h-full"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        />
        <button onClick={reset} className="absolute top-4 right-4 bg-slate-800 p-2 rounded-sm text-white hover:bg-slate-700">
          <RefreshCw size={16} />
        </button>
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={() => setPaused(v => !v)}
            className={`px-2 py-1 text-xs rounded-sm font-bold border transition-colors ${
              paused ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
            {paused ? 'Weiter' : 'Pause'}
          </button>
          <button onClick={() => setShowAxes(v => !v)}
            className={`px-2 py-1 text-xs rounded-sm font-bold border transition-colors ${
              showAxes ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
            <Eye size={11} className="inline mr-1" />Achsen
          </button>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 pointer-events-none">
          Ziehen zum Rotieren
        </div>
      </div>

      <div className="bg-slate-950 border-t border-slate-800 p-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lorenz-Parameter</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Trajektorien</span>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setNumTrails(n)}
                className={`w-5 h-5 text-[10px] rounded-sm border font-bold transition-colors ${
                  numTrails === n ? 'bg-cyan-500/30 border-cyan-500/50 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>{n}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Slider label="\u03c3 (Sigma)" value={sigma} min={1}   max={20} step={0.1}  onChange={setSigma} color="#22d3ee" />
          <Slider label="\u03c1 (Rho)"   value={rho}   min={0.5} max={60} step={0.5}  onChange={setRho}   color="#f472b6" />
          <Slider label="\u03b2 (Beta)"  value={beta}  min={0.1} max={6}  step={0.01} onChange={setBeta}  color="#4ade80" />
        </div>
      </div>
    </div>
  );
};

export default LorenzAttractor;
