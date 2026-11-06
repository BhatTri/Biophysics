/*
 * vesicles.js — decorative hero animation for the home page.
 * Draws thermally fluctuating vesicles: each contour is
 *   r(θ) = R · (1 + Σ a_n cos(nθ + φ_n)),   n = 2..6,
 * with the mode amplitudes/phases doing a slow random walk (a cartoon of
 * membrane flicker). Drawn as a double line to suggest a lipid bilayer.
 * Respects prefers-reduced-motion and pauses when off-screen.
 */
(function () {
  "use strict";
  const canvas = document.getElementById("vesicle-canvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = [
    [39, 167, 118],   // lab green
    [43, 183, 196],   // teal
    [139, 124, 246]   // violet
  ];
  let W = 0, H = 0, dpr = 1, vesicles = [], running = true, t = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeVesicle(big) {
    const modes = [];
    for (let n = 2; n <= 6; n++) modes.push({ n: n, a: 0, phi: rand(0, Math.PI * 2), amp: (big ? 0.05 : 0.08) / (n - 1) });
    const R = big ? rand(0.20, 0.26) * Math.min(W, H) : rand(0.035, 0.09) * Math.min(W, H);
    return {
      x: rand(R, W - R), y: rand(R, H - R), R: R,
      vx: rand(-0.12, 0.12), vy: rand(-0.12, 0.12),
      c: palette[Math.floor(Math.random() * palette.length)],
      modes: modes, seed: rand(0, 1000)
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vesicles = [makeVesicle(true)];
    const count = W < 500 ? 6 : 10;
    for (let i = 0; i < count; i++) vesicles.push(makeVesicle(false));
    // put the giant vesicle roughly in the middle
    vesicles[0].x = W * 0.52; vesicles[0].y = H * 0.5;
    draw();
  }

  function contour(v, offset) {
    ctx.beginPath();
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      let r = 1;
      for (const m of v.modes) r += m.a * Math.cos(m.n * th + m.phi);
      r = v.R * r - offset;
      const x = v.x + r * Math.cos(th), y = v.y + r * Math.sin(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const v of vesicles) {
      const [r, g, b] = v.c;
      const grad = ctx.createRadialGradient(v.x - v.R * 0.3, v.y - v.R * 0.3, v.R * 0.1, v.x, v.y, v.R * 1.1);
      grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.22)");
      grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0.04)");
      contour(v, 0);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, v.R * 0.025);
      ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.9)";
      ctx.stroke();
      contour(v, Math.max(3, v.R * 0.05));          // inner leaflet
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.45)";
      ctx.stroke();
    }
  }

  function step() {
    t += 1;
    for (const v of vesicles) {
      for (const m of v.modes) {
        // Ornstein–Uhlenbeck-like random walk for each mode amplitude
        m.a += -0.02 * m.a + rand(-1, 1) * m.amp * 0.12;
        m.phi += rand(-0.02, 0.02);
      }
      v.x += v.vx; v.y += v.vy;
      if (v.x < v.R || v.x > W - v.R) v.vx *= -1;
      if (v.y < v.R || v.y > H - v.R) v.vy *= -1;
    }
    draw();
  }

  function loop() {
    if (!running) return;
    step();
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", function () { clearTimeout(resize._t); resize._t = setTimeout(resize, 150); });

  if (reduce) {
    for (let i = 0; i < 60; i++) step();   // settle into a fluctuated shape, then stay still
    return;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      const vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; loop(); }
      if (!vis) running = false;
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; loop(); }
  });
  loop();
})();
