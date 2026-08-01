import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Menu, X, Atom, ChevronRight, PanelLeftClose, PanelLeftOpen, BookOpen, Search } from 'lucide-react';

import LandingPage from './components/LandingPage';
import { MODULES } from './simulations';

// ─── Umlaut-normaliser for fuzzy search ──────────────────────────────────────
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ');
}

// ─── Derive sorted unique categories from registry ───────────────────────────
const ALL_CATEGORIES = [...new Set(MODULES.map(m => m.category))].sort();

export default function PhysicsLab() {
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // ── Search & filter state ─────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // null = all
  const searchInputRef = useRef(null);

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filteredModules = useMemo(() => {
    const q = normalise(query.trim());
    return MODULES.filter(m => {
      const catMatch = activeCategory === null || m.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      const haystack = normalise(`${m.title} ${m.category} ${m.desc}`);
      // support multi-word: every word must appear somewhere
      return q.split(' ').filter(Boolean).every(word => haystack.includes(word));
    });
  }, [query, activeCategory]);

  // ── Sync URL params (no router needed) ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (query)          params.set('q',   query);
    if (activeCategory) params.set('cat', activeCategory);
    if (activeModuleId) params.set('sim', activeModuleId);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [query, activeCategory, activeModuleId]);

  // ── Restore state from URL on first load ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q'))   setQuery(params.get('q'));
    if (params.get('cat')) setActiveCategory(params.get('cat'));
    if (params.get('sim')) setActiveModuleId(params.get('sim'));
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // '/' focuses search (unless already in an input)
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Escape clears search
      if (e.key === 'Escape') {
        setQuery('');
        setActiveCategory(null);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Auto-expand sidebar when user starts typing ───────────────────────────
  useEffect(() => {
    if (query || activeCategory) setSidebarOpen(true);
  }, [query, activeCategory]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setActiveCategory(null);
    searchInputRef.current?.focus();
  }, []);

  const handleSelectModule = useCallback((id) => {
    setActiveModuleId(id);
    setMobileMenuOpen(false);
  }, []);

  const activeModule = MODULES.find(m => m.id === activeModuleId);

  useEffect(() => {
    document.title = activeModule ? `${activeModule.title} – PhysikLab` : 'PhysikLab';
  }, [activeModule]);

  const hasFilter = query.trim() !== '' || activeCategory !== null;

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">

      {/* ── Global header ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <button onClick={() => setSidebarOpen(v => !v)} className="hidden lg:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => setActiveModuleId(null)}>
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <Atom className="text-white" size={20} />
            </div>
            <h1 className="hidden sm:block font-bold text-white tracking-tight leading-none">PhysikLab</h1>
          </div>
        </div>

        {/* Header right: info panel toggle + result badge */}
        <div className="flex items-center gap-3">
          {hasFilter && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              {filteredModules.length} / {MODULES.length}
            </span>
          )}
          {activeModule && (
            <button
              onClick={() => setShowInfoPanel(v => !v)}
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showInfoPanel ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={16} /> Info
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Mobile overlay backdrop ──────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-950 border-r border-slate-800
          transform transition-all duration-300 ease-in-out
          flex flex-col shadow-2xl lg:shadow-none
          ${ isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:transform-none lg:translate-x-0
          ${ isSidebarOpen   ? 'lg:w-72'        : 'lg:w-0 lg:border-r-0 lg:overflow-hidden'}
          w-72
        `}>

          {/* Search + filter header */}
          <div className="w-72 px-3 pt-4 pb-3 border-b border-slate-800/60 shrink-0 space-y-2">

            {/* Search input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Suchen… (Taste /)"
                className="
                  w-full bg-slate-900 border border-slate-800 rounded-lg
                  pl-8 pr-7 py-1.5 text-sm text-slate-200 placeholder-slate-600
                  focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30
                  transition-colors
                "
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  activeCategory === null
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                Alle
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    activeCategory === cat
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 w-72 custom-scrollbar">

            {/* Section label with count */}
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
              <span>Bibliothek</span>
              <span className={`${ hasFilter ? 'text-cyan-600' : 'text-slate-700'}`}>
                {filteredModules.length}/{MODULES.length}
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-500"><X size={16} /></button>
            </div>

            {filteredModules.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-slate-600 text-sm mb-3">Keine Simulationen gefunden.</p>
                <button
                  onClick={clearSearch}
                  className="text-xs text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
                >
                  Filter zurücksetzen
                </button>
              </div>
            ) : (
              filteredModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => handleSelectModule(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 group ${
                    activeModuleId === module.id
                      ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    activeModuleId === module.id ? 'bg-cyan-500/10' : 'bg-slate-900 group-hover:bg-slate-800'
                  }`}>
                    <module.icon size={16} className={activeModuleId === module.id ? module.color : 'text-slate-600 group-hover:text-slate-400'} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    {/* Highlight matching chars in title */}
                    <div className="font-medium truncate">
                      <HighlightMatch text={module.title} query={query} />
                    </div>
                    <div className="text-[10px] opacity-60 font-light">{module.category}</div>
                  </div>
                  {activeModuleId === module.id && <ChevronRight size={14} className="shrink-0" />}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/50 relative overflow-hidden">
          {!activeModuleId ? (
            <LandingPage
              onSelect={handleSelectModule}
              query={query}
              setQuery={setQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              filteredModules={filteredModules}
              allCategories={ALL_CATEGORIES}
              clearSearch={clearSearch}
              hasFilter={hasFilter}
            />
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
              <div className={`relative bg-black flex flex-col min-h-0 order-1 transition-all duration-300 ${
                showInfoPanel ? 'lg:flex-1 h-[60%] lg:h-full' : 'flex-1 h-full'
              }`}>
                <div className="flex-1 relative w-full h-full min-h-0">
                  <activeModule.component />
                </div>
              </div>
              <div className={`bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 z-10 order-2 transition-all duration-300 ease-in-out overflow-hidden ${
                showInfoPanel ? 'h-[40%] lg:h-full w-full lg:w-80 opacity-100' : 'h-0 lg:h-full lg:w-0 lg:border-l-0 opacity-0 pointer-events-none'
              }`}>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar w-full lg:w-80">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 bg-slate-900 ${activeModule.color} text-[10px] font-bold uppercase rounded-sm border border-slate-800`}>
                      {activeModule.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">{activeModule.title}</h2>
                  <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed text-sm">
                    <p>{activeModule.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Inline search highlight component ───────────────────────────────────────
function HighlightMatch({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  // Simple case-insensitive highlight
  const lq = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(lq);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-cyan-500/25 text-cyan-200 rounded-sm not-italic px-0.5">
        {text.slice(idx, idx + lq.length)}
      </mark>
      {text.slice(idx + lq.length)}
    </>
  );
}
