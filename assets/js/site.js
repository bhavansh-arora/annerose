/* ==========================================================================
   Anne Rose — interface behaviour (menu, header, cursor, quiz, forms …)
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced) doc.classList.add("reduced");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.lenis = lenis;
    if (!window.gsap) {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* In-page anchors through Lenis */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -20 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Config wiring ---------- */
  $$("[data-book]").forEach(function (el) {
    if (CFG.bookingUrl) {
      el.setAttribute("href", CFG.bookingUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    }
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header ---------- */
  var header = $(".site-header");
  var lastY = window.scrollY;
  var ticking = false;
  function darkUnderHeader() {
    if (!header) return false;
    var y = header.offsetHeight / 2;
    var els = document.elementsFromPoint ? document.elementsFromPoint(window.innerWidth / 2, y) : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (header.contains(el) || el.classList.contains("menu")) continue;
      var sec = el.closest("[data-theme]");
      if (sec) return sec.getAttribute("data-theme") === "dark";
    }
    return false;
  }
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      var goingDown = y > lastY && y > 400;
      if (!body.classList.contains("menu-open")) header.classList.toggle("is-hidden", goingDown);
      header.classList.toggle("on-dark", darkUnderHeader());
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Menu ---------- */
  var toggle = $(".menu-toggle");
  var toggleText = $(".menu-toggle__text");
  function openMenu() {
    body.classList.add("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (toggleText) toggleText.textContent = "Close";
    if (lenis) lenis.stop();
    var menu = $(".menu");
    if (menu) menu.removeAttribute("inert");
  }
  function closeMenu() {
    if (!body.classList.contains("menu-open")) return;
    body.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (toggleText) toggleText.textContent = "Menu";
    if (lenis) lenis.start();
    var menu = $(".menu");
    if (menu) menu.setAttribute("inert", "");
  }
  if (toggle) toggle.addEventListener("click", function () {
    body.classList.contains("menu-open") ? closeMenu() : openMenu();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- Browser chrome colour (status bar / toolbars) ---------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function uiWine() { doc.classList.add("ui-wine"); if (themeMeta) themeMeta.setAttribute("content", "#561526"); }
  function uiIvory() { doc.classList.remove("ui-wine"); if (themeMeta) themeMeta.setAttribute("content", "#f5efe6"); }

  /* ---------- Preloader (first visit per session) ---------- */
  var pre = $(".preloader");
  if (pre) {
    if (doc.classList.contains("no-preloader") || reduced) {
      if (!doc.classList.contains("pt-enter")) uiIvory();
      doc.classList.remove("is-preloading");
      pre.remove();
      body.classList.add("is-loaded");
    } else {
      store.set("ar_seen", "1");
      var count = $(".preloader__count", pre);
      var letters = $$(".preloader__word span", pre);
      var start = performance.now();
      var DURATION = 1500;
      letters.forEach(function (l, i) {
        l.style.transition = "transform 1s cubic-bezier(.22,1,.36,1) " + (0.05 * i) + "s";
        requestAnimationFrame(function () { requestAnimationFrame(function () { l.style.transform = "translateY(0)"; }); });
      });
      var tick = function (now) {
        var p = Math.min(1, (now - start) / DURATION);
        var eased = 1 - Math.pow(1 - p, 3);
        if (count) count.textContent = String(Math.round(eased * 100)).padStart(2, "0") + "%";
        if (p < 1) requestAnimationFrame(tick);
        else finishPreloader();
      };
      requestAnimationFrame(tick);
    }
  } else {
    body.classList.add("is-loaded");
  }
  function finishPreloader() {
    pre.style.transition = "clip-path 1.1s cubic-bezier(.65,0,.35,1)";
    pre.style.clipPath = "inset(0 0 100% 0)";
    doc.classList.remove("is-preloading");
    setTimeout(uiIvory, 500);
    body.classList.add("is-loaded");
    document.dispatchEvent(new CustomEvent("site:loaded"));
    setTimeout(function () { pre.remove(); }, 1200);
  }

  /* ---------- Cursor (dot + trailing ring) ---------- */
  if (finePointer && !reduced) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<div class="cursor__dot"></div><div class="cursor__ring"><span></span></div>';
    body.appendChild(cursor);
    var dot = $(".cursor__dot", cursor), ring = $(".cursor__ring", cursor), label = $("span", ring);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(loop);
    })();
    var DARK = '[data-theme="dark"], .dark, .dark-2, .cta-final, .site-footer, .program, .compass, .menu, .svc';
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-cursor], a, button, .choice, .option");
      cursor.classList.toggle("is-hover", false);
      cursor.classList.toggle("is-label", false);
      cursor.classList.toggle("on-dark", !!e.target.closest(DARK) || body.classList.contains("menu-open"));
      if (!t) return;
      var txt = t.getAttribute("data-cursor");
      if (txt) { label.textContent = txt; cursor.classList.add("is-label"); }
      else cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseleave", function () { cursor.style.opacity = "0"; });
    document.addEventListener("mouseenter", function () { cursor.style.opacity = "1"; });

    /* Magnetic buttons */
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.22 + "px," + (e.clientY - r.top - r.height / 2) * 0.3 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });

    /* Service list: an arched image follows the cursor */
    $$("[data-hover-list]").forEach(function (list) {
      var box = document.createElement("div");
      box.className = "hover-img";
      box.setAttribute("aria-hidden", "true");
      var imgs = {};
      $$(".svc", list).forEach(function (row) {
        var src = row.getAttribute("data-img");
        if (!src || imgs[src]) return;
        var im = new Image(); im.src = src; im.alt = ""; box.appendChild(im); imgs[src] = im;
      });
      body.appendChild(box);
      var bx = 0, by = 0, tx = 0, ty = 0, on = false;
      (function follow() {
        bx += (tx - bx) * 0.12; by += (ty - by) * 0.12;
        box.style.left = bx + "px"; box.style.top = by + "px";
        requestAnimationFrame(follow);
      })();
      list.addEventListener("mousemove", function (e) { tx = e.clientX + 200; ty = e.clientY; if (!on) { bx = tx; by = ty; } });
      $$(".svc", list).forEach(function (row) {
        row.addEventListener("mouseenter", function () {
          on = true; box.classList.add("is-visible");
          Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle("is-active", k === row.getAttribute("data-img")); });
        });
      });
      list.addEventListener("mouseleave", function () { on = false; box.classList.toggle("is-visible", false); });
    });
  }

  /* ---------- Page transitions (wine curtain between pages) ---------- */
  var curtain = $(".curtain");
  var PAGE_TITLES = {
    "index": "Embrace the <em>knowing</em>", "": "Embrace the <em>knowing</em>",
    "about": "About <em>Anne</em>", "coaching": "One-on-one <em>coaching</em>",
    "leadership": "Leadership <em>coaching</em>", "life-coaching": "Intuitive <em>life</em>",
    "workshops": "Workshops <em>&amp; talks</em>", "stories": "Client <em>stories</em>",
    "resources": "Resources <em>&amp; reading</em>", "contact": "Let's <em>talk</em>", "404": "Off the <em>path</em>"
  };
  function titleFor(path) {
    var key = (path.split("/").pop() || "").replace(/\.html$/, "");
    return PAGE_TITLES[key] || "Anne <em>Rose</em>";
  }
  var ctTitle = curtain ? $(".curtain__title", curtain) : null;
  /* Park the panels back below the screen instantly (no visible sweep) */
  function resetCurtain() {
    if (!curtain) return;
    curtain.classList.add("no-anim");
    doc.classList.remove("pt-enter");
    uiIvory();
    curtain.classList.remove("is-leaving", "is-covering");
    void curtain.offsetHeight;
    requestAnimationFrame(function () { requestAnimationFrame(function () { curtain.classList.remove("no-anim"); }); });
  }
  /* Arriving from another page: panels lift away */
  if (curtain && doc.classList.contains("pt-enter")) {
    if (ctTitle) ctTitle.innerHTML = titleFor(location.pathname);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      curtain.classList.add("is-leaving");
      setTimeout(resetCurtain, 1500);
    }); });
  }
  if (curtain && !reduced) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target && a.target !== "_self") return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      closeMenu();
      if (ctTitle) ctTitle.innerHTML = titleFor(url.pathname);
      store.set("ar_pt", "1");
      store.set("ar_pt_t", titleFor(url.pathname));
      curtain.classList.add("is-covering");
      setTimeout(uiWine, 350);
      setTimeout(function () { location.href = url.href; }, 900);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) resetCurtain(); });
  }

  /* ---------- Marquees: clone group for a seamless loop ---------- */
  $$(".marquee__track").forEach(function (track) {
    var group = $(".marquee__group", track);
    if (!group) return;
    var clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  /* ---------- Testimonial wall: duplicate columns for a seamless loop ---------- */
  $$("[data-wall] .wall__col").forEach(function (col) {
    Array.prototype.slice.call(col.children).forEach(function (card) {
      var c = card.cloneNode(true); c.setAttribute("aria-hidden", "true"); col.appendChild(c);
    });
  });

  /* ---------- FAQ ---------- */
  $$(".faq__item").forEach(function (item) {
    var q = $(".faq__q", item);
    if (!q) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      setTimeout(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- Testimonial slider ---------- */
  $$("[data-quotes]").forEach(function (root) {
    var slides = $$(".quote-slide", root);
    var bar = $(".quotes__bar", root);
    var cur = $(".quotes__count b", root);
    var total = $(".quotes__count span", root);
    var i = 0, timer = null, DUR = 9000;
    if (total) total.textContent = String(slides.length).padStart(2, "0");
    function show(n) {
      slides[i].classList.remove("is-active");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active");
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
      run();
    }
    function run() {
      clearTimeout(timer);
      if (bar) { bar.classList.remove("is-running"); void bar.offsetWidth; bar.style.setProperty("--dur", DUR + "ms"); bar.classList.add("is-running"); }
      if (!reduced) timer = setTimeout(function () { show(i + 1); }, DUR);
    }
    var prev = $("[data-prev]", root), next = $("[data-next]", root);
    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });
    var started = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting && !started) { started = true; run(); } });
      }, { threshold: 0.3 }).observe(root);
    } else run();
  });

  /* ---------- Story filters ---------- */
  var filterBar = $("[data-filters]");
  if (filterBar) {
    var chips = $$(".chip", filterBar);
    var stories = $$(".story");
    chips.forEach(function (chip) {
      var f = chip.getAttribute("data-filter");
      var n = f === "all" ? stories.length : stories.filter(function (s) { return (s.getAttribute("data-cat") || "").indexOf(f) > -1; }).length;
      var sup = document.createElement("sup"); sup.textContent = n; chip.appendChild(sup);
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-active"); chip.setAttribute("aria-pressed", "true");
        stories.forEach(function (s) {
          var show = f === "all" || (s.getAttribute("data-cat") || "").indexOf(f) > -1;
          s.classList.toggle("is-hidden", !show);
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  }

  /* ==========================================================================
     CLARITY COMPASS — a 60-second fit quiz that routes visitors to the right
     path and carries their answers into the enquiry form.
     ========================================================================== */
  var PATHS = {
    leadership: {
      title: 'Leadership <em>Coaching</em>',
      text: "You're carrying a team, a vision, or a next big step. Anne's leadership coaching reconnects you with a clear, inspiring direction and the tools to lead from it — with her trademark ability to lovingly kick butt.",
      url: "leadership.html",
      label: "Leadership coaching"
    },
    career: {
      title: 'Your Next <em>Career Step</em>',
      text: "A client favourite. Take stock of where you are, update your goals and open the door to a happier, healthier life — with tools for a balanced, fulfilling way of working.",
      url: "leadership.html#career",
      label: "Next career step"
    },
    life: {
      title: 'Intuitive <em>Life Coaching</em>',
      text: "It's time to learn about you — what makes you tick, what gives you joy, what holds you back. Sessions bring a profound sense of clarity and a soul-guided path forward.",
      url: "life-coaching.html",
      label: "Intuitive life coaching"
    },
    learning: {
      title: 'Virtual Learning <em>&amp; Workshops</em>',
      text: "Bring Anne to your team. Fun, engaging, experiential sessions on leadership, communication, conflict and stress — from the #1-rated speaker at Toyota Canada.",
      url: "workshops.html",
      label: "Virtual learning for a team"
    }
  };
  var FORMAT_LABEL = { online: "Online, one-on-one", person: "In person, Toronto", either: "Online or in person", group: "Group / team session" };
  var TIMING_LABEL = { now: "Ready to start now", soon: "In the next month or two", exploring: "Just exploring" };

  $$("[data-compass]").forEach(function (root) {
    var steps = $$(".compass__step", root);
    var result = $(".compass__result", root);
    var bars = $$(".compass__progress i", root);
    var answers = {};
    var idx = 0;
    function go(n) {
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === n); });
      result.classList.remove("is-active");
      bars.forEach(function (b, k) { b.classList.toggle("is-done", k < n); });
      idx = n;
    }
    function score() {
      var tally = { leadership: 0, career: 0, life: 0, learning: 0 };
      Object.keys(answers).forEach(function (k) {
        var v = answers[k];
        if (v.path) v.path.split(" ").forEach(function (p) { tally[p] = (tally[p] || 0) + 1; });
      });
      var best = "leadership", max = -1;
      ["leadership", "life", "career", "learning"].forEach(function (p) { if (tally[p] > max) { max = tally[p]; best = p; } });
      return best;
    }
    function finish() {
      var best = score();
      var p = PATHS[best];
      var fmt = (answers.format && answers.format.value) || "either";
      var tim = (answers.timing && answers.timing.value) || "exploring";
      $(".compass__result-title", result).innerHTML = p.title;
      $(".compass__result-text", result).textContent = p.text;
      $(".compass__result-tags", result).innerHTML =
        "<span>" + FORMAT_LABEL[fmt] + "</span><span>" + TIMING_LABEL[tim] + "</span>";
      var learn = $("[data-result-learn]", result);
      if (learn) learn.setAttribute("href", p.url);
      var send = $("[data-result-send]", result);
      var q = "?path=" + best + "&format=" + fmt + "&timing=" + tim;
      if (send) send.setAttribute("href", "contact.html" + q);
      store.set("ar_compass", JSON.stringify({ path: best, format: fmt, timing: tim }));
      steps.forEach(function (s) { s.classList.remove("is-active"); });
      bars.forEach(function (b) { b.classList.add("is-done"); });
      result.classList.add("is-active");
    }
    steps.forEach(function (step, k) {
      $$(".option", step).forEach(function (opt) {
        opt.addEventListener("click", function () {
          $$(".option", step).forEach(function (o) { o.classList.remove("is-selected"); o.setAttribute("aria-pressed", "false"); });
          opt.classList.add("is-selected"); opt.setAttribute("aria-pressed", "true");
          answers[step.getAttribute("data-key")] = { path: opt.getAttribute("data-path"), value: opt.getAttribute("data-value") };
          setTimeout(function () { k < steps.length - 1 ? go(k + 1) : finish(); }, 280);
        });
      });
      var back = $(".compass__back", step);
      if (back) back.addEventListener("click", function () { if (k > 0) go(k - 1); });
    });
    var restart = $(".compass__restart", root);
    if (restart) restart.addEventListener("click", function () { answers = {}; $$(".option", root).forEach(function (o) { o.classList.remove("is-selected"); }); go(0); });
    go(0);
  });

  /* ==========================================================================
     ENQUIRY FORM — multi-step, pre-filled from the compass, posts to an
     automation endpoint (or opens email as a fallback).
     ========================================================================== */
  var form = $("[data-enquiry]");
  if (form) {
    var fSteps = $$(".form__step", form);
    var fBars = $$(".form__steps i", form);
    var fCount = $(".form__count", form);
    var btnNext = $("[data-form-next]", form);
    var btnBack = $("[data-form-back]", form);
    var btnLabel = btnNext ? $(".btn__label", btnNext) : null;
    var cur = 0;

    /* Prefill from URL or from the compass */
    var params = new URLSearchParams(window.location.search);
    var saved = {};
    try { saved = JSON.parse(store.get("ar_compass") || "{}"); } catch (e) { saved = {}; }
    var pre = { path: params.get("path") || saved.path, format: params.get("format") || saved.format, timing: params.get("timing") || saved.timing };
    ["path", "format", "timing"].forEach(function (k) {
      if (!pre[k]) return;
      var input = form.querySelector('input[name="' + k + '"][value="' + pre[k] + '"]');
      if (input) input.checked = true;
    });
    if (params.get("intent") === "waitlist") {
      var lp = form.querySelector('input[name="path"][value="learning"]');
      if (lp) lp.checked = true;
      var msg = form.querySelector('textarea[name="message"]');
      if (msg && !msg.value) msg.value = "Please add me to the Spring Reset waitlist.";
    }

    function showStep(n) {
      fSteps.forEach(function (s, k) { s.classList.toggle("is-active", k === n); });
      fBars.forEach(function (b, k) { b.classList.toggle("is-done", k <= n); });
      if (fCount) fCount.textContent = "Step " + (n + 1) + " of " + fSteps.length;
      if (btnBack) btnBack.hidden = n === 0;
      if (btnLabel) btnLabel.textContent = n === fSteps.length - 1 ? "Send to Anne" : "Continue";
      cur = n;
    }
    function validate(step) {
      var ok = true;
      $$(".field", step).forEach(function (f) { f.classList.remove("has-error"); });
      $$("[required]", step).forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()) : input.value.trim().length > 0;
        if (!valid) { ok = false; if (field) field.classList.add("has-error"); }
      });
      var group = step.querySelector("[data-require-choice]");
      if (group) {
        var name = group.getAttribute("data-require-choice");
        if (!form.querySelector('input[name="' + name + '"]:checked')) {
          ok = false;
          group.classList.add("shake");
          var hint = step.querySelector(".form__hint");
          if (hint) { hint.style.color = "var(--rose)"; setTimeout(function () { hint.style.color = ""; }, 1600); }
        }
      }
      return ok;
    }
    function collect() {
      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (data[k]) data[k] = [].concat(data[k], v); else data[k] = v;
      });
      return data;
    }
    function labelFor(name, value) {
      var input = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (!input) return value || "";
      var strong = input.parentNode.querySelector("span");
      return strong ? strong.firstChild.textContent.trim() : value;
    }
    function submit() {
      var data = collect();
      if (data._gotcha) return; // spam trap
      var summary = {
        "Looking for": labelFor("path", data.path),
        "Format": labelFor("format", data.format),
        "Timing": labelFor("timing", data.timing),
        "Name": data.name, "Email": data.email, "Phone": data.phone || "—",
        "Best way to reach": data.contact_pref || "Email",
        "Message": data.message || "—"
      };
      var done = function () {
        form.classList.add("is-sent");
        var nm = $("[data-sent-name]", form);
        if (nm) nm.textContent = (data.name || "").split(" ")[0] || "friend";
        if (lenis) lenis.scrollTo(form, { offset: -120 }); else form.scrollIntoView();
        store.set("ar_compass", "");
      };
      if (CFG.formEndpoint) {
        if (btnNext) btnNext.setAttribute("aria-busy", "true");
        fetch(CFG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(Object.assign({ _subject: "New coaching enquiry — " + data.name, source: location.href }, summary))
        }).then(done).catch(function () { mailFallback(summary); done(); });
      } else {
        mailFallback(summary);
        done();
      }
    }
    function mailFallback(summary) {
      var lines = Object.keys(summary).map(function (k) { return k + ": " + summary[k]; }).join("\n");
      var href = "mailto:" + (CFG.email || "") + "?subject=" + encodeURIComponent("Coaching enquiry — " + summary.Name) + "&body=" + encodeURIComponent(lines);
      window.location.href = href;
    }
    if (btnNext) btnNext.addEventListener("click", function (e) {
      e.preventDefault();
      if (!validate(fSteps[cur])) return;
      if (cur < fSteps.length - 1) showStep(cur + 1); else submit();
    });
    if (btnBack) btnBack.addEventListener("click", function (e) { e.preventDefault(); if (cur > 0) showStep(cur - 1); });
    form.addEventListener("submit", function (e) { e.preventDefault(); if (btnNext) btnNext.click(); });
    /* Auto-advance on choice steps */
    $$(".form__step", form).forEach(function (step, k) {
      if (!step.hasAttribute("data-auto")) return;
      $$('input[type="radio"]', step).forEach(function (r) {
        r.addEventListener("change", function () { setTimeout(function () { if (cur === k && k < fSteps.length - 1) showStep(k + 1); }, 320); });
      });
    });
    if (CFG.replyPromise) $$("[data-reply-promise]").forEach(function (el) { el.textContent = CFG.replyPromise; });
    /* Arrived from the compass with everything answered? Jump to the last step. */
    var allSet = ["path", "format", "timing"].every(function (k) { return form.querySelector('input[name="' + k + '"]:checked'); });
    showStep(allSet ? fSteps.length - 1 : 0);
    var preNote = $("[data-prefilled]", form);
    if (preNote && allSet) preNote.hidden = false;
  }
})();
