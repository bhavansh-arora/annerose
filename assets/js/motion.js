/* ==========================================================================
   Anne Rose — motion layer (GSAP + ScrollTrigger)
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Word splitting (keeps <em>, <br>, <strong>) ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    var out = document.createDocumentFragment();
    function wrapWord(text, wrapperTag, wrapperClass) {
      var mask = document.createElement("span");
      mask.className = "split-line";
      mask.style.display = "inline-block";
      mask.style.verticalAlign = "top";
      var inner = document.createElement("span");
      if (wrapperTag) {
        var w = document.createElement(wrapperTag);
        if (wrapperClass) w.className = wrapperClass;
        w.textContent = text;
        inner.appendChild(w);
      } else inner.textContent = text;
      mask.appendChild(inner);
      return mask;
    }
    function walk(node, target, wrapperTag, wrapperClass) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) target.appendChild(document.createTextNode(" "));
            else target.appendChild(wrapWord(p, wrapperTag, wrapperClass));
          });
        } else if (child.nodeType === 1) {
          if (child.tagName === "BR") { target.appendChild(child.cloneNode()); return; }
          if (child.classList && child.classList.contains("row")) {
            var row = child.cloneNode(false);
            walk(child, row, wrapperTag, wrapperClass);
            target.appendChild(row);
            return;
          }
          walk(child, target, child.tagName.toLowerCase(), child.className);
        }
      });
    }
    walk(el, out, null, null);
    el.innerHTML = "";
    el.appendChild(out);
  }

  /* ---------- Statement words (scrubbed opacity) ---------- */
  function splitStatement(el) {
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
            else { var s = document.createElement("span"); s.className = "w"; s.textContent = p; frag.appendChild(s); }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") walk(child);
      });
    }
    walk(el);
  }

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    /* Static fallback: show everything */
    $$("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-clip]").forEach(function (el) { el.style.clipPath = "none"; });
    $$(".statement__text .w").forEach(function (w) { w.style.opacity = 1; });
    return;
  }

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* Lenis <-> ScrollTrigger */
  if (window.lenis) {
    window.lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { window.lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var mm = gsap.matchMedia();

  /* ---------- Split headings ---------- */
  $$("[data-split]").forEach(splitWords);

  function animateSplit(el, delay) {
    var words = $$(".split-line > span", el);
    return gsap.fromTo(words, { yPercent: 118 }, {
      yPercent: 0, duration: 1.5, ease: "expo.out", stagger: 0.05, delay: delay || 0,
      onComplete: function () { $$(".split-line", el).forEach(function (l) { l.classList.add("is-done"); }); }
    });
  }

  /* Hero intro (waits for the preloader) */
  /* Giant hero word: split into letters */
  var giant = document.querySelector("[data-giant]");
  var giantLetters = [];
  if (giant) {
    var txt = giant.textContent; giant.textContent = "";
    txt.split("").forEach(function (ch) { var sp = document.createElement("span"); sp.textContent = ch; sp.style.display = "inline-block"; giant.appendChild(sp); giantLetters.push(sp); });
  }
  var hv = document.querySelector("[data-hv]");
  var pops = $$("[data-pop]");
  if (giantLetters.length) gsap.set(giantLetters, { yPercent: 60, autoAlpha: 0, rotate: 8 });
  if (pops.length) gsap.set(pops, { autoAlpha: 0, y: 40, scale: .94 });
  if (hv) gsap.set(hv, { scale: .965 });

  var heroSplits = $$(".hv [data-split], .page-hero [data-split], .notfound [data-split]");
  var heroBits = $$("[data-hero]");
  gsap.set(heroSplits.map(function (el) { return $$(".split-line > span", el); }).flat(), { yPercent: 118 });
  gsap.set(heroBits, { autoAlpha: 0, y: 30 });
  var heroPanel = document.querySelector("[data-hero-panel]");
  var heroArch = document.querySelector("[data-hero-arch]");
  var heroRise = document.querySelector("[data-hero-rise]");
  if (heroPanel) gsap.set(heroPanel, { clipPath: "inset(0% 0% 0% 100%)" });
  if (heroArch) gsap.set(heroArch, { scaleY: 0, transformOrigin: "50% 100%" });
  if (heroRise) gsap.set(heroRise, { yPercent: 18, autoAlpha: 0 });

  function playHero() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (heroPanel) tl.to(heroPanel, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0);
    if (heroArch) tl.to(heroArch, { scaleY: 1, duration: 1.6, ease: "expo.inOut" }, 0.35);
    if (hv) tl.to(hv, { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "transform" }, 0);
    if (giantLetters.length) tl.to(giantLetters, { yPercent: 0, autoAlpha: 1, rotate: 0, duration: 1.6, stagger: 0.05 }, 0.15);
    if (heroRise) tl.to(heroRise, { yPercent: 0, autoAlpha: 1, duration: 1.8 }, 0.45);
    if (pops.length) tl.to(pops, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.09 }, 0.8);
    heroSplits.forEach(function (el, i) {
      tl.to($$(".split-line > span", el), { yPercent: 0, duration: 1.6, stagger: 0.07, onComplete: function () { $$(".split-line", el).forEach(function (l) { l.classList.add("is-done"); }); } }, 0.2 + i * 0.12);
    });
    tl.to(heroBits, { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.1 }, 0.8);
  }
  if (document.querySelector(".preloader") && !document.documentElement.classList.contains("no-preloader")) {
    document.addEventListener("site:loaded", playHero, { once: true });
  } else {
    playHero();
  }

  /* Other split headings reveal on scroll */
  $$("[data-split]").forEach(function (el) {
    if (heroSplits.indexOf(el) > -1) return;
    var words = $$(".split-line > span", el);
    gsap.set(words, { yPercent: 118 });
    ST.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () { animateSplit(el); }
    });
  });

  /* ---------- Generic reveals ---------- */
  ST.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: function (batch) {
      batch.forEach(function (el, i) {
        var d = parseFloat(el.getAttribute("data-delay") || 0);
        setTimeout(function () { el.classList.add("is-in"); }, (d + i * 0.08) * 1000);
      });
    }
  });

  /* ---------- Image clip reveals ---------- */
  $$("[data-clip]").forEach(function (el) {
    var img = el.querySelector("img");
    gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut",
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
      onComplete: function () { el.style.clipPath = "none"; }
    });
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 86%", once: true } });
  });

  /* ---------- Hairline rules draw in ---------- */
  $$("[data-rule]").forEach(function (el) {
    gsap.to(el, { scaleX: 1, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
  });

  /* ---------- Hero portrait drifts as you scroll away ---------- */
  if (hv && window.matchMedia("(min-width: 1025px)").matches) {
    if (giant) gsap.to(giant, { xPercent: -14, ease: "none", scrollTrigger: { trigger: hv, start: "top top", end: "bottom top", scrub: true } });
    if (heroRise) gsap.to(heroRise, { yPercent: 8, scale: 1.04, ease: "none", scrollTrigger: { trigger: hv, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hv__left", { y: -60, ease: "none", scrollTrigger: { trigger: hv, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hv__right, .hv__proof", { y: -110, ease: "none", scrollTrigger: { trigger: hv, start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Hand-drawn underlines under accent words ---------- */
  var SWASHES = [
    "M2 14 C 40 4, 90 2, 140 8 S 230 16, 298 6",
    "M2 10 C 60 18, 120 2, 180 10 S 260 14, 298 4",
    "M4 12 Q 80 2 150 10 T 296 8"
  ];
  var swashItems = [];
  $$(".sec-head .h2, .stack-sec__intro .h2, .wall__intro .h2, .page-hero .h1, .cta-final .h-mega, .dims__copy .h2, .compass__intro .h2").forEach(function (h, i) {
    if (!h.querySelector("em")) return;
    if (getComputedStyle(h).position === "static") h.style.position = "relative";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "swash"); svg.setAttribute("viewBox", "0 0 300 20"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", SWASHES[i % SWASHES.length]); p.setAttribute("pathLength", "1");
    p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1";
    svg.appendChild(p); h.appendChild(svg);
    swashItems.push({ h: h, svg: svg });
    gsap.to(p, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", delay: 0.7, scrollTrigger: { trigger: h, start: "top 85%", once: true } });
  });
  function placeSwashes() {
    swashItems.forEach(function (it) {
      var boxes = $$("em", it.h).map(function (em) { return (em.closest(".split-line") || em).getBoundingClientRect(); });
      if (!boxes.length) return;
      var maxTop = Math.max.apply(null, boxes.map(function (b) { return Math.round(b.top); }));
      var last = boxes.filter(function (b) { return Math.abs(Math.round(b.top) - maxTop) < 6; });
      var left = Math.min.apply(null, last.map(function (b) { return b.left; }));
      var right = Math.max.apply(null, last.map(function (b) { return b.right; }));
      var bottom = Math.max.apply(null, last.map(function (b) { return b.bottom; }));
      var hr = it.h.getBoundingClientRect();
      var hgt = Math.max(10, (bottom - maxTop) * 0.22);
      it.svg.style.left = (left - hr.left) + "px";
      it.svg.style.width = (right - left) + "px";
      it.svg.style.top = (bottom - hr.top - hgt * 0.9) + "px";
      it.svg.style.height = hgt + "px";
      it.svg.style.bottom = "auto";
    });
  }
  placeSwashes();
  window.addEventListener("resize", placeSwashes);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSwashes);
  window.addEventListener("load", placeSwashes);

  /* ---------- Line-art roses draw themselves ---------- */
  $$("[data-draw]").forEach(function (svg) {
    var paths = $$("path", svg);
    gsap.to(paths, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut", stagger: 0.12, scrollTrigger: { trigger: svg, start: "top 92%", once: true } });
  });

  /* ---------- Stacking cards: earlier cards recede ---------- */
  var stackCards = $$(".stack-card");
  stackCards.forEach(function (card, i) {
    var next = stackCards[i + 1];
    if (!next) return;
    gsap.fromTo(card, { scale: 1 }, { scale: 0.94, ease: "none", scrollTrigger: { trigger: next, start: "top 85%", end: "top 30%", scrub: true } });
  });

  /* ---------- Progress ring ---------- */
  $$("[data-ring]").forEach(function (ring) {
    var fg = ring.querySelector(".ring__fg");
    var pct = parseFloat(ring.getAttribute("data-ring")) / 100;
    gsap.fromTo(fg, { strokeDashoffset: 289 }, { strokeDashoffset: 289 * (1 - pct), duration: 2.4, ease: "power3.out", scrollTrigger: { trigger: ring, start: "top 85%", once: true } });
  });

  /* ---------- Section labels glide in ---------- */
  $$(".sec-head .label, .statement__label .label").forEach(function (el) {
    gsap.fromTo(el, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  /* ---------- 3D tilt on tiles ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$("[data-tilt]").forEach(function (el) {
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: x * 6, rotateX: -y * 6, y: -6, transformPerspective: 1000, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { rotateY: 0, rotateX: 0, y: 0, duration: 0.9, ease: "expo.out" }); });
    });
  }

  /* ---------- Service rows rise in ---------- */
  $$(".svc").forEach(function (row, i) {
    gsap.fromTo(row, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: "expo.out", delay: i * 0.06, scrollTrigger: { trigger: row, start: "top 92%", once: true } });
  });

  /* ---------- Parallax ---------- */
  $$("[data-speed]").forEach(function (el) {
    var speed = parseFloat(el.getAttribute("data-speed"));
    gsap.fromTo(el, { yPercent: -speed * 10 }, {
      yPercent: speed * 10, ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---------- Statement scrub ---------- */
  $$("[data-words]").forEach(function (el) {
    splitStatement(el);
    var words = $$(".w", el);
    gsap.to(words, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 }
    });
  });

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var obj = { v: 0 };
    el.textContent = "0";
    ST.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(obj, { v: end, duration: 2.2, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(obj.v); } });
      }
    });
  });

  /* ---------- Method: pinned horizontal scroll (tablet landscape + desktop) ---------- */
  mm.add("(min-width: 761px)", function () {
    var section = document.querySelector("[data-method]");
    if (!section) return;
    var pin = section.querySelector(".method__pin");
    var track = section.querySelector(".method__track");
    var bar = section.querySelector(".method__progress i");
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, {
      x: function () { return -distance(); }, ease: "none",
      scrollTrigger: {
        trigger: pin, start: "top top", end: function () { return "+=" + distance(); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) { if (bar) bar.style.transform = "scaleX(" + self.progress + ")"; }
      }
    });
    return function () { tween.kill(); };
  });

  /* ---------- Timeline fill ---------- */
  $$(".timeline").forEach(function (tl) {
    var fill = tl.querySelector(".timeline__fill");
    if (!fill) return;
    gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 70%", end: "bottom 60%", scrub: true } });
  });

  /* ---------- Staggered card entrances ---------- */
  $$("[data-stagger]").forEach(function (group) {
    var items = Array.prototype.slice.call(group.children);
    gsap.fromTo(items, { y: 70, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: group, start: "top 85%", once: true }
    });
  });

  /* ---------- Footer wordmark ---------- */
  var word = document.querySelector(".footer__word");
  if (word) {
    gsap.fromTo(word, { yPercent: 40, opacity: 0 }, {
      yPercent: 0, opacity: 1, ease: "expo.out", duration: 1.6,
      scrollTrigger: { trigger: word, start: "top 98%", once: true }
    });
  }

  /* ---------- Marquee speed nudged by scroll velocity ---------- */
  var tilts = $$(".marquee--tilt");
  if (tilts.length) {
    ST.create({
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 1800, 1.4);
        tilts.forEach(function (m) { m.style.setProperty("--skew", (self.direction * v * 2) + "deg"); });
      }
    });
  }

  /* Refresh after fonts/images settle */
  window.addEventListener("load", function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
