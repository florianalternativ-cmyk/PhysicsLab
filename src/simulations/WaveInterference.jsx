import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, MousePointer2 } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const WaveInterference = () => {
  const [frequency, setFrequency] = useState(10);
  const [amplitude, setAmplitude] = useState(50);
  const [phaseOffset, setPhaseOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  
  const [internalRes, setInternalRes] = useState({ w: 400, h: 400 });

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const containerSize = useContainerDimensions(containerRef);
  
  const [sources, setSources] = useState([{ x: 0.35, y: 0.5 }, { x: 0.65, y: 0.5 }]);
  const [draggingSource, setDraggingSource] = useState(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    const maxDimension = 450; 
    const aspect = containerSize.width / containerSize.height;
    let w, h;
    if (aspect > 1) { w = maxDimension; h = Math.floor(maxDimension / aspect); } 
    else { h = maxDimension; w = Math.floor(maxDimension * aspect); }
    setInternalRes({ w, h });
  }, [containerSize]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (canvas.width !== internalRes.w || canvas.height !== internalRes.h) {
        canvas.width = internalRes.w; canvas.height = internalRes.h;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    const { w: width, h: height } = internalRes;
    if (width === 0 || height === 0) return;

    const imgData = ctx.createImageData(width, height);
    const buffer32 = new Uint32Array(imgData.data.buffer);

    const t = timeRef.current;
    const k = frequency * 0.05; 
    const wFreq = frequency * 0.2;  
    const maxAmp = amplitude * 2; 
    const phaseRad = phaseOffset * Math.PI / 180;

    const sx1 = sources[0].x * width; const sy1 = sources[0].y * height;
    const sx2 = sources[1].x * width; const sy2 = sources[1].y * height;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      const dy1 = y - sy1; const dy2 = y - sy2;
      const dy1Sq = dy1 * dy1; const dy2Sq = dy2 * dy2;

      for (let x = 0; x < width; x++) {
        const dx1 = x - sx1; const dx2 = x - sx2;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1Sq);
        const dist2 = Math.sqrt(dx2 * dx2 + dy2Sq);

        const wave1 = amplitude * Math.sin(dist1 * k - t * wFreq);
        const wave2 = amplitude * Math.sin(dist2 * k - t * wFreq + phaseRad);

        let intensity = (wave1 + wave2) / (maxAmp || 1); 
        if (intensity > 1) intensity = 1;
        if (intensity < -1) intensity = -1;

        let r, g, b;
        if (intensity > 0) {
            r = (intensity * 200) | 0; g = (100 + intensity * 155) | 0; b = (200 + intensity * 55) | 0;
        } else {
            const absInt = Math.abs(intensity);
            r = 0; g = (100 - absInt * 80) | 0; b = (200 - absInt * 150) | 0;
        }
        buffer32[rowOffset + x] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    sources.forEach((source) => {
      const sx = source.x * width; const sy = source.y * height;
      ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fillStyle = '#FFD700'; ctx.fill(); ctx.stroke();
    });

    if (isRunning) {
      // SLOWER: Reduced time increment from 0.5 to 0.1
      timeRef.current += 0.1;
      animationRef.current = requestAnimationFrame(renderFrame);
    }
  }, [internalRes, frequency, amplitude, phaseOffset, sources, isRunning]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationRef.current);
  }, [renderFrame]);

  const handleInteraction = (clientX, clientY, type) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));

    if (type === 'start') {
      const threshold = 0.1; 
      const dist1 = Math.sqrt(Math.pow(x - sources[0].x, 2) + Math.pow(y - sources[0].y, 2));
      const dist2 = Math.sqrt(Math.pow(x - sources[1].x, 2) + Math.pow(y - sources[1].y, 2));
      if (dist1 < threshold) setDraggingSource(0);
      else if (dist2 < threshold) setDraggingSource(1);
      setShowOverlay(false);
    } else if (type === 'move' && draggingSource !== null) {
      setSources(prev => { const n = [...prev]; n[draggingSource] = { x, y }; return n; });
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      <header className="h-10 sm:h-12 px-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
        <h1 className="text-sm font-bold text-slate-300">Wellen Interferenz</h1>
      </header>

      <div className="flex-1 relative bg-black overflow-hidden group min-h-0">
            <div 
              ref={containerRef}
              className="w-full h-full cursor-crosshair touch-none select-none"
              onMouseDown={(e) => handleInteraction(e.clientX, e.clientY, 'start')}
              onMouseMove={(e) => handleInteraction(e.clientX, e.clientY, 'move')}
              onMouseUp={() => setDraggingSource(null)}
              onMouseLeave={() => setDraggingSource(null)}
              onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'start')}
              onTouchMove={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'move')}
              onTouchEnd={() => setDraggingSource(null)}
            >
              <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'pixelated' }} />
              {showOverlay && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-black/60 px-4 py-2 rounded-full border border-cyan-500/30 flex items-center gap-2 backdrop-blur-xs animate-bounce"><MousePointer2 className="text-cyan-400" size={16} /><span className="text-cyan-100 text-sm">Quellen verschieben</span></div></div>)}
            </div>
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shrink-0 z-10 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-4 min-w-[300px]">
          <div className="flex items-center gap-2 mr-2">
             <button onClick={() => setIsRunning(!isRunning)} className={`p-2 rounded-lg transition-colors ${isRunning ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/40' : 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/40'}`}>{isRunning ? <Pause size={18} /> : <Play size={18} />}</button>
             <button onClick={() => { setSources([{ x: 0.35, y: 0.5 }, { x: 0.65, y: 0.5 }]); setFrequency(10); setPhaseOffset(0); setAmplitude(50); }} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"><RefreshCw size={18} /></button>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500">Freq</label><input type="range" min="2" max="30" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-cyan-500" /></div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500">Amp</label><input type="range" min="10" max="100" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-cyan-500" /></div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500">Phase</label><input type="range" min="0" max="360" step="45" value={phaseOffset} onChange={(e) => setPhaseOffset(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-purple-500" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveInterference;
