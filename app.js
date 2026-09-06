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
const muteIcon = document.getElementById('muteIcon');

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
  muteIcon.src = video.muted ? 'sound-off.png' : 'sound-on.png';
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

function captureWindowState(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;

  const state = {
    scroll: [win, ...win.querySelectorAll('*')]
      .filter(el => el.scrollTop || el.scrollLeft)
      .map(el => [el, el.scrollTop, el.scrollLeft]),
    focusId: win.contains(document.activeElement) ? document.activeElement.id : null
  };

  const handler = windowStateHandlers[windowId];
  if (handler && handler.save) state.custom = handler.save(win);

  savedWindowState.set(windowId, state);
}

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

const flexWindows = new Set(['terminal-window', 'windowgamejs', 'windowbiggycraftjs', 'windowjs', 'windowbgjs', 'windowdudejs', 'windowmemejs', 'windowweatherjs', 'windowmusicjs', 'windowcalcjs', 'windowpaintjs', 'windowbrowserjs']);

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
    targetWindow.style.top = '';
    targetWindow.style.left = '';
    targetWindow.style.width = '';
    targetWindow.style.height = '';
    targetWindow.classList.remove('maximized');
    delete targetWindow.dataset.prevBox;
  }
  minimizedWindows.delete(windowId);
  savedWindowState.delete(windowId);
  if (windowId === 'windowbrowserjs' && typeof resetBrowser === 'function') resetBrowser();
  if (windowId === 'windowbiggycraftjs' && typeof resetBiggyCraft === 'function') resetBiggyCraft();
  if (windowId === 'windowjs' && !video.paused) {
    video.pause();
    playPauseIcon.src = 'play-buttton.png';
  }
  syncDock();
}

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

const CURRENT_BG_KEY = "biggyos-background";

function setBackground(imagePath) {
  document.body.style.backgroundImage = `url('${imagePath}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
  localStorage.setItem(CURRENT_BG_KEY, imagePath);
}

function removeBackground() {
  document.body.style.backgroundImage = "";
  localStorage.removeItem(CURRENT_BG_KEY);
}


dragElement(document.getElementById("windowgamejs"), document.querySelector("#windowgamejs .title-bar"));
dragElement(document.getElementById("windowjs"), document.querySelector("#windowjs .title-bar"));
dragElement(document.getElementById("windowbgjs"), document.querySelector("#windowbgjs .title-bar"));
dragElement(document.getElementById("windowdudejs"), document.querySelector("#windowdudejs .title-bar"));
dragElement(document.getElementById("windowmemejs"), document.querySelector("#windowmemejs .title-bar"));
dragElement(document.getElementById("windowtodojs"), document.querySelector("#windowtodojs .title-bar"));
dragElement(document.getElementById("terminal-window"), document.querySelector("#terminal-window .term-title-bar"))
dragElement(document.getElementById("noteswindowjs"), document.querySelector("#noteswindowjs .title-bar"))
dragElement(document.getElementById("storewindowjs"), document.querySelector("#storewindowjs .title-bar"))
dragElement(document.getElementById("windowweatherjs"), document.querySelector("#windowweatherjs .title-bar"))
dragElement(document.getElementById("windowmusicjs"), document.querySelector("#windowmusicjs .title-bar"))
dragElement(document.getElementById("windowcalcjs"), document.querySelector("#windowcalcjs .title-bar"))
dragElement(document.getElementById("windowpaintjs"), document.querySelector("#windowpaintjs .title-bar"))
dragElement(document.getElementById("windowbrowserjs"), document.querySelector("#windowbrowserjs .title-bar"))
dragElement(document.getElementById("windowbiggycraftjs"), document.querySelector("#windowbiggycraftjs .title-bar"))

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
makeResizable(document.getElementById("windowcalcjs"));
makeResizable(document.getElementById("windowpaintjs"));
makeResizable(document.getElementById("windowbrowserjs"));
makeResizable(document.getElementById("windowbiggycraftjs"));


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
      e.stopPropagation();
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

let highestZ = 20;
function bringToFront(windowId) {
  if(!windowId) return;
  highestZ++;
  windowId.style.zIndex = highestZ;

}


const WEATHER_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Ccircle cx='9' cy='8' r='4' fill='%23FFD54A'/%3E" +
  "%3Cpath d='M7 19a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0116.5 19H7z' fill='%23FFFFFF'/%3E" +
  "%3C/svg%3E";

const MUSIC_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Cpath d='M9 17V5l11-2v12' stroke='%23FFFFFF' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E" +
  "%3Ccircle cx='6.5' cy='17.5' r='2.5' fill='%23FFFFFF'/%3E" +
  "%3Ccircle cx='17.5' cy='15.5' r='2.5' fill='%23FFFFFF'/%3E" +
  "%3C/svg%3E";

const CALC_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Crect x='4' y='2' width='16' height='20' rx='2' fill='none' stroke='%23FFFFFF' stroke-width='1.6'/%3E" +
  "%3Crect x='7' y='5' width='10' height='4' fill='%23FFFFFF'/%3E" +
  "%3Cg fill='%23FFFFFF'%3E%3Ccircle cx='8.5' cy='13' r='1.2'/%3E%3Ccircle cx='12' cy='13' r='1.2'/%3E" +
  "%3Ccircle cx='15.5' cy='13' r='1.2'/%3E%3Ccircle cx='8.5' cy='17' r='1.2'/%3E" +
  "%3Ccircle cx='12' cy='17' r='1.2'/%3E%3Ccircle cx='15.5' cy='17' r='1.2'/%3E%3C/g%3E" +
  "%3C/svg%3E";

const PAINT_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Cpath d='M4 17.5L15 6.5l2.5 2.5L6.5 20H4z' fill='%23FFFFFF'/%3E" +
  "%3Cpath d='M16.5 5l2.5 2.5 1.2-1.2a1.8 1.8 0 00-2.5-2.5z' fill='%23FFD54A'/%3E" +
  "%3C/svg%3E";

const BROWSER_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23FFFFFF' stroke-width='1.7'/%3E" +
  "%3Cellipse cx='12' cy='12' rx='4' ry='9' fill='none' stroke='%23FFFFFF' stroke-width='1.4'/%3E" +
  "%3Cpath d='M3.5 9h17M3.5 15h17' stroke='%23FFFFFF' stroke-width='1.4'/%3E" +
  "%3C/svg%3E";

const apps = [
  { id: "play",   name:"VideoMeme",    icon: "play.png",       color: "#e0c52e", windowId: "windowjs" },
  { id: "background", name:"Backgrounds", icon: "background.png", color: "#f04c4c", windowId: "windowbgjs" },
  { id: "dude",   name:"About Me",    icon: "Dude.png",       color: "#10902e", windowId: "windowdudejs" },
  { id: "game",   name:"Monkey Mart",    icon: "xbox.png",       color: "black",   windowId: "windowgamejs" },
  { id: "meme",   name:"Memes",    icon: "meme.png",       color: "#062cc1", windowId: "windowmemejs" },
  { id: "todo",   name:"Biggy Todo",    icon: "todo.png",       color: "#e05832", windowId: "windowtodojs" },
  { id: "terminal", name:"Terminal", icon: "terminal.png", color:"black", windowId:"terminal-window"},
  {id: "notes", name:"notes", icon: "note.png", color:"#e0c759", windowId:"noteswindowjs"},
  { id: "weather", name: "Weather", icon: WEATHER_ICON, color: "#3b7dd8", windowId: "windowweatherjs", installable: true },
  {id: "apps", icon: "app.png", color:"#c4c3c3", windowId:"storewindowjs"},
  { id: "music", name: "Music", icon: "music.png", color: "#ff19d5", windowId: "windowmusicjs", installable: true },
  { id: "calc", name: "Calculator", icon: "calc.jpg", color: "#4a4a4a", windowId: "windowcalcjs", installable: true },
  { id: "paint", name: "Biggy Paint", icon: "pencil.jpg" , color: "#6c009b", windowId: "windowpaintjs", installable: true },
  { id: "browser", name: "Biggy Browser", icon: "browser.jpg" , color: "#25c7c7", windowId: "windowbrowserjs", installable: true },
  { id: "biggycraft", name: "BiggyCraft", icon: "minecraft.png" , color: "#65380c", windowId: "windowbiggycraftjs", installable: true }
];

const INSTALLED_APPS_KEY = "biggyos-installed-apps";
const WEATHER_COORDS_KEY = "biggyos-weather-coords";

function requestWeatherLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      localStorage.setItem(WEATHER_COORDS_KEY, JSON.stringify({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }));
    },
    () => {}
  );
}

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

function downloadThenInstall(app, btn) {
  if (app.id === 'weather') requestWeatherLocation();

  const duration = 1400 + Math.random() * 1600;
  const start = Date.now();

  btn.disabled = true;
  btn.classList.add('store-card-downloading');
  btn.innerHTML = '<span class="store-download-fill"></span><span class="store-download-label">0%</span>';
  const fill = btn.querySelector('.store-download-fill');
  const label = btn.querySelector('.store-download-label');

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
  { id: "4k1", type:"image",label:"spiderman", file: "bg3.jpg"},
  { id:"4k2", type:"image", label:"mountains", file:"bg4.jpg"}
];

const CUSTOM_BGS_KEY = "biggyos-custom-backgrounds";
const MAX_CUSTOM_BG_BYTES = 4 * 1024 * 1024;

function getCustomBackgrounds() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_BGS_KEY)) || [];
  } catch {
    return [];
  }
}

function setCustomBackgrounds(list) {
  try {
    localStorage.setItem(CUSTOM_BGS_KEY, JSON.stringify(list));
  } catch {
    alert("Out of storage - remove a background or two first.");
  }
}

function addCustomBackground(file) {
  if (!file.type.startsWith("image/")) {
    alert("That's not an image. GIF, PNG, JPG or WEBP only.");
    return;
  }
  if (file.size > MAX_CUSTOM_BG_BYTES) {
    alert("That file's too chunky (4MB max).");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const list = getCustomBackgrounds();
    list.push({ id: "custom-" + Date.now(), label: file.name, file: reader.result });
    setCustomBackgrounds(list);
    renderBackgrounds();
  };
  reader.readAsDataURL(file);
}

function removeCustomBackground(id) {
  const removed = getCustomBackgrounds().find(bg => bg.id === id);
  setCustomBackgrounds(getCustomBackgrounds().filter(bg => bg.id !== id));
  if (removed && localStorage.getItem(CURRENT_BG_KEY) === removed.file) removeBackground();
  renderBackgrounds();
}

function makeBgThumb(bg) {
  const wrapper = document.createElement("div");
  wrapper.className = "barnyardimg bg-thumb";

  const button = document.createElement("button");
  button.className = "bg-thumb-btn";
  button.title = bg.label;

  const img = document.createElement("img");
  img.className = "fit";
  img.src = bg.file;
  img.alt = bg.label;
  button.appendChild(img);
  button.addEventListener("click", () => setBackground(bg.file));

  wrapper.appendChild(button);
  return wrapper;
}

function renderBackgrounds() {
  const container = document.querySelector("#windowbgjs .windowbgcontent");
  if (!container) return;

  container.querySelectorAll(".bg-thumb").forEach(el => el.remove());

  backgrounds.forEach(bg => {
    if (bg.type === "none") {
      const wrapper = document.createElement("div");
      wrapper.className = "barnyardimg bg-thumb";

      const button = document.createElement("button");
      button.className = "bg-thumb-btn bg-remove-btn";
      button.title = bg.label;
      button.textContent = "🚫";
      button.addEventListener("click", removeBackground);

      wrapper.appendChild(button);
      container.appendChild(wrapper);
      return;
    }

    container.appendChild(makeBgThumb(bg));
  });

  getCustomBackgrounds().forEach(bg => {
    const wrapper = makeBgThumb(bg);
    wrapper.classList.add("custom");

    const removeBtn = document.createElement("button");
    removeBtn.className = "bg-custom-remove";
    removeBtn.textContent = "✕";
    removeBtn.title = "Delete this background";
    removeBtn.addEventListener("click", () => removeCustomBackground(bg.id));
    wrapper.appendChild(removeBtn);

    container.appendChild(wrapper);
  });

  const addWrapper = document.createElement("div");
  addWrapper.className = "barnyardimg bg-thumb";

  const addBtn = document.createElement("button");
  addBtn.className = "bg-thumb-btn bg-add-btn";
  addBtn.title = "Add your own image or GIF";
  addBtn.innerHTML = "+<small>image / gif</small>";

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*,image/gif";
  picker.style.display = "none";
  picker.addEventListener("change", () => {
    if (picker.files[0]) addCustomBackground(picker.files[0]);
    picker.value = "";
  });

  addBtn.addEventListener("click", () => picker.click());
  addWrapper.appendChild(addBtn);
  addWrapper.appendChild(picker);
  container.appendChild(addWrapper);
}

renderBackgrounds();

const savedBackground = localStorage.getItem(CURRENT_BG_KEY);
if (savedBackground) setBackground(savedBackground);


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

  const bootDuration = 1800 + Math.random() * 800;

  let jokeIndex = Math.floor(Math.random() * loadingJokes.length);
  function cycleJoke() {
    loadingJoker.textContent = loadingJokes[jokeIndex % loadingJokes.length];
    jokeIndex++;
  }
  cycleJoke();
  const jokeInterval = setInterval(cycleJoke, 650 + Math.random() * 150);

  setTimeout(() => {
    clearInterval(jokeInterval);
    loadingJoker.textContent = "Ready.";
    enterBtn.classList.add("visible");
  }, bootDuration);

  const CLANK_END = 1.0;
  const FALLBACK_DURATION = 5;

  function easeCreakThenPush(t) {
    return t < 0.75
      ? (t / 0.75) * 0.22
      : 0.22 + Math.pow((t - 0.75) / 0.25, 2) * 0.78;
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
    setTimeout(() => {
      bootScreen.remove();
      document.dispatchEvent(new CustomEvent("biggyos:ready"));
    }, 600);
  }

  skipBtn.addEventListener("click", removeBoot);

  enterBtn.addEventListener("click", () => {
    enterBtn.classList.remove("visible");
    bootContent.classList.add("fade-out");

    doorAudio.currentTime = 0;
    doorAudio.play().catch(() => {});

    bootScreen.classList.add("shaking");
    doorSeam.classList.add("lit");
    skipBtn.classList.add("visible");

    rafId = requestAnimationFrame(driveDoors);

    doorAudio.addEventListener("ended", removeBoot, { once: true });
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
  todo: 'windowtodojs',
  calc: 'windowcalcjs',
  paint: 'windowpaintjs',
  browser: 'windowbrowserjs'
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
  printToTerminal('  -open: video, backgrounds, creator, game, meme, todo, calc, paint, browser');
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

  const savedCity = localStorage.getItem(WEATHER_CITY_KEY);
  const savedCoords = JSON.parse(localStorage.getItem(WEATHER_COORDS_KEY) || 'null');
  if (savedCity) {
    cityInput.value = savedCity;
    loadWeatherForCity(savedCity);
  } else if (savedCoords) {
    loadWeatherForCoords(savedCoords.lat, savedCoords.lon, 'Current Location');
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
  el.style.display = '';
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
  syncWidgetImage();

  refreshBtn.addEventListener('click', () => fetchBtn.click());
});

function setIframesInteractive(interactive) {
  document.querySelectorAll('iframe').forEach(f => {
    f.style.pointerEvents = interactive ? '' : 'none';
  });
}

(function () {
  const TUTORIAL_SEEN_KEY = 'biggyos-tutorial-seen';

  const steps = [
    {
      target: null,
      title: 'Right-Click Menu',
      text: 'Right-click anywhere on the desktop to pull up a quick menu of shortcuts.',
    },
    {
      target: () => document.getElementById('dock-terminal'),
      title: 'Terminal',
      text: 'This opens the Terminal — poke around and try a few commands.',
      placement: 'top',
    },
    {
      target: () => document.getElementById('dock-apps'),
      title: 'App Store',
      text: 'Grab more apps here, like Weather and Music.',
      placement: 'top',
    },
  ];

  let scrim, spotlight, popup, currentStep = -1;

  function build() {
    scrim = document.createElement('div');
    scrim.id = 'tutorialScrim';

    spotlight = document.createElement('div');
    spotlight.id = 'tutorialSpotlight';

    popup = document.createElement('div');
    popup.id = 'tutorialPopup';
    popup.innerHTML = `
      <div class="tutorial-popup-title"></div>
      <div class="tutorial-popup-text"></div>
      <div class="tutorial-popup-footer">
        <div class="tutorial-popup-dots"></div>
        <div class="tutorial-popup-actions">
          <button class="tutorial-btn tutorial-skip">Skip</button>
          <button class="tutorial-btn tutorial-next">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(scrim);
    document.body.appendChild(spotlight);
    document.body.appendChild(popup);

    scrim.addEventListener('click', (e) => e.stopPropagation());
    popup.querySelector('.tutorial-skip').addEventListener('click', endTutorial);
    popup.querySelector('.tutorial-next').addEventListener('click', () => {
      if (currentStep >= steps.length - 1) { endTutorial(); return; }
      showStep(currentStep + 1);
    });

    window.addEventListener('resize', () => { if (currentStep >= 0) render(); });
  }

  function render() {
    const step = steps[currentStep];
    const targetEl = step.target ? step.target() : null;

    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      const pad = 10;
      spotlight.style.left = (r.left - pad) + 'px';
      spotlight.style.top = (r.top - pad) + 'px';
      spotlight.style.width = (r.width + pad * 2) + 'px';
      spotlight.style.height = (r.height + pad * 2) + 'px';
      spotlight.style.borderRadius = '16px';
    } else {
      spotlight.style.left = '50%';
      spotlight.style.top = '50%';
      spotlight.style.width = '0px';
      spotlight.style.height = '0px';
      spotlight.style.borderRadius = '50%';
    }

    popup.querySelector('.tutorial-popup-title').textContent = step.title;
    popup.querySelector('.tutorial-popup-text').textContent = step.text;

    const dots = popup.querySelector('.tutorial-popup-dots');
    dots.innerHTML = '';
    steps.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'tutorial-dot' + (i === currentStep ? ' active' : '');
      dots.appendChild(dot);
    });

    popup.querySelector('.tutorial-next').textContent =
      currentStep === steps.length - 1 ? 'Done' : 'Next';

    positionPopup(targetEl, step.placement);
  }

  function positionPopup(targetEl, placement) {
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const margin = 18;
    let left, top;

    if (!targetEl) {
      left = (window.innerWidth - pw) / 2;
      top = (window.innerHeight - ph) / 2;
    } else {
      const r = targetEl.getBoundingClientRect();
      left = r.left + r.width / 2 - pw / 2;
      if (placement === 'top') {
        top = r.top - ph - margin;
        if (top < 8) top = r.bottom + margin;
      } else {
        top = r.bottom + margin;
      }
    }

    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - ph - 12));

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  function showStep(i) {
    currentStep = i;
    render();
  }

  function endTutorial() {
    currentStep = -1;
    if (scrim) scrim.remove();
    if (spotlight) spotlight.remove();
    if (popup) popup.remove();
    scrim = spotlight = popup = null;
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  }

  function startTutorial() {
    if (!scrim) build();
    showStep(0);
  }

  document.addEventListener('biggyos:ready', () => {
    if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) startTutorial();
  });

  window.startTutorial = startTutorial;
})();

document.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('calcDisplay');
  const keys = document.getElementById('calcKeys');
  if (!display || !keys) return;

  const layout = [
    ['C', 'op'], ['←', 'op'], ['%', 'op'], ['÷', 'op'],
    ['7', ''], ['8', ''], ['9', ''], ['×', 'op'],
    ['4', ''], ['5', ''], ['6', ''], ['−', 'op'],
    ['1', ''], ['2', ''], ['3', ''], ['+', 'op'],
    ['0', 'wide'], ['.', ''], ['=', 'equals']
  ];

  let current = '0';
  let previous = null;
  let pendingOp = null;
  let justEvaluated = false;

  function show() {
    display.textContent = current;
  }

  function doMath(a, b, op) {
    if (op === '+') return a + b;
    if (op === '−') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? NaN : a / b;
    return b;
  }

  function inputDigit(d) {
    if (justEvaluated) { current = '0'; justEvaluated = false; }
    if (d === '.' && current.includes('.')) return;
    current = (current === '0' && d !== '.') ? d : current + d;
  }

  function chooseOp(op) {
    if (pendingOp !== null && !justEvaluated) evaluate();
    previous = parseFloat(current);
    pendingOp = op;
    justEvaluated = true;
  }

  function evaluate() {
    if (pendingOp === null || previous === null) return;
    const result = doMath(previous, parseFloat(current), pendingOp);
    current = isNaN(result) ? 'Nope' : String(parseFloat(result.toPrecision(12)));
    previous = null;
    pendingOp = null;
    justEvaluated = true;
  }

  function press(label) {
    if (current === 'Nope' && label !== 'C') current = '0';

    if (/^[0-9.]$/.test(label)) inputDigit(label);
    else if (label === 'C') { current = '0'; previous = null; pendingOp = null; }
    else if (label === '←') current = current.length > 1 ? current.slice(0, -1) : '0';
    else if (label === '%') current = String(parseFloat(current) / 100);
    else if (label === '=') evaluate();
    else chooseOp(label);

    show();
  }

  layout.forEach(([label, className]) => {
    const btn = document.createElement('button');
    btn.className = 'calc-key ' + className;
    btn.textContent = label;
    btn.addEventListener('click', () => press(label));
    keys.appendChild(btn);
  });

  document.addEventListener('keydown', (e) => {
    const win = document.getElementById('windowcalcjs');
    if (!win || win.style.display === 'none') return;

    const map = { '/': '÷', '*': '×', '-': '−', 'Enter': '=', 'Backspace': '←', 'Escape': 'C' };
    const key = map[e.key] || e.key;
    if (/^[0-9.]$/.test(key) || ['+', '−', '×', '÷', '=', '←', 'C', '%'].includes(key)) {
      e.preventDefault();
      press(key);
    }
  });

  show();
});


document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('paintCanvas');
  const swatchRow = document.getElementById('paintSwatches');
  const colorInput = document.getElementById('paintColor');
  const sizeInput = document.getElementById('paintSize');
  const brushPreview = document.getElementById('paintBrushPreview');
  const eraserBtn = document.getElementById('paintEraserBtn');
  const clearBtn = document.getElementById('paintClearBtn');
  const saveBtn = document.getElementById('paintSaveBtn');
  if (!canvas) return;

  const PAPER = '#f6ecd4';

  const palette = [
    ['#1b1917', 'Ink'],
    ['#d8b02d', 'Cheddar'],
    ['#f2dc79', 'Rind'],
    ['#e05832', 'Hot Sauce'],
    ['#2ea043', 'Mold'],
    ['#3b7dd8', 'Blue Cheese'],
    ['#8a8578', 'Rat Fur'],
    ['#f04c4c', 'Ketchup']
  ];

  const ctx = canvas.getContext('2d');
  let drawing = false;
  let erasing = false;

  function updateBrushDot() {
    brushPreview.style.setProperty('--brush-size', sizeInput.value + 'px');
    brushPreview.style.setProperty('--brush-color', erasing ? PAPER : colorInput.value);
  }

  function pickColor(hex) {
    colorInput.value = hex;
    erasing = false;
    eraserBtn.classList.remove('active');
    swatchRow.querySelectorAll('.paint-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === hex);
    });
    updateBrushDot();
  }

  palette.forEach(([hex, name]) => {
    const btn = document.createElement('button');
    btn.className = 'paint-swatch';
    btn.style.backgroundColor = hex;
    btn.dataset.color = hex;
    btn.title = name;
    btn.addEventListener('click', () => pickColor(hex));
    swatchRow.appendChild(btn);
  });

  function fitCanvas() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;

    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    if (canvas.width && canvas.height) snapshot.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot, 0, 0);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function pointAt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e) {
    drawing = true;
    const p = pointAt(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    draw(e);
  }

  function draw(e) {
    if (!drawing) return;
    const p = pointAt(e);
    ctx.strokeStyle = erasing ? PAPER : colorInput.value;
    ctx.lineWidth = sizeInput.value;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', draw);
  document.addEventListener('pointerup', stop);

  colorInput.addEventListener('input', () => pickColor(colorInput.value));
  sizeInput.addEventListener('input', updateBrushDot);

  eraserBtn.addEventListener('click', () => {
    erasing = !erasing;
    eraserBtn.classList.toggle('active', erasing);
    updateBrushDot();
  });

  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'biggy-paint.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  new ResizeObserver(fitCanvas).observe(canvas);
  fitCanvas();
  pickColor(palette[1][0]);
});


document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('browserFrame');
  const address = document.getElementById('browserAddressBar');
  if (!frame || !address) return;

  const homeScreen = document.getElementById('browserHome');
  const blockedScreen = document.getElementById('browserBlocked');
  const settingsScreen = document.getElementById('browserSettings');
  const statusEl = document.getElementById('browserStatus');
  const backBtn = document.getElementById('browserBackBtn');
  const fwdBtn = document.getElementById('browserFwdBtn');
  const tilesEl = document.getElementById('browserTiles');
  const proxyInput = document.getElementById('browserProxyInput');
  const proxyState = document.getElementById('browserProxyState');
  const settingsBtn = document.getElementById('browserSettingsBtn');
  const blockedText = document.getElementById('browserBlockedText');

  const PROXY_KEY = 'biggyos-browser-proxy';
  const BOOKMARKS_KEY = 'biggyos-browser-bookmarks';
  const LOAD_TIMEOUT = 8000;
  const SEARCH_PREFIX = 'https://lite.duckduckgo.com/lite/?q=';

  const defaultTiles = [
    { icon: "xbox.png", label: 'Monkey Mart', url: 'https://monkeymartfree.com/play/monkey-mart/' },
    { label: 'Example', url: 'https://example.com' },
    { icon: 'browser.jpg', label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Cheese' },
    { icon: 'hackclub.png', label: 'Hack Club', url: 'https://hackclub.com' }
  ];

  const history = [];
  let historyIndex = -1;
  let loadTimer = null;

  function getProxy() {
    return (localStorage.getItem(PROXY_KEY) || '').replace(/\/+$/, '');
  }

  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function setBookmarks(list) {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    renderTiles();
  }

  function toUrl(input) {
    const text = input.trim();
    if (!text) return null;
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[^\s]+\.[^\s]{2,}(\/.*)?$/.test(text)) return 'https://' + text;
    return SEARCH_PREFIX + encodeURIComponent(text);
  }

  function frameUrl(url) {
    const proxy = getProxy();
    return proxy ? proxy + '/go?url=' + encodeURIComponent(url) : url;
  }

  function showScreen(name) {
    homeScreen.style.display = name === 'home' ? 'flex' : 'none';
    blockedScreen.style.display = name === 'blocked' ? 'flex' : 'none';
    settingsScreen.style.display = name === 'settings' ? 'flex' : 'none';
    frame.style.display = name === 'frame' ? 'block' : 'none';
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function updateArrows() {
    backBtn.disabled = historyIndex <= 0;
    fwdBtn.disabled = historyIndex >= history.length - 1;
  }

  function showBlocked(url) {
    blockedText.textContent = getProxy()
      ? `${url} never came back through the proxy. It might be down, or the site is too heavy for it.`
      : `${url} never loaded. Sites that refuse framing come up blank instead — a proxy server fixes that.`;
    showScreen('blocked');
    setStatus('Blocked');
  }

  function load(url, addToHistory = true) {
    if (addToHistory) {
      history.splice(historyIndex + 1);
      history.push(url);
      historyIndex = history.length - 1;
    }

    address.value = url;
    updateArrows();
    showScreen('frame');
    setStatus('Loading ' + url);

    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => showBlocked(url), LOAD_TIMEOUT);
    frame.src = frameUrl(url);
  }

  frame.addEventListener('load', () => {
    if (!frame.src || frame.src === 'about:blank') return;
    clearTimeout(loadTimer);
    setStatus(getProxy()
      ? 'Loaded through proxy'
      : 'Loaded — page blank? this site blocks framing, try ↗');
  });

  function goHome() {
    clearTimeout(loadTimer);
    frame.src = 'about:blank';
    address.value = '';
    showScreen('home');
    setStatus(getProxy() ? 'Proxy mode' : 'Direct mode — framed sites only');
  }

  function renderTiles() {
    tilesEl.innerHTML = '';

    const saved = getBookmarks();
    [...defaultTiles, ...saved].forEach((tile, i) => {
      const btn = document.createElement('button');
      btn.className = 'browser-tile';
      if (tile.icon) {
        const icon = document.createElement('img');
        icon.className = 'browser-tile-icon';
        icon.src = tile.icon;
        icon.alt = '';
        btn.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = tile.label;
      btn.appendChild(label);
      btn.addEventListener('click', () => load(tile.url));

      if (i >= defaultTiles.length) {
        const remove = document.createElement('button');
        remove.className = 'browser-tile-remove';
        remove.textContent = '✕';
        remove.title = 'Remove bookmark';
        remove.addEventListener('click', (e) => {
          e.stopPropagation();
          setBookmarks(getBookmarks().filter(b => b.url !== tile.url));
        });
        btn.appendChild(remove);
      }

      tilesEl.appendChild(btn);
    });
  }

  function currentUrl() {
    return history[historyIndex] || null;
  }

  address.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const text = address.value;
    const url = toUrl(text);
    if (!url) return;

    if (url.startsWith(SEARCH_PREFIX) && !getProxy()) {
      window.open(url, '_blank', 'noopener');
      setStatus('Searches need a proxy — opened in a real tab');
      return;
    }
    load(url);
  });

  backBtn.addEventListener('click', () => {
    if (historyIndex > 0) load(history[--historyIndex], false);
  });

  fwdBtn.addEventListener('click', () => {
    if (historyIndex < history.length - 1) load(history[++historyIndex], false);
  });

  document.getElementById('browserReloadBtn').addEventListener('click', () => {
    const url = currentUrl();
    if (url) load(url, false);
  });

  document.getElementById('browserHomeBtn').addEventListener('click', goHome);

  document.getElementById('browserBookmarkBtn').addEventListener('click', () => {
    const url = currentUrl();
    if (!url) return;
    if (getBookmarks().some(b => b.url === url)) return;

    let label;
    try {
      label = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      label = url;
    }
    setBookmarks([...getBookmarks(), { emoji: '⭐️', label, url }]);
    setStatus('Bookmarked ' + label);
  });

  function openExternally() {
    const url = currentUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }
  document.getElementById('browserExternalBtn').addEventListener('click', openExternally);
  document.getElementById('browserBlockedExternal').addEventListener('click', openExternally);

  function showProxyState() {
    const proxy = getProxy();
    proxyState.textContent = proxy
      ? 'Currently proxying through ' + proxy
      : 'No proxy set. Only sites that allow framing will load.';
    settingsBtn.classList.toggle('active', !!proxy);
  }

  settingsBtn.addEventListener('click', () => {
    proxyInput.value = getProxy();
    showProxyState();
    showScreen('settings');
    setStatus('Settings');
  });

  document.getElementById('browserProxySave').addEventListener('click', () => {
    const value = proxyInput.value.trim().replace(/\/+$/, '');
    if (value && !/^https?:\/\//i.test(value)) {
      alert('Proxy address needs to start with http:// or https://');
      return;
    }
    localStorage.setItem(PROXY_KEY, value);
    showProxyState();
    goHome();
  });

  document.getElementById('browserProxyClear').addEventListener('click', () => {
    localStorage.removeItem(PROXY_KEY);
    proxyInput.value = '';
    showProxyState();
    goHome();
  });

  registerWindowState('windowbrowserjs', {
    save() {
      return { url: currentUrl() };
    },
    restore() {}
  });

  window.resetBrowser = goHome;

  renderTiles();
  showProxyState();
  goHome();
});


const playBiggyCraftButton = document.getElementById('playBiggyCraft');
const biggycraftFrame = document.getElementById('biggycraftFrame');
const biggycraftLauncher = document.getElementById('biggycraftLauncher');

playBiggyCraftButton.addEventListener('click', () => {
  if (!biggycraftFrame.src) {
    biggycraftFrame.src = biggycraftFrame.dataset.src;
  }
  biggycraftLauncher.style.display = 'none';
  biggycraftFrame.style.display = 'block';

  bringToFront(document.getElementById('windowbiggycraftjs'));
});

function resetBiggyCraft() {
  biggycraftFrame.removeAttribute("src");
  biggycraftFrame.style.display = 'none';
  biggycraftLauncher.style.display = 'flex';
}
