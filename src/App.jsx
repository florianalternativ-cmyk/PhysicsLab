import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Menu, X, Atom, ChevronRight, PanelLeftClose, PanelLeftOpen, BookOpen, Search, Home } from 'lucide-react';

import LandingPage    from './components/LandingPage';
import ParticleField  from './components/ParticleField';
import MouseSpotlight from './components/MouseSpotlight';
import { MODULES }    from './simulations';

function normalise(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ');
}

const ALL_CATEGORIES = [...new Set(MODULES.map(m => m.category))].sort();

function HighlightMatch({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const lq = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(lq);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[rgba(79,127,255,0.18)] text-white rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + lq.length)}
      </mark>
      {text.slice(idx + lq.length)}
    </>
  );
}

export default function PhysicsLab() {
  const [activeModuleId, setActiveModuleId]   = useState(null);
  const [isSidebarOpen,  setSidebarOpen]       = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen]  = useState(false);
  const [showInfoPanel,  setShowInfoPanel]     = useState(true);
  const [query,          setQuery]             = useState('');
  const [activeCategory, setActiveCategory]    = useState(null);
  const [isHeaderCondensed, setHeaderCondensed]= useState(false);

  const searchInputRef = useRef(null);

  const filteredModules = useMemo(() => {
    const q = normalise(query.trim());
    return MODULES.filter(m => {
      const catMatch = activeCategory === null || m.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      const haystack = normalise(`${m.title} ${m.category} ${m.desc}`);
      return q.split(' ').filter(Boolean).every(word => haystack.includes(word));
    });
  }, [query, activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query)          params.set('q',   query);
    if (activeCategory) params.set('cat', activeCategory);
    if (activeModuleId) params.set('sim', activeModuleId);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [query, activeCategory, activeModuleId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q'))   setQuery(params.get('q'));
    if (params.get('cat')) setActiveCategory(params.get('cat'));
    if (params.get('sim')) setActiveModuleId(params.get('sim'));
  }, []);

  useEffect(() => {
    const handler = () => setHeaderCondensed(window.scrollY > 40);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
      if (e.key === 'Escape') {
        setQuery('');
        setActiveCategory(null);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
  const hasFilter    = query.trim() !== '' || activeCategory !== null;

  useEffect(() => {
    document.title = activeModule ? `${activeModule.title} – PhysikLab` : 'PhysikLab';
  }, [activeModule]);

  return (
    <div className="fixed inset-0 w-full h-full bg-[var(--bg-deep)] text-[var(--text-primary)] overflow-hidden flex flex-col">

      {/* ── Global background layers (pointer-events:none) ────────────────── */}
      <div className="absolute inset-0 bg-grid" />
      <MouseSpotlight />
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField className="absolute inset-0 opacity-50" />
        {/* subtle dark vignette so edges stay dark */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 120% 80% at center, transparent 40%, rgba(5,5,8,0.72) 100%)'
        }} />
      </div>

      {/* ── Floating header ────────────────────────────────────────── */}
      <div className={`pointer-events-none absolute top-4 left-0 right-0 z-30 px-4 transition-all duration-300`}>
        <div className={`pointer-events-auto max-w-5xl mx-auto rounded-full floating-shell transition-all duration-300 ${isHeaderCondensed ? 'px-3 py-2' : 'px-4 py-2.5'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-white transition-colors">
                <Menu size={18} />
              </button>
              <button onClick={() => setSidebarOpen(v => !v)} className="hidden lg:flex p-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/4 rounded-full transition-colors">
                {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>
              <button onClick={() => setActiveModuleId(null)} className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/8 flex items-center justify-center text-[var(--accent-strong)]">
                  <Atom size={18} />
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-white truncate">PhysikLab</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Interactive Physics</div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hasFilter && (
                <span className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full border border-white/8 text-[var(--text-secondary)] bg-white/[0.03]">
                  {filteredModules.length} / {MODULES.length}
                </span>
              )}
              {activeModule && (
                <button
                  onClick={() => setActiveModuleId(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-white/8 bg-white/[0.03] text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Home size={14} /> Übersicht
                </button>
              )}
              {activeModule && (
                <button
                  onClick={() => setShowInfoPanel(v => !v)}
                  className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    showInfoPanel
                      ? 'border-[rgba(79,127,255,0.28)] bg-[rgba(79,127,255,0.12)] text-white'
                      : 'border-white/8 bg-white/[0.03] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  <BookOpen size={14} /> Info
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative pt-20">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-[rgba(8,8,14,0.90)] border-r border-white/6
          transform transition-all duration-300 ease-in-out
          flex flex-col shadow-2xl lg:shadow-none backdrop-blur-2xl
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:transform-none lg:translate-x-0
          ${isSidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-r-0 lg:overflow-hidden'}
          w-72
        `}>
          <div className="w-72 px-3 pt-4 pb-3 border-b border-white/6 shrink-0 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Suchen… (Taste /)"
                className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-8 pr-7 py-2 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)] focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(79,127,255,0.08)]"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                  activeCategory === null
                    ? 'border-[var(--accent)] text-white bg-[rgba(79,127,255,0.14)]'
                    : 'border-white/8 text-[var(--text-muted)] bg-white/[0.03] hover:text-white hover:border-white/16'
                }`}
              >Alle</button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    activeCategory === cat
                      ? 'border-[var(--accent)] text-white bg-[rgba(79,127,255,0.14)]'
                      : 'border-white/8 text-[var(--text-muted)] bg-white/[0.03] hover:text-white hover:border-white/16'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 w-72 custom-scrollbar">
            <div className="px-3 mb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.18em] flex items-center justify-between">
              <span>Bibliothek</span>
              <span className={hasFilter ? 'text-[var(--accent-strong)]' : 'text-[var(--text-muted)]'}>
                {filteredModules.length}/{MODULES.length}
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-[var(--text-muted)]"><X size={16} /></button>
            </div>

            {filteredModules.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[var(--text-muted)] text-sm mb-3">Keine Simulationen gefunden.</p>
                <button onClick={clearSearch} className="text-xs text-[var(--accent-strong)] hover:text-white underline underline-offset-2">Filter zurücksetzen</button>
              </div>
            ) : (
              filteredModules.map(module => (
                <button
                  key={module.id}
                  onClick={() => handleSelectModule(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all duration-150 group ${
                    activeModuleId === module.id
                      ? 'bg-white/[0.06] text-white border border-white/10'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    activeModuleId === module.id ? 'bg-white/[0.06]' : 'bg-black/20 group-hover:bg-white/[0.04]'
                  }`}>
                    <module.icon size={16} className={activeModuleId === module.id ? module.color : 'text-[var(--text-muted)] group-hover:text-white'} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate"><HighlightMatch text={module.title} query={query} /></div>
                    <div className="text-[10px] opacity-70 font-light">{module.category}</div>
                  </div>
                  {activeModuleId === module.id && <ChevronRight size={14} className="shrink-0" />}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {!activeModuleId ? (
            <LandingPage
              onSelect={handleSelectModule}
              query={query}             setQuery={setQuery}
              activeCategory={activeCategory} setActiveCategory={setActiveCategory}
              filteredModules={filteredModules}
              allCategories={ALL_CATEGORIES}
              clearSearch={clearSearch}
              hasFilter={hasFilter}
            />
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden px-3 pb-3 gap-3">
              <div className={`relative flex flex-col min-h-0 order-1 transition-all duration-300 ${
                showInfoPanel ? 'lg:flex-1 h-[60%] lg:h-full' : 'flex-1 h-full'
              } glass-panel rounded-[28px] overflow-hidden`}>
                <div className="flex-1 relative w-full h-full min-h-0">
                  <activeModule.component />
                </div>
              </div>
              <div className={`glass-panel rounded-[28px] flex flex-col shrink-0 z-10 order-2 transition-all duration-300 ease-in-out overflow-hidden ${
                showInfoPanel ? 'h-[40%] lg:h-full w-full lg:w-80 opacity-100' : 'h-0 lg:h-full lg:w-0 opacity-0 pointer-events-none'
              }`}>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar w-full lg:w-80">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 bg-white/[0.04] ${activeModule.color} text-[10px] font-semibold uppercase rounded-full border border-white/8`}>
                      {activeModule.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white mb-4">{activeModule.title}</h2>
                  <div className="text-[var(--text-secondary)] leading-7 text-sm">
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
