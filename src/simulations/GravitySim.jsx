import { useState, useEffect, useRef } from 'react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const GravitySim = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dimensions = useContainerDimensions(containerRef);
  
  // SLOWER: Reduced gravity default from 0.5 to 0.2
  const [gravity, setGravity] = useState(0.2);
  const [elasticity, setElasticity] = useState(0.8);
  const ballsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas || dimensions.width === 0) return;
    canvas.width = dimensions.width; canvas.height = dimensions.height;
    
    if(ballsRef.current.length === 0) {
        for(let i=0; i<5; i++) ballsRef.current.push({
            x: dimensions.width/2, y: dimensions.height/3, 
            vx: Math.random()*10-5, vy: 0, 
            r: 10+Math.random()*15, c: `hsl(${Math.random()*360},70%,60%)`
        });
    }

    const ctx = canvas.getContext('2d');
    let id;
    const loop = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; ctx.fillRect(0,0, canvas.width, canvas.height);
      
      ballsRef.current.forEach(b => {
        b.vy += gravity;
        b.x += b.vx; b.y += b.vy;
        
        if(b.y + b.r > canvas.height) { b.y = canvas.height - b.r; b.vy *= -elasticity; }
        if(b.x + b.r > canvas.width) { b.x = canvas.width - b.r; b.vx *= -elasticity; }
        if(b.x - b.r < 0) { b.x = b.r; b.vx *= -elasticity; }

        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fillStyle = b.c; ctx.fill();
      });
      id = requestAnimationFrame(loop);
    };

    const click = (e) => {
        const r = canvas.getBoundingClientRect();
        // FIX: Random size and color for new balls
        ballsRef.current.push({
            x: e.clientX-r.left, 
            y: e.clientY-r.top, 
            vx: Math.random()*10-5, 
            vy: Math.random()*10-5, 
            r: 10 + Math.random()*20, // Random radius 10-30
            c: `hsl(${Math.random()*360}, 70%, 60%)` // Random color
        });
    };
    canvas.addEventListener('mousedown', click);
    loop();
    return () => { canvas.removeEventListener('mousedown', click); cancelAnimationFrame(id); };
  }, [gravity, elasticity, dimensions]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
       <div className="flex-1 relative cursor-crosshair min-h-0" ref={containerRef}>
          <canvas ref={canvasRef} className="block" />
          <div className="absolute top-4 left-4 pointer-events-none text-xs text-slate-400 bg-black/50 p-2 rounded-sm">Klicken für mehr Bälle</div>
       </div>
       <div className="h-16 bg-slate-950 flex items-center px-4 gap-8 border-t border-slate-800 shrink-0">
          <div className="flex-1 space-y-1">
             <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase"><span>Gravitation</span><span>{gravity}</span></div>
             <input type="range" min="0" max="1.5" step="0.05" value={gravity} onChange={e => setGravity(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-full accent-blue-500"/>
          </div>
          <div className="flex-1 space-y-1">
             <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase"><span>Elastizität</span><span>{elasticity}</span></div>
             <input type="range" min="0.1" max="1.2" step="0.05" value={elasticity} onChange={e => setElasticity(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-full accent-pink-500"/>
          </div>
       </div>
    </div>
  );
};

export default GravitySim;
