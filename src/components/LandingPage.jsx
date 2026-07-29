import { Atom, ChevronRight } from 'lucide-react';

import { MODULES } from '../simulations';

const LandingPage = ({ onSelect }) => (
  <div className="h-full overflow-y-auto bg-slate-950 p-6 md:p-12">
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 text-center">
        <div className="inline-block p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 shadow-2xl shadow-cyan-900/20"><Atom size={64} className="text-cyan-500" /></div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">Physik<span className="text-cyan-500">Lab</span></h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">Eine interaktive Sammlung moderner Physik-Simulationen. Entdecke Wellenmechanik, Akustik und Chaostheorie direkt im Browser.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map((m) => (
          <button key={m.id} onClick={() => onSelect(m.id)} className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-600 transition-all hover:shadow-2xl hover:shadow-slate-900/50 hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${m.color}`}><m.icon size={120} /></div>
            <div className={`w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 ${m.color} group-hover:scale-110 transition-transform`}><m.icon size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-1">{m.title}</h3><p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{m.category}</p><p className="text-sm text-slate-400 mb-6">{m.desc}</p>
            <div className="flex items-center text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">Starten <ChevronRight size={16} className="ml-1" /></div>
          </button>
        ))}
      </div>
      <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm"><p>&copy; {new Date().getFullYear()} PhysikLab. Bereit für Deployment.</p></footer>
    </div>
  </div>
);

export default LandingPage;
