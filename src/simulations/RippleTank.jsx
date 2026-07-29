import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Waves, BrickWall, Eraser } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const RippleTank = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const containerSize = useContainerDimensions(containerRef); 

  const [mode, setMode] = useState('wave'); 
  const [strength, setStrength] = useState(400);
  const [isRunning, setIsRunning] = useState(true);
  
  const simulationRef = useRef({ width: 0, height: 0, buffer1: null, buffer2: null, obstacles: null });
  const requestRef = useRef(null);
  const isMouseDownRef = useRef(false);

  // Resize & Buffer Allocation
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    const base = 250; const aspect = containerSize.width / containerSize.height;
    let newW, newH;
    if (aspect > 1) { newW = Math.floor(base * aspect); newH = base; } else { newW = base; newH = Math.floor(base / aspect); }
    if (newW > 450) { newW = 450; newH = Math.floor(450/aspect); }

    if (simulationRef.current.width !== newW || simulationRef.current.height !== newH) {
        const size = newW * newH;
        simulationRef.current = {
            width: newW, height: newH,
            buffer1: new Float32Array(size), buffer2: new Float32Array(size), obstacles: new Uint8Array(size)
        };
        if (canvasRef.current) { canvasRef.current.width = newW; canvasRef.current.height = newH; }
    }
  }, [containerSize]);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const damping = 0.985;

    const loop = () => {
      if (!isRunning) { requestRef.current = requestAnimationFrame(loop); return; }
      const { width, height, buffer1, buffer2, obstacles } = simulationRef.current;
      if (!width) { requestRef.current = requestAnimationFrame(loop); return; }

      const imgData = ctx.createImageData(width, height);
      const buf32 = new Uint32Array(imgData.data.buffer);

      for (let y = 1; y < height - 1; y++) {
        const rOff = y * width; const uOff = (y-1)*width; const lOff = (y+1)*width;
        for (let x = 1; x < width - 1; x++) {
          const i = rOff + x;
          if (obstacles[i] === 1) { buffer2[i] = 0; continue; }
          const val = (buffer1[i - 1] + buffer1[i + 1] + buffer1[uOff + x] + buffer1[lOff + x]) / 2 - buffer2[i];
          buffer2[i] = val * damping;
        }
      }
      const temp = buffer1; simulationRef.current.buffer1 = buffer2; simulationRef.current.buffer2 = temp;
      
      const len = width * height;
      for (let i = 0; i < len; i++) {
        if (obstacles[i] === 1) { buf32[i] = 0xFF32C8FF; continue; }
        const val = buffer2[i]; const intensity = val * 20; 
        let r=0, g=20, b=60;
        if (intensity > 0) { r = Math.min(255, r + intensity * 2)|0; g = Math.min(255, g + intensity * 4)|0; b = Math.min(255, b + intensity * 8)|0; } 
        else { r = Math.max(0, r + intensity)|0; g = Math.max(0, g + intensity)|0; b = Math.max(0, b + intensity)|0; }
        buf32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
      ctx.putImageData(imgData, 0, 0);
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning]);

  const clearWater = () => { if(simulationRef.current.buffer1) simulationRef.current.buffer1.fill(0); if(simulationRef.current.buffer2) simulationRef.current.buffer2.fill(0); };
  const clearWalls = () => { if(simulationRef.current.obstacles) simulationRef.current.obstacles.fill(0); };
  
  const presetSlit = () => {
    clearWalls(); clearWater();
    const { width, height, obstacles } = simulationRef.current;
    if(!width) return;
    const midX = (width / 2) | 0; const gapSize = 8;
    for (let y = 0; y < height; y++) {
        if (y < height/2 - gapSize || y > height/2 + gapSize) {
             const idx = y * width + midX; if(idx < obstacles.length) { obstacles[idx] = 1; obstacles[idx+1] = 1; obstacles[idx-1] = 1; }
        }
    }
    createDisturbance(midX - 20, height / 2, 1000); setMode('wave');
  };

  const createDisturbance = (x, y, amp) => {
    const { width, height, buffer1, obstacles } = simulationRef.current;
    if (!width) return;
    if (x > 1 && x < width - 1 && y > 1 && y < height - 1) {
        const radius = 2;
        for(let dy = -radius; dy <= radius; dy++) for(let dx = -radius; dx <= radius; dx++) {
            const index = (y+dy) * width + (x+dx); if (index >= 0 && index < buffer1.length && obstacles[index] === 0) buffer1[index] += amp; 
        }
    }
  };

  const createWall = (x, y) => {
      const { width, obstacles, buffer1, buffer2 } = simulationRef.current;
      if (!width) return;
      const radius = 2;
      for(let dy = -radius; dy <= radius; dy++) for(let dx = -radius; dx <= radius; dx++) {
          const index = (y+dy) * width + (x+dx); if (index >= 0 && index < obstacles.length) { obstacles[index] = 1; buffer1[index] = 0; buffer2[index] = 0; }
      }
  };

  const handleInput = (cx, cy) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = simulationRef.current;
    const x = Math.floor(((cx - rect.left) / rect.width) * width);
    const y = Math.floor(((cy - rect.top) / rect.height) * height);
    if (mode === 'wave') createDisturbance(x, y, strength); else createWall(x, y);
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      <header className="h-10 sm:h-12 px-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span><h1 className="text-sm font-bold text-slate-300">Wellenwanne</h1></div>
        <div className="flex gap-2">
            <button title="Wasser glätten" onClick={clearWater} className="p-1.5 hover:bg-slate-700 rounded-sm text-slate-400"><Eraser size={14}/></button>
            <button title="Wände löschen" onClick={clearWalls} className="p-1.5 hover:bg-slate-700 rounded-sm text-slate-400"><RefreshCw size={14}/></button>
        </div>
      </header>
      <div className="flex-1 relative bg-black touch-none min-h-0" ref={containerRef}>
         <canvas ref={canvasRef} className="w-full h-full cursor-crosshair block" style={{ imageRendering: 'pixelated' }}
            onMouseDown={(e) => { isMouseDownRef.current = true; handleInput(e.clientX, e.clientY); }}
            onMouseMove={(e) => { if (isMouseDownRef.current) handleInput(e.clientX, e.clientY); }}
            onMouseUp={() => { isMouseDownRef.current = false; }} onMouseLeave={() => { isMouseDownRef.current = false; }}
            onTouchStart={(e) => { isMouseDownRef.current = true; handleInput(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchMove={(e) => { if (isMouseDownRef.current) handleInput(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchEnd={() => { isMouseDownRef.current = false; }}
         />
      </div>
      <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 overflow-x-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between min-w-[300px]">
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <button onClick={() => setMode('wave')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${mode === 'wave' ? 'bg-blue-600/20 border-blue-600/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}><Waves size={14} /> Wellen</button>
                <button onClick={() => setMode('wall')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${mode === 'wall' ? 'bg-amber-600/20 border-amber-600/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}><BrickWall size={14} /> Wände</button>
            </div>
            <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
                <label className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">Kraft</label>
                <input type="range" min="100" max="1000" step="50" value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-blue-500" />
                <button onClick={presetSlit} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors whitespace-nowrap">Spalt</button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default RippleTank;
