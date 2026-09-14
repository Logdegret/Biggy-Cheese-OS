# BiggyOS

<img width="1793" height="889" alt="image" src="https://github.com/user-attachments/assets/a703ef61-5fd7-4e3b-ba44-c53912450e82" />


A web-based desktop environment that runs in your browser 

Built with HTML, CSS, and JavaScript



## About
I build Biggy OS which runs in your browser without download and is a static site. It is based off of the biggy cheese meme.


## Features

### Desktop Environment
- **Windowing system** — glassmorphism-styled windows that can be dragged around the screen and closed with macOS-style traffic light controls
- **App Dock** — a bottom dock of app icons; each icon opens its corresponding window
- **Boot sequence** — animated loading screen with a progress bar and a rotating set of loading jokes
- **Status bar** — top bar displaying a random biggy cheese joke on each page load
- **Live clock widget** — canvas-drawn analog clock face with a synced digital time readout


### Modular by Design
* I built this os to be modular by design so that I wouldn't have to write extra code every time I wanted to make a new window.
* It is now easy to make new windows


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

## Fork my project!

Since BiggyOS is a fully static site you can easily remix it!

```bash

git clone git@github.com:Logdegret/Biggy-chez.git
cd Biggy-chez

open index.html
```


## Deployment

BiggyOS is a fully static site

**GitHub Pages**
1. Push to GitHub
2. Go to Settings → Pages
3. Set the source to your `main` branch
4. Done

## Extending BiggyOS

* You can add new apps/windows by using the template below
**Add a new dock app** — edit `app.js`:
```javascript
const apps = [
  { id: "play", icon: "play.png", color: "#e0862e", action: () => openWindow("windowjs") },
  { id: "newapp", icon: "newapp.png", color: "#ff6699", action: () => openWindow("windowid") },
];
```


## Project Info

| | |
|---|---|
| Made by | Logan |
| GitHub | [Logdegret](https://github.com/Logdegret) |
| Repository | [Biggy-Cheese-OS](https://github.com/Logdegret/Biggy-Cheese-OS) |

