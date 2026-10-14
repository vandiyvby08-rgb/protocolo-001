/* ============================================================
   MENSAJE FINAL — edita únicamente este texto
   (no uses el carácter ` dentro del mensaje)
   ============================================================ */
const MENSAJE_PERSONAL = ` Se que podra parecer poco, pero por la distancia y por lo bueno que soy haciendo estas cosas es lo mejor que puedo darte. Ya llevamos 2 meses siendo amigos y no sabes la gratitud que tengo por haberme soportado tanto tiempo, la verdad, nunca tuve un amigo asi, uno con el que pueda ser yo mismo y eso signifca mas que muchas palabras. Te deseo un feliz cumpleaños y que la pases de la mejor manera y como solia decirte anteriormente, te mando un gran "abrazo psicologico" desde los andes y que roblox sea aquel lugar donde guarde nuestras risas y nuestros divertidos momentos juntos (y con rotom xdd). Felices 17, Michelle. `;

const intro = document.getElementById("intro");
const puzzle = document.getElementById("puzzle");
const reveal = document.getElementById("reveal");

const startBtn = document.getElementById("startBtn");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answer");
const feedback = document.getElementById("feedback");
const restartBtn = document.getElementById("restartBtn");

function showScreen(screen) {
  [intro, puzzle, reveal].forEach(section => {
    section.classList.add("hidden");
  });

  screen.classList.remove("hidden");
}

startBtn.addEventListener("click", () => {
  showScreen(puzzle);
  answerInput.focus();
});

answerForm.addEventListener("submit", event => {
  event.preventDefault();

  const answer = answerInput.value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const validAnswers = ["espada de diamante","una espada","nada"];
  
  if (validAnswers.includes(answer)) {
    feedback.textContent = "";
    enterGalaxyScene();   // antes: showScreen(reveal);
    document.getElementById("clock").textContent =
      "ARCHIVO DESCIFRADO";
  } else {
    feedback.textContent =
      "CLAVE INCORRECTA. no se acuerda...";
    answerInput.select();
  }
});

restartBtn.addEventListener("click", () => {
  answerInput.value = "";
  feedback.textContent = "";

  document.getElementById("clock").textContent =
    "CONEXIÓN ESTABLE";

  leaveGalaxyScene();
  showScreen(intro);
});

/* ============================================================
   ESCENA FINAL — GALAXIA (Canvas 2D)
   enterGalaxyScene() la inicia y leaveGalaxyScene() la detiene.
   Para cambiar el mensaje NO hace falta tocar nada de este bloque.
   ============================================================ */
const terminal = document.querySelector(".terminal");
const galaxyCanvas = document.getElementById("galaxyCanvas");
const galaxyCtx = galaxyCanvas.getContext("2d");
const galaxyContent = reveal.querySelector(".galaxy-content");
const personalMessage = document.getElementById("personalMessage");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const MESSAGE_DELAY = 3.2;               // segundos hasta que aparece el texto
const DEG = Math.PI / 180;
const ARMS = 3;                          // brazos espirales
const TWIST = 5.2;                       // cuánto se enrollan los brazos
const TINTS = ["220,248,255", "114,232,255", "72,196,214", "150,140,255"];

const G = {
  active: false, running: false, entering: false, shown: false,
  raf: 0, last: 0, t: 0,
  w: 0, h: 0, dpr: 1, cx: 0, cy: 0, R: 200, sinE: 0.36, roll: 0,
  P: null, stars: [],
  ptr: { x: 0, y: 0 }, tilt: { x: 0, y: 0 },
  S: { x: 0, y: 0, front: 0, vis: 0 },
  spark: { r: 0.6, to: 0.6, a: 0, flash: 0, trail: [] }
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = x => 1 - Math.pow(1 - x, 3);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/* ---------- Mensaje: aparece palabra a palabra ---------- */
function renderPersonalMessage() {
  const words = MENSAJE_PERSONAL.trim().split(/\s+/);
  const step = Math.min(70, 3200 / words.length);
  personalMessage.textContent = "";
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "gx-word";
    span.style.setProperty("--i", i);
    span.textContent = word;
    personalMessage.append(span, " ");
  });
  personalMessage.style.setProperty("--step", step + "ms");
  reveal.style.setProperty("--end", (1.1 + words.length * step / 1000) + "s");
}

function showGalaxyMessage() {
  G.shown = true;
  reveal.classList.add("is-visible");
}

/* ---------- Generación de la galaxia ---------- */
function buildGalaxy() {
  const n = window.innerWidth < 700 ? 1900 : 3600;
  const F = () => new Float32Array(n);
  const P = {
    n, r: F(), th: F(), y: F(), w: F(), a: F(), size: F(), ph: F(), ts: F(),
    sx: F(), sy: F(), al: F(), front: new Uint8Array(n),
    byTint: [[], [], [], []]
  };
  for (let i = 0; i < n;) {
    const r = 0.13 + Math.pow(Math.random(), 1.5) * 0.87;      // más densidad al centro
    const band = 0.5 + 0.5 * Math.cos(r * 21);                  // bandas con huecos
    if (Math.random() > 0.35 + 0.65 * band) continue;
    const arm = Math.floor(Math.random() * ARMS);
    P.r[i] = r;
    P.th[i] = arm * (Math.PI * 2 / ARMS) + r * TWIST + gauss() * (0.18 + r * 0.55);
    P.y[i] = gauss() * (0.012 + 0.07 * Math.max(0, 1 - r * 1.6));
    P.w[i] = 0.075 / Math.pow(r, 0.8) * (0.95 + Math.random() * 0.1);
    P.a[i] = (0.25 + Math.random() * 0.75) * (1 - 0.35 * r);
    P.size[i] = Math.random() < 0.12 ? 1.7 : 1;
    P.ph[i] = Math.random() * 6.28;
    P.ts[i] = 0.8 + Math.random() * 2.2;
    const q = Math.random();
    const tint = r < 0.35 ? (q < 0.45 ? 2 : q < 0.8 ? 1 : 0)
      : r < 0.7 ? (q < 0.35 ? 0 : q < 0.75 ? 1 : q < 0.9 ? 2 : 3)
      : (q < 0.3 ? 0 : q < 0.5 ? 1 : q < 0.65 ? 2 : 3);
    P.byTint[tint].push(i);
    i++;
  }
  return P;
}

/* ---------- Tamaño y encuadre ---------- */
function resizeGalaxy() {
  const w = reveal.clientWidth, h = reveal.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  galaxyCanvas.width = Math.round(w * dpr);
  galaxyCanvas.height = Math.round(h * dpr);
  const region = Math.max(h - galaxyContent.offsetHeight, h * 0.34);  // zona libre sobre el texto
  Object.assign(G, {
    w, h, dpr, cx: w / 2, cy: region * 0.5,
    R: Math.max(150, Math.min(w * 0.5, region * 1.05))
  });
}

/* ---------- Dibujo ---------- */
function drawStars(t, fade) {
  const ctx = galaxyCtx;
  ctx.fillStyle = "rgb(190,215,255)";
  for (const s of G.stars) {
    const px = (((s.x * G.w - G.tilt.x * 24 * s.z) % G.w) + G.w) % G.w;
    const py = (((s.y * G.h - G.tilt.y * 14 * s.z) % G.h) + G.h) % G.h;
    const sz = s.z > 0.9 ? 1.8 : 1;
    ctx.globalAlpha = (0.2 + 0.5 * s.z) * (0.65 + 0.35 * Math.sin(t * 1.2 + s.ph)) * fade;
    ctx.fillRect(px, py, sz, sz);
  }
  ctx.globalAlpha = 1;
}

function drawParticles(P, wantFront) {
  const ctx = galaxyCtx;
  for (let c = 0; c < 4; c++) {
    ctx.fillStyle = "rgb(" + TINTS[c] + ")";
    const list = P.byTint[c];
    for (let j = 0; j < list.length; j++) {
      const i = list[j];
      if (P.front[i] !== wantFront) continue;
      const s = P.size[i];
      ctx.globalAlpha = P.al[i];
      ctx.fillRect(P.sx[i] - s * 0.5, P.sy[i] - s * 0.5, s, s);
    }
  }
  ctx.globalAlpha = 1;
}

function drawSpark() {
  const ctx = galaxyCtx, sp = G.spark, S = G.S, n = sp.trail.length;
  if (S.vis <= 0) return;
  ctx.fillStyle = "rgb(235,250,255)";
  for (let j = 0; j < n; j++) {
    const s = 0.8 + 1.6 * j / n;
    ctx.globalAlpha = (j / n) * 0.45 * S.vis;
    ctx.fillRect(sp.trail[j].x - s / 2, sp.trail[j].y - s / 2, s, s);
  }
  const rr = 10 + 16 * sp.flash;
  const g = ctx.createRadialGradient(S.x, S.y, 0, S.x, S.y, rr);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(150,235,255,0.35)");
  g.addColorStop(1, "rgba(114,232,255,0)");
  ctx.globalAlpha = S.vis;
  ctx.fillStyle = g;
  ctx.fillRect(S.x - rr, S.y - rr, rr * 2, rr * 2);
  ctx.globalAlpha = 1;
}

function renderGalaxy(dt) {
  const ctx = galaxyCtx, P = G.P, t = G.t, tl = G.tilt, sp = G.spark, S = G.S;
  const enter = ease(clamp(t / 3.6, 0, 1));    // cámara: cae desde arriba y se estabiliza
  const grow = ease(clamp(t / 2.8, 0, 1));     // la galaxia se abre desde el centro
  const fade = clamp(t / 1.4, 0, 1);
  const spin = 1 + (1 - enter) * 2.5;          // gira más rápido al inicio, luego se calma

  const f = 1 - Math.exp(-dt * 3);
  tl.x += (G.ptr.x - tl.x) * f;
  tl.y += (G.ptr.y - tl.y) * f;

  const elev = (64 + (21 - 64) * enter + Math.sin(t * 0.13) * 3.5 + tl.y * 7) * DEG;
  const dist = 4.2 + (1 - enter) * 1.6 + Math.sin(t * 0.09) * 0.22;
  const roll = Math.sin(t * 0.07) * 0.03 + tl.x * 0.07;
  const sinE = Math.sin(elev), cosE = Math.cos(elev), k = G.R * dist;
  G.sinE = sinE;
  G.roll = roll;

  for (let i = 0; i < P.n; i++) {
    P.th[i] += P.w[i] * spin * dt;
    const rr = P.r[i] * grow, y = P.y[i] * grow;
    const x = rr * Math.cos(P.th[i]), z = rr * Math.sin(P.th[i]);
    const depth = dist - (y * sinE + z * cosE), sc = k / depth;
    P.sx[i] = x * sc;
    P.sy[i] = -(y * cosE - z * sinE) * sc;
    P.front[i] = depth < dist ? 1 : 0;
    P.al[i] = P.a[i] * fade * (0.8 + 0.2 * Math.sin(t * P.ts[i] + P.ph[i]))
      * Math.min(1, 0.85 + 0.25 * (dist - depth));
  }

  // chispa errante (órbita 3D que pasa por detrás del agujero negro)
  sp.r += (sp.to - sp.r) * (1 - Math.exp(-dt * 1.8));
  sp.a += dt * 0.5 / Math.pow(sp.r, 0.8);
  sp.flash = Math.max(0, sp.flash - dt * 0.8);
  const sx3 = sp.r * grow * Math.cos(sp.a), sz3 = sp.r * grow * Math.sin(sp.a);
  const sy3 = Math.sin(sp.a * 1.3) * 0.05;
  const sd = dist - (sy3 * sinE + sz3 * cosE), ss = k / sd;
  S.x = sx3 * ss;
  S.y = -(sy3 * cosE - sz3 * sinE) * ss;
  S.front = sd < dist ? 1 : 0;
  S.vis = clamp((t - 2.2) / 1.5, 0, 1);
  if (dt > 0) {
    sp.trail.push({ x: S.x, y: S.y });
    if (sp.trail.length > 22) sp.trail.shift();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  drawStars(t, fade);
  ctx.translate(G.cx, G.cy);
  ctx.rotate(roll);
  ctx.globalCompositeOperation = "lighter";

  // halo central aplanado sobre el plano del disco
  ctx.save();
  ctx.scale(1, Math.max(0.4, sinE));
  const hr = Math.max(1, G.R * 0.75 * grow);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
  g.addColorStop(0, "rgba(90,210,225," + (0.3 * fade) + ")");
  g.addColorStop(0.35, "rgba(70,120,220," + (0.1 * fade) + ")");
  g.addColorStop(1, "rgba(40,60,160,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-hr, -hr, hr * 2, hr * 2);
  ctx.restore();

  drawParticles(P, 0);
  if (!S.front) drawSpark();

  // agujero negro: cúpula que tapa lo que queda detrás
  const rh = G.R * 0.12 * ease(clamp(t / 1.4, 0, 1)), ry = rh * sinE;
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(-rh, 0);
  ctx.arc(0, 0, rh, Math.PI, 0);
  ctx.ellipse(0, 0, rh, ry, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.fill();

  ctx.globalCompositeOperation = "lighter";
  drawParticles(P, 1);
  if (S.front) drawSpark();

  // arco luminoso delantero
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.ellipse(0, 0, rh, ry, 0, 0, Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(114,232,255,0.9)";
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/* ---------- Bucle, pausa y ciclo de vida ---------- */
function loop(now) {
  if (!G.running) return;
  if (!G.last) G.last = now;
  const dt = Math.min((now - G.last) / 1000, 0.05);
  G.last = now;
  G.t += dt;
  renderGalaxy(dt);
  if (!G.shown && G.t > MESSAGE_DELAY) showGalaxyMessage();
  G.raf = requestAnimationFrame(loop);
}

function startGalaxy() {
  G.P = buildGalaxy();
  G.stars = Array.from({ length: 110 }, () => ({
    x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.28
  }));
  Object.assign(G, { active: true, t: 0, last: 0, shown: false });
  Object.assign(G.spark, { r: 0.6, to: 0.6, a: Math.random() * 6.28, flash: 0, trail: [] });
  G.tilt.x = G.tilt.y = G.ptr.x = G.ptr.y = 0;
  reveal.classList.remove("is-visible");
  renderPersonalMessage();
  resizeGalaxy();
  if (motionQuery.matches) {            // movimiento reducido: escena estática
    G.t = 9;
    renderGalaxy(0);
    showGalaxyMessage();
    return;
  }
  G.running = true;
  G.raf = requestAnimationFrame(loop);
}

function stopGalaxy() {
  G.active = G.running = false;
  cancelAnimationFrame(G.raf);
  reveal.classList.remove("is-visible");
}

function enterGalaxyScene() {
  if (G.active || G.entering) return;
  G.entering = true;
  terminal.classList.add("is-leaving");           // el acertijo se desvanece
  setTimeout(() => {
    terminal.classList.add("hidden");
    document.body.classList.add("galaxy-mode");
    showScreen(reveal);                           // muestra la escena
    startGalaxy();
    G.entering = false;
  }, motionQuery.matches ? 0 : 750);
}

function leaveGalaxyScene() {
  stopGalaxy();
  document.body.classList.remove("galaxy-mode");
  terminal.classList.remove("is-leaving", "hidden");
}

window.addEventListener("resize", () => {
  if (!G.active) return;
  resizeGalaxy();
  if (motionQuery.matches) renderGalaxy(0);
});

document.addEventListener("visibilitychange", () => {
  if (!G.active || motionQuery.matches) return;
  if (document.hidden) {
    G.running = false;
    cancelAnimationFrame(G.raf);
  } else if (!G.running) {
    G.running = true;
    G.last = 0;
    G.raf = requestAnimationFrame(loop);
  }
});

/* ---------- Interacción: inclinar con el puntero, tocar para lanzar la chispa ---------- */
reveal.addEventListener("pointermove", e => {
  if (!G.active || motionQuery.matches) return;
  G.ptr.x = (e.clientX / G.w) * 2 - 1;
  G.ptr.y = (e.clientY / G.h) * 2 - 1;
});

reveal.addEventListener("pointerleave", () => {
  G.ptr.x = G.ptr.y = 0;
});

reveal.addEventListener("pointerdown", e => {
  if (!G.active || motionQuery.matches || e.target.closest(".galaxy-content")) return;
  const x0 = e.clientX - G.cx, y0 = e.clientY - G.cy;
  const c = Math.cos(-G.roll), s = Math.sin(-G.roll);
  const dx = x0 * c - y0 * s, dy = x0 * s + y0 * c;
  G.spark.to = clamp(Math.hypot(dx / G.R, dy / (G.R * G.sinE)), 0.2, 1);
  G.spark.flash = 1;
});
