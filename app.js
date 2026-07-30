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

function openWindow(windowId) {
  const target = document.getElementById(windowId);
  if (target) target.style.display = "block";
}

function closeWindow(windowId) {
  const targetWindow = document.getElementById(windowId);
  if (targetWindow) {
    targetWindow.style.display = 'none';
  }
  if (windowId === 'windowjs' && !video.paused) {
    video.pause();
    playPauseIcon.src = 'play-buttton.png';
  }
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

dragElement(document.getElementById("windowjs"), document.querySelector("#windowjs .title-bar"));
dragElement(document.getElementById("windowbgjs"), document.querySelector("#windowbgjs .title-bar"));
// dragElement(document.getElementById("clockjs"));
dragElement(document.getElementById("windowdudejs"), document.querySelector("#windowdudejs .title-bar"));



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
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = dragElement;
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

  function stopDragging() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


// ---- Modular app dock ----
// Add/remove apps by editing this array only — renderDock() builds the bar from it.
const apps = [
  { id: "play",       icon: "play.png",       color: "#e0c52e", action: () => openWindow("windowjs") },
  { id: "background", icon: "background.png", color: "#f04c4c", action: () => openWindow("windowbgjs") },
  { id:"dude", icon:"Dude.png", color:"#10902e", action: () => openWindow("windowdudejs") }
];

function renderDock() {
  const dock = document.getElementById("appDock");
  if (!dock) return;
  dock.innerHTML = "";

  apps.forEach(app => {
    const iconEl = document.createElement("div");
    iconEl.className = "dock-icon";
    iconEl.id = `dock-${app.id}`;
    iconEl.style.backgroundColor = app.color;
    iconEl.title = app.id;

    iconEl.innerHTML = `<img src="${app.icon}" alt="${app.id}">`;

    iconEl.addEventListener("click", () => {
      if (typeof app.action === "function") app.action();
    });

    dock.appendChild(iconEl);
  });
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
  "🐀Biggy don't miss🧀"
];

const randomJoke = ratJokes[Math.floor(Math.random() * ratJokes.length)];
document.getElementById("status-bar-text").textContent = randomJoke;




window.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  setTimeout(() => {
    bootScreen.classList.add("hidden");
    setTimeout(() => bootScreen.remove(), 600);
  }, 2200);
});


window.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  const loadingJoker = document.getElementById("loadingJoker");

  const loadingJokes = [
    "👽Hacking into your drive...👨‍💻",
    "💩Something smells in here. Wait, is that blue cheese?🧀",
    "🎧I hear something mice in you setup🐀",
    "Yes, were still here...",
    "Getting ready for the rap sesh",
    "Is this a star project?⭐️💫"
  ];

  const bootDuration = 1800 + Math.random() * 800; // ms

  let jokeIndex = Math.floor(Math.random() * loadingJokes.length); // random starting point too
  function cycleJoke() {
    loadingJoker.textContent = loadingJokes[jokeIndex % loadingJokes.length];
    jokeIndex++;
  }
  cycleJoke();
  const jokeInterval = setInterval(cycleJoke, 650 + Math.random() * 150);

  setTimeout(() => {
    clearInterval(jokeInterval);
    bootScreen.classList.add("hidden");
    setTimeout(() => bootScreen.remove(), 600);
  }, bootDuration);
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