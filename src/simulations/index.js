import { Waves, Droplets, Activity, Music, Circle, Shuffle, Infinity as InfinityIcon } from 'lucide-react';

import WaveInterference from './WaveInterference';
import RippleTank from './RippleTank';
import BeatsPhasor from './BeatsPhasor';
import GuitarTuner from './GuitarTuner';
import GravitySim from './GravitySim';
import DoublePendulum from './DoublePendulum';
import Lissajous from './Lissajous';

const MODULES = [
  { id: 'waves', title: 'Interferenz', category: 'Wellenlehre', icon: Waves, component: WaveInterference, color: 'text-cyan-400', desc: 'Überlagerung zweier Wellenquellen. Erforsche konstruktive und destruktive Interferenz.' },
  { id: 'ripple', title: 'Wellenwanne', category: 'Wellenoptik', icon: Droplets, component: RippleTank, color: 'text-blue-400', desc: 'Numerische Wellensimulation. Beobachte Beugung, Reflexion und das Huygenssche Prinzip.' },
  { id: 'beats', title: 'Phasoren', category: 'Akustik', icon: Activity, component: BeatsPhasor, color: 'text-purple-400', desc: 'Visualisierung von Schwebungen mittels rotierender Zeiger (Phasoren).' },
  { id: 'tuner', title: 'Gitarren-Tuner', category: 'Akustik', icon: Music, component: GuitarTuner, color: 'text-red-400', desc: 'Hörbare Schwebung zweier Frequenzen. Ideal zum Verstehen von Stimmvorgängen.' },
  { id: 'gravity', title: 'Elastischer Stoß', category: 'Mechanik', icon: Circle, component: GravitySim, color: 'text-emerald-400', desc: 'Klassische Mechanik: Stoßgesetze und Gravitation in einem Partikelsystem.' },
  { id: 'pendulum', title: 'Doppelpendel', category: 'Chaos', icon: Shuffle, component: DoublePendulum, color: 'text-pink-400', desc: 'Ein einfaches mechanisches System mit komplexem, chaotischem Verhalten.' },
  { id: 'lissajous', title: 'Lissajous', category: 'Schwingungen', icon: InfinityIcon, component: Lissajous, color: 'text-green-400', desc: 'Überlagerung harmonischer Schwingungen in zwei Dimensionen.' }
];

export { MODULES };
