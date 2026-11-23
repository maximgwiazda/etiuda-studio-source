/* THE OPENING (board 957, Claudia handover 2026-11-03, Max decisions 30 and 31):
 * First-round variant A, Studio's turn phiIcon 90 degrees (c-open), ink #8b5cf6 over the window's own ground (theme token),
 * landing in Studio's corner mark (.brand svg, 25 x 25 at 14, 6.5) with no jump, then the window arriving;
 * nothing of the UI before the landing; one clock with the corner logo.
 * Under reduced motion: no opening; the window shows as soon as the page is ready, its corner mark still (Max, 2026-11-03 02:33).
 * A key, click or wheel ends the opening at once.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StudioOpening = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OPENING_INK = "#8b5cf6";
  const PHI_ICON = Math.PI / 2; // Studio: 90 degrees (c-open)
  const CORNER_BOX = { x: 14, y: 6.5, w: 25, h: 25 };
  const W0 = 2 * Math.PI * 0.007; // 0.007 Hz detune rate in rad/s
  const KF = 150 / 212;
  const LW = 20 * KF;
  const HOLD_MS = 0; // reduced motion: no opening, no hold (Max, 2026-11-03 02:33)

  const TIMING = {
    FADE_IN: 0.45,
    RISE: 0.70,
    GROW: 0.90,
    TURN: 2.05,
    STILL_UNTIL: 2.35,
    LAND: 2.90,
    ARRIVE: 3.25
  };

  /* A gap shorter than a 240 Hz frame is a repeated stamp, not a display frame: counted, it would cap every later
     step at a few milliseconds and the opening would crawl to the failsafe. A gap longer than a 30 Hz frame is a
     stall, not a refresh rate, and stays out of the same window: three stalls would lift the median and the
     two-frame cap would go with them. */
  const SHORTEST_FRAME_MS = 1000 / 240;
  const LONGEST_FRAME_MS = 1000 / 30;

  /* ---- fifth figure calculations (the pin's beam equations in Studio's tree) ---- */
  const FIFTH_PHI0 = Math.PI / 4, FIFTH_A = 96, FIFTH_R = 10, FIFTH_SPACING = 0.6, FIFTH_FINE = 4000, FIFTH_INK = 150, FIFTH_BOX = 256;
  const FIFTH_T0 = 3 * Math.PI / 4, FIFTH_T1 = 7 * Math.PI / 4;

  function fifthPass(phi) {
    const fine = [];
    for (let i = 0; i <= FIFTH_FINE; i++) {
      const t = FIFTH_T0 + (FIFTH_T1 - FIFTH_T0) * i / FIFTH_FINE;
      fine.push([128 + FIFTH_A * Math.sin(3 * t + phi), 128 + FIFTH_A * Math.sin(2 * t), t]);
    }
    const out = [fine[0]]; let acc = 0;
    for (let i = 1; i < fine.length; i++) {
      acc += Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]);
      if (acc >= FIFTH_R * FIFTH_SPACING) { out.push(fine[i]); acc = 0; }
    }
    out.push(fine[fine.length - 1]);
    return out;
  }

  let fifthFitStd = null;
  function fifthFit() {
    if (fifthFitStd) return fifthFitStd;
    const c = fifthPass(FIFTH_PHI0), r = FIFTH_R;
    const x1 = Math.min(...c.map(p => p[0] - r)), x2 = Math.max(...c.map(p => p[0] + r));
    const y1 = Math.min(...c.map(p => p[1] - r)), y2 = Math.max(...c.map(p => p[1] + r));
    const k = FIFTH_INK / Math.max(x2 - x1, y2 - y1);
    return fifthFitStd = { k: k, ox: FIFTH_BOX / 2 - k * (x1 + x2) / 2, oy: FIFTH_BOX / 2 - k * (y1 + y2) / 2 };
  }

  const fifthF2 = v => (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
  function fifthLinePath(phi, fit) {
    const f = fit || fifthFit(), pass = fifthPass(phi), n = pass.length, closed = Math.abs(phi - FIFTH_PHI0) > 1e-9;
    const pt = (p, m) => [(m ? FIFTH_BOX - p[0] : p[0]) * f.k + f.ox, p[1] * f.k + f.oy];
    const vel = (t, m) => [(m ? -3 : 3) * FIFTH_A * Math.cos(3 * t + phi) * f.k, 2 * FIFTH_A * Math.cos(2 * t) * f.k];
    const seq = pass.map(p => [p, false]);
    if (closed) for (let i = 1; i < n; i++) seq.push([pass[i], true]);
    let d = "M" + pt(seq[0][0], false).map(fifthF2).join(" ");
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1], b = seq[i], dt = (b[0][2] - a[0][2] + Math.PI) % Math.PI;
      const p0 = pt(a[0], a[1]), p1 = pt(b[0], b[1]), v0 = vel(a[0][2], a[1]), v1 = vel(b[0][2], b[1]);
      d += "C" + [p0[0] + v0[0] * dt / 3, p0[1] + v0[1] * dt / 3, p1[0] - v1[0] * dt / 3, p1[1] - v1[1] * dt / 3, p1[0], p1[1]].map(fifthF2).join(" ");
    }
    return closed ? d + "Z" : d;
  }
  function fifthRadius() { return FIFTH_R * fifthFit().k; }
  /* THE BAND'S MARK STANDS AT THE FIGURE'S OWN SIZE (index.html): its path is the line at FIFTH_A and FIFTH_R about the box's
     centre, its viewBox frames the icon's box at 88 per cent and its group places the figure. The corner turns in that frame. */
  const OWN_SIZE = { k: 1, ox: 0, oy: 0 };
  const CORNER_FRAME = { x0: -17.4545, w: 290.9091, tx: -25.057, sc: 1.195755 };
  /* THE TURN CARRIES THE DEPTH, as the app icon and the standing mask do: the far pass at TURN_FAR of the near, eased. The
     turn's mask (index.html, #depth-turn) holds the line's pieces at the figure's own size in their greys, far to near, so the
     nearer pass wins where the arms cross, at the standing mask's width (TURN_MASK_W, wider than the line so the rim takes its
     own pass's light). */
  const TURN_FAR = 0.4, TURN_MASK_W = 21.67;
  function turnLight(z) { const u = z * 0.5 + 0.5; return TURN_FAR + (1 - TURN_FAR) * u * u * (3 - 2 * u); }
  function turnPieces(phi) {
    const pass = fifthPass(phi), out = [];
    const at = (p, m) => [m ? FIFTH_BOX - p[0] : p[0], p[1], (m ? -1 : 1) * Math.cos(3 * p[2] + phi)];
    for (const m of [false, true]) for (let i = 1; i < pass.length; i++) {
      const a = at(pass[i - 1], m), b = at(pass[i], m);
      out.push([a[0], a[1], b[0], b[1], (a[2] + b[2]) / 2]);
    }
    return out.sort((p, q) => p[4] - q[4]);
  }
  function turnMaskLines(phi) {
    return turnPieces(phi).map((p) => {
      const v = Math.round(255 * turnLight(p[4])).toString(16).padStart(2, "0");
      return '<line x1="' + fifthF2(p[0]) + '" y1="' + fifthF2(p[1]) + '" x2="' + fifthF2(p[2]) + '" y2="' + fifthF2(p[3])
        + '" stroke="#' + v + v + v + '" stroke-width="' + TURN_MASK_W + '"/>';
    }).join("");
  }

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, f) => a.map((v, i) => Math.round(v * f + b[i] * (1 - f)));
  const rgb = (c) => "rgb(" + c.join(",") + ")";
  const cl = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { const u = cl(x); return u * u * (3 - 2 * u); };
  const eo = (x) => 1 - Math.pow(1 - cl(x), 3);
  const eio = (x) => { const u = cl(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };

  const WHITE = [255, 255, 255];
  const INK_RGB = hex(OPENING_INK);

  const pt = (t, phi) => [
    128 + 96 * KF * Math.sin(3 * t + phi),
    128 + 96 * KF * Math.sin(2 * t),
    Math.cos(3 * t + phi)
  ];

  const lerpAt = (a, b, f) => ({
    cx: a.cx + (b.cx - a.cx) * f,
    cy: a.cy + (b.cy - a.cy) * f,
    k: a.k * Math.pow(b.k / a.k, f)
  });

  /** Where the band's mark stands: its centre, and the scale from this flight's fit (KF) to the mark's own size. */
  function cornerTarget() {
    const u = CORNER_BOX.w / CORNER_FRAME.w, c = (128 * CORNER_FRAME.sc + CORNER_FRAME.tx - CORNER_FRAME.x0) * u;
    return {
      cx: CORNER_BOX.x + c,
      cy: CORNER_BOX.y + c,
      k: u * CORNER_FRAME.sc / KF
    };
  }

  function bigTarget(W, H) {
    const w = W || 1280, h = H || 880;
    return { cx: w / 2, cy: h / 2 - 10, k: 300 / 150 };
  }

  function cornerPhase(t) {
    return PHI_ICON + W0 * (t - TIMING.STILL_UNTIL);
  }

  /** The figure position, scale, phase and colours across opening time t in seconds. */
  function figureAt(t, W, H) {
    const big = bigTarget(W, H);
    const c0 = cornerTarget();

    if (t < TIMING.TURN) {
      const s = eio(t / TIMING.TURN);
      const phi = PHI_ICON - Math.PI * 0.85 * (1 - s);
      const alpha = ease(t / TIMING.FADE_IN);
      const yOff = 18 * (1 - eo(t / TIMING.RISE));
      const kScale = big.k * (0.9 + 0.1 * eo(t / TIMING.GROW));
      return {
        cx: big.cx,
        cy: big.cy + yOff,
        k: kScale,
        phi,
        depth: 1.0,
        ground: 1.0,
        colour: OPENING_INK,
        alpha,
        arc: 0
      };
    }

    if (t < TIMING.STILL_UNTIL) {
      return {
        cx: big.cx,
        cy: big.cy,
        k: big.k,
        phi: PHI_ICON,
        depth: 1.0,
        ground: 1.0,
        colour: OPENING_INK,
        alpha: 1.0,
        arc: 0
      };
    }

    if (t < TIMING.LAND) {
      const tau = (t - TIMING.STILL_UNTIL) / (TIMING.LAND - TIMING.STILL_UNTIL);
      const f = eio(tau);
      const geom = lerpAt(big, c0, f);
      const arc = Math.sin(Math.PI * f) * 40;
      const depth = 1 - ease(f * 3);
      const phi = cornerPhase(t);
      return {
        cx: geom.cx - arc * 0.3,
        cy: geom.cy - arc,
        k: geom.k,
        phi,
        depth,
        ground: 1.0,
        colour: OPENING_INK,
        alpha: 1.0,
        arc
      };
    }

    if (t < TIMING.ARRIVE) {
      const tau = (t - TIMING.LAND) / (TIMING.ARRIVE - TIMING.LAND);
      const ground = 1 - ease(tau);
      const phi = cornerPhase(t);
      const curColour = mix(INK_RGB, WHITE, ground);
      return {
        cx: c0.cx,
        cy: c0.cy,
        k: c0.k,
        phi,
        depth: 0,
        ground,
        colour: curColour,
        alpha: 1.0,
        arc: 0
      };
    }

    const phi = cornerPhase(t);
    return {
      cx: c0.cx,
      cy: c0.cy,
      k: c0.k,
      phi,
      depth: 0,
      ground: 0,
      colour: WHITE,
      alpha: 1.0,
      arc: 0
    };
  }

  function drawLine(ctx, phi, at, opt) {
    if (!ctx) return;
    const o = opt || {};
    const N = o.n || 520;
    const depth = o.depth == null ? 1 : o.depth;
    const far = o.far == null ? 0.4 : o.far;
    const near = Array.isArray(o.colour) ? o.colour : (typeof o.colour === "string" ? hex(o.colour) : INK_RGB);
    const bg = Array.isArray(o.bg) ? o.bg : (typeof o.bg === "string" ? hex(o.bg) : [247, 248, 250]);

    const segs = [];
    for (let j = 0; j < N; j++) {
      const a = (2 * Math.PI * j) / N, b = (2 * Math.PI * (j + 1)) / N;
      const p = pt(a, phi), q = pt(b, phi);
      segs.push([p, q, (p[2] + q[2]) / 2]);
    }
    if (depth > 0) segs.sort((u, v) => u[2] - v[2]);

    ctx.lineCap = "round";
    ctx.lineWidth = LW * at.k;

    for (const [p, q, z] of segs) {
      const u = z * 0.5 + 0.5;
      const L = far + (1 - far) * u * u * (3 - 2 * u);
      const f = 1 - depth * (1 - L);
      ctx.strokeStyle = rgb(mix(near, bg, f));
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.beginPath();
      ctx.moveTo(at.cx + (p[0] - 128) * at.k, at.cy + (p[1] - 128) * at.k);
      ctx.lineTo(at.cx + (q[0] - 128) * at.k, at.cy + (q[1] - 128) * at.k);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function getGroundRgb(doc) {
    if (doc && doc.documentElement && doc.documentElement.dataset && doc.documentElement.dataset.theme === "dark") {
      return [15, 16, 19]; // #0f1013
    }
    return [247, 248, 250]; // #f7f8fa
  }

  /* ---- Shared clock with Studio corner logo in header ---- */
  let cornerClockPhi = PHI_ICON;
  let cornerPathNode = null;
  let cornerRaf = 0;
  let cornerLastMs = null;
  let cornerQuiet = null;
  let cornerStandingD = null;
  let cornerMask = null;
  let cornerTurnMask = null;
  let cornerPaintedMs = -Infinity;
  const CORNER_PAINT_MS = 50;

  /* Turning, the path is stroked at the figure's own width and its mask is off: the mask is the standing figure's depth and
     would cut any other phase. Standing, the outline is filled and the mask is back. */
  function cornerStroke(node, on) {
    node.setAttribute("fill", on ? "none" : "currentColor");
    node.setAttribute("stroke", on ? "currentColor" : "none");
    node.setAttribute("stroke-width", String(2 * FIFTH_R));
    node.setAttribute("stroke-linecap", "round");
    node.setAttribute("stroke-linejoin", "round");
    if (cornerMask) node.setAttribute("mask", on ? (cornerTurnMask ? "url(#depth-turn)" : "none") : cornerMask);
  }
  /** The turned line at phi and its light: the path's d, and the turn's mask rewritten to the same phase. */
  function cornerTurnTo(node, phi) {
    node.setAttribute("d", fifthLinePath(phi, OWN_SIZE));
    if (cornerTurnMask) cornerTurnMask.innerHTML = turnMaskLines(phi);
  }

  function syncCornerPhase(phi) {
    cornerClockPhi = phi;
    cornerLastMs = null;
    if (cornerPathNode && typeof fifthLinePath === "function") {
      try {
        cornerStroke(cornerPathNode, true);
        cornerTurnTo(cornerPathNode, phi);
      } catch (e) {}
    }
  }

  function wireStudioCorner(node, opts) {
    if (!node) return;
    if (cornerRaf && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(cornerRaf);
      cornerRaf = 0;
    }
    cornerClockPhi = PHI_ICON;
    cornerLastMs = null;
    cornerPathNode = node;
    cornerStandingD = node.getAttribute("d");
    cornerMask = node.getAttribute("mask");
    cornerPaintedMs = -Infinity;
    const o = opts || {};
    cornerQuiet = o.still || (() => false);

    const doc = node.ownerDocument || (typeof document !== "undefined" ? document : null);
    cornerTurnMask = doc && typeof doc.getElementById === "function" ? doc.getElementById("depth-turn") : null;

    const isQuiet = () => {
      if (cornerQuiet && cornerQuiet()) return true;
      if (doc && doc.documentElement && doc.documentElement.classList) {
        if (doc.documentElement.classList.contains("e-still") || doc.documentElement.classList.contains("e-system-still")) {
          return true;
        }
      }
      return false;
    };

    const isHidden = () => !!(doc && doc.hidden);

    const stroke = (on) => cornerStroke(node, on);

    const sync = () => {
      const still = isQuiet(), go = !still && !isHidden();
      if (go && !cornerRaf) {
        cornerLastMs = null;
        if (typeof requestAnimationFrame === "function") {
          cornerRaf = requestAnimationFrame(frame);
        }
      }
      if (!go && cornerRaf) {
        if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(cornerRaf);
        cornerRaf = 0;
      }
      if (still) {
        cornerClockPhi = PHI_ICON;
        cornerLastMs = null;
        stroke(false);
        if (cornerStandingD && node.getAttribute("d") !== cornerStandingD) {
          node.setAttribute("d", cornerStandingD);
        }
      }
    };

    const frame = (ms) => {
      /* The next frame is booked first, as the desk's wireFifth does, so the id stays the pending one. */
      cornerRaf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(frame) : 0;
      if (isQuiet() || isHidden()) {
        sync();
        return;
      }
      const dt = cornerLastMs === null ? (1 / 60) : Math.max(0, Math.min(1 / 30, (ms - cornerLastMs) / 1000));
      cornerLastMs = ms;
      cornerClockPhi += W0 * dt;
      // the clock moves every frame; the line and its mask are rewritten every CORNER_PAINT_MS, as the desk's header repaints
      if (ms - cornerPaintedMs < CORNER_PAINT_MS) return;
      cornerPaintedMs = ms;
      stroke(true);
      cornerTurnTo(node, cornerClockPhi);
    };

    if (doc && doc.addEventListener) {
      doc.addEventListener("visibilitychange", sync);
    }
    if (doc && doc.documentElement && typeof MutationObserver !== "undefined") {
      try {
        new MutationObserver(sync).observe(doc.documentElement, { attributes: true, attributeFilter: ["class"] });
      } catch (e) {}
    }

    sync();
  }

  /** The opening launch animation run at boot. */
  function openingMark(opts) {
    const o = opts || {};
    const doc = o.doc || (typeof document !== "undefined" ? document : null);
    const win = o.window || (typeof window !== "undefined" ? window : null);
    const body = doc && doc.body;
    const quiet = o.still || (() => (doc && doc.documentElement && doc.documentElement.classList && doc.documentElement.classList.contains("e-still")) || false);
    const isStillMotion = typeof quiet === "function" ? quiet() : !!quiet;

    if (body && body.classList) {
      body.classList.add("e-launch");
    }

    const state = {
      reason: null,
      ended: false,
      ms: 0,
      isStill: isStillMotion,
      holdMs: isStillMotion ? HOLD_MS : 0
    };
    let t0 = (win && win.performance ? win.performance.now() : Date.now());
    let rafId = 0;
    /* THE PAGE IS NEVER LEFT HIDDEN (the test architect, 2026-11-03 03:04): whatever happens to the frames or to the page's
       ready, the window is given way 1.5 s after the opening would have arrived. A page shown before ready beats one never shown. */
    const FAILSAFE_MS = Math.round(TIMING.ARRIVE * 1000) + 1500;
    let failsafeTimer = 0;
    const setTimer = (win && win.setTimeout) || (typeof setTimeout === "function" ? setTimeout : null);
    const clearTimer = (win && win.clearTimeout) || (typeof clearTimeout === "function" ? clearTimeout : null);
    const armFailsafe = () => { if (setTimer) failsafeTimer = setTimer(() => giveWay("failsafe"), FAILSAFE_MS); };
    let veil = null;
    let canvas = null;
    let ctx = null;

    let currentOpeningFig = null;
    let openingMs = 0;
    let lastFrameTime = t0;
    let framed = false;
    /* The estimate starts at one 60 Hz frame, five times, so one short gap cannot move the median. */
    const gapHist = [1000 / 60, 1000 / 60, 1000 / 60, 1000 / 60, 1000 / 60];
    let gapWrite = 0;
    let frameGap = 1000 / 60;
    function noteGap(dt) {
      if (!(dt >= SHORTEST_FRAME_MS && dt <= LONGEST_FRAME_MS)) return;
      gapHist[gapWrite % gapHist.length] = dt;
      gapWrite += 1;
      const ordered = gapHist.slice().sort((a, b) => a - b);
      frameGap = ordered[(ordered.length - 1) >> 1];
    }

    let held = "";
    let skipSearchFocus = false;
    let flightDetached = false;
    let keyDetached = false;

    function loose() {
      const a = doc && doc.activeElement;
      return !a || a === body || a === (doc && doc.documentElement);
    }
    function isPrintable(e) {
      const k = e && e.key;
      const graph = !!(e && e.getModifierState && e.getModifierState("AltGraph"));
      return typeof k === "string" && k.length === 1 && !e.isComposing && (graph || !(e.ctrlKey || e.metaKey || e.altKey));
    }
    function detachFlight() {
      if (flightDetached || !win || !win.removeEventListener) return;
      flightDetached = true;
      win.removeEventListener("pointerdown", onPointer, true);
      win.removeEventListener("wheel", onWheel, true);
    }
    function detachKey() {
      if (keyDetached || !win || !win.removeEventListener) return;
      keyDetached = true;
      win.removeEventListener("keydown", onKey, true);
    }
    function onKey(e) {
      /* Held only while focus is still on the page itself. Once #q or another control has it, the key is the field's. */
      if (!keyDetached && !skipSearchFocus && isPrintable(e) && loose()) {
        held += e.key;
        if (typeof e.preventDefault === "function") e.preventDefault();
      }
      if (!state.ended) giveWay("key");
    }
    const PRESSABLE = 'button, a[href], input, select, textarea, label, summary, [data-act], [role="button"]';
    function onPointer(e) {
      /* The down already hit the veil, so the browser will not fire click on the control underneath.
         giveWay takes the veil out of hit-testing first; the control under the point takes focus now and
         is pressed at the release, as a native click is, only if the up is on it: an up elsewhere presses
         nothing, so a drag or a selection begun in the flight stays one (the test architect's read,
         2026-11-03). The event is not stopped or cancelled; a down that hit a control is left alone. */
      const onVeil = !!(e && veil && (e.target === veil || (veil.contains && veil.contains(e.target))));
      giveWay("click");
      if (!onVeil || !e) return;
      if (e.button != null && e.button !== 0) return;
      let target = null;
      if (doc && typeof doc.elementFromPoint === "function" && e.clientX != null && e.clientY != null) {
        target = doc.elementFromPoint(e.clientX, e.clientY);
      }
      if (!target || target === veil || (veil.contains && veil.contains(target))) return;
      if (target === body || target === (doc && doc.documentElement)) return;
      const control = (target.closest && target.closest(PRESSABLE)) || target;
      if (typeof control.focus === "function") {
        try { control.focus({ preventScroll: true }); } catch (err) {}
      }
      if (!win || !win.addEventListener) return;
      const onUp = (u) => {
        win.removeEventListener("pointerup", onUp, true);
        if (!u || (u.button != null && u.button !== 0)) return;
        const at = doc && typeof doc.elementFromPoint === "function" && u.clientX != null && u.clientY != null
          ? doc.elementFromPoint(u.clientX, u.clientY) : null;
        if (!at || !(at === control || (control.contains && control.contains(at)))) return;
        /* With the release's own modifiers, so a Shift+click in the flight is still a range (app.js reads e.shiftKey). */
        const M = win.MouseEvent;
        try {
          if (typeof M === "function" && control.dispatchEvent) {
            control.dispatchEvent(new M("click", { bubbles: true, cancelable: true, view: win, button: 0, detail: 1,
              clientX: u.clientX, clientY: u.clientY, shiftKey: !!u.shiftKey, ctrlKey: !!u.ctrlKey, altKey: !!u.altKey, metaKey: !!u.metaKey }));
          } else if (typeof control.click === "function") control.click();
        } catch (err) {}
      };
      win.addEventListener("pointerup", onUp, true);
    }
    function onWheel() { giveWay("wheel"); }

    currentOpeningFig = isStillMotion ? { cx: 0, cy: 0, k: 0, phi: PHI_ICON } : figureAt(0, 1280, 880);

    function giveWay(reason) {
      if (state.ended) return;
      state.ended = true;
      state.reason = reason;
      if (reason === "key" || reason === "click" || reason === "wheel") {
        state.skipped = true;
      }
      if (failsafeTimer && clearTimer) { clearTimer(failsafeTimer); failsafeTimer = 0; }
      const now = (win && win.performance ? win.performance.now() : Date.now());
      state.ms = now - t0;
      if (rafId && win && win.cancelAnimationFrame) {
        win.cancelAnimationFrame(rafId);
        rafId = 0;
      }

      const finalPhi = isStillMotion
        ? PHI_ICON
        : (currentOpeningFig ? currentOpeningFig.phi : PHI_ICON);

      syncCornerPhase(finalPhi);
      if (win) win.__lastSetCornerPhase = finalPhi;
      if (typeof o.onHandover === "function") o.onHandover(finalPhi);

      if (body && body.classList) {
        body.classList.add("e-launch-out");
        body.classList.remove("e-launch");
      }

      if (veil) {
        if (veil.classList) veil.classList.add("e-going");
        if (veil.style) veil.style.pointerEvents = "none";
        (setTimer || setTimeout)(() => {
          if (veil.remove) veil.remove();
          if (body && body.classList) {
            body.classList.remove("e-launch-out");
          }
        }, isStillMotion ? 0 : 350);
      } else {
        if (body && body.classList) {
          body.classList.remove("e-launch-out");
        }
      }

      if (reason === "click") skipSearchFocus = true;
      detachFlight();
    }

    if (win && win.addEventListener) {
      win.addEventListener("keydown", onKey, true);
      win.addEventListener("pointerdown", onPointer, true);
      win.addEventListener("wheel", onWheel, { passive: true, capture: true });
    }

    if (win) {
      win.__launchOpeningState = () => ({
        get cx() { return currentOpeningFig ? currentOpeningFig.cx : 0; },
        get cy() { return currentOpeningFig ? currentOpeningFig.cy : 0; },
        get size() { return currentOpeningFig ? currentOpeningFig.k * 256 : 0; },
        get phase() { return currentOpeningFig ? currentOpeningFig.phi : PHI_ICON; },
        get skipped() { return !!state.skipped; },
        get ended() { return !!state.ended; },
        get reason() { return state.reason; },
        get isStill() { return state.isStill; },
        get isFlightTurning() { return !state.isStill && !state.ended; },
        get clockMs() { return openingMs; }
      });
    }

    if (doc && doc.createElement && body && body.appendChild) {
      veil = doc.createElement("div");
      veil.className = "e-launch-veil";
      canvas = doc.createElement("canvas");
      canvas.className = "e-opening";
      canvas.setAttribute("aria-hidden", "true");
      veil.appendChild(canvas);
      body.appendChild(veil);
      ctx = canvas.getContext ? canvas.getContext("2d") : null;
    }

    /* #q does not exist until the page is ready. A key pressed before that is held and handed over then,
       and focus moves off the page itself. A click on another control never pulls focus to #q. */
    const waitReady = (win && win.Promise ? win.Promise.resolve(o.ready) : Promise.resolve(o.ready));
    waitReady.then(() => {
      detachKey();
      if (skipSearchFocus || typeof o.focus !== "function" || !loose()) return;
      try {
        const target = o.focus();
        if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
        if (target && held && ("value" in target)) {
          target.value = (target.value || "") + held;
          held = "";
          const Ev = (win && win.Event) || (typeof Event === "function" ? Event : null);
          if (Ev && typeof target.dispatchEvent === "function") target.dispatchEvent(new Ev("input", { bubbles: true }));
        }
      } catch (err) {}
    });

    if (isStillMotion) {
      /* NO OPENING UNDER REDUCED MOTION (Max, 2026-11-03 02:33, the designer's recommendation): nothing is drawn over the
         window, which shows as soon as the page is ready, the corner mark still. */
      armFailsafe();
      waitReady.then(() => giveWay("still"));
      return {
        get reason() { return state.reason; },
        get ended() { return state.ended; },
        get isStill() { return state.isStill; },
        get holdMs() { return state.holdMs; },
        get ms() { return state.ms; },
        get clockMs() { return 0; },
        k: { get ms() { return 0; } },
        giveWay
      };
    }

    function renderFrame(now) {
      try { drawFrame(now); } catch (err) { giveWay("error"); }
    }
    function drawFrame(now) {
      if (state.ended) return;
      const dt = Math.max(0, now - lastFrameTime);
      if (framed) noteGap(dt);
      const step = Math.min(dt, 2 * frameGap);
      framed = true;
      lastFrameTime = Math.max(lastFrameTime, now);
      openingMs += step;
      const t = openingMs / 1000;
      const curW = (win && win.innerWidth) || 1280;
      const curH = (win && win.innerHeight) || 880;
      const fig = figureAt(t, curW, curH);
      currentOpeningFig = fig;

      if (t >= TIMING.STILL_UNTIL) {
        syncCornerPhase(fig.phi);
      }

      if (ctx) {
        const dpr = (win && win.devicePixelRatio) || 1;
        const bw = Math.round(curW * dpr), bh = Math.round(curH * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw; canvas.height = bh;
          if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          else if (ctx.scale) ctx.scale(dpr, dpr);
        }
        const ground = getGroundRgb(doc);
        if (ctx.clearRect) ctx.clearRect(0, 0, curW, curH);
        if (fig.ground > 0 && ctx.fillStyle && ctx.fillRect) {
          ctx.fillStyle = rgb(ground);
          ctx.globalAlpha = fig.ground;
          ctx.fillRect(0, 0, curW, curH);
          ctx.globalAlpha = 1;
        }
        const curColour = Array.isArray(fig.colour) ? fig.colour : INK_RGB;
        drawLine(ctx, fig.phi, fig, {
          depth: fig.depth,
          far: 0.4,
          colour: curColour,
          bg: mix(ground, curColour, fig.ground),
          alpha: fig.alpha
        });
      }

      if (t >= TIMING.ARRIVE) {
        const waitReady = (win && win.Promise ? win.Promise.resolve(o.ready) : Promise.resolve(o.ready));
        waitReady.then(() => giveWay("time"));
        return;
      }

      if (!state.ended && win && win.requestAnimationFrame) {
        rafId = win.requestAnimationFrame(renderFrame);
      }
    }

    armFailsafe();
    lastFrameTime = (win && win.performance ? win.performance.now() : Date.now());
    if (win && !(win.__stubNoFramesAndNeverReady) && win.requestAnimationFrame) {
      rafId = win.requestAnimationFrame(renderFrame);
    }

    return {
      get reason() { return state.reason; },
      get ended() { return state.ended; },
      get isStill() { return state.isStill; },
      get holdMs() { return state.holdMs; },
      get ms() { return state.ms; },
      get clockMs() { return openingMs; },
      k: { get ms() { return openingMs; } },
      giveWay
    };
  }

  return {
    OPENING_INK,
    PHI_ICON,
    CORNER_BOX,
    W0,
    KF,
    LW,
    HOLD_MS,
    TIMING,
    WHITE,
    INK_RGB,
    pt,
    lerpAt,
    cornerTarget,
    CORNER_FRAME,
    TURN_FAR,
    turnPieces,
    bigTarget,
    cornerPhase,
    figureAt,
    drawLine,
    getGroundRgb,
    syncCornerPhase,
    getCornerPhase: () => cornerClockPhi,
    wireStudioCorner,
    openingMark,
    fifthLinePath,
    fifthRadius
  };
});
