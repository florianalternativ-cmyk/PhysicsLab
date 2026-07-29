import { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const BeatsPhasor = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const containerSize = useContainerDimensions(containerRef);
    
    const [f1, setF1] = useState(2.0);
    const [f2, setF2] = useState(2.2);
    // SLOWER: Start speed reduced from 1.0 to 0.5
    const [speed, setSpeed] = useState(0.5);
    const [isPaused, setIsPaused] = useState(false);
    
    const timeRef = useRef(0);
    const reqRef = useRef(null);

    const drawArrow = (ctx, x1, y1, x2, y2, color, width = 2) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const angle = Math.atan2(y2 - y1, x2 - x1); const headLen = 8;
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.fill();
    };

    const drawGraph = (ctx, offsetY, freq, color, amp, label, startX, width, time) => {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.save(); ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startX, offsetY); ctx.lineTo(startX + width, offsetY); ctx.stroke(); ctx.restore();
        for (let x = 0; x < width; x++) {
            const yVal = Math.sin(2 * Math.PI * freq * (time - x * 0.01)) * amp;
            if (x === 0) ctx.moveTo(startX, offsetY - yVal); else ctx.lineTo(startX + x, offsetY - yVal);
        }
        ctx.stroke(); ctx.fillStyle = color; ctx.font = "12px sans-serif"; ctx.fillText(label, startX + 10, offsetY - amp - 5);
    };

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas || containerSize.width === 0) return;
        canvas.width = containerSize.width; canvas.height = containerSize.height;
        const ctx = canvas.getContext('2d');
        const vW = 1000; const vH = 500; const scale = Math.min(canvas.width / vW, canvas.height / vH);
        const offsetX = (canvas.width - vW * scale) / 2; const offsetY = (canvas.height - vH * scale) / 2;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
            ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,vW, vH);

            const center = { x: 150, y: 250 }; const graphX = 350; const graphW = 600; const amp = 40; const t = timeRef.current;
            const a1 = 2 * Math.PI * f1 * t; const a2 = 2 * Math.PI * f2 * t;
            const x1 = Math.cos(a1)*amp; const y1 = -Math.sin(a1)*amp;
            const x2 = Math.cos(a2)*amp; const y2 = -Math.sin(a2)*amp;
            const xSum = x1 + x2; const ySum = y1 + y2;

            // Phasor Circle
            ctx.beginPath(); ctx.strokeStyle = "#334155"; ctx.arc(center.x, center.y, amp * 2.2, 0, Math.PI * 2); ctx.stroke();
            // Vectors
            drawArrow(ctx, center.x, center.y, center.x + x1, center.y + y1, "#f87171", 3); 
            drawArrow(ctx, center.x + x1, center.y + y1, center.x + xSum, center.y + ySum, "#38bdf8", 2); 
            drawArrow(ctx, center.x, center.y, center.x + xSum, center.y + ySum, "#a855f7", 4); 

            // Graphs
            drawGraph(ctx, 100, f1, "#f87171", amp, "Welle 1", graphX, graphW, t);
            drawGraph(ctx, 250, f2, "#38bdf8", amp, "Welle 2", graphX, graphW, t);
            
            // Sum Graph
            const sumY = 400;
            ctx.beginPath(); ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2;
            ctx.save(); ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(graphX, sumY); ctx.lineTo(graphX + graphW, sumY); ctx.stroke(); ctx.restore();
            for (let x = 0; x < graphW; x++) {
                const tp = t - x * 0.01;
                const val = (Math.sin(2 * Math.PI * f1 * tp) + Math.sin(2 * Math.PI * f2 * tp)) * amp;
                if (x === 0) ctx.moveTo(graphX, sumY - val); else ctx.lineTo(graphX + x, sumY - val);
            }
            ctx.stroke();
            ctx.fillStyle = "#a855f7"; ctx.font = "12px sans-serif"; ctx.fillText("Summe", graphX + 10, sumY - (2*amp) - 5);

            // Projection
            ctx.setLineDash([2, 4]); ctx.lineWidth = 1; ctx.strokeStyle = "#a855f7"; 
            ctx.beginPath(); ctx.moveTo(center.x + xSum, center.y + ySum); ctx.lineTo(graphX, sumY + ySum); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "#a855f7"; ctx.beginPath(); ctx.arc(graphX, sumY + ySum, 4, 0, Math.PI*2); ctx.fill();

            ctx.restore();
            if (!isPaused) { timeRef.current += 0.01 * speed; }
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [f1, f2, speed, isPaused, containerSize]);

    return (
        <div className="flex flex-col h-full bg-black text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
             <header className="h-10 sm:h-12 px-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span><h1 className="text-sm font-bold text-slate-300">Schwebung</h1>
            </header>
            <div className="flex-1 relative bg-black min-h-0" ref={containerRef}><canvas ref={canvasRef} className="block w-full h-full" /></div>
            <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 overflow-x-auto">
                <div className="flex flex-col sm:flex-row gap-4 items-center min-w-[300px]">
                    <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded-lg transition-colors ${!isPaused ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-emerald-600/20 text-emerald-500'}`}>{isPaused ? <Play size={18} /> : <Pause size={18} />}</button>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">Freq 1 <span className="text-red-400">{f1.toFixed(1)}</span></label><input type="range" min="0.5" max="5.0" step="0.1" value={f1} onChange={(e) => setF1(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full accent-red-400" /></div>
                        <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">Freq 2 <span className="text-sky-400">{f2.toFixed(1)}</span></label><input type="range" min="0.5" max="5.0" step="0.1" value={f2} onChange={(e) => setF2(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full accent-sky-400" /></div>
                        <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">Speed <span className="text-slate-300">{speed.toFixed(1)}x</span></label><input type="range" min="0" max="3.0" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full accent-slate-400" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeatsPhasor;
