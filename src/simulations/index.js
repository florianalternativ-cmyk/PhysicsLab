import { Waves, Droplets, Activity, Music, Circle, Shuffle, Infinity as InfinityIcon, Radio, GitBranch, Globe } from 'lucide-react';

import WaveInterference from './WaveInterference';
import RippleTank from './RippleTank';
import BeatsPhasor from './BeatsPhasor';
import GuitarTuner from './GuitarTuner';
import GravitySim from './GravitySim';
import DoublePendulum from './DoublePendulum';
import Lissajous from './Lissajous';
import FourierSynthesis from './FourierSynthesis';
import LorenzAttractor from './LorenzAttractor';
import NBodyGravity from './NBodyGravity';

const MODULES = [
  { id: 'waves',    title: 'Interferenz',      category: 'Wellenlehre',  icon: Waves,         component: WaveInterference, color: 'text-cyan-400',    desc: '\u00dcberlagerung zweier Wellenquellen. Erforsche konstruktive und destruktive Interferenz.' },
  { id: 'ripple',   title: 'Wellenwanne',      category: 'Wellenoptik',  icon: Droplets,      component: RippleTank,       color: 'text-blue-400',    desc: 'Numerische Wellensimulation. Beobachte Beugung, Reflexion und das Huygenssche Prinzip.' },
  { id: 'beats',    title: 'Phasoren',         category: 'Akustik',      icon: Activity,      component: BeatsPhasor,      color: 'text-purple-400',  desc: 'Visualisierung von Schwebungen mittels rotierender Zeiger (Phasoren).' },
  { id: 'tuner',    title: 'Gitarren-Tuner',   category: 'Akustik',      icon: Music,         component: GuitarTuner,      color: 'text-red-400',     desc: 'H\u00f6rbare Schwebung zweier Frequenzen. Ideal zum Verstehen von Stimmvorg\u00e4ngen.' },
  { id: 'gravity',  title: 'Elastischer Sto\u00df', category: 'Mechanik', icon: Circle,        component: GravitySim,       color: 'text-emerald-400', desc: 'Klassische Mechanik: Sto\u00dfgesetze und Gravitation in einem Partikelsystem.' },
  { id: 'pendulum', title: 'Doppelpendel',     category: 'Chaos',        icon: Shuffle,       component: DoublePendulum,   color: 'text-pink-400',    desc: 'Ein einfaches mechanisches System mit komplexem, chaotischem Verhalten.' },
  { id: 'lissajous',title: 'Lissajous',        category: 'Schwingungen', icon: InfinityIcon,  component: Lissajous,        color: 'text-green-400',   desc: '\u00dcberlagerung harmonischer Schwingungen in zwei Dimensionen.' },
  { id: 'fourier',  title: 'Fourier-Synthese', category: 'Schwingungen', icon: Radio,         component: FourierSynthesis, color: 'text-cyan-400',    desc: 'Addiere harmonische Obert\u00f6ne und beobachte, wie aus Sinuswellen komplexe Wellenformen entstehen.' },
  { id: 'lorenz',   title: 'Lorenz-Attraktor', category: 'Chaos',        icon: GitBranch,     component: LorenzAttractor,  color: 'text-fuchsia-400', desc: 'Deterministisches Chaos in 3D. Drehe den Attraktor frei, passe \u03c3, \u03c1, \u03b2 an und beobachte den Schmetterlingseffekt.' },
  { id: 'nbody',    title: 'N-Körper-Gravitation', category: 'Mechanik', icon: Globe,         component: NBodyGravity,     color: 'text-yellow-400',  desc: 'N-Körper-Gravitationssimulation mit symplektischem Leapfrog-Integrator. Figur-8-Drei\u00f6rper-L\u00f6sung, Doppelstern und Sonnensystem als Presets. Neue K\u00f6rper per Klick/Ziehen spawnen, Gravitation, Zeitskala und Masse live einstellen.' },
];

export { MODULES };
