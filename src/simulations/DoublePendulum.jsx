import { useEffect, useRef } from 'react';
import { RefreshCw, Hand } from 'lucide-react';
import { useContainerDimensions } from '../hooks/useContainerDimensions';

const DoublePendulum = () => {
    const canvasRef = useRef(null); 
    const containerRef = useRef(null); 
    const dimensions = useContainerDimensions(containerRef);
    const s = useRef({th1:Math.PI/2, th2:Math.PI/2, v1:0, v2:0, path:[]}); 
    const req = useRef(null);
    const dragRef = useRef({ active: false, mass: 0 }); // 0 = none, 1 = m1, 2 = m2

    // SLOWER: Reduced gravity constant for simulation
    const SIM_G = 0.4; 

    useEffect(()=>{
        const c=canvasRef.current; if(!c||!dimensions.width)return; 
        c.width=dimensions.width; c.height=dimensions.height; 
        const ctx=c.getContext('2d'); 
        const cx=c.width/2; const cy=c.height/3; 
        const l1=100; const l2=100; // lengths

        const loop=()=>{
            let {th1,th2,v1,v2,path}=s.current;
            
            // Only update physics if NOT dragging
            if (!dragRef.current.active) {
                const g = SIM_G; 
                const num1=-g*(20+10)*Math.sin(th1)-10*g*Math.sin(th1-2*th2)-2*Math.sin(th1-th2)*10*(v2**2*100+v1**2*100*Math.cos(th1-th2));
                const den1=100*(20+10-10*Math.cos(2*th1-2*th2)); const a1=num1/den1;
                const num2=2*Math.sin(th1-th2)*(v1**2*100*(20)+g*(20)*Math.cos(th1)+v2**2*100*10*Math.cos(th1-th2));
                const den2=100*(20+10-10*Math.cos(2*th1-2*th2)); const a2=num2/den2;
                v1+=a1; v2+=a2; th1+=v1; th2+=v2; v1*=0.999; v2*=0.999;
            } else {
                // If dragging, reset velocities so it doesn't fly away when released
                v1 = 0; v2 = 0;
            }

            const x1=l1*Math.sin(th1), y1=l1*Math.cos(th1);
            const x2=x1+l2*Math.sin(th2), y2=y1+l2*Math.cos(th2);
            
            // Only trace path if moving fast enough or not dragging
            if(!dragRef.current.active) {
                path.push({x:x2,y:y2}); if(path.length>200)path.shift(); 
            } else {
                path = []; // Clear path on drag
            }
            
            s.current={th1,th2,v1,v2,path};

            // Render
            ctx.fillStyle="#0f172a"; ctx.fillRect(0,0,c.width,c.height); 
            ctx.translate(cx,cy);
            
            ctx.beginPath(); ctx.strokeStyle="rgba(236,72,153,0.5)"; 
            path.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}); 
            ctx.stroke();

            ctx.beginPath(); ctx.strokeStyle="#cbd5e1"; ctx.lineWidth=2;
            ctx.moveTo(0,0); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

            ctx.fillStyle="#38bdf8"; ctx.beginPath(); ctx.arc(x1,y1,12,0,Math.PI*2); ctx.fill(); // Bigger interaction target
            ctx.fillStyle="#ec4899"; ctx.beginPath(); ctx.arc(x2,y2,12,0,Math.PI*2); ctx.fill();

            ctx.translate(-cx,-cy); 
            req.current=requestAnimationFrame(loop);
        }; 
        req.current=requestAnimationFrame(loop); 
        return ()=>cancelAnimationFrame(req.current);
    },[dimensions]);

    // FIX: Interactive Mouse Handlers for Pendulum
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left - dimensions.width/2;
        const my = e.clientY - rect.top - dimensions.height/3;
        const {th1, th2} = s.current;
        const l1=100, l2=100;
        
        const x1=l1*Math.sin(th1), y1=l1*Math.cos(th1);
        const x2=x1+l2*Math.sin(th2), y2=y1+l2*Math.cos(th2);

        const d1 = Math.sqrt((mx-x1)**2 + (my-y1)**2);
        const d2 = Math.sqrt((mx-x2)**2 + (my-y2)**2);

        if (d2 < 30) dragRef.current = {active: true, mass: 2};
        else if (d1 < 30) dragRef.current = {active: true, mass: 1};
    };

    const handleMouseMove = (e) => {
        if (!dragRef.current.active) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left - dimensions.width/2;
        const my = e.clientY - rect.top - dimensions.height/3;
        
        if (dragRef.current.mass === 1) {
            s.current.th1 = Math.atan2(mx, my);
        } else if (dragRef.current.mass === 2) {
            // Need to calculate th2 relative to m1
            const l1=100;
            const x1=l1*Math.sin(s.current.th1);
            const y1=l1*Math.cos(s.current.th1);
            s.current.th2 = Math.atan2(mx-x1, my-y1);
        }
    };

    const handleMouseUp = () => { dragRef.current = {active: false, mass: 0}; };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
            <div className="flex-1 relative cursor-pointer" ref={containerRef}>
                <canvas 
                    ref={canvasRef} 
                    className="block w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                <button onClick={()=>{s.current={th1:Math.PI/2,th2:Math.PI/2,v1:0,v2:0,path:[]}}} className="absolute top-4 right-4 bg-slate-800 p-2 rounded-sm text-white"><RefreshCw size={16}/></button>
                {dragRef.current && (
                    <div className="absolute top-4 left-4 bg-black/50 p-2 rounded-sm text-xs text-slate-400 pointer-events-none flex items-center gap-2">
                        <Hand size={12}/> Ziehe die Massen
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoublePendulum;
