import { Atom, ChevronRight, Search, X, SlidersHorizontal, ArrowDown, Orbit, Cpu, Sparkles } from 'lucide-react';
import { useRef, useEffect } from 'react';

function useRevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

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

  useRevealOnScroll();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar text-[var(--text-primary)]">
      <section className="relative min-h-screen px-6 md:px-10 lg:px-14 flex items-center justify-center overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,127,255,0.08),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,5,8,0.72))]" />

        <div className="relative z-10 max-w-5xl w-full text-center section-reveal is-visible" data-reveal>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel text-sm text-[var(--text-secondary)] mb-8">
            <Atom size={16} className="text-[var(--accent-strong)]" />
            Interaktive Physik, präzise simuliert und direkt im Browser erfahrbar
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95] text-white">
            Physik als
            <span className="block text-[var(--accent-strong)]">bewegter Raum</span>
          </h1>

          <p className="max-w-2xl mx-auto mt-8 text-base md:text-lg leading-8 text-[var(--text-secondary)]">
            Eine Sammlung hochwertiger Simulationen zu Wellen, Akustik, Mechanik, Chaos und Schwingungen.
            Nicht als Werkzeugkasten gestaltet, sondern als ruhiger, präziser Ort zum Erkunden physikalischer Ideen.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#bibliothek"
              className="animated-outline relative px-6 py-3 rounded-full floating-shell text-white font-medium hover:translate-y-[-1px] transition-transform"
            >
              Zur Bibliothek
            </a>
            <div className="text-sm text-[var(--text-muted)] flex items-center gap-2" style={{ animation: 'pulseFloat 3s ease-in-out infinite' }}>
              <ArrowDown size={15} /> Scrollen für Übersicht, Suche und Filter
            </div>
          </div>
        </div>
      </section>

      <section id="bibliothek" className="relative px-6 md:px-10 lg:px-14 py-24">
        <div className="max-w-6xl mx-auto section-reveal" data-reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-3">Bibliothek</div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Simulationen finden, filtern, öffnen</h2>
              <p className="mt-4 max-w-2xl text-[var(--text-secondary)] leading-7">
                Die Bibliothek ist jetzt nicht nur eine Liste, sondern ein präziser Einstiegspunkt.
                Suche nach Begriffen, reduziere nach Themengebiet und springe direkt in das passende Modul.
              </p>
            </div>
            <div className="text-sm text-[var(--text-muted)] lg:text-right">
              {filteredModules.length} Simulation{filteredModules.length !== 1 ? 'en' : ''} sichtbar
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-4 md:p-5 mb-8">
            <div className="flex flex-col gap-4">
              <div className="relative max-w-2xl">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Simulation suchen…  (Taste / zum Fokussieren)"
                  className="w-full rounded-2xl border border-white/8 bg-white/4 pl-11 pr-10 py-3.5 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)] focus:bg-white/6 focus:shadow-[0_0_0_4px_rgba(79,127,255,0.08)]"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white p-1 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mr-2">
                  <SlidersHorizontal size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">Filter</span>
                </div>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === null
                      ? 'border-[var(--accent)] text-white bg-[rgba(79,127,255,0.14)] shadow-[0_0_0_1px_rgba(79,127,255,0.18)]'
                      : 'border-white/8 text-[var(--text-secondary)] bg-white/3 hover:border-white/16 hover:text-white'
                  }`}
                >
                  Alle
                </button>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      activeCategory === cat
                        ? 'border-[var(--accent)] text-white bg-[rgba(79,127,255,0.14)] shadow-[0_0_0_1px_rgba(79,127,255,0.18)]'
                        : 'border-white/8 text-[var(--text-secondary)] bg-white/3 hover:border-white/16 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {hasFilter && (
                  <button
                    onClick={clearSearch}
                    className="ml-auto text-xs text-[var(--accent-strong)] hover:text-white transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredModules.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center">
              <div className="text-5xl mb-4">🔭</div>
              <h3 className="text-xl font-semibold text-white mb-2">Keine Simulationen gefunden</h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Versuche einen anderen Suchbegriff oder entferne den Kategoriefilter.
              </p>
              <button
                onClick={clearSearch}
                className="px-4 py-2 rounded-full border border-white/10 bg-white/4 text-sm text-white hover:bg-white/6 transition-colors"
              >
                Alle anzeigen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredModules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className="group relative rounded-3xl p-6 text-left glass-panel overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/14"
                >
                  <div className={`absolute -top-2 -right-2 opacity-8 group-hover:opacity-16 transition-opacity ${m.color}`}>
                    <m.icon size={122} />
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 60px rgba(255,255,255,0.02)' }} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{m.category}</span>
                      <div className={`w-11 h-11 rounded-2xl bg-black/30 border border-white/6 flex items-center justify-center ${m.color} group-hover:scale-105 transition-transform`}>
                        <m.icon size={20} />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight text-white mb-3">{m.title}</h3>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] line-clamp-3 mb-8">{m.desc}</p>

                    <div className="flex items-center text-sm text-white/80 group-hover:text-[var(--accent-strong)] transition-colors">
                      Modul öffnen
                      <ChevronRight size={15} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative px-6 md:px-10 lg:px-14 pb-24">
        <div className="max-w-6xl mx-auto section-reveal" data-reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Orbit,
                title: 'Echte Dynamik',
                text: 'Die Module beruhen auf numerischer Integration, Wellengleichungen, Phasoren, chaotischen Systemen und klassischen mechanischen Modellen.',
              },
              {
                icon: Cpu,
                title: 'Direkt im Browser',
                text: 'Canvas, Web Audio API und React bilden das Fundament. Keine fertige Physik-Engine, sondern nachvollziehbar programmierte Modelle.',
              },
              {
                icon: Sparkles,
                title: 'Ruhige Gestaltung',
                text: 'Reduzierte Farben, mehr Tiefe, weiche Übergänge und ein lebendiger Hintergrund sorgen für eine deutlich hochwertigere Wahrnehmung.',
              },
            ].map((item) => (
              <div key={item.title} className="glass-panel rounded-3xl p-6">
                <div className="w-12 h-12 rounded-2xl border border-white/8 bg-white/4 flex items-center justify-center mb-5 text-[var(--accent-strong)]">
                  <item.icon size={20} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white mb-3">{item.title}</h3>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 lg:px-14 pb-10 text-center text-[var(--text-muted)] text-sm">
        <p>&copy; {new Date().getFullYear()} PhysikLab — {filteredModules.length} Simulation{filteredModules.length !== 1 ? 'en' : ''} verfügbar.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
