/**
 * Fixes requested:
 * - Nose twitch no longer flies off (use rx/ry attr instead of transforms)
 * - Subtle ears + nose motion throughout entire story (idle loops)
 * - Hide run slower
 * - Legs animate while running off-screen
 */

const frame = document.getElementById("frame");
const light = document.getElementById("light");
const titleOverlay = document.getElementById("titleOverlay");

const captionArea = document.getElementById("captionArea");
const captionKicker = document.getElementById("captionKicker");
const caption = document.getElementById("caption");
const captionSmall = document.getElementById("captionSmall");

const hay = document.getElementById("hay");
const bowl = document.getElementById("bowl");
const box = document.getElementById("box");

const soundbar = document.getElementById("soundbar");
const soundRow = document.getElementById("soundRow");

const bunnySvg = document.getElementById("bunnySvg");
const nose = document.getElementById("nose");

// Legs (ids added in SVG)
const legBack = document.getElementById("legBack");
const legFrontNear = document.getElementById("legFrontNear");
const legFrontFar = document.getElementById("legFrontFar");

// Ears are groups
const earLeft = document.querySelector(".earPath--left");
const earRight = document.querySelector(".earPath--right");

// Callouts
const callouts = document.getElementById("callouts");
const cHunger = document.getElementById("cHunger");
const cEnergy = document.getElementById("cEnergy");
const cMood = document.getElementById("cMood");
const cSafety = document.getElementById("cSafety");
const variableCallouts = [cHunger, cEnergy, cMood, cSafety];
const conditionalButtons = Array.from(callouts.querySelectorAll("button[data-stimulus]"));

// spans for values
const hungerVal = document.getElementById("hungerVal");
const energyVal = document.getElementById("energyVal");
const moodVal = document.getElementById("moodVal");

// -------------------------
const SCENES = {
  0: { kicker: "Title", line: "The Bunny’s Journey", small: "Scroll to begin.", mode: "title" },
  1: { kicker: "Arrival", line: "I didn’t move at first. I waited to see what the world would do.", small: "Everything smelled different. I listened.", mode: "arrival" },
  2: { kicker: "First Contact", line: "I pushed something small. A piece of hay. It moved.", small: "Click the hay. Open DevTools → Console.", mode: "firstContact" },
  3: { kicker: "Naming Things", line: "Some feelings stay. Some change. I started to tell them apart.", small: "States appear as names. Names make them manageable.", mode: "naming" },
  4: { kicker: "The Switch", line: "Not everything makes me run. But some things do.", small: "Click a conditional. Watch my body decide.", mode: "switch" },
  5: { kicker: "Listening", line: "The world acts. I listen for what matters.", small: "Some sounds I catch. Some I miss.", mode: "listening" },
  6: { kicker: "The System", line: "Consistency isn’t boring. It’s why I can rest.", small: "One thing moves — and I notice immediately.", mode: "system" },
  7: { kicker: "The Memory", line: "I remember what happens next. Even before it happens.", small: "Memory persists… until the world updates.", mode: "memory" },
  8: { kicker: "The Mistake", line: "I thought I understood. I didn’t. I got stuck.", small: "Mistakes don’t mean I’m broken. I try again.", mode: "mistake" },
  9: { kicker: "Understanding", line: "When something new arrives, I watch. I test. I learn. Then I rest.", small: "I don’t control everything. I understand enough.", mode: "closing" },
};

// -------------------------
// Variables
let hunger = 0;
let energy = 50;
let mood = "curious";

const STATE_PRESETS = [
  { hunger: 18, energy: 72, mood: "curious" },
  { hunger: 78, energy: 55, mood: "bored" },
  { hunger: 32, energy: 62, mood: "calm" },
  { hunger: 44, energy: 48, mood: "curious" },
];

function renderState() {
  hungerVal.textContent = hunger;
  energyVal.textContent = energy;
  moodVal.textContent = mood;
}

// -------------------------
const KEY = "bunnyPOV_memory_v1";
function getMem() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function setMem(patch) { const next = { ...getMem(), ...patch }; localStorage.setItem(KEY, JSON.stringify(next)); return next; }

// -------------------------
function setLightProgress(t) {
  const x = Math.round((t - 0.5) * 180);
  light.style.setProperty("--light-x", `${x}px`);
}

// -------------------------
function show(el, on) {
  el.style.opacity = on ? "1" : "0";
  el.style.transform = on ? "translateY(0px)" : "translateY(8px)";
}
function setObjVisible(el, on) { el.style.opacity = on ? "1" : "0"; }

function showHay(on) {
  hay.style.opacity = on ? "1" : "0";
  hay.style.pointerEvents = on ? "auto" : "none";
  if (!on) hay.style.transform = "translateX(0px)";
}

// -------------------------
// Captions
function animateCaptionChange({ kicker, line, small }, style = "fadeUp") {
  gsap.killTweensOf([captionKicker, caption, captionSmall]);

  const tl = gsap.timeline();
  tl.to([captionKicker, caption, captionSmall], {
    opacity: 0,
    y: -6,
    duration: 0.18,
    ease: "power2.out",
    stagger: 0.03,
  });

  tl.add(() => {
    captionKicker.textContent = kicker ?? "—";
    caption.textContent = line ?? "";
    captionSmall.textContent = small ?? "";
  });

  const targets = [captionKicker, caption, captionSmall];

  if (style === "swipe") {
    tl.fromTo(targets, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.38, ease: "power2.out", stagger: 0.05 });
  } else if (style === "softPop") {
    tl.fromTo(targets, { opacity: 0, y: 10, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power2.out", stagger: 0.05 });
  } else if (style === "jitter") {
    tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.04 })
      .to(caption, { x: -3, duration: 0.06, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<");
  } else {
    tl.fromTo(targets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.40, ease: "power2.out", stagger: 0.05 });
  }

  return tl;
}

// -------------------------
// Callouts
function hideAllCallouts() {
  gsap.to(callouts.querySelectorAll(".callout"), {
    opacity: 0,
    duration: 0.18,
    ease: "power1.out",
    overwrite: true,
  });
}

function showCallouts(targets) {
  hideAllCallouts();
  gsap.fromTo(
    targets,
    { opacity: 0, y: () => gsap.utils.random(10, 24), x: () => gsap.utils.random(-18, 18), rotate: () => gsap.utils.random(-2, 2) },
    { opacity: 1, y: 0, x: 0, rotate: 0, duration: 0.55, ease: "power2.out", stagger: 0.08, overwrite: true }
  );
}

function floatCallouts(targets) {
  targets.forEach((t, i) => {
    gsap.to(t, { y: "+=6", duration: 2.2 + i * 0.25, yoyo: true, repeat: -1, ease: "sine.inOut" });
  });
}
floatCallouts(variableCallouts);

// -------------------------
// Bunny baseline
gsap.set(bunnySvg, { transformOrigin: "50% 80%" });

// Make SVG element transforms behave consistently (esp. for groups)
[earLeft, earRight, legBack, legFrontNear, legFrontFar].forEach((el) => {
  if (!el) return;
  // helps SVG transforms use the element’s box
  el.style.transformBox = "fill-box";
  el.style.transformOrigin = "center";
});

// breathing
gsap.to(bunnySvg, { y: 2, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });

/**
 * Always-on subtle ear sway (whole story)
 * (Tiny movement so it reads as “alive,” not “wiggly”)
 */
gsap.to([earLeft, earRight], {
  rotate: 0.45,
  duration: 2.6,
  yoyo: true,
  repeat: -1,
  ease: "sine.inOut",
});

/**
 * Always-on subtle nose twitch (whole story)
 * Uses attr changes so it NEVER drifts.
 */
if (nose) {
  gsap.to(nose, {
    attr: { rx: 8.6, ry: 9.4 },
    duration: 0.10,
    yoyo: true,
    repeat: -1,
    repeatDelay: 2.2,
    ease: "sine.inOut",
  });
}

// Arrival: fade-in + slightly “more noticeable” ear/nose moment
function playArrival() {
  gsap.killTweensOf([bunnySvg, earLeft, earRight]);

  gsap.fromTo(
    bunnySvg,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.95, ease: "power2.out" }
  );

  gsap.timeline()
    .to(earRight, { rotate: -4, duration: 0.16, ease: "power2.out" }, 0.28)
    .to(earRight, { rotate: 0, duration: 0.20, ease: "sine.out" })
    .to(earLeft, { rotate: 3, duration: 0.14, ease: "power2.out" }, 0.48)
    .to(earLeft, { rotate: 0, duration: 0.20, ease: "sine.out" });

  // a tiny extra nose “sniff” on arrival via attr (not transform)
  if (nose) {
    gsap.timeline()
      .to(nose, { attr: { rx: 9.0, ry: 9.2 }, duration: 0.08, ease: "power2.out" }, 0.55)
      .to(nose, { attr: { rx: 8.0, ry: 10.0 }, duration: 0.12, ease: "sine.out" });
  }
}

// Reactions
function reactEarPop() {
  gsap.killTweensOf([earRight, bunnySvg]);
  gsap.timeline()
    .to(bunnySvg, { y: -6, duration: 0.25, ease: "power2.out" }, 0)
    .to(earRight, { rotate: -9, y: -4, duration: 0.28, ease: "power2.out" }, 0)
    .to(earRight, { rotate: -3, y: -2, duration: 0.26, ease: "power2.out" })
    .to(bunnySvg, { y: 0, duration: 0.35, ease: "sine.out" }, "<");
}

/**
 * Cute leg-run cycle while escaping
 */
let runLegTween = null;
function startLegRun() {
  stopLegRun();
  const legs = [legFrontNear, legFrontFar, legBack].filter(Boolean);

  // alternate little rotations (subtle, cartoony)
  runLegTween = gsap.timeline({ repeat: -1 });
  runLegTween
    .to(legFrontNear, { rotate: 10, duration: 0.10, ease: "sine.inOut" }, 0)
    .to(legFrontFar, { rotate: -8, duration: 0.10, ease: "sine.inOut" }, 0)
    .to(legBack, { rotate: 6, duration: 0.10, ease: "sine.inOut" }, 0)
    .to(legFrontNear, { rotate: -8, duration: 0.10, ease: "sine.inOut" })
    .to(legFrontFar, { rotate: 10, duration: 0.10, ease: "sine.inOut" }, "<")
    .to(legBack, { rotate: -6, duration: 0.10, ease: "sine.inOut" }, "<");
}

function stopLegRun() {
  if (runLegTween) {
    runLegTween.kill();
    runLegTween = null;
  }
  // reset legs
  [legFrontNear, legFrontFar, legBack].forEach((l) => l && gsap.set(l, { rotate: 0 }));
}

/**
 * Hide run: slower + smoother + legs move
 */
function reactRunAway() {
  gsap.killTweensOf([bunnySvg, earLeft, earRight]);
  startLegRun();

  const tl = gsap.timeline({
    onComplete: () => stopLegRun(),
  });

  tl.to([earLeft, earRight], { rotate: 6, duration: 0.16, ease: "power2.out" }, 0)
    // off-screen left (slower than before)
    .to(bunnySvg, { x: -650, duration: 0.62, ease: "power2.in" }, 0)
    // teleport to right edge
    .set(bunnySvg, { x: 650 }, 0.64)
    // return from right (slower + cushy ease)
    .to(bunnySvg, { x: 0, duration: 0.78, ease: "power2.out" }, 0.66)
    .to([earLeft, earRight], { rotate: 0, duration: 0.35, ease: "sine.out" }, 0.90);
}

function reactNeutral() {
  gsap.to(bunnySvg, { y: -5, duration: 0.22, yoyo: true, repeat: 1, ease: "sine.inOut" });
}

// -------------------------
// First contact: click hay
let nudges = 0;
hay.addEventListener("click", () => {
  nudges++;
  const dx = Math.min(180, nudges * 70);
  hay.style.transform = `translateX(${dx}px)`;
  console.log("[First Contact] hay moved:", dx);
  setMem({ nudges });

  captionSmall.textContent =
    nudges === 1 ? "Again. It responds. That wasn’t an accident." : "It happens again — predictable.";
});

// -------------------------
// Conditionals
let activeStep = 0;

conditionalButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const stim = btn.dataset.stimulus;

    captionSmall.textContent = "I freeze.";
    gsap.to(bunnySvg, { y: -4, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });

    setTimeout(() => {
      const result = decide(stim);
      applyDecision(result);
    }, 220);
  });
});

function decide(stim) {
  if (stim === "softVoice") return { type: "safe", extra: "A soft voice? Safe." };
  if (stim === "footsteps") return { type: "neutral", extra: "Footsteps. I listen, but I stay." };
  if (stim === "doorClose") return { type: "neutral", extra: "A quiet door. Not danger." };
  if (stim === "loudSharp") return { type: "danger", extra: "A loud sound. I run." };
  if (stim === "fastShadow") return { type: "danger", extra: "Too fast. I hide." };
  return { type: "neutral", extra: "I stay." };
}

function applyDecision({ type, extra }) {
  captionSmall.textContent = extra;

  if (type === "safe") reactEarPop();
  else if (type === "danger") {
    if (activeStep === 4) reactRunAway();
    else reactNeutral();
  } else reactNeutral();
}

// -------------------------
// Listening
let listeningTimer = null;

function startListening() {
  stopListening();
  soundRow.innerHTML = "";
  listeningTimer = setInterval(() => {
    const types = ["door", "steps", "bag", "silence"];
    const t = types[Math.floor(Math.random() * types.length)];
    const caught = t !== "silence" && Math.random() > 0.35;

    const dot = document.createElement("div");
    dot.className = "pulse " + (caught ? "pulse--caught" : "pulse--missed");
    dot.title = caught ? `caught: ${t}` : `missed: ${t}`;
    soundRow.appendChild(dot);
    if (soundRow.children.length > 34) soundRow.removeChild(soundRow.firstChild);

    if (caught) {
      captionSmall.textContent = t === "bag" ? "Food rustles — I come." : "Something happens — I look.";
      gsap.to(bunnySvg, { y: -6, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
    } else {
      captionSmall.textContent = "Some sounds I miss. I listen for what matters.";
    }
  }, 900);
}

function stopListening() {
  if (listeningTimer) clearInterval(listeningTimer);
  listeningTimer = null;
}

// -------------------------
// Mistake
function playMistake() {
  captionSmall.textContent = "I pause. I breathe. I try again.";

  gsap.timeline()
    .to(bunnySvg, { y: -18, duration: 0.25, ease: "power2.out" })
    .to(bunnySvg, { y: 10, duration: 0.22, ease: "power2.in" })
    .to(bunnySvg, { x: -16, y: 8, scale: 0.98, duration: 0.35, ease: "power2.out" })
    .to(bunnySvg, { x: 0, y: 0, scale: 1, duration: 0.55, ease: "sine.out" });

  setTimeout(() => {
    captionSmall.textContent = "Different angle. New attempt.";
  }, 900);
}

// -------------------------
// System bowl beat (slow)
function playSystemBowlBeat() {
  setObjVisible(bowl, true);
  bowl.style.transform = "translateX(0px)";

  setTimeout(() => {
    bowl.style.transform = "translateX(-44px)";
    captionSmall.textContent = "The bowl moved. My stomach drops.";
    gsap.to(bunnySvg, { y: -6, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
  }, 1400);

  setTimeout(() => {
    captionSmall.textContent = "I turn. I scan. I look again.";
    gsap.timeline()
      .to(bunnySvg, { scaleX: -1, duration: 0.35, ease: "power2.out" })
      .to(bunnySvg, { x: 10, duration: 0.35, ease: "sine.inOut" }, "<")
      .to(bunnySvg, { x: 0, duration: 0.35, ease: "sine.out" });
  }, 3100);

  setTimeout(() => {
    bowl.style.transform = "translateX(0px)";
    captionSmall.textContent = "Found it. The system settles.";
    gsap.to(bunnySvg, { scaleX: 1, duration: 0.35, ease: "power2.out" });
  }, 5200);
}

// -------------------------
// Scene activation
function applyMode(step) {
  const s = SCENES[step];
  if (!s) return;

  const captionStyleByStep = {
    0: "softPop",
    1: "fadeUp",
    2: "swipe",
    3: "fadeUp",
    4: "jitter",
    5: "swipe",
    6: "fadeUp",
    7: "softPop",
    8: "jitter",
    9: "softPop",
  };

  animateCaptionChange(
    { kicker: s.kicker, line: s.line, small: s.small },
    captionStyleByStep[step] || "fadeUp"
  );

  // Reset UI
  hideAllCallouts();
  show(soundbar, false);
  setObjVisible(bowl, false);
  setObjVisible(box, false);
  stopListening();
  showHay(false);

  // Stop any run leg cycle if user scrolls mid-run
  stopLegRun();

  // Title-only
  if (step === 0) {
    frame.classList.add("is-title");
    titleOverlay.classList.remove("is-gone");
    return;
  } else {
    frame.classList.remove("is-title");
    titleOverlay.classList.add("is-gone");
  }

  // light
  const lightByStep = { 1: 0.45, 2: 0.55, 3: 0.60, 4: 0.50, 5: 0.52, 6: 0.62, 7: 0.58, 8: 0.48, 9: 0.66 };
  setLightProgress(lightByStep[step] ?? 0.55);

  // camera
  const camera = {
    1: { scale: 1.02, y: 0 },
    2: { scale: 1.04, y: -2 },
    3: { scale: 1.03, y: 0 },
    4: { scale: 1.05, y: -4 },
    5: { scale: 1.02, y: 0 },
    6: { scale: 1.00, y: 2 },
    7: { scale: 1.01, y: 0 },
    8: { scale: 1.06, y: -6 },
    9: { scale: 1.00, y: 4 },
  }[step] || { scale: 1.02, y: 0 };

  gsap.to(bunnySvg, { scale: camera.scale, duration: 0.6, ease: "power2.out", overwrite: true });
  gsap.to(bunnySvg, { y: camera.y, duration: 0.6, ease: "power2.out", overwrite: true });

  // Mode behaviors
  if (s.mode === "arrival") {
    playArrival();
    return;
  }

  if (s.mode === "firstContact") {
    showHay(true);
    return;
  }

  if (s.mode === "naming") {
    showCallouts(variableCallouts);
    return;
  }

  if (s.mode === "switch") {
    showCallouts(conditionalButtons);
    return;
  }

  if (s.mode === "listening") {
    show(soundbar, true);
    startListening();
    return;
  }

  if (s.mode === "system") {
    playSystemBowlBeat();
    return;
  }

  if (s.mode === "memory") {
    setObjVisible(bowl, true);
    const mem = getMem();
    if (mem.nudges) captionSmall.textContent = `I remember: I can make things happen (${mem.nudges} nudges).`;
    return;
  }

  if (s.mode === "mistake") {
    playMistake();
    return;
  }

  if (s.mode === "closing") {
    setObjVisible(box, true);
  }
}

// -------------------------
// Scroll driver
const steps = Array.from(document.querySelectorAll(".step"));

const io = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
    if (!visible) return;

    const stepNum = Number(visible.target.dataset.step);
    if (!Number.isFinite(stepNum)) return;

    if (activeStep !== stepNum) {
      activeStep = stepNum;
      setMem({ lastStep: activeStep });
      applyMode(activeStep);
    }
  },
  { threshold: [0.45, 0.6, 0.75] }
);

steps.forEach((s) => io.observe(s));

// progress helpers
function getProgress(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = r.height + vh;
  const p = (vh - r.top) / total;
  return Math.min(1, Math.max(0, p));
}

function raf() {
  // opening light: step 1
  const s1 = document.querySelector('.step[data-step="1"]');
  if (s1) setLightProgress(getProgress(s1));

  // naming cycle: step 3
  if (activeStep === 3) {
    const s3 = document.querySelector('.step[data-step="3"]');
    if (s3) {
      const p = getProgress(s3);
      const idx = Math.min(STATE_PRESETS.length - 1, Math.floor(p * STATE_PRESETS.length));
      const preset = STATE_PRESETS[idx];
      hunger = preset.hunger;
      energy = preset.energy;
      mood = preset.mood;
      renderState();
    }
  }

  requestAnimationFrame(raf);
}

renderState();
applyMode(0);
requestAnimationFrame(raf);
