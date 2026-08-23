const opengame = document.getElementById('opengame');

opengame.addEventListener('click', () => {
  const game = document.getElementById('gameFile');
  opengame.style.display = 'none';
  game.style.display = 'block';
  bringToFront(document.getElementById('windowgamejs'));
  document.querySelector('#windowgamejs .windowgamecontent').style.backgroundColor = 'transparent';
});


const video = document.getElementById('cheezVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const seekBar = document.getElementById('seekBar');
const timeDisplay = document.getElementById('timeDisplay');
const muteBtn = document.getElementById('muteBtn');

playPauseBtn.addEventListener('click', () => {
  if (video.paused) {
    video.play();
    playPauseIcon.src = 'pause.png';
  } else {
    video.pause();
    playPauseIcon.src = 'play-buttton.png';
  }
});

video.addEventListener('timeupdate', () => {
  seekBar.value = (video.currentTime / video.duration) * 100;
  timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
});

seekBar.addEventListener('input', () => {
  video.currentTime = (seekBar.value / 100) * video.duration;
});

muteBtn.addEventListener('click', () => {
  video.muted = !video.muted;
  muteBtn.textContent = video.muted ? '🔇' : '🔈';
});

function formatTime(s) {
  const m = Math.floor(s / 60) || 0;
  const sec = Math.floor(s % 60) || 0;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}


const minimizedWindows = new Set();


const windowStateHandlers = {};
const savedWindowState = new Map();

function registerWindowState(windowId, handlers) {
  windowStateHandlers[windowId] = handlers;
}

// Read state out of a window just before it gets hidden.
function captureWindowState(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;

  const state = {
    // Cheap insurance: some browsers drop scroll offsets on display:none.
    scroll: [win, ...win.querySelectorAll('*')]
      .filter(el => el.scrollTop || el.scrollLeft)
      .map(el => [el, el.scrollTop, el.scrollLeft]),
    focusId: win.contains(document.activeElement) ? document.activeElement.id : null
  };

  const handler = windowStateHandlers[windowId];
  if (handler && handler.save) state.custom = handler.save(win);

  savedWindowState.set(windowId, state);
}

// Put it back, after the window is visible again so layout values stick.
function restoreWindowState(windowId) {
  const win = document.getElementById(windowId);
  const state = savedWindowState.get(windowId);
  if (!win || !state) return;

  state.scroll.forEach(([el, top, left]) => {
    el.scrollTop = top;
    el.scrollLeft = left;
  });

  const handler = windowStateHandlers[windowId];
  if (handler && handler.restore) handler.restore(win, state.custom);

  if (state.focusId) {
    const focusEl = document.getElementById(state.focusId);
    if (focusEl) focusEl.focus();
  }

  savedWindowState.delete(windowId);
}

// Windows built as a flex column (title bar + content that fills the rest,
// so resizing actually grows the content) need `display: flex`, not the
// default 'block' - otherwise the inline style below overrides their CSS
// and flex:1 on the content silently does nothing.
const flexWindows = new Set(['terminal-window', 'windowgamejs', 'windowjs', 'windowbgjs', 'windowdudejs', 'windowmemejs', 'windowweatherjs', 'windowmusicjs']);

function openWindow(windowId) {
  const target = document.getElementById(windowId);
  if (target) {
    const wasMinimized = minimizedWindows.delete(windowId);
    target.style.display = flexWindows.has(windowId) ? 'flex' : 'block';
    bringToFront(target);
    if (wasMinimized) restoreWindowState(windowId);
  }
  if (windowId === 'terminal-window') {
    initTerminal();
  }
  syncDock();
}

function minimizeWindow(windowId) {
  const target = document.getElementById(windowId);
  if (target) {
    captureWindowState(windowId);
    target.style.display = 'none';
    minimizedWindows.add(windowId);
  }
  syncDock();
}

function closeWindow(windowId) {
  const targetWindow = document.getElementById(windowId);
  if (targetWindow) {
    targetWindow.style.display = 'none';
    // Unlike minimize, close means "start over" - drop any manual move,
    // resize, or maximize so the window reopens at its CSS default box
    // instead of wherever it was last left.
    targetWindow.style.top = '';
    targetWindow.style.left = '';
    targetWindow.style.width = '';
    targetWindow.style.height = '';
    targetWindow.classList.remove('maximized');
    delete targetWindow.dataset.prevBox;
  }
  // A closed window starts fresh next time, so drop anything we stashed.
  minimizedWindows.delete(windowId);
  savedWindowState.delete(windowId);
  if (windowId === 'windowjs' && !video.paused) {
    video.pause();
    playPauseIcon.src = 'play-buttton.png';
  }
  syncDock();
}

// Video: pause on minimize, resume on restore.
// Note we deliberately do NOT reassign currentTime here. Pausing leaves the
// playhead where it is, so the position survives on its own - and re-seeking
// would break playback on any host that doesn't serve HTTP range requests,
// where every seek clamps back to 0.
registerWindowState('windowjs', {
  save() {
    const wasPlaying = !video.paused;
    if (wasPlaying) {
      video.pause();
      playPauseIcon.src = 'play-buttton.png';
    }
    return { wasPlaying };
  },
  restore(win, state) {
    if (state && state.wasPlaying) {
      video.play();
      playPauseIcon.src = 'pause.png';
    }
  }
});

// Game: the iframe keeps running while hidden, so remember whether the user
// had already hit Start and put the window back on that screen.
registerWindowState('windowgamejs', {
  save(win) {
    const frame = win.querySelector('#gameFile');
    return { started: frame.style.display === 'block' };
  },
  restore(win, state) {
    if (!state) return;
    const frame = win.querySelector('#gameFile');
    const startBtn = win.querySelector('#opengame');
    frame.style.display = state.started ? 'block' : 'none';
    startBtn.style.display = state.started ? 'none' : 'block';
  }
});

// Toggle a window between its normal size and full screen.
// Stashes the inline top/left/width/height so restoring puts it back where it was.
function maximizeWindow(windowId) {
  const target = document.getElementById(windowId);
  if (!target) return;

  if (target.classList.contains('maximized')) {
    const saved = JSON.parse(target.dataset.prevBox || '{}');
    target.style.top = saved.top || '';
    target.style.left = saved.left || '';
    target.style.width = saved.width || '';
    target.style.height = saved.height || '';
    target.classList.remove('maximized');
  } else {
    target.dataset.prevBox = JSON.stringify({
      top: target.style.top,
      left: target.style.left,
      width: target.style.width,
      height: target.style.height
    });
    target.style.top = '32px';
    target.style.left = '0px';
    target.style.width = '100vw';
    target.style.height = 'calc(100vh - 32px)';
    target.classList.add('maximized');
  }
  bringToFront(target);
}

// Set the page background from the dock or the Backgrounds window
function setBackground(imagePath) {
  document.body.style.backgroundImage = `url('${imagePath}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
}

// Remove any custom background and revert to the default .box background
function removeBackground() {
  document.body.style.backgroundImage = "";
}






// time to make this draggable...
dragElement(document.getElementById("windowgamejs"), document.querySelector("#windowgamejs .title-bar"));
dragElement(document.getElementById("windowjs"), document.querySelector("#windowjs .title-bar"));
dragElement(document.getElementById("windowbgjs"), document.querySelector("#windowbgjs .title-bar"));
// dragElement(document.getElementById("clockjs"));
dragElement(document.getElementById("windowdudejs"), document.querySelector("#windowdudejs .title-bar"));
dragElement(document.getElementById("windowmemejs"), document.querySelector("#windowmemejs .title-bar"));
dragElement(document.getElementById("windowtodojs"), document.querySelector("#windowtodojs .title-bar"));
dragElement(document.getElementById("terminal-window"), document.querySelector("#terminal-window .term-title-bar"))
dragElement(document.getElementById("noteswindowjs"), document.querySelector("#noteswindowjs .title-bar"))
dragElement(document.getElementById("storewindowjs"), document.querySelector("#storewindowjs .title-bar"))
dragElement(document.getElementById("windowweatherjs"), document.querySelector("#windowweatherjs .title-bar"))
dragElement(document.getElementById("windowmusicjs"), document.querySelector("#windowmusicjs .title-bar"))

// ...and resizable from all four corner grips.
makeResizable(document.getElementById("windowgamejs"));
makeResizable(document.getElementById("windowjs"));
makeResizable(document.getElementById("windowbgjs"));
makeResizable(document.getElementById("windowdudejs"));
makeResizable(document.getElementById("windowmemejs"));
makeResizable(document.getElementById("windowtodojs"));
makeResizable(document.getElementById("terminal-window"));
makeResizable(document.getElementById("noteswindowjs"));
makeResizable(document.getElementById("storewindowjs"));
makeResizable(document.getElementById("windowweatherjs"));
makeResizable(document.getElementById("windowmusicjs"));



function dragElement(element, handle) {

  var initialX = 0;
  var initialY = 0;
  var currentX = 0;
  var currentY = 0;

  const dragHandle = handle || element;
  dragHandle.onmousedown = startDragging;

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    bringToFront(element);
    setIframesInteractive(false);
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = dragElement;
  }

  function stopDragging() {
    setIframesInteractive(true);
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function dragElement(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = (element.offsetTop - currentY) + "px";
    element.style.left = (element.offsetLeft - currentX) + "px";
  }
}

// Drag the bottom-right corner grip to resize a window. minWidth/minHeight
// stop it from being shrunk small enough to lose the title bar controls.
// Wires up every corner grip inside `element`. Each handle's data-dir
// ("tl"/"tr"/"bl"/"br") says which edges it drags - dragging from the top
// or left has to shrink/grow width or height in the opposite direction AND
// shift top/left so the opposite corner stays anchored in place.
function makeResizable(element, minWidth = 220, minHeight = 140) {
  if (!element) return;
  const handles = element.querySelectorAll(".resize-handle");
  if (!handles.length) return;

  handles.forEach(handle => {
    const dir = handle.dataset.dir || "br";

    var startX = 0;
    var startY = 0;
    var startWidth = 0;
    var startHeight = 0;
    var startTop = 0;
    var startLeft = 0;

    handle.addEventListener("mousedown", startResizing);

    function startResizing(e) {
      e.preventDefault();
      e.stopPropagation(); // don't let this bubble into dragElement's title-bar logic
      bringToFront(element);
      setIframesInteractive(false);

      startX = e.clientX;
      startY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startTop = element.offsetTop;
      startLeft = element.offsetLeft;

      document.onmousemove = resize;
      document.onmouseup = stopResizing;
    }

    function resize(e) {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (dir.includes("r")) {
        element.style.width = Math.max(minWidth, startWidth + dx) + "px";
      }
      if (dir.includes("b")) {
        element.style.height = Math.max(minHeight, startHeight + dy) + "px";
      }
      if (dir.includes("l")) {
        const newWidth = Math.max(minWidth, startWidth - dx);
        element.style.width = newWidth + "px";
        element.style.left = (startLeft + (startWidth - newWidth)) + "px";
      }
      if (dir.includes("t")) {
        const newHeight = Math.max(minHeight, startHeight - dy);
        element.style.height = newHeight + "px";
        element.style.top = (startTop + (startHeight - newHeight)) + "px";
      }
    }

    function stopResizing() {
      setIframesInteractive(true);
      document.onmousemove = null;
      document.onmouseup = null;
    }
  });
}

// Layering windows with z-index//
// Start above the clock widget (z-index 10) so windows always layer over it.
let highestZ = 20;
function bringToFront(windowId) {
  if(!windowId) return;
  highestZ++;
  windowId.style.zIndex = highestZ;

}




// Inline SVG so the Weather app doesn't need its own icon asset on disk.
const WEATHER_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Ccircle cx='9' cy='8' r='4' fill='%23FFD54A'/%3E" +
  "%3Cpath d='M7 19a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0116.5 19H7z' fill='%23FFFFFF'/%3E" +
  "%3C/svg%3E";

// Same trick for the Music app's icon.
const MUSIC_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Cpath d='M9 17V5l11-2v12' stroke='%23FFFFFF' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E" +
  "%3Ccircle cx='6.5' cy='17.5' r='2.5' fill='%23FFFFFF'/%3E" +
  "%3Ccircle cx='17.5' cy='15.5' r='2.5' fill='%23FFFFFF'/%3E" +
  "%3C/svg%3E";

// ---- Modular app dock ----
// Add/remove apps by editing this array only — renderDock() builds the bar from it.
// windowId ties each icon to its window so syncDock() can show a running dot.
// `installable: true` means the app only shows up in the dock once installed
// from the Store (see installApp/uninstallApp) — everything else is always present.
const apps = [
  { id: "play",   name:"VideoMeme",    icon: "play.png",       color: "#e0c52e", windowId: "windowjs" },
  { id: "background", name:"Backgrounds", icon: "background.png", color: "#f04c4c", windowId: "windowbgjs" },
  { id: "dude",   name:"About Me",    icon: "Dude.png",       color: "#10902e", windowId: "windowdudejs" },
  { id: "game",   name:"Monkey Mart",    icon: "xbox.png",       color: "black",   windowId: "windowgamejs" },
  { id: "meme",   name:"Memes",    icon: "meme.png",       color: "#062cc1", windowId: "windowmemejs" },
  { id: "todo",   name:"Biggy Todo",    icon: "todo.png",       color: "#e05832", windowId: "windowtodojs" },
  { id: "terminal", name:"Terminal", icon: "terminal.png", color:"black", windowId:"terminal-window"},
  {id: "notes", name:"notes", icon: "note.png", color:"#f2dc79", windowId:"noteswindowjs"},
  { id: "weather", name: "Weather", icon: WEATHER_ICON, color: "#3b7dd8", windowId: "windowweatherjs", installable: true },
  {id: "apps", icon: "app.png", color:"#b1b0b0", windowId:"storewindowjs"},
  { id: "music", name: "Music", icon: MUSIC_ICON, color: "#e1158c", windowId: "windowmusicjs", installable: true }
];

const INSTALLED_APPS_KEY = "biggyos-installed-apps";

function getInstalledApps() {
  try {
    return JSON.parse(localStorage.getItem(INSTALLED_APPS_KEY)) || [];
  } catch {
    return [];
  }
}

function isAppInstalled(app) {
  return !app.installable || getInstalledApps().includes(app.id);
}

function installApp(appId) {
  const installed = getInstalledApps();
  if (!installed.includes(appId)) {
    installed.push(appId);
    localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(installed));
  }
  renderDock();
  renderStore();
}

function uninstallApp(appId) {
  const installed = getInstalledApps().filter(id => id !== appId);
  localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(installed));
  const app = apps.find(a => a.id === appId);
  if (app) closeWindow(app.windowId);
  renderDock();
  renderStore();
}

// Fake download progress before an app actually installs - applies to every
// app.installable entry automatically, so any future installable app (e.g.
// a music player) gets this for free without touching this function.
function downloadThenInstall(app, btn) {
  const duration = 1400 + Math.random() * 1600; // 1.4-3s, just for flavor
  const start = Date.now();

  btn.disabled = true;
  btn.classList.add('store-card-downloading');
  btn.innerHTML = '<span class="store-download-fill"></span><span class="store-download-label">0%</span>';
  const fill = btn.querySelector('.store-download-fill');
  const label = btn.querySelector('.store-download-label');

  // setInterval, not requestAnimationFrame - rAF pauses while the tab is
  // backgrounded, which would freeze the "download" if the user switches
  // tabs mid-install. setInterval keeps ticking (throttled, but it moves).
  const intervalId = setInterval(() => {
    const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
    fill.style.width = pct + '%';
    label.textContent = pct < 100 ? `${pct}%` : 'Installing…';

    if (pct >= 100) {
      clearInterval(intervalId);
      setTimeout(() => installApp(app.id), 200);
    }
  }, 60);
}

// Light up the dot under any icon whose window is open or minimized.
function syncDock() {
  apps.forEach(app => {
    const iconEl = document.getElementById(`dock-${app.id}`);
    const win = document.getElementById(app.windowId);
    if (!iconEl || !win) return;

    const isMinimized = minimizedWindows.has(app.windowId);
    const isOpen = win.style.display !== 'none' && win.style.display !== '';

    iconEl.classList.toggle('running', isOpen || isMinimized);
    iconEl.classList.toggle('minimized', isMinimized);
  });
}

function renderDock() {
  const dock = document.getElementById("appDock");
  if (!dock) return;
  dock.innerHTML = "";

  apps.forEach(app => {
    if (!isAppInstalled(app)) return;

    const iconEl = document.createElement("div");
    iconEl.className = "dock-icon";
    iconEl.id = `dock-${app.id}`;
    iconEl.style.backgroundColor = app.color;
    iconEl.title = app.name || app.id;

    iconEl.innerHTML = `<img src="${app.icon}" alt="${app.id}">`;

    // Clicking a running icon that's minimized restores it; otherwise opens it.
    iconEl.addEventListener("click", () => {
      if (typeof app.action === "function") {
        app.action();
      } else {
        openWindow(app.windowId);
      }
    });

    dock.appendChild(iconEl);
  });

  syncDock();
}

renderDock();


const backgrounds = [
  { id: "none",     type: "none",  label: "Remove Background" },
  { id: "barnyard", type: "image", label: "Barnyard", file: "barnyard.jpg" },
  { id: "moo",      type: "image", label: "Moo",      file: "moo.jpg" },
  
];

function renderBackgrounds() {
  const container = document.querySelector("#windowbgjs .windowbgcontent");
  if (!container) return;

  container.querySelectorAll(".bg-thumb").forEach(el => el.remove());

  backgrounds.forEach(bg => {
    const wrapper = document.createElement("div");
    wrapper.className = "barnyardimg bg-thumb";

  const button = document.createElement("button");
  button.className = "bg-thumb-btn";
  button.title = bg.label;

    if (bg.type === "none") {
      button.className = "bg-thumb-btn bg-remove-btn";
      button.textContent = "🚫";
      button.addEventListener("click", removeBackground);
    } else {
      const img = document.createElement("img");
      img.className = "fit";
      img.src = bg.file;
      img.alt = bg.label;
      button.appendChild(img);
      button.addEventListener("click", () => setBackground(bg.file));
    }

    wrapper.appendChild(button);
    container.appendChild(wrapper);
  });
}

renderBackgrounds();


const ratJokes = [
  "🐀Still Cheesing🧀",
  "🐀Who's Biggy Cheese?🧀",
  "🐀The equivalent of Eminem🧀",
  "🐀Why so Cheesy?🧀",
  "🐀Who cut the cheese?🧀",
  "🐀Who let the rats out?🧀",
  "🐀Don't let him fool you...🧀",
  "🐀He's big, and he's cheesy🧀",
  "🐀How many cheese have you eaten?🧀",
  "🐀Shaggeyyyy🧀",
  "🐀Cheese me if you can🧀",
  "🐀Rat King has entered the chat🧀",
  "🐀Gouda vibes only🧀",
  "🐀No cap, just cheese🧀",
  "🐀He's the rat, the myth, the legend🧀",
  "🐀Feta up with your nonsense🧀",
  "🐀Cheesin' till the wheelz fall off🧀",
  "🐀Rats run this town🧀",
  "🐀Brie yourself, it's Biggy🧀",
  "🐀Squeak now or forever hold your cheese🧀",
  "🐀This ain't provolone, this is destiny🧀",
  "🐀Sewer to superstar🧀",
  "🐀Cheddar than ever🧀",
  "🐀One does not simply say no to cheese🧀",
  "🐀Big Cheese Energy🧀",
  "🐀Rat pack runnin' deep🧀",
  "🐀Whiskers on fleek🧀",
  "🐀Nacho average rat🧀",
  "🐀Cheese today, legend tomorrow🧀",
  "🐀Parmesan and popping🧀",
  "🐀He came, he saw, he cheesed🧀",
  "🐀Living the mozzarella life🧀",
  "🐀Ask about my cheese plan🧀",
  "🐀Rat tax: paid in cheese🧀",
  "🐀Biggy don't miss🧀",
  "Your lucky!! this ones rare..."
];

const randomJoke = ratJokes[Math.floor(Math.random() * ratJokes.length)];
document.getElementById("status-bar-text").textContent = randomJoke;




window.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  const bootContent = document.querySelector(".boot-content");
  const loadingJoker = document.getElementById("loadingJoker");
  const enterBtn = document.getElementById("bootEnterBtn");
  const skipBtn = document.getElementById("bootSkipBtn");
  const doorLeft = document.getElementById("bootDoorLeft");
  const doorRight = document.getElementById("bootDoorRight");
  const doorSeam = document.getElementById("doorSeam");
  const doorAudio = document.getElementById("doorAudio");

  const loadingJokes = [
    "👽Hacking into your drive...👨‍💻",
    "💩Something smells in here. Wait, is that blue cheese?🧀",
    "🎧I hear something mice in you setup🐀",
    "Yes, were still here...",
    "Getting ready for the rap sesh",
    "Is this a star project?⭐️💫",
    "Please Elect this For Super Star!!! ⭐️⭐️⭐️",
    "Please Wait, No Stay!! 🙏"
  ];

  const bootDuration = 1800 + Math.random() * 800; // ms

  let jokeIndex = Math.floor(Math.random() * loadingJokes.length); // random starting point too
  function cycleJoke() {
    loadingJoker.textContent = loadingJokes[jokeIndex % loadingJokes.length];
    jokeIndex++;
  }
  cycleJoke();
  const jokeInterval = setInterval(cycleJoke, 650 + Math.random() * 150);

  // after the fake load finishes, stop the jokes and reveal the enter button
  setTimeout(() => {
    clearInterval(jokeInterval);
    loadingJoker.textContent = "Ready.";
    enterBtn.classList.add("visible");
  }, bootDuration);

  // clank ~0-1s, door slide ~1s onward - tuned to door-open.mp3's waveform
  const CLANK_END = 1.0;
  const FALLBACK_DURATION = 5;

  // slow creak that only really commits to opening in the last stretch,
  // then shoves the rest of the way in a hard final push
  function easeCreakThenPush(t) {
    return t < 0.75
      ? (t / 0.75) * 0.22               // slow, almost-stalled creep
      : 0.22 + Math.pow((t - 0.75) / 0.25, 2) * 0.78; // hard push at the end
  }

  let rafId = null;
  function driveDoors() {
    const t = doorAudio.currentTime;

    if (t < CLANK_END) {
      rafId = requestAnimationFrame(driveDoors);
      return;
    }

    bootScreen.classList.remove("shaking");

    const total = (doorAudio.duration || FALLBACK_DURATION) - CLANK_END;
    const openT = Math.min(1, (t - CLANK_END) / total);
    const eased = easeCreakThenPush(openT);

    doorLeft.style.transform = `translateX(${-eased * 100}%)`;
    doorRight.style.transform = `translateX(${eased * 100}%)`;
    doorSeam.style.width = (6 + eased * 60) + "px";

    if (openT < 1 && !doorAudio.paused && !doorAudio.ended) {
      rafId = requestAnimationFrame(driveDoors);
    }
  }

  function removeBoot() {
    if (rafId) cancelAnimationFrame(rafId);
    doorAudio.pause();
    bootScreen.classList.add("hidden");
    setTimeout(() => bootScreen.remove(), 600);
  }

  skipBtn.addEventListener("click", removeBoot);

  enterBtn.addEventListener("click", () => {
    enterBtn.classList.remove("visible");
    bootContent.classList.add("fade-out");

    doorAudio.currentTime = 0;
    doorAudio.play().catch(() => {});

    bootScreen.classList.add("shaking");
    doorSeam.classList.add("lit");
    skipBtn.classList.add("visible"); // only appears once the doors are opening

    rafId = requestAnimationFrame(driveDoors);

    doorAudio.addEventListener("ended", removeBoot, { once: true });
    // fallback in case audio fails to load/play
    setTimeout(removeBoot, 6000);
  });
});



function updateClock(){
  const hour = document.getElementById('hourHand');
  const minute = document.getElementById('minuteHand');
  const second = document.getElementById('secondHand');
  const digital = document.getElementById('digitalTime');

  if(!hour || !minute || !second) return;
  const now = new Date();
  const ms = now.getMilliseconds();
  const s = now.getSeconds() + ms/1000;
  const m = now.getMinutes() + s/60;
  const h = now.getHours() % 12 +m/60;

  second.style.transform = `rotate(${s * 6}deg)`;
  minute.style.transform = `rotate(${m * 6}deg)`;
  hour.style.transform = `rotate(${h * 30}deg)`;

  if (digital) digital.textContent = now.toLocaleTimeString();
}

function tickClock(){
  updateClock()
  requestAnimationFrame(tickClock);

}
tickClock();



document.addEventListener('DOMContentLoaded', () =>{
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');

  const emptyMsg = document.getElementById('todoEmpty');

  // Hide the placeholder line as soon as there's at least one task.
  const updateEmptyMsg = () => {
    if (emptyMsg) {
      emptyMsg.style.display = taskList.children.length ? 'none' : 'block';
    }
  };

  const addTask = () => {
    const taskText = taskInput.value.trim();
    if (taskText == ''){
      alert("Bro Actually enter a task.");
      return;
    }

    const listItem = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.addEventListener('change', () => {
      listItem.classList.toggle('completed', checkbox.checked);
    });

    // textContent, not innerHTML — a task like "<b>hi" should render as typed.
    const label = document.createElement('span');
    label.className = 'task-text';
    label.textContent = taskText;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => {
      listItem.remove();
      updateEmptyMsg();
    });

    listItem.appendChild(checkbox);
    listItem.appendChild(label);
    listItem.appendChild(deleteBtn);
    taskList.appendChild(listItem);

    taskInput.value = '';
    taskInput.focus();
    updateEmptyMsg();
  };

  updateEmptyMsg();

  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter'){
      addTask();
    }
  });
});


const terminalHistory = [];
let terminalHistoryIndex = -1;
let terminalInitialized = false;

const terminalFS = {
  "about.txt": "BiggyOS - a browser-based desktop simulator built for Hack Club Stardance.",
  "notes.txt": "This terminal is a simulated shell. No real commands are executed."
};

const windowAliases = {
  video: 'windowjs',
  backgrounds: 'windowbgjs',
  creator: 'windowdudejs',
  game: 'windowgamejs',
  meme: 'windowmemejs',
  todo: 'windowtodojs'
};

function initTerminal() {
  if (terminalInitialized) return;
  terminalInitialized = true;

  const input = document.getElementById('terminal-input');
  if (!input) {
    console.error('initTerminal: #terminal-input not found in DOM');
    return;
  }

  input.addEventListener('keydown', handleTerminalKeydown);

  printToTerminal('BiggyOS Terminal [v1.0]');
  printToTerminal('Type "help" for a list of commands.');
}

function handleTerminalKeydown(e) {
  const input = e.target;

  if (e.key === 'Enter') {
    const cmd = input.value;
    runTerminalCommand(cmd);
    input.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (terminalHistory.length === 0) return;
    if (terminalHistoryIndex > 0) terminalHistoryIndex--;
    input.value = terminalHistory[terminalHistoryIndex] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (terminalHistoryIndex < terminalHistory.length - 1) {
      terminalHistoryIndex++;
      input.value = terminalHistory[terminalHistoryIndex];
    } else {
      terminalHistoryIndex = terminalHistory.length;
      input.value = '';
    }
  }
}

function printToTerminal(text, isCommand = false) {
  const log = document.getElementById('terminal-log');
  if (!log) return;

  const line = document.createElement('div');
  line.className = 'terminal-log-line';
  line.textContent = isCommand ? `biggy@os:~$ ${text}` : text;
  log.appendChild(line);

  const logContainer = document.querySelector('.terminal-log-container');
  if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
}

function runTerminalCommand(raw) {
  const cmd = raw.trim();
  if (cmd === '') return;

  printToTerminal(cmd, true);
  terminalHistory.push(cmd);
  terminalHistoryIndex = terminalHistory.length;

  const [base, ...args] = cmd.split(' ');

  switch (base.toLowerCase()) {
    case 'help':
  printToTerminal('Available commands:');
  printToTerminal('help');
  printToTerminal('  -show this list');
  printToTerminal('about');
  printToTerminal('  -about BiggyOS');
  printToTerminal('ls');
  printToTerminal('  -list files');
  printToTerminal('cat [file]');
  printToTerminal('  -print file contents');
  printToTerminal('date');
  printToTerminal('  -show current date/time');
  printToTerminal('whoami');
  printToTerminal('  -show current user');
  printToTerminal('echo [text]');
  printToTerminal('  -print text back');
  printToTerminal('history');
  printToTerminal('  -show past commands');
  printToTerminal('clear');
  printToTerminal('  -clear the terminal');
  printToTerminal('open [window]');
  printToTerminal('  -open: video, backgrounds, creator, game, meme, todo');
  break;

    case 'about':
      printToTerminal('BiggyOS — a browser-based desktop simulator, built for Hack Club Stardance.');
      break;

    case 'ls':
      printToTerminal(Object.keys(terminalFS).join('  '));
      break;

    case 'cat':
      if (!args[0]) {
        printToTerminal('cat: missing file operand');
      } else if (terminalFS[args[0]]) {
        printToTerminal(terminalFS[args[0]]);
      } else {
        printToTerminal(`cat: ${args[0]}: No such file`);
      }
      break;

    case 'date':
      printToTerminal(new Date().toString());
      break;

    case 'whoami':
      printToTerminal('guest');
      break;

    case 'echo':
      printToTerminal(args.join(' '));
      break;

    case 'history':
      if (terminalHistory.length === 0) {
        printToTerminal('(no commands yet)');
      } else {
        terminalHistory.forEach((c, i) => printToTerminal(`${i + 1}  ${c}`));
      }
      break;

    case 'clear':
      const log = document.getElementById('terminal-log');
      if (log) log.innerHTML = '';
      break;

    case 'open':
      if (!args[0]) {
        printToTerminal('open: specify a window, e.g. "open meme"');
      } else {
        const resolvedId = windowAliases[args[0]] || args[0];
        if (!document.getElementById(resolvedId)) {
          printToTerminal(`open: window not found: ${args[0]}`);
        } else if (typeof openWindow === 'function') {
          openWindow(resolvedId);
          printToTerminal(`Opening ${args[0]}...`);
        } else {
          printToTerminal('error: openWindow() not found');
        }
      }
      break;

    default:
      printToTerminal(`command not found: ${base}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const notesTextarea = document.getElementById('notesTextarea');
  if (!notesTextarea) return;

  notesTextarea.value = localStorage.getItem('biggyos-notes') || '';
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('biggyos-notes', notesTextarea.value);
  });
});


function renderStore() {
  const container = document.getElementById("storewindowcontentjs");
  if (!container) return;

  container.innerHTML ='';
  apps
    .filter(app => app.windowId !== 'storewindowjs')
    .forEach(app => {
      const card = document.createElement("div");
      card.className = 'store-card';
      const iconWrap=document.createElement("div");
      iconWrap.className='store-card-icon';
      iconWrap.style.backgroundColor=app.color;
      iconWrap.innerHTML = `<img src="${app.icon}" alt="${app.id}">`;

      const name= document.createElement('div');
      name.className = 'store-card-name';
      name.textContent = app.name || app.id;

      const actions = document.createElement('div');
      actions.className = 'store-card-actions';

      if (app.installable && !isAppInstalled(app)) {
        const installBtn = document.createElement('button');
        installBtn.className = 'store-card-btn';
        installBtn.textContent = 'Install';
        installBtn.addEventListener('click', () => downloadThenInstall(app, installBtn));
        actions.appendChild(installBtn);
      } else {
        const openBtn = document.createElement('button');
        openBtn.className = 'store-card-btn';
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => openWindow(app.windowId));
        actions.appendChild(openBtn);

        if (app.installable) {
          const uninstallBtn = document.createElement('button');
          uninstallBtn.className = 'store-card-uninstall';
          uninstallBtn.textContent = '🗑';
          uninstallBtn.title = 'Uninstall';
          uninstallBtn.addEventListener('click', () => uninstallApp(app.id));
          actions.appendChild(uninstallBtn);
        }
      }

      card.appendChild(iconWrap);
      card.appendChild(name);
      card.appendChild(actions);
      container.appendChild(card);
    });

}

renderStore();


// ---- Weather app (Open-Meteo - free, no API key) ----
document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('weatherCityInput');
  const searchBtn = document.getElementById('weatherSearchBtn');
  if (!cityInput || !searchBtn) return;

  const WEATHER_CITY_KEY = 'biggyos-weather-city';

  const WEATHER_CODES = {
    0: { icon: '☀️', label: 'Clear sky' },
    1: { icon: '🌤️', label: 'Mostly clear' },
    2: { icon: '⛅', label: 'Partly cloudy' },
    3: { icon: '☁️', label: 'Overcast' },
    45: { icon: '🌫️', label: 'Foggy' },
    48: { icon: '🌫️', label: 'Foggy' },
    51: { icon: '🌦️', label: 'Light drizzle' },
    53: { icon: '🌦️', label: 'Drizzle' },
    55: { icon: '🌦️', label: 'Heavy drizzle' },
    61: { icon: '🌧️', label: 'Light rain' },
    63: { icon: '🌧️', label: 'Rain' },
    65: { icon: '🌧️', label: 'Heavy rain' },
    71: { icon: '🌨️', label: 'Light snow' },
    73: { icon: '🌨️', label: 'Snow' },
    75: { icon: '🌨️', label: 'Heavy snow' },
    80: { icon: '🌦️', label: 'Rain showers' },
    81: { icon: '🌧️', label: 'Rain showers' },
    82: { icon: '⛈️', label: 'Violent showers' },
    95: { icon: '⛈️', label: 'Thunderstorm' },
    96: { icon: '⛈️', label: 'Thunderstorm w/ hail' },
    99: { icon: '⛈️', label: 'Thunderstorm w/ hail' }
  };

  function describeCode(code) {
    return WEATHER_CODES[code] || { icon: '❓', label: 'Unknown' };
  }

  function dayLabel(dateStr, index) {
    if (index === 0) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  function setStatus(text) {
    document.getElementById('weatherCondition').textContent = text;
  }

  function renderWeather(name, current, daily) {
    const cond = describeCode(current.weather_code);

    document.getElementById('weatherIconBig').textContent = cond.icon;
    document.getElementById('weatherTempBig').textContent = Math.round(current.temperature_2m) + '°';
    document.getElementById('weatherCondition').textContent = cond.label;
    document.getElementById('weatherCityName').textContent = name;
    document.getElementById('weatherHumidity').textContent = Math.round(current.relative_humidity_2m) + '%';
    document.getElementById('weatherWind').textContent = Math.round(current.wind_speed_10m) + ' km/h';
    document.getElementById('weatherFeelsLike').textContent = Math.round(current.apparent_temperature) + '°';

    // Mirror into the desktop widget too, so it stays live even with the
    // Weather window closed.
    const widgetIcon = document.getElementById('weatherWidgetIcon');
    const widgetTemp = document.getElementById('weatherWidgetTemp');
    const widgetCity = document.getElementById('weatherWidgetCity');
    if (widgetIcon) widgetIcon.textContent = cond.icon;
    if (widgetTemp) widgetTemp.textContent = Math.round(current.temperature_2m) + '°';
    if (widgetCity) widgetCity.textContent = name;

    if (daily && daily.time && daily.time.length) {
      document.getElementById('weatherHiLo').innerHTML =
        `H:${Math.round(daily.temperature_2m_max[0])}&deg; L:${Math.round(daily.temperature_2m_min[0])}&deg;`;
    }

    const list = document.getElementById('weatherForecastList');
    list.innerHTML = '';
    if (daily && daily.time) {
      daily.time.forEach((dateStr, i) => {
        const dayCond = describeCode(daily.weather_code[i]);
        const row = document.createElement('div');
        row.className = 'weather-forecast-row';
        row.innerHTML = `
          <span class="weather-forecast-day">${dayLabel(dateStr, i)}</span>
          <span class="weather-forecast-icon">${dayCond.icon}</span>
          <span class="weather-forecast-range">${Math.round(daily.temperature_2m_min[i])}&deg; / ${Math.round(daily.temperature_2m_max[i])}&deg;</span>
        `;
        list.appendChild(row);
      });
    }
  }

  async function loadWeatherForCoords(lat, lon, label) {
    setStatus('Loading...');
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );
      const data = await res.json();
      renderWeather(label, data.current, data.daily);
    } catch (err) {
      setStatus('Could not load weather');
      console.error('Weather fetch failed:', err);
    }
  }

  async function loadWeatherForCity(cityName) {
    setStatus('Searching...');
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || !geoData.results.length) {
        setStatus('City not found');
        return;
      }
      const place = geoData.results[0];
      const label = place.admin1 ? `${place.name}, ${place.admin1}` : place.name;
      localStorage.setItem(WEATHER_CITY_KEY, place.name);
      await loadWeatherForCoords(place.latitude, place.longitude, label);
    } catch (err) {
      setStatus('Could not load weather');
      console.error('Weather geocode failed:', err);
    }
  }

  function search() {
    const value = cityInput.value.trim();
    if (value) loadWeatherForCity(value);
  }

  searchBtn.addEventListener('click', search);
  cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search();
  });

  // initial load: last-searched city > geolocation > default city
  const savedCity = localStorage.getItem(WEATHER_CITY_KEY);
  if (savedCity) {
    cityInput.value = savedCity;
    loadWeatherForCity(savedCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude, 'Current Location'),
      () => loadWeatherForCity('New York')
    );
  } else {
    loadWeatherForCity('New York');
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
    const audio = document.getElementById('musicAudio');
    const playBtn = document.getElementById('musicPlayBtn');
    const prevBtn = document.getElementById('musicPrevBtn');
    const nextBtn = document.getElementById('musicNextBtn');
    const seekBar = document.getElementById('musicSeekBar');
    const volumeBar = document.getElementById('musicVolumeBar');
    const trackTitle = document.getElementById('musicTrackTitle');
    const timeCurrent = document.getElementById('musicTimeCurrent');
    const timeDuration = document.getElementById('musicTimeDuration');
    const playlistEl = document.getElementById('musicPlaylist');
    const addBtn = document.getElementById('musicAddBtn');
    const fileInput = document.getElementById('musicFileInput');
    if (!audio || !playBtn) return;

    const tracks = [
      { title: 'Background Music 1', src: 'bgmusic1.mp3' },
      { title: 'Background Music 2', src: 'bgmusic2.mp3' },
      { title: 'Background Music 3', src: 'bgmusic3.mp3' }
    ];
    let currentIndex = -1;

  function formatTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function renderPlaylist() {
    playlistEl.innerHTML = '';
    tracks.forEach((track, i) => {
      const row = document.createElement('div');
      row.className = 'music-playlist-row' + (i === currentIndex ? ' active' : '');
      row.textContent = track.title;
      row.addEventListener('click', () => playTrack(i));
      playlistEl.appendChild(row);
    });
  }

  const widgetPlayBtn = document.getElementById('musicWidgetPlay');
  const widgetTitle = document.getElementById('musicWidgetTitle');

  function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    audio.src = tracks[index].src;
    trackTitle.textContent = tracks[index].title;
    if (widgetTitle) widgetTitle.textContent = tracks[index].title;
    audio.play().catch(() => {});
    renderPlaylist();
  }

  playBtn.addEventListener('click', () => {
    if (!audio.src) { if (tracks.length) playTrack(0); return; }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  // The widget's mini play button just proxies the real one - reuses the
  // exact same play/pause/first-track logic instead of duplicating it.
  if (widgetPlayBtn) {
    widgetPlayBtn.addEventListener('click', () => playBtn.click());
  }

  prevBtn.addEventListener('click', () => {
    if (tracks.length) playTrack((currentIndex - 1 + tracks.length) % tracks.length);
  });

  nextBtn.addEventListener('click', () => {
    if (tracks.length) playTrack((currentIndex + 1) % tracks.length);
  });

  audio.addEventListener('play', () => {
    playBtn.textContent = '⏸';
    if (widgetPlayBtn) widgetPlayBtn.textContent = '⏸';
  });
  audio.addEventListener('pause', () => {
    playBtn.textContent = '▶';
    if (widgetPlayBtn) widgetPlayBtn.textContent = '▶';
  });
  audio.addEventListener('ended', () => {
    if (tracks.length) playTrack((currentIndex + 1) % tracks.length);
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    seekBar.value = (audio.currentTime / audio.duration) * 100;
    timeCurrent.textContent = formatTime(audio.currentTime);
    timeDuration.textContent = formatTime(audio.duration);
  });

  seekBar.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
  });

  volumeBar.addEventListener('input', () => { audio.volume = volumeBar.value / 100; });
  audio.volume = volumeBar.value / 100;

  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(file => {
      tracks.push({ title: file.name.replace(/\.[^/.]+$/, ''), src: URL.createObjectURL(file) });
    });
    renderPlaylist();
    fileInput.value = '';
  });

  renderPlaylist();
});


const contextMenu = document.getElementById('contextMenu');

// ---- Optional desktop widgets ----
// Weather/Music/Meme start hidden (see their `style="display: none;"` in
// index.html) and only appear once added from the right-click menu -
// getAddedWidgets() persists the choice so it survives a reload.
const WIDGET_IDS = ['weatherWidget', 'musicWidget', 'memeWidget'];
const WIDGET_LABELS = { weatherWidget: 'Weather', musicWidget: 'Music', memeWidget: 'Meme' };
const ADDED_WIDGETS_KEY = 'biggyos-added-widgets';

function getAddedWidgets() {
  try {
    return JSON.parse(localStorage.getItem(ADDED_WIDGETS_KEY)) || [];
  } catch {
    return [];
  }
}

function setAddedWidgets(list) {
  localStorage.setItem(ADDED_WIDGETS_KEY, JSON.stringify(list));
}

function showWidget(widgetId) {
  const el = document.getElementById(widgetId);
  if (!el) return;
  el.style.display = ''; // fall back to the class's own display:flex
  const added = getAddedWidgets();
  if (!added.includes(widgetId)) {
    added.push(widgetId);
    setAddedWidgets(added);
  }
}

function hideWidget(widgetId) {
  const el = document.getElementById(widgetId);
  if (!el) return;
  el.style.display = 'none';
  setAddedWidgets(getAddedWidgets().filter(id => id !== widgetId));
}

// Restore whichever widgets were added last time.
document.addEventListener('DOMContentLoaded', () => {
  getAddedWidgets().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
});

function getContextMenuItems() {
  const added = getAddedWidgets();
  const widgetItems = WIDGET_IDS.map(id => {
    const isAdded = added.includes(id);
    return {
      label: (isAdded ? 'Remove ' : 'Add ') + WIDGET_LABELS[id] + ' Widget',
      action: () => (isAdded ? hideWidget(id) : showWidget(id))
    };
  });

  return [
    { label: 'New Note', action: () => openWindow('noteswindowjs') },
    { label: 'Change Background', action: () => openWindow('windowbgjs') },
    { separator: true },
    ...widgetItems,
    { separator: true },
    { label: 'Refresh Desktop', action: () => location.reload() },
  ];
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  contextMenu.innerHTML = '';
  getContextMenuItems().forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.className = 'context-menu-separator';
      contextMenu.appendChild(sep);
      return;
    }
    const row = document.createElement('div');
    row.className = 'context-menu-item';
    row.textContent = item.label;
    row.addEventListener('click', () => {
      item.action();
      contextMenu.style.display = 'none';
    });
    contextMenu.appendChild(row);
  });

  contextMenu.style.display = 'block';

  const menuWidth = contextMenu.offsetWidth;
  const menuHeight = contextMenu.offsetHeight;
  const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
  const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
});

document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') contextMenu.style.display = 'none';
});


// ---- Meme widget ----
// The meme image is set entirely from Python (PyScript's get_meme sets
// img.src directly), so rather than duplicate that fetch/filter logic in
// JS, just mirror whatever src the real #meme-img ends up with.
document.addEventListener('DOMContentLoaded', () => {
  const memeImg = document.getElementById('meme-img');
  const widgetImg = document.getElementById('memeWidgetImg');
  const refreshBtn = document.getElementById('memeWidgetRefresh');
  const fetchBtn = document.getElementById('fetchMemeBtn');
  if (!memeImg || !widgetImg || !refreshBtn || !fetchBtn) return;

  function syncWidgetImage() {
    if (memeImg.src) widgetImg.src = memeImg.src;
  }

  new MutationObserver(syncWidgetImage).observe(memeImg, { attributes: true, attributeFilter: ['src'] });
  syncWidgetImage(); // in case a meme was already fetched before this ran

  refreshBtn.addEventListener('click', () => fetchBtn.click());
});

function setIframesInteractive(interactive) {
  document.querySelectorAll('iframe').forEach(f => {
    f.style.pointerEvents = interactive ? '' : 'none';
  });
}

