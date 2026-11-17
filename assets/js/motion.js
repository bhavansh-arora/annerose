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
    return gsap.fromTo(words, { yPercent: 115, rotate: 4 }, {
      yPercent: 0, rotate: 0, duration: 1.25, ease: "expo.out", stagger: 0.045, delay: delay || 0
    });
  }

  /* Hero intro (waits for the preloader) */
  var heroSplits = $$(".hero [data-split], .page-hero [data-split], .notfound [data-split]");
  var heroBits = $$("[data-hero]");
  gsap.set(heroSplits.map(function (el) { return $$(".split-line > span", el); }).flat(), { yPercent: 115 });
  gsap.set(heroBits, { autoAlpha: 0, y: 30 });
  var heroPortrait = document.querySelector("[data-hero-portrait]");
  if (heroPortrait) gsap.set(heroPortrait, { clipPath: "inset(100% 0% 0% 0% round 999px 999px 28px 28px)" });

  function playHero() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    heroSplits.forEach(function (el, i) {
      tl.to($$(".split-line > span", el), { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.06 }, i * 0.12);
    });
    if (heroPortrait) tl.to(heroPortrait, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 28px 28px)", duration: 1.6, ease: "expo.inOut" }, 0.1);
    tl.to(heroBits, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.5);
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
    gsap.set(words, { yPercent: 115, rotate: 4 });
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
    gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 28px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.6, ease: "expo.inOut",
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
    if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
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
