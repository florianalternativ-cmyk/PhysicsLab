import { Atom, ChevronRight, Search, X, SlidersHorizontal } from 'lucide-react';
import { useRef, useEffect } from 'react';

const LandingPage = ({
  onSelect,
  query, setQuery,
  activeCategory, setActiveCategory,
  filteredModules,
  allCategories,
  clearSearch,
  hasFilter,
}) => {
  const inputRef = useRef(null);

  // Focus search on '/' key (mirrors App.jsx shortcut, but scoped to landing)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-slate-950 custom-scrollbar">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="pt-12 pb-10 text-center">
          <div className="inline-block p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 shadow-2xl shadow-cyan-900/20">
            <Atom size={56} className="text-cyan-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Physik<span className="text-cyan-500">Lab</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Eine interaktive Sammlung moderner Physik-Simulationen.
            Entdecke Wellenmechanik, Akustik und Chaostheorie direkt im Browser.
          </p>
        </div>

        {/* ── Search + filter bar ───────────────────────────────────────────── */}
        <div className="mb-8 space-y-3">

          {/* Search input */}
          <div className="relative max-w-xl mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Simulation suchen…  (Taste / zum Fokussieren)"
              className="
                w-full bg-slate-900 border border-slate-800 rounded-xl
                pl-11 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600
                focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                transition-all shadow-lg
              "
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-1 text-slate-600 mr-1">
              <SlidersHorizontal size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Filter:</span>
            </div>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                activeCategory === null
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              Alle
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-900/30'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active filter summary */}
          {hasFilter && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-slate-500">
                {filteredModules.length === 0
                  ? 'Keine Ergebnisse'
                  : `${filteredModules.length} von ${filteredModules.length === 1 ? '1 Simulation' : filteredModules.length + ' Simulationen'}`
                }
              </span>
              <button
                onClick={clearSearch}
                className="text-xs text-cyan-500 hover:text-cyan-300 underline underline-offset-2 transition-colors"
              >
                Alle anzeigen
              </button>
            </div>
          )}
        </div>

        {/* ── Module grid ───────────────────────────────────────────────────── */}
        {filteredModules.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔭</div>
            <h3 className="text-lg font-bold text-slate-400 mb-2">Keine Simulationen gefunden</h3>
            <p className="text-slate-600 text-sm mb-6">
              Versuche einen anderen Suchbegriff oder entferne den Kategoriefilter.
            </p>
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-600 transition-all duration-200 hover:shadow-2xl hover:shadow-slate-900/50 hover:-translate-y-1 overflow-hidden"
              >
                {/* Large background icon */}
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${m.color}`}>
                  <m.icon size={100} />
                </div>

                {/* Category badge */}
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-3 ${
                  activeCategory === m.category
                    ? `${m.color} border-current bg-current/10`
                    : 'text-slate-600 border-slate-800 bg-transparent'
                }`}>
                  {m.category}
                </span>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 ${m.color} group-hover:scale-110 transition-transform`}>
                  <m.icon size={22} />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
                <p className="text-sm text-slate-400 mb-6 line-clamp-3">{m.desc}</p>

                <div className="flex items-center text-sm font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">
                  Starten <ChevronRight size={15} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-700 text-sm">
          <p>&copy; {new Date().getFullYear()} PhysikLab &mdash; {filteredModules.length} Simulation{filteredModules.length !== 1 ? 'en' : ''} verfügbar.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
