import { useState, useEffect, useRef } from 'react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const Lissajous = () => {
    const canvasRef = useRef(null); const containerRef = useRef(null); const dimensions = useContainerDimensions(containerRef);
    const [a, setA] = useState(3); const [b, setB] = useState(2); const [delta, setDelta] = useState(90); const [speed, setSpeed] = useState(0.2); // SLOWER Default
    const timeRef = useRef(0); const reqRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current; if (!c || !dimensions.width) return; c.width = dimensions.width; c.height = dimensions.height;
        const ctx = c.getContext('2d'); const cx = c.width/2; const cy = c.height/2; const s = Math.min(cx,cy)-20;
        const loop = () => {
            timeRef.current += 0.01 * speed;
            ctx.fillStyle = "rgba(15, 23, 42, 0.2)"; ctx.fillRect(0,0, c.width, c.height);
            ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = "#4ade80";
            for(let i=0; i<=500; i++) {
                const t = (i/500)*2*Math.PI; const x = Math.sin(a*t + delta*Math.PI/180 + timeRef.current*0.1); const y = Math.sin(b*t);
                if(i===0) ctx.moveTo(cx+x*s, cy+y*s); else ctx.lineTo(cx+x*s, cy+y*s);
            }
            ctx.stroke(); reqRef.current = requestAnimationFrame(loop);
        };
        reqRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(reqRef.current);
    }, [a,b,delta,speed,dimensions]);
    return (<div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden"><div className="flex-1 relative" ref={containerRef}><canvas ref={canvasRef} className="block w-full h-full"/></div><div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-4 gap-2"><input type="range" min="1" max="10" value={a} onChange={e=>setA(Number(e.target.value))} className="accent-green-400"/><input type="range" min="1" max="10" value={b} onChange={e=>setB(Number(e.target.value))} className="accent-green-400"/><input type="range" min="0" max="360" value={delta} onChange={e=>setDelta(Number(e.target.value))} className="accent-blue-400"/><input type="range" min="0" max="5" step="0.1" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="accent-slate-400"/></div></div>);
};

export default Lissajous;
