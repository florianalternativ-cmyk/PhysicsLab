import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const DEFAULT_HARMONICS = [
  { amp: 1.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
  { amp: 0.0, phase: 0 },
];

const PRESETS = {
  sine:     [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  square:   [1.0, 0.0, 1/3, 0.0, 1/5, 0.0, 1/7, 0.0],
  sawtooth: [1.0, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8],
  triangle: [1.0, 0.0, 1/9, 0.0, 1/25,0.0, 1/49,0.0],
};

const HARMONIC_COLORS = [
  '#22d3ee', '#818cf8', '#34d399', '#fb923c',
  '#f472b6', '#a78bfa', '#4ade80', '#fbbf24',
];

const FourierSynthesis = () => {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const dimensions   = useContainerDimensions(containerRef);
  const reqRef       = useRef(null);
  const timeRef      = useRef(0);

  const [harmonics, setHarmonics] = useState(DEFAULT_HARMONICS.map(h => ({ ...h })));
  const [speed, setSpeed]         = useState(1.0);
  const [showPhasors, setShowPhasors] = useState(true);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const harmonicsRef = useRef(harmonics);
  const speedRef     = useRef(speed);
  const showPhasorsRef  = useRef(showPhasors);
  const showSpectrumRef = useRef(showSpectrum);

  useEffect(() => { harmonicsRef.current = harmonics; }, [harmonics]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { showPhasorsRef.current = showPhasors; }, [showPhasors]);
  useEffect(() => { showSpectrumRef.current = showSpectrum; }, [showSpectrum]);

  const applyPreset = useCallback((key) => {
    const amps = PRESETS[key];
    setHarmonics(prev => prev.map((h, i) => ({ ...h, amp: amps[i] })));
  }, []);

  const reset = useCallback(() => {
    setHarmonics(DEFAULT_HARMONICS.map(h => ({ ...h })));
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !dimensions.width) return;
    c.width  = dimensions.width;
    c.height = dimensions.height;
    const ctx = c.getContext('2d');

    // wave history buffer
    const waveHistory = [];
    const WAVE_LEN = Math.floor(dimensions.width * 0.45);

    const drawGrid = (x0, y0, w, h, label) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = y0 + (i / 4) * h;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        const x = x0 + (i / 4) * w;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke();
      }
      // center line
      ctx.strokeStyle = 'rgba(100,116,139,0.4)';
      ctx.beginPath(); ctx.moveTo(x0, y0 + h/2); ctx.lineTo(x0 + w, y0 + h/2); ctx.stroke();
      // label
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(label, x0 + 8, y0 + 14);
      ctx.restore();
    };

    const loop = () => {
      timeRef.current += 0.02 * speedRef.current;
      const t = timeRef.current;
      const hs = harmonicsRef.current;
      const W = c.width, H = c.height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // ── Layout ──────────────────────────────────────────────
      const phasorCX = W * 0.22;
      const phasorCY = H * 0.42;
      const maxR     = Math.min(phasorCX, phasorCY) * 0.82;

      const waveX0 = W * 0.44;
      const waveY0 = H * 0.06;
      const waveW  = W * 0.54;
      const waveH  = H * 0.52;

      const specX0 = W * 0.44;
      const specY0 = H * 0.63;
      const specW  = W * 0.54;
      const specH  = H * 0.32;

      // ── Phasor diagram ──────────────────────────────────────
      if (showPhasorsRef.current) {
        ctx.save();
        ctx.translate(phasorCX, phasorCY);

        // background circle
        ctx.beginPath();
        ctx.arc(0, 0, maxR + 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,116,139,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // unit circle guides
        let totalAmp = hs.reduce((s, h) => s + h.amp, 0);
        let guideR = totalAmp > 0 ? (maxR / totalAmp) : maxR;

        // draw each phasor arm
        let cx2 = 0, cy2 = 0;
        hs.forEach((h, i) => {
          if (h.amp < 0.01) return;
          const angle = (i + 1) * t + (h.phase * Math.PI / 180);
          const r     = h.amp * guideR;
          const nx = cx2 + r * Math.cos(angle);
          const ny = cy2 - r * Math.sin(angle);

          // circle showing orbit
          ctx.beginPath();
          ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
          ctx.strokeStyle = `${HARMONIC_COLORS[i]}22`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // phasor arm
          ctx.beginPath();
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = HARMONIC_COLORS[i];
          ctx.lineWidth = 2;
          ctx.stroke();

          // tip dot
          ctx.beginPath();
          ctx.arc(nx, ny, 4, 0, Math.PI * 2);
          ctx.fillStyle = HARMONIC_COLORS[i];
          ctx.fill();

          cx2 = nx; cy2 = ny;
        });

        // tip → wave connector (dashed)
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(148,163,184,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(phasorCX * -1 + waveX0, cy2); // points toward wave panel origin
        ctx.stroke();
        ctx.restore();

        // label
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('PHASOREN', -maxR - 10, -maxR - 2);

        ctx.restore();
      }

      // ── Wave panel ──────────────────────────────────────────
      drawGrid(waveX0, waveY0, waveW, waveH, 'WELLENFORM');

      // compute current sample
      let sample = 0;
      hs.forEach((h, i) => {
        if (h.amp > 0.001)
          sample += h.amp * Math.sin((i + 1) * t + (h.phase * Math.PI / 180));
      });

      waveHistory.push(sample);
      if (waveHistory.length > WAVE_LEN) waveHistory.shift();

      const totalAmpNorm = Math.max(hs.reduce((s, h) => s + h.amp, 0), 0.001);
      const waveAmpPx    = (waveH * 0.44) / totalAmpNorm;

      // individual harmonics (faint)
      hs.forEach((h, i) => {
        if (h.amp < 0.01) return;
        ctx.beginPath();
        ctx.strokeStyle = `${HARMONIC_COLORS[i]}44`;
        ctx.lineWidth = 1;
        waveHistory.forEach((_, idx) => {
          const tBack = t - (waveHistory.length - 1 - idx) * 0.02 * speedRef.current;
          const v = h.amp * Math.sin((i + 1) * tBack + (h.phase * Math.PI / 180));
          const x = waveX0 + (idx / WAVE_LEN) * waveW;
          const y = waveY0 + waveH / 2 - v * waveAmpPx;
          idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
      });

      // composite wave (bright)
      ctx.beginPath();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      waveHistory.forEach((v, idx) => {
        const x = waveX0 + (idx / WAVE_LEN) * waveW;
        const y = waveY0 + waveH / 2 - v * waveAmpPx;
        idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // current position marker
      const curX = waveX0 + waveW - 1;
      const curY = waveY0 + waveH / 2 - sample * waveAmpPx;
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // ── Spectrum panel ──────────────────────────────────────
      if (showSpectrumRef.current) {
        drawGrid(specX0, specY0, specW, specH, 'SPEKTRUM  (Amplituden)');
        const barW  = (specW / 8) * 0.6;
        const barGap = specW / 8;
        hs.forEach((h, i) => {
          const barH = h.amp * (specH * 0.85);
          const bx   = specX0 + barGap * i + barGap * 0.2;
          const by   = specY0 + specH - barH - 4;

          // glow
          ctx.shadowColor = HARMONIC_COLORS[i];
          ctx.shadowBlur  = 12;
          ctx.fillStyle   = HARMONIC_COLORS[i];
          ctx.fillRect(bx, by, barW, barH);
          ctx.shadowBlur  = 0;

          // frequency label
          ctx.fillStyle = 'rgba(148,163,184,0.7)';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`f${i + 1}`, bx + barW / 2, specY0 + specH + 12);
          ctx.textAlign = 'left';
        });
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [dimensions]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 relative min-h-0" ref={containerRef}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <button
          onClick={reset}
          className="absolute top-4 right-4 bg-slate-800 p-2 rounded-sm text-white hover:bg-slate-700"
        >
          <RefreshCw size={16} />
        </button>
        {/* Toggle buttons */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => setShowPhasors(v => !v)}
            className={`px-2 py-1 text-xs rounded-sm font-bold border transition-colors ${showPhasors ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            Phasoren
          </button>
          <button
            onClick={() => setShowSpectrum(v => !v)}
            className={`px-2 py-1 text-xs rounded-sm font-bold border transition-colors ${showSpectrum ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            Spektrum
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-950 border-t border-slate-800 p-3 space-y-3 shrink-0">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <Zap size={13} className="text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Preset:</span>
          {Object.keys(PRESETS).map(key => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm border border-slate-700 transition-colors capitalize"
            >
              {key === 'sine' ? 'Sinus' : key === 'square' ? 'Rechteck' : key === 'sawtooth' ? 'Sägezahn' : 'Dreieck'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Geschwindigkeit</span>
            <input
              type="range" min="0.1" max="4" step="0.1" value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-20 accent-slate-400"
            />
          </div>
        </div>

        {/* Harmonic sliders */}
        <div className="grid grid-cols-8 gap-1">
          {harmonics.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold" style={{ color: HARMONIC_COLORS[i] }}>
                f{i + 1}
              </span>
              {/* Amplitude */}
              <input
                type="range" min="0" max="1" step="0.01" value={h.amp}
                onChange={e => setHarmonics(prev => prev.map((x, j) => j === i ? { ...x, amp: Number(e.target.value) } : x))}
                className="w-full"
                style={{ accentColor: HARMONIC_COLORS[i], writingMode: 'horizontal-tb' }}
                title={`Amplitude f${i + 1}: ${h.amp.toFixed(2)}`}
              />
              <span className="text-[9px] text-slate-500 font-mono">{h.amp.toFixed(2)}</span>
              {/* Phase */}
              <input
                type="range" min="-180" max="180" step="5" value={h.phase}
                onChange={e => setHarmonics(prev => prev.map((x, j) => j === i ? { ...x, phase: Number(e.target.value) } : x))}
                className="w-full accent-slate-600"
                title={`Phase f${i + 1}: ${h.phase}°`}
              />
              <span className="text-[9px] text-slate-600 font-mono">{h.phase}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FourierSynthesis;
