# BiggyOS

A web-based desktop environment that runs in your browser 🐀🧀

Built with HTML, CSS, and JavaScript

## About

BiggyOS is a fully client-side desktop environment that runs entirely in your browser. It features a windowing system, a modular app dock, a live analog/digital clock, a swappable background gallery, and a playful rat-and-cheese theme throughout — all rendered with plain HTML, CSS, and JavaScript.

Everything is self-contained. No backend, no database, no build step required.

## Features

### Desktop Environment
- **Windowing system** — glassmorphism-styled windows that can be dragged around the screen and closed with macOS-style traffic light controls
- **App Dock** — a bottom dock of app icons; each icon opens its corresponding window
- **Boot sequence** — animated loading screen with a progress bar and a rotating set of loading jokes
- **Status bar** — top bar displaying a random rat/cheese-themed joke on each page load
- **Live clock widget** — canvas-drawn analog clock face with a synced digital time readout

### Built-in Apps

| App | Description |
|---|---|
| YouTube Player | Custom video window with play/pause, seek bar, mute, and a link to the associated YouTube channel |
| Backgrounds | Gallery window for selecting a desktop background from a thumbnail grid, or removing it entirely |

### Modular by Design
Both the dock and the Backgrounds app are driven by simple JavaScript data arrays rather than hardcoded markup:
- **New dock app** — add one entry to the `apps` array (id, icon, color, action)
- **New background** — drop an image into the project folder and add one entry to the `backgrounds` array

No HTML editing or manual event-listener wiring required for either.

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, glassmorphism, flexbox) |
| Logic | Vanilla JavaScript (ES6) |
| Rendering | DOM + CSS transforms for the clock hands |

## Architecture

```
├── index.html      # Page structure — boot screen, status bar, clock widget, windows, dock
├── styles.css       # All visual styling — glassmorphism, dock, window, and background tile styles
└── app.js           # All logic:
                      #   - window open/close/drag
                      #   - dock rendering (apps array)
                      #   - background rendering (backgrounds array)
                      #   - video player controls
                      #   - live clock
                      #   - boot sequence + status bar jokes
```

## Getting Started

Since BiggyOS is a fully static site with no build tools or server-side code, you can run it directly:

```bash
# Clone the repository
git clone git@github.com:Logdegret/Biggy-chez.git
cd Biggy-chez

# Open directly in a browser
open index.html
```

Or serve it with any static file server, for example:

```bash
npx serve .
```

## Deployment

BiggyOS is a fully static site — no backend required.

**GitHub Pages (recommended):**
1. Push to GitHub
2. Go to Settings → Pages
3. Set the source to your `main` branch
4. Done — you get a live URL

Other options: Netlify, Vercel, Cloudflare Pages — any static host works.

## Extending BiggyOS

**Add a new dock app** — edit `app.js`:
```javascript
const apps = [
  { id: "play", icon: "play.png", color: "#e0862e", action: () => openWindow("windowjs") },
  { id: "newapp", icon: "newapp.png", color: "#ff6699", action: () => openWindow("windowid") },
];
```

**Add a new background** — edit `app.js`:
```javascript
const backgrounds = [
  { id: "none", type: "none", label: "Remove Background" },
  { id: "barnyard", type: "image", label: "Barnyard", file: "barnyard.jpg" },
  { id: "moo", type: "image", label: "Moo", file: "moo.jpg" },
];
```

## Project Info

| | |
|---|---|
| Made by | Logan |
| GitHub | [Logdegret](https://github.com/Logdegret) |
| Repository | [Biggy-chez](https://github.com/Logdegret/Biggy-chez) |

---

BiggyOS — made with 🐀 and 🧀
