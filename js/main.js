/**
 * Focal Bunny + Captions (GSAP)
 * Fixes:
 * - inner ear moves with ear (ears are grouped)
 * - title ears brown via CSS vars
 * - hay only visible in First Contact
 * - bowl moved right + visible; bunny flips to “find it”
 * - system section captions slowed down
 */

const frame = document.getElementById("frame");
const light = document.getElementById("light");
const titleOverlay = document.getElementById("titleOverlay");

const captionKicker = document.getElementById("captionKicker");
const caption = document.getElementById("caption");
const captionSmall = document.getElementById("captionSmall");

const hay = document.getElementById("hay");
const bowl = document.getElementById("bowl");
const box = document.getElementById("box");

const soundbar = document.getElementById("soundbar");
const soundRow = document.getElementById("soundRow");

const bunnySvg = document.getElementById("bunnySvg");

// Ears are GROUPS now
const earLeft = document.querySelector(".earPath--left");
const earRight = document.querySelector(".earPath--right");

// Callouts
const callouts = document.getElementById("callouts");

// variable callouts
const cHunger = document.getElementById("cHunger");
const cEnergy = document.getElementById("cEnergy");
const cMood = document.getElementById("cMood");
const cSafety = document.getElementById("cSafety");
const variableCallouts = [cHunger, cEnergy, cMood, cSafety];

// conditional callouts (buttons)
const conditionalButtons = Array.from(callouts.querySelectorAll("button[data-stimulus]"));

// spans for values
const hungerVal = document.getElementById("hungerVal");
const energyVal = document.getElementById("energyVal");
const moodVal = document.getElementById("moodVal");

// -------------------------
// Story data
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
// Variables (internal states)
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
// localStorage (memory)
const KEY = "bunnyPOV_memory_v1";
function getMem() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function setMem(patch) { const next = { ...getMem(), ...patch }; localStorage.setItem(KEY, JSON.stringify(next)); return next; }

// -------------------------
// Light movement
function setLightProgress(t) {
  const x = Math.round((t - 0.5) * 180);
  light.style.setProperty("--light-x", `${x}px`);
}

// -------------------------
// Show/hide helpers
function show(el, on) {
  el.style.opacity = on ? "1" : "0";
  el.style.transform = on ? "translateY(0px)" : "translateY(8px)";
}
function setObjVisible(el, on) { el.style.opacity = on ? "1" : "0"; }

// Hay only in First Contact
function showHay(on) {
  hay.style.opacity = on ? "1" : "0";
  hay.style.pointerEvents = on ? "auto" : "none";
}

// -------------------------
// Caption animations (GSAP)
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
    tl.fromTo(
      targets,
      { opacity: 0, x: -40, y: 0 },
      { opacity: 1, x: 0, y: 0, duration: 0.38, ease: "power2.out", stagger: 0.05 }
    );
  } else if (style === "softPop") {
    tl.fromTo(
      targets,
      { opacity: 0, y: 10, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power2.out", stagger: 0.05 }
    );
  } else if (style === "jitter") {
    tl.fromTo(
      targets,
      { opacity: 0, y: 0, x: 0 },
      { opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.04 }
    ).to(
      caption,
      { x: -3, duration: 0.06, yoyo: true, repeat: 5, ease: "sine.inOut" },
      "<"
    );
  } else {
    tl.fromTo(
      targets,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.40, ease: "power2.out", stagger: 0.05 }
    );
  }

  return tl;
}

// -------------------------
// Callout animations
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
    {
      opacity: 0,
      y: () => gsap.utils.random(10, 24),
      x: () => gsap.utils.random(-18, 18),
      rotate: () => gsap.utils.random(-2, 2),
    },
    {
      opacity: 1,
      y: 0,
      x: 0,
      rotate: 0,
      duration: 0.55,
      ease: "power2.out",
      stagger: 0.08,
      overwrite: true,
    }
  );
}

// Floating drift for variable callouts
function floatCallouts(targets) {
  targets.forEach((t, i) => {
    gsap.to(t, {
      y: "+=6",
      duration: 2.2 + i * 0.25,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  });
}
floatCallouts(variableCallouts);

// -------------------------
// GSAP baseline bunny animations
gsap.set(bunnySvg, { transformOrigin: "50% 80%" });

// subtle breathing loop
gsap.to(bunnySvg, { y: 2, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });

// micro ear idle (groups now)
gsap.to([earLeft, earRight], {
  rotate: 0.6,
  duration: 2.4,
  yoyo: true,
  repeat: -1,
  ease: "sine.inOut",
  transformOrigin: "120px 170px", // approx “ear base” area in the SVG
});

// Reactions
function reactEarPop() {
  gsap.killTweensOf([earRight, bunnySvg]);
  gsap.timeline()
    .to(bunnySvg, { y: -6, duration: 0.25, ease: "power2.out" }, 0)
    .to(earRight, { rotate: -10, y: -6, duration: 0.32, ease: "power2.out", transformOrigin: "120px 170px" }, 0)
    .to(earRight, { rotate: -4, y: -3, duration: 0.28, ease: "power2.out" })
    .to(bunnySvg, { y: 0, duration: 0.35, ease: "sine.out" }, "<");
}

function reactHide() {
  gsap.killTweensOf([bunnySvg, earLeft, earRight]);
  gsap.timeline()
    .to(bunnySvg, { x: -18, y: 10, scale: 0.98, duration: 0.35, ease: "power2.out" }, 0)
    .to([earLeft, earRight], { rotate: 6, duration: 0.25, ease: "power2.out", transformOrigin: "120px 170px" }, 0.05)
    .to(bunnySvg, { x: -10, y: 6, duration: 0.45, ease: "sine.inOut" })
    .to(bunnySvg, { x: 0, y: 0, scale: 1, duration: 0.55, ease: "sine.out" });
}

// -------------------------
// First contact: click hay
let nudges = 0;
hay.addEventListener("click", () => {
  nudges++;
  const dx = Math.min(160, nudges * 60);
  hay.style.transform = `translateX(${dx}px)`;
  console.log("[First Contact] hay moved:", dx);
  setMem({ nudges });

  captionSmall.textContent =
    nudges === 1 ? "Again. It responds. That wasn’t an accident." : "It happens again — predictable.";
});

// -------------------------
// Conditionals: click conditional callouts
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
  else if (type === "danger") reactHide();
  else gsap.to(bunnySvg, { y: -5, duration: 0.22, yoyo: true, repeat: 1, ease: "sine.inOut" });
}

// -------------------------
// Listening: timed events (some missed)
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
// Mistake: gentle fail + recover
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
// System: bowl beat (slower + flip moment)
function playSystemBowlBeat() {
  setObjVisible(bowl, true);
  bowl.style.transform = "translateX(0px)";

  // Beat 1: notice the change (slower)
  setTimeout(() => {
    bowl.style.transform = "translateX(-44px)";
    captionSmall.textContent = "The bowl moved. My stomach drops.";
    // quick alert body
    gsap.to(bunnySvg, { y: -6, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
  }, 1200);

  // Beat 2: search + flip around
  setTimeout(() => {
    captionSmall.textContent = "I turn. I scan. I look again.";
    gsap.timeline()
      .to(bunnySvg, { scaleX: -1, duration: 0.35, ease: "power2.out" })   // flip
      .to(bunnySvg, { x: 10, duration: 0.35, ease: "sine.inOut" }, "<")   // small “step”
      .to(bunnySvg, { x: 0, duration: 0.35, ease: "sine.out" });
  }, 2600);

  // Beat 3: relief (slow)
  setTimeout(() => {
    bowl.style.transform = "translateX(0px)";
    captionSmall.textContent = "Found it. The system settles.";
    gsap.to(bunnySvg, { scaleX: 1, duration: 0.35, ease: "power2.out" }); // face forward again
  }, 4300);
}

// -------------------------
// Scene activation per step
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

  // Always hide hay unless First Contact
  showHay(false);

  // Title-only view
  if (step === 0) {
    frame.classList.add("is-title");
    titleOverlay.classList.remove("is-gone");
    return;
  } else {
    frame.classList.remove("is-title");
    titleOverlay.classList.add("is-gone");
  }

  // Stage differences
  const lightByStep = { 1: 0.45, 2: 0.55, 3: 0.60, 4: 0.50, 5: 0.52, 6: 0.62, 7: 0.58, 8: 0.48, 9: 0.66 };
  setLightProgress(lightByStep[step] ?? 0.55);

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

  // Per-mode
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
let activeStep = 0;

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

// Per-step progress effects (opening light + naming cycle)
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
