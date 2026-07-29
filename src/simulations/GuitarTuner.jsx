import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const GuitarTuner = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const dimensions = useContainerDimensions(containerRef);
    const [f1, setF1] = useState(396);
    const [f2, setF2] = useState(370);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioCtxRef = useRef(null);
    const oscRef = useRef([]);

    useEffect(() => {
        if(isPlaying) {
            audioCtxRef.current = new (window.AudioContext||window.webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const g = ctx.createGain(); g.gain.value = 0.1; g.connect(ctx.destination);
            [f1, f2].forEach((f, i) => {
                const o = ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start();
                oscRef.current[i] = o;
            });
        } else {
            oscRef.current.forEach(o => { try{o.stop()}catch{} });
            if(audioCtxRef.current) audioCtxRef.current.close();
        }
        return () => { oscRef.current.forEach(o => { try{o.stop()}catch{} }); if(audioCtxRef.current) audioCtxRef.current.close(); };
    }, [isPlaying]);

    useEffect(() => {
        if(isPlaying && oscRef.current[0]) {
             oscRef.current[0].frequency.setValueAtTime(f1, audioCtxRef.current.currentTime);
             oscRef.current[1].frequency.setValueAtTime(f2, audioCtxRef.current.currentTime);
        }
    }, [f1, f2, isPlaying]);

    useEffect(() => {
        const c = canvasRef.current; if(!c || !dimensions.width) return;
        c.width = dimensions.width; c.height = dimensions.height;
        const ctx = c.getContext('2d');
        const w = c.width; const h = c.height; const cy = h/2;
        
        ctx.fillStyle="#0f172a"; ctx.fillRect(0,0,w,h);
        
        // FIX: Richtiges Zoom-Level für Beats. Wir zeigen ca. 0.2 Sekunden an.
        // Das reicht, um eine Schwebung von ~5Hz (Periode 0.2s) oder mehr zu sehen.
        const timeWindow = 0.2; // Sekunden
        const maxAmp = h / 3;

        ctx.beginPath(); ctx.strokeStyle="#38bdf8"; ctx.lineWidth=2;
        for(let x=0; x<w; x++) {
            const t = (x / w) * timeWindow; // Mapping x pixel to time
            // Physics: sin(2 * PI * f * t)
            const y1 = Math.sin(2 * Math.PI * f1 * t);
            const y2 = Math.sin(2 * Math.PI * f2 * t);
            // Summe (normalisiert durch 2)
            const ySum = (y1 + y2) * 0.5;
            ctx.lineTo(x, cy - ySum * maxAmp);
        }
        ctx.stroke();

        // Envelope (Hüllkurve) - cos(PI * (f1-f2) * t)
        ctx.beginPath(); ctx.strokeStyle="rgba(248,113,113,0.5)"; ctx.setLineDash([5,5]);
        for(let x=0; x<w; x++) {
            const t = (x / w) * timeWindow; 
            const envelope = Math.cos(Math.PI * (f1-f2) * t);
            ctx.lineTo(x, cy - Math.abs(envelope) * maxAmp);
        }
        ctx.stroke();
    }, [dimensions, f1, f2]);

    return (
        <div className="flex flex-col h-full bg-black text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex-1 relative" ref={containerRef}>
                <canvas ref={canvasRef} className="block w-full h-full"/>
                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-sm text-[10px] text-slate-400 border border-slate-700">
                    Zoom: 0.2s Fenster
                </div>
                <button onClick={()=>setIsPlaying(!isPlaying)} className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold flex items-center gap-2 ${isPlaying?'bg-red-500 text-white':'bg-cyan-600 text-white'}`}>
                    {isPlaying?<VolumeX size={18}/>:<Volume2 size={18}/>} {isPlaying?'Stop':'Start'}
                </button>
            </div>
            <div className="p-4 border-t border-slate-800 grid grid-cols-2 gap-6 bg-slate-900">
                <div><label className="text-xs font-bold text-slate-500">Saite 1 ({f1}Hz)</label><input type="range" min="300" max="500" value={f1} onChange={e=>setF1(Number(e.target.value))} className="w-full accent-cyan-500"/></div>
                <div><label className="text-xs font-bold text-slate-500">Saite 2 ({f2}Hz)</label><input type="range" min="300" max="500" value={f2} onChange={e=>setF2(Number(e.target.value))} className="w-full accent-red-500"/></div>
            </div>
        </div>
    );
};

export default GuitarTuner;
