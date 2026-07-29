import { useState, useEffect } from 'react';
import { Menu, X, Atom, ChevronRight, PanelLeftClose, PanelLeftOpen, BookOpen } from 'lucide-react';

import LandingPage from './components/LandingPage';
import { MODULES } from './simulations';

export default function PhysicsLab() {
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  useEffect(() => { document.title = activeModuleId ? `${MODULES.find(m=>m.id===activeModuleId).title} - PhysikLab` : "PhysikLab"; }, [activeModuleId]);
  const activeModule = MODULES.find(m => m.id === activeModuleId);

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"><Menu size={20} /></button>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden lg:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}</button>
            <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => setActiveModuleId(null)}>
                <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20"><Atom className="text-white" size={20} /></div>
                <div className="hidden sm:block"><h1 className="font-bold text-white tracking-tight leading-none">PhysikLab</h1></div>
            </div>
        </div>
        {activeModule && ( <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showInfoPanel ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'}`}><BookOpen size={16} /> Info</button> )}
      </header>
      <div className="flex-1 flex overflow-hidden relative">
        {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}/>)}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-r-0 lg:overflow-hidden'}`}>
           <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 w-72">
             <div className="px-3 mb-2 text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">Bibliothek <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-500"><X size={16}/></button></div>
             {MODULES.map((module) => (
               <button key={module.id} onClick={() => { setActiveModuleId(module.id); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 group ${activeModuleId === module.id ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
                 <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${activeModuleId === module.id ? 'bg-cyan-500/10' : 'bg-slate-900'}`}><module.icon size={16} className={activeModuleId === module.id ? module.color : 'text-slate-600'} /></div>
                 <div className="flex-1 text-left"><div className="font-medium">{module.title}</div><div className="text-[10px] opacity-60 font-light">{module.category}</div></div>
                 {activeModuleId === module.id && <ChevronRight size={14} />}
               </button>
             ))}
           </div>
        </aside>
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/50 relative overflow-hidden">
          {!activeModuleId ? ( <LandingPage onSelect={setActiveModuleId} /> ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
              <div className={`relative bg-black flex flex-col min-h-0 order-1 lg:order-1 transition-all duration-300 ${showInfoPanel ? 'lg:flex-1 h-[60%] lg:h-full' : 'flex-1 h-full'}`}>
                 <div className="flex-1 relative w-full h-full min-h-0"><activeModule.component /></div>
              </div>
              <div className={`bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 z-10 order-2 lg:order-2 transition-all duration-300 ease-in-out overflow-hidden ${showInfoPanel ? 'h-[40%] lg:h-full w-full lg:w-80 opacity-100' : 'h-0 lg:h-full lg:w-0 lg:border-l-0 opacity-0 pointer-events-none'}`}>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar w-full lg:w-80">
                  <div className="flex items-center gap-2 mb-4"><span className={`px-2 py-1 bg-slate-900 ${activeModule.color} text-[10px] font-bold uppercase rounded-sm border border-slate-800`}>{activeModule.category}</span></div>
                  <h2 className="text-xl font-bold text-white mb-4">{activeModule.title}</h2>
                  <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed text-sm"><p>{activeModule.desc}</p></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
