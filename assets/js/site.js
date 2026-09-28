/* Chinmay Dhamapurkar — portfolio v2.
   Libraries (loaded before this file): GSAP + ScrollTrigger + SplitText, Three.js r128, Lenis.
   Everything degrades: without GSAP the page is static, without WebGL there is no particle field. */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var G = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  var hasG = !!(G && ST);
  if (hasG) { G.registerPlugin(ST); if (Split) G.registerPlugin(Split); }

  var EMAIL = "chinmaydhamapurkar25@gmail.com";
  var LINKS = {
    resume: "https://drive.google.com/file/d/1wLrzhoIugxGx7Su0iX0xDXsr2o21ejp7/view?usp=sharing",
    linkedin: "https://www.linkedin.com/in/chinmay-dhamapurkar-b9a712155/",
    github: "https://github.com/chinmaydhama"
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function isSmall() { return window.innerWidth < 900; }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = r() || 1e-6, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ================================================================
     Smooth scroll
     ================================================================ */
  var lenis = null;
  if (hasG && window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var el = document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(el);
  });

  /* ================================================================
     Particle field (Three.js)
     ================================================================ */
  var field = (function () {
    var canvas = $("#gl");
    var THREE = window.THREE;
    if (!THREE || !canvas) return null;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return null; }
    if (!renderer || !renderer.getContext()) return null;

    var small = isSmall();
    var N = small ? 5000 : 9000;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    /* ---------- formations ---------- */
    var SHAPES = {};
    function make(name, seed, fn, dy) {
      var a = new Float32Array(N * 3), r = mulberry(seed);
      for (var i = 0; i < N; i++) {
        var p = fn(i, r);
        a[i * 3] = p[0]; a[i * 3 + 1] = p[1] + (dy || 0); a[i * 3 + 2] = p[2];
      }
      SHAPES[name] = a;
    }
    function sph(r, R, c) {
      var u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      return [c[0] + Math.cos(th) * s * R, c[1] + u * R, c[2] + Math.sin(th) * s * R];
    }

    // Hero / contact: a system, seen from outside
    make("sphere", 1, function (i, r) {
      var y = 1 - (2 * (i + 0.5)) / N, rad = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
      var R = 2.05 + (r() - 0.5) * 0.06 + (r() < 0.05 ? r() * 1.1 : 0);
      return [Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R];
    });

    // Manifesto / pattern: nine stacked layers
    make("layers", 2, function (i, r) {
      var k = i % 9, y = -1.7 + k * 0.425, s = 1.35, u, v;
      if (r() < 0.24) {
        var t = r() * 4, e = Math.floor(t), f = t - e;
        var P = [[-s, -s], [s, -s], [s, s], [-s, s]], a = P[e], b = P[(e + 1) % 4];
        u = a[0] + (b[0] - a[0]) * f; v = a[1] + (b[1] - a[1]) * f;
      } else {
        u = (Math.floor(r() * 13) / 12 * 2 - 1) * s; v = (r() * 2 - 1) * s;
        if (r() < 0.5) { var tmp = u; u = v; v = tmp; }
      }
      return [u, y, v];
    });

    // 01: a gear
    make("gear", 3, function (i, r) {
      var q = r(), a, rad, b;
      if (q < 0.42) { a = r() * Math.PI * 2; b = r() * Math.PI * 2; return [(1.45 + 0.16 * Math.cos(b)) * Math.cos(a), (1.45 + 0.16 * Math.cos(b)) * Math.sin(a), 0.16 * Math.sin(b)]; }
      if (q < 0.75) { var teeth = 18, k = Math.floor(r() * teeth); a = ((k + 0.5 + (r() - 0.5) * 0.42) / teeth) * Math.PI * 2; rad = 1.62 + r() * 0.42; return [Math.cos(a) * rad, Math.sin(a) * rad, (r() - 0.5) * 0.3]; }
      if (q < 0.87) { a = r() * Math.PI * 2; b = r() * Math.PI * 2; return [(0.42 + 0.1 * Math.cos(b)) * Math.cos(a), (0.42 + 0.1 * Math.cos(b)) * Math.sin(a), 0.1 * Math.sin(b)]; }
      var sp = Math.floor(r() * 6); a = (sp / 6) * Math.PI * 2 + (r() - 0.5) * 0.06; rad = 0.5 + r() * 0.9;
      return [Math.cos(a) * rad, Math.sin(a) * rad, (r() - 0.5) * 0.08];
    });

    // 02: logistics routes between hubs
    (function () {
      var hr = mulberry(99), hubs = [], edges = [], seen = {};
      for (var h = 0; h < 9; h++) {
        var ang = (h / 9) * Math.PI * 2 + hr() * 0.5, rad = h === 0 ? 0 : 1.1 + hr() * 1.25;
        hubs.push([Math.cos(ang) * rad, 0, Math.sin(ang) * rad * 0.8]);
      }
      hubs.forEach(function (A, ai) {
        var ds = hubs.map(function (B, bi) { return [bi, Math.pow(B[0] - A[0], 2) + Math.pow(B[2] - A[2], 2)]; })
          .filter(function (d) { return d[0] !== ai; }).sort(function (x, y) { return x[1] - y[1]; });
        for (var m = 0; m < 2; m++) {
          var bi = ds[m][0], key = Math.min(ai, bi) + "-" + Math.max(ai, bi);
          if (!seen[key]) { seen[key] = 1; edges.push([ai, bi]); }
        }
        if (ai > 0 && !seen["0-" + ai] && hr() < 0.4) { seen["0-" + ai] = 1; edges.push([0, ai]); }
      });
      make("routes", 4, function (i, r) {
        var q = r();
        if (q < 0.7) {
          var E = edges[Math.floor(r() * edges.length)], A = hubs[E[0]], B = hubs[E[1]], t = r();
          var len = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[2] - A[2], 2));
          var C = [(A[0] + B[0]) / 2, 0.25 + len * 0.35, (A[2] + B[2]) / 2], u = 1 - t;
          return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0] + gauss(r) * 0.012,
                  u * u * A[1] + 2 * u * t * C[1] + t * t * B[1] + gauss(r) * 0.012,
                  u * u * A[2] + 2 * u * t * C[2] + t * t * B[2] + gauss(r) * 0.012];
        }
        if (q < 0.86) { var H = hubs[Math.floor(r() * hubs.length)]; return [H[0] + gauss(r) * 0.07, Math.abs(gauss(r)) * 0.08, H[2] + gauss(r) * 0.07]; }
        var s = 2.7, t2 = r() * 2 - 1, line = Math.round((r() * 2 - 1) * 8) / 8;
        return r() < 0.5 ? [t2 * s, 0, line * s * 0.8] : [line * s, 0, t2 * s * 0.8];
      }, -0.35);
    })();

    // 03: a charging grid
    make("lattice", 5, function (i, r) {
      var g = 40, s = 2.7;
      if (r() < 0.84) {
        var gx = Math.floor(r() * g), gz = Math.floor(r() * g), along = r(), onX = r() < 0.5;
        return [-s + ((gx + (onX ? along : 0)) / (g - 1)) * 2 * s, 0, -s + ((gz + (onX ? 0 : along)) / (g - 1)) * 2 * s];
      }
      var cx = Math.floor(r() * 8), cz = Math.floor(r() * 8);
      return [-s + ((cx + 0.5) / 8) * 2 * s + (r() - 0.5) * 0.03, r() * 0.5, -s + ((cz + 0.5) / 8) * 2 * s + (r() - 0.5) * 0.03];
    }, -0.2);

    // 04: a campus of buildings
    (function () {
      var cr = mulberry(4242), blocks = [], total = 0;
      for (var bx = -3; bx <= 3; bx++) for (var bz = -3; bz <= 3; bz++) {
        if (cr() < 0.2) continue;
        var hgt = 0.15 + Math.pow(cr(), 2.2) * 2.0;
        blocks.push({ x: bx * 0.72, z: bz * 0.72, w: 0.24 + cr() * 0.08, d: 0.24 + cr() * 0.08, h: hgt });
        total += hgt + 0.4;
      }
      make("campus", 6, function (i, r) {
        if (r() < 0.1) {
          var s = 2.6, t = r() * 2 - 1, line = Math.round((r() * 2 - 1) * 7) / 7;
          return r() < 0.5 ? [t * s, 0, line * s] : [line * s, 0, t * s];
        }
        var pick = r() * total, b = blocks[0];
        for (var k = 0; k < blocks.length; k++) { pick -= blocks[k].h + 0.4; if (pick <= 0) { b = blocks[k]; break; } }
        var sx = r() < 0.5 ? -1 : 1, sz = r() < 0.5 ? -1 : 1, q = r(), t2 = r() * 2 - 1;
        if (q < 0.5) return [b.x + sx * b.w, r() * b.h, b.z + sz * b.d];
        if (q < 0.78) { var yy = r() < 0.7 ? b.h : 0; return r() < 0.5 ? [b.x + t2 * b.w, yy, b.z + sz * b.d] : [b.x + sx * b.w, yy, b.z + t2 * b.d]; }
        var floors = Math.max(1, Math.round(b.h / 0.13)), yf = (Math.floor(r() * floors) / floors) * b.h + 0.065;
        return r() < 0.5 ? [b.x + t2 * b.w, yf, b.z + sz * b.d] : [b.x + sx * b.w, yf, b.z + t2 * b.d];
      }, -0.75);
    })();

    // 05: a router and five agents
    (function () {
      var agents = [];
      for (var k = 0; k < 5; k++) {
        var an = -Math.PI / 2 + (k / 5) * Math.PI * 2;
        agents.push([Math.cos(an) * 1.9, Math.sin(an) * 1.9, k % 2 ? 0.35 : -0.35]);
      }
      make("network", 7, function (i, r) {
        var q = r();
        if (q < 0.14) return sph(r, 0.4, [0, 0, 0]);
        if (q < 0.5) return sph(r, 0.24 + r() * 0.08, agents[Math.floor(r() * 5)]);
        var t = r();
        if (q < 0.9) {
          var A = agents[Math.floor(r() * 5)], bul = Math.sin(t * Math.PI) * 0.22;
          return [A[0] * t - A[1] * bul * 0.3 + gauss(r) * 0.012, A[1] * t + A[0] * bul * 0.3 + gauss(r) * 0.012, A[2] * t];
        }
        var j = Math.floor(r() * 5), B = agents[j], C = agents[(j + 1) % 5];
        return [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t, B[2] + (C[2] - B[2]) * t];
      });
    })();

    // 06: a galaxy of co-mentioned entities
    (function () {
      var gr = mulberry(777), nodes = [], links = [];
      for (var k = 0; k < 22; k++) {
        var arm = k % 3, rr = 0.5 + gr() * 2.0, an = (arm / 3) * Math.PI * 2 + rr * 1.9 + (gr() - 0.5) * 0.4;
        nodes.push([Math.cos(an) * rr, (gr() - 0.5) * 0.3, Math.sin(an) * rr]);
      }
      for (k = 0; k < 26; k++) {
        var a = Math.floor(gr() * nodes.length), b = Math.floor(gr() * nodes.length);
        if (a !== b) links.push([a, b]);
      }
      make("galaxy", 8, function (i, r) {
        var q = r();
        if (q < 0.5) {
          var arm2 = Math.floor(r() * 3), rr2 = Math.pow(r(), 0.7) * 2.5 + 0.08, an2 = (arm2 / 3) * Math.PI * 2 + rr2 * 1.9, sp = 0.1 + rr2 * 0.08;
          return [Math.cos(an2) * rr2 + gauss(r) * sp, gauss(r) * 0.05 * (2.6 - rr2), Math.sin(an2) * rr2 + gauss(r) * sp];
        }
        if (q < 0.72) { var n = nodes[Math.floor(r() * nodes.length)], s = 0.05 + r() * 0.06; return [n[0] + gauss(r) * s, n[1] + gauss(r) * s, n[2] + gauss(r) * s]; }
        if (q < 0.93) {
          var L = links[Math.floor(r() * links.length)], A = nodes[L[0]], B = nodes[L[1]], t = r();
          return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 0.15, A[2] + (B[2] - A[2]) * t];
        }
        return sph(r, 0.22, [0, 0, 0]);
      });
    })();

    // Intro: a loose cloud that condenses into the sphere
    make("cloud", 9, function (i, r) {
      return [gauss(r) * 3.2, gauss(r) * 2.2, gauss(r) * 2.6];
    });

    // The avatar scene: particles frame the holographic portrait as a halo and a starfield behind it
    make("face", 10, function (i, r) {
      var q = r(), a = r() * Math.PI * 2;
      if (q < 0.34) { var rr0 = 2.22 + gauss(r) * 0.03; return [Math.cos(a) * rr0, Math.sin(a) * rr0, gauss(r) * 0.04 - 0.3]; }
      if (q < 0.5) { var rr1 = 2.5 + gauss(r) * 0.06; return [Math.cos(a) * rr1, Math.sin(a) * rr1 * 0.98, gauss(r) * 0.08 - 0.5]; }
      var rad = Math.sqrt(r()) * 3.1;
      return [Math.cos(a) * rad, Math.sin(a) * rad, -1.1 - r() * 1.8];
    });

    var CONF = {
      face:    { rx: 0.0,  vy: 0,    vz: 0,    wave: 0 },
      sphere:  { rx: 0.2,  vy: 0.06, vz: 0,    wave: 0 },
      layers:  { rx: 0.5,  vy: 0.09, vz: 0,    wave: 0 },
      gear:    { rx: -0.2, vy: 0.0,  vz: 0.16, wave: 0 },
      routes:  { rx: 0.62, vy: 0.05, vz: 0,    wave: 0 },
      lattice: { rx: 0.6,  vy: 0.04, vz: 0,    wave: 1 },
      campus:  { rx: 0.48, vy: 0.07, vz: 0,    wave: 0 },
      network: { rx: 0.1,  vy: 0.05, vz: 0,    wave: 0 },
      galaxy:  { rx: 0.9,  vy: 0.05, vz: 0,    wave: 0 }
    };

    /* ---------- geometry + shader ---------- */
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(SHAPES.cloud);
    var to = new Float32Array(SHAPES.sphere);
    var rnd = new Float32Array(N);
    var rr = mulberry(31337);
    for (var i = 0; i < N; i++) rnd[i] = rr();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(to, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));

    var uni = {
      uMix: { value: 0 }, uTime: { value: 0 }, uSize: { value: small ? 2.9 : 2.5 }, uPR: { value: DPR },
      uWave: { value: 0 }, uAgit: { value: 0 }, uOpacity: { value: 1 },
      uThink: { value: 0 }, uPulse: { value: 0 }, uScan: { value: 0 },
      uColor: { value: new THREE.Color("#8fd3f4") }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        "attribute vec3 aTo;",
        "attribute float aRand;",
        "uniform float uMix, uTime, uSize, uPR, uWave, uAgit, uThink, uPulse;",
        "varying float vRand;",
        "varying float vDepth;",
        "varying float vY;",
        "void main(){",
        "  float k = clamp((uMix - aRand * 0.35) / 0.65, 0.0, 1.0);",
        "  k = k * k * (3.0 - 2.0 * k);",
        "  vec3 p = mix(position, aTo, k);",
        "  float mid = sin(k * 3.14159265);",
        "  p += normalize(p + vec3(0.0001)) * mid * 0.35 * (aRand - 0.3);",
        "  p.y += sin(p.x * 1.7 + uTime * 1.3) * cos(p.z * 1.3 + uTime * 0.9) * 0.16 * uWave;",
        "  float slice = floor(p.y * 16.0);",
        "  float glitch = step(0.93, fract(sin(slice * 12.9898 + floor(uTime * 9.0)) * 43758.5453));",
        "  p.x += glitch * uThink * 0.16 * (fract(slice * 0.37) - 0.5) * 2.0;",
        "  float amp = 0.012 + uAgit * 0.09 + uThink * 0.07;",
        "  p += amp * vec3(sin(uTime * 0.9 + aRand * 40.0), cos(uTime * 0.8 + aRand * 25.0), sin(uTime * 0.7 + aRand * 13.0));",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = uSize * uPR * (0.55 + aRand * 0.9) * (7.0 / -mv.z) * (1.0 + uPulse * 0.9 * aRand);",
        "  vRand = aRand;",
        "  vY = p.y;",
        "  vDepth = -mv.z;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor;",
        "uniform float uOpacity, uScan;",
        "varying float vRand;",
        "varying float vDepth;",
        "varying float vY;",
        "void main(){",
        "  vec2 c = gl_PointCoord - 0.5;",
        "  float d = length(c);",
        "  if (d > 0.5) discard;",
        "  float a = smoothstep(0.5, 0.0, d);",
        "  a *= a;",
        "  vec3 col = mix(uColor, vec3(1.0), step(0.93, vRand) * 0.75);",
        "  float fade = clamp(1.35 - (vDepth - 5.0) * 0.18, 0.25, 1.0);",
        "  float band = smoothstep(0.35, 0.0, abs(vY - uScan));",
        "  col += band * 0.55;",
        "  float lines = 0.8 + 0.2 * step(0.5, fract(gl_FragCoord.y / 3.0));",
        "  gl_FragColor = vec4(col, a * uOpacity * fade * lines * (0.35 + vRand * 0.65 + band * 0.4));",
        "}"
      ].join("\n")
    });
    var points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    var spin = new THREE.Group();
    var group = new THREE.Group();
    spin.add(points);
    group.add(spin);
    scene.add(group);

    /* ---------- the avatar: CD-01, a small robot twin ---------- */
    var reveal = { v: 0 }, agentMode = "idle", talkAmp = 0;
    var av = { blinkAt: -9, nextBlink: 2, happyUntil: 0, nod: 0 };
    var avatar = new THREE.Group();
    avatar.position.set(0, 0.25, 0.2);
    avatar.visible = false;
    group.add(avatar);
    var hemi = new THREE.HemisphereLight(0xe4ecff, 0x0b1119, 0.5);
    var keyL = new THREE.DirectionalLight(0xffffff, 0.78);
    keyL.position.set(-2.5, 3.2, 4);
    var rimL = new THREE.PointLight(0x8fd3f4, 2.4, 12);
    rimL.position.set(2.6, -0.6, -2.4);
    scene.add(hemi, keyL, rimL);
    function std(color, rough, metal) { return new THREE.MeshStandardMaterial({ color: color, roughness: rough, metalness: metal, transparent: true }); }
    var shell = std(0xdfe5ec, 0.34, 0.06), visorM = std(0x070b11, 0.12, 0.55), jointM = std(0x98a4b5, 0.45, 0.3);
    var solids = [shell, visorM, jointM], glowMats = [];
    function glowM() { var m = new THREE.MeshBasicMaterial({ color: 0x8fd3f4, transparent: true }); glowMats.push(m); return m; }
    function add(parent, geo, m, x, y, z) { var o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); parent.add(o); return o; }

    var head = new THREE.Group();
    avatar.add(head);
    add(head, new THREE.SphereGeometry(1.15, 48, 36), shell).scale.set(1.06, 0.94, 1);
    add(head, new THREE.SphereGeometry(1, 48, 32), visorM, 0, -0.02, 0.72).scale.set(0.9, 0.56, 0.5);
    // a soft glossy highlight on the visor glass
    var shine = add(head, new THREE.SphereGeometry(0.12, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 }), -0.44, 0.2, 1.13);
    shine.scale.set(2.4, 0.45, 0.2);
    shine.rotation.z = 0.32;
    var eyes = [-0.3, 0.3].map(function (x) {
      var g = new THREE.Group();
      g.position.set(x, 0.08, 1.2);
      head.add(g);
      var oval = add(g, new THREE.SphereGeometry(0.1, 24, 16), glowM());
      oval.scale.set(1, 1.35, 0.3);
      var happy = add(g, new THREE.TorusGeometry(0.1, 0.028, 8, 24, Math.PI), glowM(), 0, -0.04, 0);
      var loader = add(g, new THREE.TorusGeometry(0.09, 0.022, 8, 24, Math.PI * 1.3), glowM());
      happy.visible = loader.visible = false;
      return { g: g, x: x, oval: oval, happy: happy, loader: loader };
    });
    var mouth = [];
    for (var mi = 0; mi < 5; mi++) mouth.push(add(head, new THREE.BoxGeometry(0.05, 0.07, 0.02), glowM(), (mi - 2) * 0.088, -0.25, 1.165));
    [-1, 1].forEach(function (s) {
      add(head, new THREE.CylinderGeometry(0.3, 0.3, 0.26, 40), shell, s * 1.17, -0.02, 0).rotation.z = Math.PI / 2;
      add(head, new THREE.TorusGeometry(0.2, 0.03, 10, 40), glowM(), s * 1.31, -0.02, 0).rotation.y = Math.PI / 2;
    });
    add(head, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), jointM, 0, 1.2, 0);
    var bulb = add(head, new THREE.SphereGeometry(0.1, 20, 16), glowM(), 0, 1.45, 0);

    var body = new THREE.Group();
    body.position.set(0, -1.72, 0);
    avatar.add(body);
    add(body, new THREE.SphereGeometry(0.9, 40, 28), shell).scale.set(1, 0.62, 0.72);
    add(body, new THREE.TorusGeometry(0.42, 0.06, 12, 40), jointM, 0, 0.5, 0).rotation.x = Math.PI / 2;
    add(body, new THREE.TorusGeometry(0.16, 0.025, 10, 36), glowM(), 0, 0.05, 0.655);
    var chest = add(body, new THREE.CircleGeometry(0.1, 28), glowM(), 0, 0.05, 0.66);
    window.CD_FACE = "ready";

    function updateAvatar(t) {
      var rv = reveal.v;
      avatar.visible = rv > 0.001;
      if (!avatar.visible) return;
      avatar.scale.setScalar(0.95 * (0.55 + 0.45 * rv));
      solids.forEach(function (m) { m.opacity = rv; });
      glowMats.forEach(function (m) { m.opacity = rv; m.color.copy(uni.uColor.value); });
      shine.material.opacity = 0.16 * rv;
      rimL.color.copy(uni.uColor.value);
      var still = reduce ? 0 : 1;
      avatar.position.y = 0.25 + Math.sin(t * 1.3) * 0.06 * still;
      body.position.y = -1.72 + Math.sin(t * 1.3 - 0.6) * 0.04 * still;
      head.rotation.y += (mouse.x * 0.45 - head.rotation.y) * 0.08;
      head.rotation.x += (mouse.y * 0.25 + av.nod - head.rotation.x) * 0.08;
      head.rotation.z = Math.sin(t * 0.7) * 0.03 * still + (agentMode === "listening" ? 0.09 : 0);
      av.nod *= 0.85;
      var thinking = agentMode === "routing" || agentMode === "retrieving", happy = t < av.happyUntil;
      if (t > av.nextBlink) { av.blinkAt = t; av.nextBlink = t + 2.5 + Math.random() * 3.5; }
      var bl = reduce ? 0 : Math.max(0, 1 - Math.abs(t - av.blinkAt - 0.07) / 0.07);
      eyes.forEach(function (e, i) {
        e.g.position.x = e.x + mouse.x * 0.05;
        e.g.position.y = 0.08 - mouse.y * 0.03;
        e.oval.visible = !thinking && !happy;
        e.happy.visible = happy && !thinking;
        e.loader.visible = thinking;
        e.oval.scale.y = 1.35 * (1 - bl * 0.9);
        e.loader.rotation.z = -t * 7 + i;
      });
      mouth.forEach(function (b, i) {
        var h = agentMode === "speaking" ? 0.35 + talkAmp * 2.2 * (0.4 + 0.6 * Math.abs(Math.sin(t * 14 + i * 1.7)))
          : agentMode === "listening" ? 0.4 + 0.7 * Math.max(0, Math.sin(t * 5 - i * 0.8)) : 0.35;
        b.scale.y = h;
      });
      bulb.scale.setScalar(1 + (thinking ? 0.4 * Math.abs(Math.sin(t * 8)) : 0.1 * Math.sin(t * 2) * still));
      chest.scale.setScalar(0.85 + (agentMode === "speaking" ? 0.25 + talkAmp * 0.5 : 0.12 * Math.sin(t * 2) * still));
    }

    var state = { rx: CONF.sphere.rx, vy: CONF.sphere.vy, vz: 0 };
    var cur = "sphere";
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var layoutMode = "right";

    function layoutTarget(mode) {
      var sm = isSmall();
      if (sm) return { x: 0, y: mode === "center" ? 0 : 0.6, s: 0.72, o: mode === "dim" ? 0.25 : 0.55 };
      if (mode === "center") return { x: 0, y: 0, s: 0.95, o: 0.7 };
      if (mode === "chat") {
        var half = Math.tan((21 * Math.PI) / 180) * 7.2 * (window.innerWidth / window.innerHeight);
        var freeCenter = (window.innerWidth - 470) / 2;
        return { x: ((freeCenter / window.innerWidth) * 2 - 1) * half, y: -0.1, s: 0.98, o: 1 };
      }
      if (mode === "dim") return { x: 0, y: 0, s: 1.25, o: 0.22 };
      var aspect = window.innerWidth / window.innerHeight;
      return { x: Math.min(2.3, 1.05 * aspect), y: 0, s: 0.92, o: 1 };
    }
    function applyLayout(mode, instant) {
      layoutMode = mode;
      var t = layoutTarget(mode);
      if (instant || !hasG || reduce) {
        group.position.set(t.x, t.y, 0); group.scale.setScalar(t.s); uni.uOpacity.value = t.o;
        return;
      }
      G.to(group.position, { x: t.x, y: t.y, duration: 1.8, ease: "expo.inOut", overwrite: true });
      G.to(group.scale, { x: t.s, y: t.s, z: t.s, duration: 1.8, ease: "expo.inOut", overwrite: true });
      G.to(uni.uOpacity, { value: t.o, duration: 1.2, overwrite: true });
    }

    function bake() {
      var m = uni.uMix.value;
      for (var i = 0; i < N; i++) {
        var k = Math.min(1, Math.max(0, (m - rnd[i] * 0.35) / 0.65));
        k = k * k * (3 - 2 * k);
        var i3 = i * 3;
        var x = pos[i3] + (to[i3] - pos[i3]) * k;
        var y = pos[i3 + 1] + (to[i3 + 1] - pos[i3 + 1]) * k;
        var z = pos[i3 + 2] + (to[i3 + 2] - pos[i3 + 2]) * k;
        var mid = Math.sin(k * Math.PI) * 0.35 * (rnd[i] - 0.3);
        var l = Math.sqrt(x * x + y * y + z * z) || 1;
        pos[i3] = x + (x / l) * mid; pos[i3 + 1] = y + (y / l) * mid; pos[i3 + 2] = z + (z / l) * mid;
      }
    }

    function setScene(name) {
      if (!SHAPES[name] || name === cur) return;
      cur = name;
      bake();
      to.set(SHAPES[name]);
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aTo.needsUpdate = true;
      var c = CONF[name];
      if (!hasG || reduce) {
        uni.uMix.value = 1; uni.uWave.value = c.wave; reveal.v = name === "face" ? 1 : 0; state.rx = c.rx; state.vy = c.vy; state.vz = c.vz;
        spin.rotation.z = 0; spin.rotation.y = 0;
        render();
        return;
      }
      uni.uMix.value = 0;
      G.to(uni.uMix, { value: 1, duration: 2.1, ease: "power2.inOut", overwrite: true });
      G.to(uni.uWave, { value: c.wave, duration: 1.4, overwrite: true });
      G.to(reveal, { v: name === "face" ? 1 : 0, duration: name === "face" ? 1.4 : 0.7, ease: name === "face" ? "back.out(1.6)" : "power2.in", overwrite: true });
      G.to(state, { rx: c.rx, vy: c.vy, vz: c.vz, duration: 1.8, ease: "power2.inOut", overwrite: true });
      var twoPi = Math.PI * 2, unwind = {};
      if (!c.vz) unwind.z = Math.round(spin.rotation.z / twoPi) * twoPi;
      if (!c.vy) unwind.y = Math.round(spin.rotation.y / twoPi) * twoPi;
      if (unwind.y !== undefined || unwind.z !== undefined) {
        unwind.duration = 1.8; unwind.ease = "power2.inOut"; unwind.overwrite = true;
        G.to(spin.rotation, unwind);
      }
    }

    function setColor(hex) {
      var c = new THREE.Color(hex);
      if (!hasG || reduce) { uni.uColor.value.copy(c); render(); return; }
      G.to(uni.uColor.value, { r: c.r, g: c.g, b: c.b, duration: 1.4, ease: "power2.out", overwrite: true });
    }

    function intro() {
      if (!hasG || reduce) { uni.uMix.value = 1; render(); return; }
      G.to(uni.uMix, { value: 1, duration: 2.2, ease: "expo.out" });
    }

    var last = performance.now() / 1000;
    function render() {
      var t = performance.now() / 1000, dt = Math.min(0.05, t - last);
      last = t;
      uni.uTime.value = t;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      group.rotation.x = state.rx + mouse.y * 0.14;
      // a flat projection should only turn a little toward the cursor
      group.rotation.y = mouse.x * (0.3 - 0.24 * Math.min(1, reveal.v));
      if (!reduce) {
        spin.rotation.y += state.vy * dt;
        spin.rotation.z += state.vz * dt;
      }
      var v = lenis ? Math.min(1, Math.abs(lenis.velocity) / 45) : 0;
      uni.uAgit.value += (v - uni.uAgit.value) * 0.08;
      uni.uPulse.value *= 0.9;
      talkAmp *= 0.86;
      updateAvatar(t);
      uni.uScan.value = reduce ? 9 : Math.sin(t * 0.55) * 2.6;
      renderer.render(scene, camera);
      if (hudOn && hudEl) placeHud();
    }

    var hudEl = document.getElementById("hud"), hudOn = false, hudR = 0, pv = new THREE.Vector3();
    function project() {
      pv.set(group.position.x, group.position.y, 0).project(camera);
      var x = ((pv.x + 1) / 2) * window.innerWidth, y = ((1 - pv.y) / 2) * window.innerHeight;
      pv.set(group.position.x + 2.05 * group.scale.x, group.position.y, 0).project(camera);
      return { x: x, y: y, r: Math.abs(((pv.x + 1) / 2) * window.innerWidth - x) };
    }
    function placeHud() {
      var q = project();
      if (Math.abs(q.r - hudR) > 1) { hudR = q.r; hudEl.style.width = hudEl.style.height = 2 * q.r + "px"; }
      hudEl.style.transform = "translate3d(" + (q.x - hudR) + "px," + (q.y - hudR) + "px,0)";
    }
    function setHud(on) {
      hudOn = on;
      if (hudEl) { hudEl.classList.toggle("is-on", on); if (on) placeHud(); }
    }
    function setAgent(mode) {
      if (agentMode === "speaking" && mode === "idle") av.happyUntil = performance.now() / 1000 + 1.3;
      agentMode = mode;
      if (reduce) render();
      var think = mode === "routing" || mode === "retrieving" ? 1 : 0;
      if (hasG && !reduce) G.to(uni.uThink, { value: think, duration: 0.6, overwrite: true });
      else uni.uThink.value = think;
      if (hudEl) { hudEl.classList.toggle("is-think", !!think); hudEl.classList.toggle("is-speak", mode === "speaking"); }
    }
    function pulse(a) { uni.uPulse.value = Math.max(uni.uPulse.value, Math.min(1, a)); }
    function talk(a) { talkAmp = Math.max(talkAmp, Math.min(1, a)); av.nod = Math.min(0.12, av.nod + 0.03); }

    window.addEventListener("pointermove", function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener("resize", function () {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      applyLayout(layoutMode, true);
      if (reduce) render();
    });

    applyLayout("right", true);
    if (hasG && !reduce) G.ticker.add(render);
    else { uni.uMix.value = 1; render(); }

    return { setScene: setScene, setColor: setColor, setLayout: applyLayout, intro: intro, setHud: setHud, setAgent: setAgent, pulse: pulse, talk: talk };
  })();

  /* ================================================================
     Scene activation: accent, particles, nav status, rail
     ================================================================ */
  var nsText = $("#ns-text");
  var railLinks = $$(".rail a");
  var activeSec = null;

  function setStatus(txt) {
    if (!nsText || nsText.textContent === txt) return;
    if (!hasG || reduce) { nsText.textContent = txt; return; }
    G.timeline()
      .to(nsText, { yPercent: -120, opacity: 0, duration: 0.22, ease: "power2.in" })
      .add(function () { nsText.textContent = txt; })
      .fromTo(nsText, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
  }

  function activate(sec) {
    if (!sec || activeSec === sec) return;
    activeSec = sec;
    var accent = sec.getAttribute("data-accent");
    if (hasG && !reduce) G.to(html, { "--accent": accent, duration: 1.1, ease: "power2.out", overwrite: true });
    else html.style.setProperty("--accent", accent);
    if (field) {
      field.setScene(sec.getAttribute("data-scene"));
      field.setColor(accent);
      field.setLayout(layoutFor(sec));
    }
    setStatus(sec.getAttribute("data-label"));
    railLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + sec.id); });
    if (field) field.setHud(sec.id === "top" || sec.id === "contact");
    html.classList.toggle("on-hero", sec.id === "top");
    activeListeners.forEach(function (fn) { fn(sec); });
  }
  var activeListeners = [];
  function layoutFor(sec) {
    var m = sec.getAttribute("data-layout") || "right";
    if (sec.id === "top" && html.classList.contains("agent-open") && !isSmall()) m = "chat";
    return m;
  }

  var scenes = $$("[data-scene]");
  if (hasG) {
    scenes.forEach(function (sec) {
      ST.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 55%",
        onEnter: function () { activate(sec); },
        onEnterBack: function () { activate(sec); }
      });
    });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(en.target); });
    }, { rootMargin: "-50% 0px -50% 0px" });
    scenes.forEach(function (s) { io.observe(s); });
  }
  activate(scenes[0]);

  /* ================================================================
     Scroll choreography
     ================================================================ */
  var heroTween = null, introDone = false;

  if (hasG && !reduce) {
    // Progress bar
    ST.create({ start: 0, end: "max", onUpdate: function (self) { G.set(".progress", { scaleX: self.progress }); } });

    // Hero headline: masked line reveal, played after the intro
    var h1 = $(".hero-title");
    if (h1 && Split) {
      Split.create(h1, {
        type: "lines", mask: "lines", autoSplit: true,
        onSplit: function (self) {
          heroTween = G.from(self.lines, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.07, paused: !introDone });
          return heroTween;
        }
      });
    }

    // Section titles: masked line reveals
    if (Split) {
      $$(".split").forEach(function (el) {
        Split.create(el, {
          type: "lines", mask: "lines", autoSplit: true,
          onSplit: function (self) {
            return G.from(self.lines, {
              yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 86%", once: true }
            });
          }
        });
      });
    }

    // Fade-up for body copy and panels
    var reveals = $$(".reveal");
    G.set(reveals, { y: 36, opacity: 0 });
    ST.batch(reveals, {
      start: "top 90%",
      once: true,
      onEnter: function (batch) { G.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }); }
    });

    // Manifesto: words light up as you scroll, section pinned
    var mt = $(".manifesto-text");
    if (mt && Split) {
      Split.create(mt, {
        type: "words", autoSplit: true,
        onSplit: function (self) {
          return G.fromTo(self.words, { opacity: 0.13 }, {
            opacity: 1, ease: "none", stagger: 0.1,
            scrollTrigger: { trigger: ".manifesto", start: "top top", end: "+=130%", scrub: 0.6, pin: true, anticipatePin: 1 }
          });
        }
      });
    }

    // Huge ghost numbers drift
    $$(".ch-ghost").forEach(function (g) {
      G.fromTo(g, { yPercent: 25 }, { yPercent: -25, ease: "none", scrollTrigger: { trigger: g.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // D.C. timeline fills as you read
    var dcf = $(".dc-fill");
    if (dcf) G.fromTo(dcf, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".dc-wrap", start: "top 85%", end: "top 40%", scrub: 0.6 } });

    // Counters
    $$("[data-count]").forEach(function (b) {
      var end = parseFloat(b.getAttribute("data-count")), dec = +(b.getAttribute("data-dec") || 0);
      var pre = b.getAttribute("data-pre") || "", suf = b.getAttribute("data-suf") || "";
      var fmt = function (v) {
        var s = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
        return pre + s + suf;
      };
      var o = { v: 0 };
      b.textContent = fmt(0);
      G.to(o, {
        v: end, duration: 1.8, ease: "power3.out",
        onUpdate: function () { b.textContent = fmt(o.v); },
        scrollTrigger: { trigger: b, start: "top 92%", once: true }
      });
    });
  }

  /* ================================================================
     02: forecast chart
     ================================================================ */
  (function forecast() {
    var svg = $("#fc-svg");
    if (!svg) return;
    var W = 560, H = 220, P = 18, n = 64, cut = 44, r = mulberry(11);
    var base = [], act = [];
    for (var i = 0; i < n; i++) {
      var b = 100 + 34 * Math.sin((i / n) * Math.PI * 4.4) + 12 * Math.sin((i / n) * Math.PI * 11) + i * 0.7;
      base.push(b);
      act.push(b + gauss(r) * 7);
    }
    var all = act.concat(base.map(function (v, i) { return v + (i > cut ? (i - cut) * 1.3 + 8 : 8); }), base.map(function (v, i) { return v - (i > cut ? (i - cut) * 1.3 + 8 : 8); }));
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    function X(i) { return P + (i / (n - 1)) * (W - 2 * P); }
    function Y(v) { return H - P - ((v - mn) / (mx - mn)) * (H - 2 * P - 14); }
    function line(arr, from, to) {
      var d = "";
      for (var i = from; i <= to; i++) d += (i === from ? "M" : "L") + X(i).toFixed(1) + "," + Y(arr[i]).toFixed(1);
      return d;
    }
    var up = "", dn = "";
    for (i = cut - 6; i < n; i++) {
      var w = i > cut ? (i - cut) * 1.3 + 8 : 8;
      up += (i === cut - 6 ? "M" : "L") + X(i).toFixed(1) + "," + Y(base[i] + w).toFixed(1);
    }
    for (i = n - 1; i >= cut - 6; i--) {
      var w2 = i > cut ? (i - cut) * 1.3 + 8 : 8;
      dn += "L" + X(i).toFixed(1) + "," + Y(base[i] - w2).toFixed(1);
    }
    var grid = "";
    for (var g = 0; g < 4; g++) {
      var gy = P + (g / 3) * (H - 2 * P);
      grid += '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + gy + '" y2="' + gy + '"></line>';
    }
    svg.innerHTML =
      '<g class="fc-grid">' + grid + "</g>" +
      '<path class="fc-band" d="' + up + dn + 'Z"></path>' +
      '<line class="fc-now" x1="' + X(cut) + '" x2="' + X(cut) + '" y1="' + P + '" y2="' + (H - P) + '"></line>' +
      '<text class="fc-txt" x="' + (X(cut) - 6) + '" y="' + (P + 10) + '" text-anchor="end">today</text>' +
      '<text class="fc-txt" x="' + (X(cut) + 6) + '" y="' + (P + 10) + '">forecast →</text>' +
      '<path class="fc-actual" d="' + line(act, 0, cut) + '"></path>' +
      '<path class="fc-pred" d="' + line(base, 0, n - 1) + '"></path>';
    if (hasG && !reduce) {
      $$(".fc-actual, .fc-pred", svg).forEach(function (p) {
        var len = p.getTotalLength();
        G.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: svg, start: "top 88%", end: "bottom 45%", scrub: 0.8 }
        });
      });
      G.from(".fc-band", { opacity: 0, scrollTrigger: { trigger: svg, start: "top 60%", end: "bottom 45%", scrub: true } });
    }
  })();

  /* ================================================================
     05: intent router
     ================================================================ */
  (function router() {
    var svg = $("#rt-svg"), qs = $("#router-qs"), out = $("#rt-out");
    if (!svg || !qs) return;
    var NS = "http://www.w3.org/2000/svg";
    var AG = ["Documents · RAG", "Text-to-SQL", "Forecasting", "Web search", "Tools"];
    var Q = [
      { q: "What does our refund policy say?", a: 0, intent: "policy lookup" },
      { q: "Revenue by segment, last 6 months", a: 1, intent: "analytics query" },
      { q: "Forecast next quarter's volume", a: 2, intent: "forecast request" },
      { q: "What changed in the market today?", a: 3, intent: "live information" },
      { q: "Open a ticket for this customer", a: 4, intent: "action" }
    ];
    function el(name, attrs, parent) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    var ys = [34, 92, 150, 208, 266];
    var src = el("path", { class: "rt-edge", d: "M62,150 L214,150" }, svg);
    var edges = ys.map(function (y) { return el("path", { class: "rt-edge", d: "M286,150 C350,150 356," + y + " 404," + y }, svg); });
    var gq = el("g", { class: "rt-node is-core" }, svg);
    el("circle", { cx: 40, cy: 150, r: 22 }, gq);
    var tq = el("text", { x: 40, y: 154, "text-anchor": "middle" }, gq); tq.textContent = "you";
    var gr = el("g", { class: "rt-node is-core" }, svg);
    el("circle", { cx: 250, cy: 150, r: 36 }, gr);
    var tr = el("text", { x: 250, y: 154, "text-anchor": "middle" }, gr); tr.textContent = "router";
    var nodes = ys.map(function (y, i) {
      var g = el("g", { class: "rt-node" }, svg);
      el("rect", { x: 404, y: y - 17, width: 150, height: 34, rx: 17 }, g);
      var t = el("text", { x: 479, y: y + 4, "text-anchor": "middle" }, g); t.textContent = AG[i];
      return g;
    });
    var dot = el("circle", { class: "rt-dot", r: 5, cx: 62, cy: 150, opacity: 0 }, svg);

    var buttons = Q.map(function (item, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = item.q;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { auto = false; clearInterval(timer); route(i); });
      qs.appendChild(b);
      return b;
    });

    var current = -1, auto = true, timer = 0, tl = null;
    function place(path, p) {
      var len = path.getTotalLength(), pt = path.getPointAtLength(len * p);
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
    }
    function route(i) {
      current = i;
      var item = Q[i];
      buttons.forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      nodes.forEach(function (n) { n.classList.remove("is-hot"); });
      edges.forEach(function (e) { e.classList.remove("is-hot"); });
      src.classList.add("is-hot");
      out.innerHTML = "routing “" + item.q + "” …";
      var done = function () {
        nodes[item.a].classList.add("is-hot");
        edges[item.a].classList.add("is-hot");
        out.innerHTML = "→ routed to <b>" + AG[item.a] + "</b> · intent: " + item.intent;
      };
      if (!hasG || reduce) { dot.setAttribute("opacity", 0); done(); return; }
      if (tl) tl.kill();
      var o = { p: 0 };
      dot.setAttribute("opacity", 1);
      tl = G.timeline()
        .fromTo(o, { p: 0 }, { p: 1, duration: 0.55, ease: "power2.in", onUpdate: function () { place(src, o.p); } })
        .add(function () { edges[item.a].classList.add("is-hot"); o.p = 0; })
        .to(o, { p: 1, duration: 0.6, ease: "power2.out", onUpdate: function () { place(edges[item.a], o.p); } })
        .add(function () { dot.setAttribute("opacity", 0); done(); });
    }
    function schedule(on) {
      clearInterval(timer);
      if (on && auto) timer = setInterval(function () { route((current + 1) % Q.length); }, 3200);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && current < 0) route(1);
        schedule(vis);
      }, { threshold: 0.4 }).observe(svg);
    } else {
      route(1);
    }
  })();

  /* ================================================================
     06: the IQRush loop
     ================================================================ */
  (function loop() {
    var svg = $("#loop");
    var kEl = $("#step-k"), titleEl = $("#step-title"), bodyEl = $("#step-body"), dotsEl = $("#step-dots");
    if (!svg) return;
    var STEPS = [
      { t: "Customer", b: "It usually starts with a sentence like “we’re invisible in ChatGPT.” I sit in those conversations, working forward-deployed with around 10 clients." },
      { t: "Product", b: "I turn the complaint into a product concept. What should the card say? When should a recommendation come back? What does done mean? That becomes PRDs, prototypes and acceptance criteria." },
      { t: "Data", b: "Then I define a quantity that can actually be measured, and build the data behind it: AI answers collected across repeated runs, statements extracted, citations matched to sources." },
      { t: "Model", b: "Classifiers, ranking, recommendations, LLM evaluation, retrieval emulation and agent workflows with LangGraph and MCP. Fine-tuning with QLoRA and PEFT where it pays off." },
      { t: "Engineering", b: "I ship it: Azure pipelines, deployment, monitoring, and coordinating a small engineering team. At employee #4 there is no MLOps team to hand things to." },
      { t: "Measurement", b: "Then I prove it works: stability, calibration, A/B tests and difference-in-differences on real interventions. What we learn goes back to the customer, and the loop starts again." }
    ];
    var NS = "http://www.w3.org/2000/svg", C = { x: 200, y: 200 }, R = 150, CIRC = 2 * Math.PI * R;
    function el(name, attrs, parent) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    el("circle", { class: "ring", cx: C.x, cy: C.y, r: R }, svg);
    el("circle", { class: "ring-ticks", cx: C.x, cy: C.y, r: R - 16 }, svg);
    var arc = el("circle", { class: "arc", cx: C.x, cy: C.y, r: R, transform: "rotate(-90 " + C.x + " " + C.y + ")", "stroke-dasharray": "0 " + CIRC }, svg);
    var ck = el("text", { class: "center-k", x: C.x, y: C.y - 18, "text-anchor": "middle" }, svg); ck.textContent = "the loop";
    var cv = el("text", { class: "center-v", x: C.x, y: C.y + 24, "text-anchor": "middle" }, svg);
    var halo = el("circle", { class: "pulse-halo", r: 14, cx: C.x, cy: C.y - R }, svg);
    var pulse = el("circle", { class: "pulse", r: 5, cx: C.x, cy: C.y - R }, svg);

    var nodes = STEPS.map(function (s, i) {
      var ang = ((-90 + i * 60) * Math.PI) / 180;
      var x = C.x + R * Math.cos(ang), y = C.y + R * Math.sin(ang);
      var lx = C.x + (R + 26) * Math.cos(ang), ly = C.y + (R + 26) * Math.sin(ang);
      var cos = Math.cos(ang), anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
      if (Math.sin(ang) > 0.9) ly += 12;
      var g = el("g", { class: "node", tabindex: "0", role: "button", "aria-label": "Step " + (i + 1) + ": " + s.t }, svg);
      el("circle", { cx: x, cy: y, r: 11 }, g);
      var tx = el("text", { x: lx, y: ly + 4, "text-anchor": anchor }, g);
      var num = el("tspan", { class: "n-num" }, tx); num.textContent = "0" + (i + 1) + " ";
      tx.appendChild(document.createTextNode(s.t));
      g.addEventListener("click", function () { pick(i); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } });
      return g;
    });
    var dots = STEPS.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Step " + (i + 1) + ": " + s.t);
      b.addEventListener("click", function () { pick(i); });
      dotsEl.appendChild(b);
      return b;
    });

    var active = 0, angle = 0, target = 0, auto = !reduce, timer = 0, raf = 0, inView = false;
    function show(i) {
      active = i;
      nodes.forEach(function (n, j) { n.classList.toggle("is-active", j === i); });
      dots.forEach(function (d, j) {
        d.classList.toggle("is-active", j === i);
        d.classList.toggle("is-done", j < i);
        d.setAttribute("aria-pressed", j === i ? "true" : "false");
      });
      kEl.textContent = "Step 0" + (i + 1) + " of 06";
      titleEl.textContent = STEPS[i].t;
      bodyEl.textContent = STEPS[i].b;
      cv.textContent = STEPS[i].t;
      if (hasG && !reduce) G.fromTo([titleEl, bodyEl], { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.05, overwrite: true });
      target = i * 60;
      if (target < angle - 0.5) target += 360;
      if (reduce) { angle = target % 360; target = angle; paint(); }
      else if (!raf) raf = requestAnimationFrame(tick);
    }
    function paint() {
      var a = ((angle - 90) * Math.PI) / 180, px = C.x + R * Math.cos(a), py = C.y + R * Math.sin(a);
      pulse.setAttribute("cx", px.toFixed(2)); pulse.setAttribute("cy", py.toFixed(2));
      halo.setAttribute("cx", px.toFixed(2)); halo.setAttribute("cy", py.toFixed(2));
      arc.setAttribute("stroke-dasharray", ((CIRC * angle) / 360).toFixed(2) + " " + CIRC.toFixed(2));
    }
    function tick() {
      angle += (target - angle) * 0.08;
      if (Math.abs(target - angle) < 0.2) angle = target;
      if (angle >= 360) { angle -= 360; target -= 360; }
      paint();
      raf = angle !== target ? requestAnimationFrame(tick) : 0;
    }
    function pick(i) {
      auto = false;
      dotsEl.classList.remove("is-auto");
      clearInterval(timer);
      show(i);
    }
    function schedule() {
      clearInterval(timer);
      dotsEl.classList.toggle("is-auto", auto && inView);
      if (auto && inView) timer = setInterval(function () { show((active + 1) % STEPS.length); }, 4200);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(svg);
    }
    show(0);
  })();

  /* ================================================================
     Marquee with scroll-velocity boost
     ================================================================ */
  (function marquee() {
    var rows = $$(".marquee-row");
    rows.forEach(function (row) { row.innerHTML += row.innerHTML; });
    if (!hasG || reduce) return;
    var tweens = rows.map(function (row, i) {
      var left = i % 2 === 0;
      return G.fromTo(row, { xPercent: left ? 0 : -50 }, { xPercent: left ? -50 : 0, duration: 46 + i * 8, ease: "none", repeat: -1 });
    });
    var boost = 0;
    ST.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: function (self) { boost = Math.min(5, Math.abs(self.getVelocity()) / 350); }
    });
    G.ticker.add(function () {
      boost *= 0.94;
      tweens.forEach(function (t) { t.timeScale(1 + boost); });
    });
  })();

  /* ================================================================
     Projects: pinned horizontal gallery on desktop, swipe on touch
     ================================================================ */
  (function projects() {
    var scroller = $(".p-scroller"), track = $(".p-track");
    if (!scroller || !track) return;
    if (!hasG || reduce) { scroller.classList.add("is-native"); return; }
    var mm = G.matchMedia();
    mm.add("(min-width: 901px) and (hover: hover)", function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      G.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: "#projects", start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });
    mm.add("(max-width: 900px), (hover: none)", function () {
      scroller.classList.add("is-native");
      return function () { scroller.classList.remove("is-native"); };
    });

    if (finePointer) {
      $$(".p-card a").forEach(function (a) {
        var art = $(".p-art", a);
        a.addEventListener("pointermove", function (e) {
          var r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          G.to(a, { rotateY: x * 10, rotateX: -y * 10, duration: 0.6, ease: "power3.out" });
          if (art) { art.style.setProperty("--ax", (x + 0.5) * 100 + "%"); art.style.setProperty("--ay", (y + 0.5) * 100 + "%"); }
        });
        a.addEventListener("pointerleave", function () { G.to(a, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" }); });
      });
    }
  })();

  /* ================================================================
     Micro-interactions: magnetic buttons, card glow, cursor
     ================================================================ */
  if (hasG && finePointer && !reduce) {
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", function () { G.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" }); });
    });

    html.classList.add("has-cursor");
    var cdot = $(".c-dot"), cring = $(".c-ring"), clabel = $("#c-label");
    G.set([cdot, cring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    var dX = G.quickTo(cdot, "x", { duration: 0.12, ease: "power3" }), dY = G.quickTo(cdot, "y", { duration: 0.12, ease: "power3" });
    var rX = G.quickTo(cring, "x", { duration: 0.5, ease: "power3" }), rY = G.quickTo(cring, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("pointermove", function (e) { dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-cursor], a, button, [role='button'], input");
      var lab = t && t.getAttribute("data-cursor");
      html.classList.toggle("cursor-label", !!lab);
      html.classList.toggle("cursor-hover", !!t && !lab);
      if (lab) clabel.textContent = lab;
    });
    document.addEventListener("pointerleave", function () { G.to([cdot, cring], { x: -100, y: -100, duration: 0.3 }); });
  }
  $$(".area").forEach(function (a) {
    a.addEventListener("pointermove", function (e) {
      var r = a.getBoundingClientRect();
      a.style.setProperty("--mx", e.clientX - r.left + "px");
      a.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // Footer wordmark: letters rise toward the cursor
  (function wordmark() {
    var wm = $(".wordmark");
    if (!wm || !hasG || !Split || !finePointer || reduce) return;
    var sp = Split.create(wm, { type: "chars", charsClass: "char" });
    wm.addEventListener("pointermove", function (e) {
      sp.chars.forEach(function (c) {
        var r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
        var k = Math.max(0, 1 - d / 240);
        G.to(c, { yPercent: -k * 26, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      });
    });
    wm.addEventListener("pointerleave", function () { G.to(sp.chars, { yPercent: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", stagger: 0.01 }); });
  })();

  /* ================================================================
     Toast + copy email
     ================================================================ */
  var toastEl = $("#toast"), toastT = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2200);
  }
  function selectEmail() {
    var a = $("#email");
    if (!a) return;
    var range = document.createRange();
    range.selectNodeContents(a);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function copyEmail() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () { toast("Email copied: " + EMAIL); }, function () { selectEmail(); toast("Press ⌘C to copy the selected email"); });
    } else {
      selectEmail();
      toast("Press ⌘C to copy the selected email");
    }
  }
  var copyBtn = $("#copy-email");
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* ================================================================
     Command menu (⌘K)
     ================================================================ */
  var menu = $("#menu"), menuInput = $("#menu-input"), menuList = $("#menu-list"), menuOpenBtn = $("#menu-open");
  var ITEMS = [
    { g: "Agent", ic: "AI", t: "Ask my AI twin", s: "Chat with Chinmay·AI", act: function () { if (window.CDAgent) window.CDAgent.open(true); } },
    { g: "Agent", ic: "▶", t: "Take the guided tour", s: "The agent walks you through all six chapters", act: function () { if (window.CDAgent) window.CDAgent.ask("Walk me through the story"); } },
    { g: "Agent", ic: "%", t: "Check fit for a role", s: "Match a job description against his experience", act: function () { if (window.CDAgent) window.CDAgent.ask("Is he a fit for my team?"); } },
    { g: "Chapters", ic: "01", t: "The engineer", s: "IIT Dharwad · InGene Motorsport · 2019", href: "#ch1" },
    { g: "Chapters", ic: "02", t: "First models", s: "Recykal · 2022", href: "#ch2" },
    { g: "Chapters", ic: "03", t: "Product", s: "ElectricPe · 2023", href: "#ch3" },
    { g: "Chapters", ic: "04", t: "Washington, D.C.", s: "GWU → ABM Industries · 2023–25", href: "#ch4" },
    { g: "Chapters", ic: "05", t: "AI products", s: "Tempora Labs · 2024–25", href: "#ch5" },
    { g: "Chapters", ic: "06", t: "Now", s: "IQRush.ai · 2025 →", href: "#ch6" },
    { g: "Sections", ic: "↑", t: "Start", s: "Back to the top", href: "#top" },
    { g: "Sections", ic: "≡", t: "Nine layers", s: "The pattern behind it all", href: "#layers" },
    { g: "Sections", ic: "◇", t: "Side projects", s: "Things I built to learn", href: "#projects" },
    { g: "Sections", ic: "@", t: "Contact", s: "Say hello", href: "#contact" },
    { g: "Actions", ic: "⧉", t: "Copy email", s: EMAIL, act: copyEmail },
    { g: "Actions", ic: "CV", t: "Open résumé", s: "Google Drive", url: LINKS.resume },
    { g: "Actions", ic: "in", t: "LinkedIn", s: "chinmay-dhamapurkar", url: LINKS.linkedin },
    { g: "Actions", ic: "gh", t: "GitHub", s: "chinmaydhama", url: LINKS.github }
  ];
  var shown = [], sel = 0, lastFocus = null;

  function renderMenu() {
    var q = (menuInput.value || "").trim().toLowerCase();
    shown = ITEMS.filter(function (it) { return !q || (it.t + " " + it.s + " " + it.g).toLowerCase().indexOf(q) > -1; });
    if (sel >= shown.length) sel = 0;
    if (!shown.length) { menuList.innerHTML = '<div class="menu-empty">Nothing matches “' + q.replace(/[<>&]/g, "") + "”. Try “chapter” or “email”.</div>"; return; }
    var h = "", group = "";
    shown.forEach(function (it, i) {
      if (it.g !== group) { group = it.g; h += '<div class="menu-group">' + group + "</div>"; }
      var inner = '<span class="mi-ic">' + it.ic + '</span><span class="mi-t">' + it.t + "<small>" + it.s + '</small></span><span class="mi-h">' + (it.url ? "↗" : it.act ? "↵" : "go") + "</span>";
      var attrs = ' class="menu-item' + (i === sel ? " is-active" : "") + '" role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '"';
      if (it.url) h += "<a" + attrs + ' href="' + it.url + '" target="_blank" rel="noopener">' + inner + "</a>";
      else if (it.href) h += "<a" + attrs + ' href="' + it.href + '">' + inner + "</a>";
      else h += '<button type="button"' + attrs + ">" + inner + "</button>";
    });
    menuList.innerHTML = h;
  }
  function setSel(i) {
    sel = (i + shown.length) % shown.length;
    $$(".menu-item", menuList).forEach(function (n, j) {
      n.classList.toggle("is-active", j === sel);
      n.setAttribute("aria-selected", j === sel ? "true" : "false");
      if (j === sel) n.scrollIntoView({ block: "nearest" });
    });
  }
  function runItem(i) {
    var it = shown[i];
    if (!it) return;
    if (it.act) { closeMenu(); it.act(); return; }
    if (it.url) { window.open(it.url, "_blank", "noopener"); closeMenu(); return; }
    closeMenu();
    scrollToEl(document.getElementById(it.href.slice(1)));
  }
  function openMenu() {
    if (!menu || !menu.hidden) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    menuInput.value = "";
    sel = 0;
    renderMenu();
    if (lenis) lenis.stop();
    if (hasG && !reduce) {
      G.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      G.fromTo(".menu-panel", { y: -14, scale: 0.98, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: "expo.out" });
      G.fromTo(".menu-item", { x: -8, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "expo.out", stagger: 0.02, delay: 0.05 });
    }
    setTimeout(function () { menuInput.focus(); }, 30);
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (lenis) lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  if (menu) {
    menuOpenBtn.addEventListener("click", openMenu);
    menu.addEventListener("click", function (e) {
      if (e.target === menu) { closeMenu(); return; }
      var item = e.target.closest(".menu-item");
      if (!item) return;
      var i = +item.getAttribute("data-i");
      if (shown[i] && shown[i].url) { closeMenu(); return; }
      e.preventDefault();
      runItem(i);
    });
    menuList.addEventListener("pointermove", function (e) {
      var item = e.target.closest(".menu-item");
      if (item && +item.getAttribute("data-i") !== sel) setSel(+item.getAttribute("data-i"));
    });
    menuInput.addEventListener("input", function () { sel = 0; renderMenu(); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(sel + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel(sel - 1); }
      else if (e.key === "Enter") { e.preventDefault(); runItem(sel); }
      else if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
      else if (e.key === "Tab") {
        var f = $$("input, .menu-item", menu), first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener("keydown", function (e) {
      var typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); menu.hidden ? openMenu() : closeMenu(); }
      else if (e.key === "/" && !typing && menu.hidden) { e.preventDefault(); if (window.CDAgent) window.CDAgent.open(true); else openMenu(); }
    });
  }

  window.CD = {
    reduce: reduce, hasG: hasG, EMAIL: EMAIL, LINKS: LINKS,
    field: field, scrollToEl: scrollToEl, toast: toast, copyEmail: copyEmail,
    relayout: function () { if (field && activeSec) field.setLayout(layoutFor(activeSec)); },
    onActivate: function (fn) { activeListeners.push(fn); },
    active: function () { return activeSec; }
  };

  /* ================================================================
     Intro: preloader count, then the hero assembles
     ================================================================ */
  (function intro() {
    var loading = html.classList.contains("is-loading");
    if (lenis) lenis.stop();
    function finish() {
      html.classList.remove("is-loading");
      try { sessionStorage.setItem("cd-intro", "1"); } catch (e) {}
      if (lenis) lenis.start();
      introDone = true;
      if (heroTween) heroTween.play();
      if (hasG && !reduce) {
        G.from(".hero-top > *, .hero-foot > *", { y: 24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.05, delay: 0.2 });
        G.from(".nav .wrap > *", { y: -16, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.1 });
      }
      if (field) field.intro();
      if (hasG) { ST.sort(); ST.refresh(); }
    }
    if (!loading || !hasG || reduce) { finish(); return; }
    var num = $("#pl-num"), bar = $("#pl-bar"), word = $("#pl-word"), pl = $(".preloader");
    var WORDS = ["engineering", "optimization", "data science", "product", "operations analytics", "forecasting", "GenAI & agents", "production ML", "LLM systems"];
    var o = { v: 0 };
    G.timeline()
      .to(o, {
        v: 100, duration: 1.1, ease: "power2.inOut",
        onUpdate: function () {
          num.textContent = Math.round(o.v);
          bar.style.transform = "scaleX(" + o.v / 100 + ")";
          word.textContent = "Booting Chinmay·AI · loading " + WORDS[Math.min(WORDS.length - 1, Math.floor((o.v / 100) * WORDS.length))];
        }
      })
      .to(pl, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut" }, "+=0.05")
      .add(finish, "-=0.65");
  })();
})();
