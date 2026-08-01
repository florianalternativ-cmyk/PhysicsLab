import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Eye, Info } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

// ─── Physical constants (simulation units) ───────────────────────────────────
const G_DEFAULT   = 500;    // gravitational constant in sim units
const SOFTENING   = 8;      // softening length ε to prevent singularity
const TRAIL_MAX   = 350;    // max trail points per body
const MIN_MASS    = 5;
const MAX_MASS    = 400;

// ─── Color palette for bodies ────────────────────────────────────────────────
const BODY_COLORS = [
  '#f9a825','#ef5350','#42a5f5','#66bb6a','#ab47bc',
  '#ff7043','#26c6da','#d4e157','#ec407a','#26a69a',
];

// ─── Presets ─────────────────────────────────────────────────────────────────
// Figure-8: Chenciner & Montgomery (2000) exact periodic 3-body solution
// Positions and velocities normalised to unit-G, mass=1
const FIGURE8_SCALE = 120;
const FIGURE8_V     = 1.35;
function figure8Preset(cx, cy) {
  // Standard figure-8 ICs (Chenciner-Montgomery), scaled for canvas
  const pos = [
    [-0.97000436,  0.24308753],
    [ 0.97000436, -0.24308753],
    [ 0.0,         0.0       ],
  ];
  const vel = [
    [ 0.93240737 / 2,  0.86473146 / 2],
    [ 0.93240737 / 2,  0.86473146 / 2],
    [-0.93240737,     -0.86473146     ],
  ];
  return pos.map((p, i) => ({
    x:  cx + p[0] * FIGURE8_SCALE,
    y:  cy + p[1] * FIGURE8_SCALE,
    vx: vel[i][0] * FIGURE8_V,
    vy: vel[i][1] * FIGURE8_V,
    m:  80,
    color: BODY_COLORS[i],
    trail: [],
    id: i,
  }));
}

function binaryStarPreset(cx, cy) {
  const sep = 110;
  const v   = 1.6;
  return [
    { x: cx - sep/2, y: cy, vx: 0, vy: -v, m: 180, color: BODY_COLORS[0], trail: [], id: 0 },
    { x: cx + sep/2, y: cy, vx: 0, vy:  v, m: 180, color: BODY_COLORS[1], trail: [], id: 1 },
    { x: cx,         y: cy - sep * 1.6, vx: v * 2.5, vy: 0, m: 10, color: BODY_COLORS[2], trail: [], id: 2 },
  ];
}

function solarPreset(cx, cy) {
  // Sun + 4 planets, roughly Keplerian circular orbit velocities
  // v_circ = sqrt(G * M_sun / r)
  const Msun = 400;
  const planets = [
    { r: 70,  m: 6,   color: BODY_COLORS[3] },
    { r: 110, m: 10,  color: BODY_COLORS[2] },
    { r: 155, m: 8,   color: BODY_COLORS[9] },
    { r: 210, m: 4,   color: BODY_COLORS[5] },
  ];
  const bodies = [{ x: cx, y: cy, vx: 0, vy: 0, m: Msun, color: BODY_COLORS[0], trail: [], id: 0 }];
  planets.forEach((p, i) => {
    const v = Math.sqrt(G_DEFAULT * Msun / p.r);
    bodies.push({ x: cx + p.r, y: cy, vx: 0, vy: v, m: p.m, color: p.color, trail: [], id: i + 1 });
  });
  return bodies;
}

function randomPreset(cx, cy) {
  return Array.from({ length: 6 }, (_, i) => ({
    x:  cx + (Math.random() - 0.5) * 300,
    y:  cy + (Math.random() - 0.5) * 300,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    m:  30 + Math.random() * 120,
    color: BODY_COLORS[i % BODY_COLORS.length],
    trail: [],
    id: i,
  }));
}

// ─── Leapfrog (Verlet) integrator — symplectic, conserves energy ──────────────
function computeAccelerations(bodies, G) {
  const acc = bodies.map(() => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx  = bodies[j].x - bodies[i].x;
      const dy  = bodies[j].y - bodies[i].y;
      const r2  = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const r   = Math.sqrt(r2);
      const f   = G / (r2 * r); // G / r³  (force / (m_i * m_j) * r)
      acc[i].ax += f * bodies[j].m * dx;
      acc[i].ay += f * bodies[j].m * dy;
      acc[j].ax -= f * bodies[i].m * dx;
      acc[j].ay -= f * bodies[i].m * dy;
    }
  }
  return acc;
}

function leapfrogStep(bodies, dt, G) {
  // kick-drift-kick (velocity Verlet)
  const acc1 = computeAccelerations(bodies, G);
  const halfKicked = bodies.map((b, i) => ({
    ...b,
    vx: b.vx + 0.5 * acc1[i].ax * dt,
    vy: b.vy + 0.5 * acc1[i].ay * dt,
  }));
  const drifted = halfKicked.map(b => ({
    ...b,
    x: b.x + b.vx * dt,
    y: b.y + b.vy * dt,
  }));
  const acc2 = computeAccelerations(drifted, G);
  return drifted.map((b, i) => ({
    ...b,
    vx: b.vx + 0.5 * acc2[i].ax * dt,
    vy: b.vy + 0.5 * acc2[i].ay * dt,
  }));
}

// ─── Energy calculation ───────────────────────────────────────────────────────
function calcEnergy(bodies, G) {
  let KE = 0, PE = 0;
  bodies.forEach(b => { KE += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy); });
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r  = Math.sqrt(dx * dx + dy * dy + SOFTENING * SOFTENING);
      PE -= G * bodies[i].m * bodies[j].m / r;
    }
  }
  return { KE, PE, total: KE + PE };
}

// ─── Center of mass ───────────────────────────────────────────────────────────
function calcCoM(bodies) {
  let mx = 0, my = 0, mt = 0;
  bodies.forEach(b => { mx += b.m * b.x; my += b.m * b.y; mt += b.m; });
  return { x: mx / mt, y: my / mt };
}

// ─── Radius from mass (visual) ────────────────────────────────────────────────
function massToRadius(m) {
  return 3 + Math.cbrt(m) * 1.5;
}

// ─────────────────────────────────────────────────────────────────────────────
const NBodyGravity = () => {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const dimensions   = useContainerDimensions(containerRef);
  const reqRef       = useRef(null);

  // All mutable sim state in one ref — RAF always sees latest values
  const simRef = useRef({
    bodies:      [],
    paused:      false,
    G:           G_DEFAULT,
    timeScale:   1.0,
    showTrails:  true,
    showVectors: false,
    showCoM:     false,
    showForces:  false,
    energy:      { KE: 0, PE: 0, total: 0 },
    e0:          null,   // initial energy for drift display
    selected:    null,   // index of selected body
    idCounter:   100,
  });

  // React state for UI only
  const [paused,      setPaused]      = useState(false);
  const [G,           setG]           = useState(G_DEFAULT);
  const [timeScale,   setTimeScale]   = useState(1.0);
  const [newMass,     setNewMass]     = useState(40);
  const [showTrails,  setShowTrails]  = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [showCoM,     setShowCoM]     = useState(false);
  const [showForces,  setShowForces]  = useState(false);
  const [energyDisplay, setEnergyDisplay] = useState({ KE: 0, PE: 0, total: 0 });
  const [selectedInfo,  setSelectedInfo]  = useState(null);
  const [preset, setPreset] = useState('figure8');

  // Sync React → simRef
  useEffect(() => { simRef.current.paused      = paused;      }, [paused]);
  useEffect(() => { simRef.current.G           = G;           }, [G]);
  useEffect(() => { simRef.current.timeScale   = timeScale;   }, [timeScale]);
  useEffect(() => { simRef.current.showTrails  = showTrails;  }, [showTrails]);
  useEffect(() => { simRef.current.showVectors = showVectors; }, [showVectors]);
  useEffect(() => { simRef.current.showCoM     = showCoM;     }, [showCoM]);
  useEffect(() => { simRef.current.showForces  = showForces;  }, [showForces]);

  // ── Load preset ──────────────────────────────────────────────────────────────
  const loadPreset = useCallback((name, W, H) => {
    const cx = W / 2, cy = H / 2;
    let bodies;
    if (name === 'figure8')   bodies = figure8Preset(cx, cy);
    else if (name === 'binary') bodies = binaryStarPreset(cx, cy);
    else if (name === 'solar')  bodies = solarPreset(cx, cy);
    else                         bodies = randomPreset(cx, cy);
    simRef.current.bodies   = bodies;
    simRef.current.e0       = null;
    simRef.current.selected = null;
    setSelectedInfo(null);
  }, []);

  useEffect(() => {
    if (!dimensions.width) return;
    loadPreset(preset, dimensions.width, dimensions.height);
  }, [preset, dimensions, loadPreset]);

  // ── Drag-to-spawn state ───────────────────────────────────────────────────────
  const spawnRef = useRef({ active: false, x: 0, y: 0, cx: 0, cy: 0 });
  const dragBodyRef = useRef({ active: false, index: -1 });

  // ── Mouse down: start spawn drag OR select/drag existing body ────────────────
  const onMouseDown = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasRef.current.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvasRef.current.height / rect.height);

    // Check if clicking on existing body
    const bodies = simRef.current.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const b  = bodies[i];
      const dr = Math.sqrt((mx - b.x) ** 2 + (my - b.y) ** 2);
      if (dr < Math.max(massToRadius(b.m) + 8, 20)) {
        dragBodyRef.current = { active: true, index: i };
        simRef.current.selected = i;
        setSelectedInfo({ m: b.m.toFixed(1), v: Math.sqrt(b.vx**2+b.vy**2).toFixed(2), color: b.color });
        return;
      }
    }
    simRef.current.selected = null;
    setSelectedInfo(null);
    // Start spawn drag
    spawnRef.current = { active: true, x: mx, y: my, cx: mx, cy: my };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasRef.current.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvasRef.current.height / rect.height);

    if (dragBodyRef.current.active) {
      const b = simRef.current.bodies[dragBodyRef.current.index];
      if (b) { b.x = mx; b.y = my; b.vx = 0; b.vy = 0; b.trail = []; }
      return;
    }
    if (spawnRef.current.active) {
      spawnRef.current.cx = mx;
      spawnRef.current.cy = my;
    }
  }, []);

  const onMouseUp = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasRef.current.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvasRef.current.height / rect.height);

    if (dragBodyRef.current.active) {
      dragBodyRef.current = { active: false, index: -1 };
      return;
    }
    if (spawnRef.current.active) {
      const { x: sx, y: sy } = spawnRef.current;
      const dx = mx - sx, dy = my - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        // Simple click — spawn at rest
        simRef.current.bodies.push({
          x: sx, y: sy, vx: 0, vy: 0,
          m: newMass,
          color: BODY_COLORS[simRef.current.idCounter % BODY_COLORS.length],
          trail: [],
          id: simRef.current.idCounter++,
        });
      } else {
        // Drag — velocity proportional to arrow
        const scale = 0.06;
        simRef.current.bodies.push({
          x: sx, y: sy,
          vx: dx * scale, vy: dy * scale,
          m: newMass,
          color: BODY_COLORS[simRef.current.idCounter % BODY_COLORS.length],
          trail: [],
          id: simRef.current.idCounter++,
        });
      }
      simRef.current.e0 = null; // reset energy baseline
      spawnRef.current.active = false;
    }
  }, [newMass]);

  const onMouseLeave = useCallback(() => {
    spawnRef.current.active = false;
    dragBodyRef.current = { active: false, index: -1 };
  }, []);

  // Touch equivalents
  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    onMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }, [onMouseDown]);
  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }, [onMouseMove]);
  const onTouchEnd = useCallback((e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    onMouseUp({ clientX: t.clientX, clientY: t.clientY });
  }, [onMouseUp]);

  // ── Main RAF loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !dimensions.width) return;
    c.width  = dimensions.width;
    c.height = dimensions.height;
    const ctx = c.getContext('2d');
    let frameCount = 0;

    const loop = () => {
      const sim = simRef.current;
      const { bodies, paused: isPaused, G: Gval, timeScale: ts,
               showTrails: trails, showVectors: vecs,
               showCoM: com, showForces: forces, selected } = sim;
      const W = c.width, H = c.height;
      const DT = 0.5 * ts;
      const SUB = Math.max(1, Math.round(ts * 2)); // substeps for stability

      // ── Physics ──────────────────────────────────────────────────────────────
      if (!isPaused && bodies.length > 0) {
        let updated = bodies.map(b => ({ ...b }));
        for (let s = 0; s < SUB; s++) {
          updated = leapfrogStep(updated, DT / SUB, Gval);
        }
        // Copy physics back, preserve trails and ids
        for (let i = 0; i < bodies.length; i++) {
          bodies[i].x  = updated[i].x;
          bodies[i].y  = updated[i].y;
          bodies[i].vx = updated[i].vx;
          bodies[i].vy = updated[i].vy;
          // Append trail
          if (trails) {
            bodies[i].trail.push({ x: bodies[i].x, y: bodies[i].y });
            if (bodies[i].trail.length > TRAIL_MAX) bodies[i].trail.shift();
          }
        }
        // Compute energy every 10 frames for display
        if (frameCount % 10 === 0) {
          const e = calcEnergy(bodies, Gval);
          if (sim.e0 === null) sim.e0 = e.total;
          sim.energy = e;
          setEnergyDisplay({ ...e, drift: sim.e0 !== 0 ? ((e.total - sim.e0) / Math.abs(sim.e0) * 100) : 0 });
          // Update selected body info
          if (selected !== null && bodies[selected]) {
            const b = bodies[selected];
            setSelectedInfo({ m: b.m.toFixed(1), v: Math.sqrt(b.vx**2+b.vy**2).toFixed(2), color: b.color });
          }
        }
      }
      frameCount++;

      // ── Render ───────────────────────────────────────────────────────────────
      // Faded background for motion blur effect
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(0, 0, W, H);

      // ── Trails ───────────────────────────────────────────────────────────────
      if (trails) {
        bodies.forEach(b => {
          if (b.trail.length < 2) return;
          ctx.beginPath();
          b.trail.forEach((pt, idx) => {
            const alpha = (idx / b.trail.length) * 0.7;
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = b.color + '55';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Bright recent segment
          if (b.trail.length > 10) {
            const recent = b.trail.slice(-10);
            ctx.beginPath();
            recent.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
            ctx.strokeStyle = b.color + 'cc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      }

      // ── Gravity force vectors ─────────────────────────────────────────────────
      if (forces && bodies.length > 1) {
        const acc = computeAccelerations(bodies, Gval);
        bodies.forEach((b, i) => {
          const mag   = Math.sqrt(acc[i].ax ** 2 + acc[i].ay ** 2);
          if (mag < 0.001) return;
          const scale = Math.min(60 / mag, 400);
          const ex    = b.x + acc[i].ax * scale;
          const ey    = b.y + acc[i].ay * scale;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = '#fbbf24aa';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // arrowhead
          const ang = Math.atan2(ey - b.y, ex - b.x);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4));
          ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4));
          ctx.closePath();
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
        });
      }

      // ── Velocity vectors ──────────────────────────────────────────────────────
      if (vecs) {
        bodies.forEach(b => {
          const speed  = Math.sqrt(b.vx ** 2 + b.vy ** 2);
          if (speed < 0.01) return;
          const scale  = 18;
          const ex = b.x + b.vx * scale;
          const ey = b.y + b.vy * scale;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = '#818cf8cc';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          const ang = Math.atan2(b.vy, b.vx);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 7 * Math.cos(ang - 0.4), ey - 7 * Math.sin(ang - 0.4));
          ctx.lineTo(ex - 7 * Math.cos(ang + 0.4), ey - 7 * Math.sin(ang + 0.4));
          ctx.closePath();
          ctx.fillStyle = '#818cf8';
          ctx.fill();
        });
      }

      // ── Bodies ────────────────────────────────────────────────────────────────
      bodies.forEach((b, i) => {
        const rad = massToRadius(b.m);
        const isSelected = i === selected;

        // Glow
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur  = isSelected ? 30 : 16;
        ctx.beginPath();
        ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.restore();

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, rad + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff66';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Mass label for large bodies
        if (b.m > 60) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b.m.toFixed(0), b.x, b.y + rad + 10);
          ctx.textAlign = 'left';
        }
      });

      // ── Center of mass ────────────────────────────────────────────────────────
      if (com && bodies.length > 1) {
        const cm = calcCoM(bodies);
        ctx.save();
        ctx.strokeStyle = '#ffffff44';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cm.x - 10, cm.y); ctx.lineTo(cm.x + 10, cm.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cm.x, cm.y - 10); ctx.lineTo(cm.x, cm.y + 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(cm.x, cm.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff66'; ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '9px monospace';
        ctx.fillText('CoM', cm.x + 6, cm.y - 4);
      }

      // ── Spawn arrow preview ───────────────────────────────────────────────────
      if (spawnRef.current.active) {
        const { x: sx, y: sy, cx: scx, cy: scy } = spawnRef.current;
        const dx = scx - sx, dy = scy - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Spawn ghost body
        const rad = massToRadius(newMassRef.current);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.shadowColor = BODY_COLORS[simRef.current.idCounter % BODY_COLORS.length];
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = BODY_COLORS[simRef.current.idCounter % BODY_COLORS.length];
        ctx.fill();
        ctx.restore();
        if (dist > 6) {
          // Arrow showing initial velocity
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(scx, scy);
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          const ang = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(scx, scy);
          ctx.lineTo(scx - 10 * Math.cos(ang - 0.4), scy - 10 * Math.sin(ang - 0.4));
          ctx.lineTo(scx - 10 * Math.cos(ang + 0.4), scy - 10 * Math.sin(ang + 0.4));
          ctx.closePath();
          ctx.fillStyle = '#ffffffaa';
          ctx.fill();
          // Speed label
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '10px monospace';
          ctx.fillText(`v=${(dist * 0.06).toFixed(2)}`, scx + 8, scy);
        }
      }

      // ── Body count HUD ────────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(148,163,184,0.45)';
      ctx.font = '10px monospace';
      ctx.fillText(`N = ${bodies.length}`, 12, H - 10);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [dimensions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep newMass accessible in RAF without re-creating loop
  const newMassRef = useRef(newMass);
  useEffect(() => { newMassRef.current = newMass; }, [newMass]);

  const toggleLabel = (val) => val ? 'an' : 'aus';

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Canvas area */}
      <div
        className="flex-1 relative min-h-0 cursor-crosshair"
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Reset button */}
        <button
          onClick={() => loadPreset(preset, dimensions.width, dimensions.height)}
          className="absolute top-4 right-4 bg-slate-800 p-2 rounded-sm text-white hover:bg-slate-700"
        >
          <RefreshCw size={16} />
        </button>

        {/* Pause button */}
        <button
          onClick={() => setPaused(v => !v)}
          className={`absolute top-4 right-14 p-2 rounded-sm font-bold border text-xs transition-colors ${
            paused ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {paused ? 'Weiter' : 'Pause'}
        </button>

        {/* Toggle overlay buttons */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          {[
            { label: 'Bahnen',    val: showTrails,  set: setShowTrails  },
            { label: 'v-Pfeile', val: showVectors, set: setShowVectors },
            { label: 'F-Pfeile', val: showForces,  set: setShowForces  },
            { label: 'CoM',      val: showCoM,     set: setShowCoM     },
          ].map(({ label, val, set }) => (
            <button key={label} onClick={() => set(v => !v)}
              className={`px-2 py-0.5 text-[10px] rounded-sm font-bold border transition-colors ${
                val ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800/80 border-slate-700 text-slate-600'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Energy HUD */}
        <div className="absolute bottom-6 right-4 text-right pointer-events-none">
          <div className="bg-slate-900/80 rounded-sm px-2 py-1 text-[9px] font-mono space-y-0.5">
            <div className="text-yellow-400">KE  {energyDisplay.KE  ? (energyDisplay.KE  / 1000).toFixed(1) : '—'} k</div>
            <div className="text-blue-400" >PE  {energyDisplay.PE  ? (energyDisplay.PE  / 1000).toFixed(1) : '—'} k</div>
            <div className="text-white"    >E   {energyDisplay.total ? (energyDisplay.total / 1000).toFixed(1) : '—'} k</div>
            {energyDisplay.drift !== undefined && (
              <div className={Math.abs(energyDisplay.drift) > 1 ? 'text-red-400' : 'text-slate-500'}>
                Δ {energyDisplay.drift?.toFixed(3)} %
              </div>
            )}
          </div>
        </div>

        {/* Selected body info */}
        {selectedInfo && (
          <div className="absolute bottom-6 left-4 pointer-events-none">
            <div className="bg-slate-900/80 rounded-sm px-2 py-1 text-[9px] font-mono space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: selectedInfo.color }} />
                <span className="text-slate-300">Ausgewählt</span>
              </div>
              <div className="text-slate-400">m = {selectedInfo.m}</div>
              <div className="text-slate-400">|v| = {selectedInfo.v}</div>
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 pointer-events-none">
          Klick: Körper spawnen · Ziehen: Geschwindigkeit setzen · Körper anklicken: auswählen
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-slate-950 border-t border-slate-800 p-3 space-y-2 shrink-0">
        {/* Preset row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Zap size={12} className="text-slate-500 shrink-0" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Preset:</span>
          {[
            { key: 'figure8', label: 'Figur-8' },
            { key: 'binary',  label: 'Doppelstern' },
            { key: 'solar',   label: 'Sonnensystem' },
            { key: 'random',  label: 'Zufall' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setPreset(key)}
              className={`px-2 py-0.5 text-xs rounded-sm border font-bold transition-colors ${
                preset === key
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-3 gap-3">
          {/* G */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold font-mono text-yellow-400">G (Gravitation)</span>
              <span className="text-[10px] text-slate-500 font-mono">{G}</span>
            </div>
            <input type="range" min="50" max="2000" step="50" value={G}
              onChange={e => setG(Number(e.target.value))}
              className="w-full h-1" style={{ accentColor: '#f9a825' }} />
          </div>
          {/* Time scale */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold font-mono text-purple-400">Zeitskala</span>
              <span className="text-[10px] text-slate-500 font-mono">{timeScale.toFixed(1)}×</span>
            </div>
            <input type="range" min="0.1" max="4" step="0.1" value={timeScale}
              onChange={e => setTimeScale(Number(e.target.value))}
              className="w-full h-1" style={{ accentColor: '#a78bfa' }} />
          </div>
          {/* New body mass */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold font-mono text-emerald-400">Neue Masse</span>
              <span className="text-[10px] text-slate-500 font-mono">{newMass}</span>
            </div>
            <input type="range" min={MIN_MASS} max={MAX_MASS} step="5" value={newMass}
              onChange={e => setNewMass(Number(e.target.value))}
              className="w-full h-1" style={{ accentColor: '#4ade80' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NBodyGravity;
