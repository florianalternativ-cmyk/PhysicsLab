# PhysikLab

Eine interaktive Sammlung von Physik-Simulationen für den Browser. Sieben Module aus
Wellenlehre, Akustik, Mechanik und Chaostheorie lassen sich in Echtzeit über Schieberegler
und direkte Maus- bzw. Touch-Eingabe verändern.

Alle Simulationen sind von Hand gerechnet und auf ein `<canvas>` gezeichnet – es kommt
keine fertige Physik- oder Grafik-Engine zum Einsatz.

## Features

| Modul | Themengebiet | Was passiert |
| --- | --- | --- |
| **Interferenz** | Wellenlehre | Überlagerung zweier punktförmiger Wellenquellen. Für jedes Pixel wird die Summe beider Sinuswellen berechnet, sodass konstruktive und destruktive Interferenz als Muster sichtbar werden. Beide Quellen lassen sich frei verschieben; Frequenz, Amplitude und Phasenverschiebung sind einstellbar. |
| **Wellenwanne** | Wellenoptik | Numerische Lösung der 2D-Wellengleichung auf einem Gitter (Finite-Differenzen mit Dämpfung). Per Klick entstehen Störungen oder Wände. Das Preset „Spalt“ baut eine Barriere mit Öffnung und zeigt damit Beugung, Reflexion und das Huygenssche Prinzip. |
| **Phasoren** | Akustik | Schwebung, erklärt über rotierende Zeiger: zwei Phasoren, ihre Vektorsumme und die zugehörigen drei Zeitverläufe (Welle 1, Welle 2, Summe). Eine gestrichelte Projektion verbindet die Zeigerspitze mit der Summenkurve. |
| **Gitarren-Tuner** | Akustik | Zwei Oszillatoren (300–500 Hz) über die Web Audio API – die Schwebung ist hier tatsächlich *hörbar*. Das Canvas zeigt die Summenschwingung in einem 0,2-s-Fenster samt Hüllkurve, analog zum Stimmen zweier Saiten gegeneinander. |
| **Elastischer Stoß** | Mechanik | Partikelsystem unter konstanter Gravitation. Die Kugeln stoßen mit einem einstellbaren Restitutionskoeffizienten gegen Boden und Seitenwände – von stark gedämpft bis energiegewinnend. Per Klick kommen neue Kugeln dazu. |
| **Doppelpendel** | Chaos | Die Bewegungsgleichungen des Doppelpendels, Schritt für Schritt integriert. Die Bahn der unteren Masse wird nachgezeichnet und macht das chaotische Verhalten sichtbar. Beide Massen lassen sich mit der Maus in eine neue Startlage ziehen. |
| **Lissajous** | Schwingungen | Lissajous-Figuren aus der Überlagerung zweier harmonischer Schwingungen: `x = sin(a·t + δ)`, `y = sin(b·t)`. Frequenzverhältnis, Phasenlage und Animationsgeschwindigkeit sind regelbar. |

Alle Module sind responsiv: Über einen `ResizeObserver` wird die Canvas-Auflösung an die
Fenstergröße angepasst, und die Wellen- sowie Wellenwannen-Simulation reagieren auch auf
Touch-Eingaben.

## Tech-Stack

- **React 19** – Funktionskomponenten und Hooks
- **Vite 8** – Dev-Server und Build
- **Tailwind CSS 4** – Styling, eingebunden über `@tailwindcss/vite`
- **lucide-react** – Icons
- **Canvas 2D API** – die komplette Darstellung aller Simulationen
- **Web Audio API** – Tonerzeugung im Gitarren-Tuner
- **ResizeObserver API** – responsive Canvas-Auflösung

## Projektstruktur

```
PhysicsLab/
├── .github/workflows/deploy.yml      Build und Deployment auf GitHub Pages
├── index.html                        Einstiegs-HTML, lädt src/main.jsx
├── package.json                      Abhängigkeiten und npm-Skripte
├── vite.config.js                    Vite-Konfiguration (React, Tailwind, base-Pfad)
└── src/
    ├── main.jsx                      Mountet die App in #root
    ├── index.css                     Tailwind-Import, Basis- und Slider-Styles
    ├── App.jsx                       App-Shell: Header, Sidebar, Modulauswahl
    ├── components/
    │   └── LandingPage.jsx           Startseite mit den Modulkarten
    ├── hooks/
    │   └── useContainerDimensions.js  Hook, der Containergrößen per ResizeObserver liefert
    └── simulations/
        ├── index.js                  Registry: Titel, Kategorie, Icon und Beschreibung je Modul
        ├── WaveInterference.jsx      Interferenz zweier Wellenquellen
        ├── RippleTank.jsx            Wellenwanne (Beugung, Reflexion)
        ├── BeatsPhasor.jsx           Schwebung über Phasoren
        ├── GuitarTuner.jsx           Hörbare Schwebung, Gitarren-Tuner
        ├── GravitySim.jsx            Gravitation und Stöße an Wänden
        ├── DoublePendulum.jsx        Chaotisches Doppelpendel
        └── Lissajous.jsx             Lissajous-Figuren
```

Ein neues Modul lässt sich hinzufügen, indem man eine Komponente unter `src/simulations/`
anlegt und sie in `src/simulations/index.js` einträgt – Sidebar und Startseite werden
daraus automatisch aufgebaut.

## Lokal starten

Voraussetzung ist [Node.js](https://nodejs.org/) in Version 20.19 oder neuer (bzw. 22.12+).

```bash
npm install
npm run dev
```

Der Dev-Server gibt die URL im Terminal aus, standardmäßig
<http://localhost:5173/PhysicsLab/>.

Weitere Skripte:

```bash
npm run build     # Produktions-Build nach dist/
npm run preview   # den Build lokal ausliefern
```

## Live-Demo

**<https://florianalternativ-cmyk.github.io/PhysicsLab/>**

Das Deployment läuft automatisch: Bei jedem Push auf `main` baut der Workflow
`.github/workflows/deploy.yml` das Projekt und veröffentlicht den Inhalt von `dist/` über
GitHub Pages. Passend dazu steht in `vite.config.js` `base: '/PhysicsLab/'`, damit die
Asset-Pfade unter dem Unterverzeichnis von Pages aufgelöst werden.

## Lizenz

Für dieses Repository ist bislang keine Lizenz festgelegt; damit gilt das einfache
Urheberrecht. Falls das Projekt von anderen genutzt oder verändert werden darf, kann eine
`LICENSE`-Datei (etwa MIT) ergänzt werden.
