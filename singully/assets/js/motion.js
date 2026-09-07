/* ==========================================================================
   Sinगली. Motion.
   Implements M1 to M12 of docs/03-motion-spec.md on GSAP + ScrollTrigger
   + Lenis, all read from the vendored globals.

   Every sequence looks for its own DOM targets and returns quietly when they
   are absent, so a page only pays for what it actually contains.

   Public surface: window.SinMotion
   ========================================================================== */

(function (window, document) {
  "use strict";

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var Lenis = window.Lenis;

  /* ---- Small helpers -------------------------------------------------- */

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, wait);
    };
  }

  function prefersReduced() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isTouch() {
    return (
      window.matchMedia &&
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }

  function seen() {
    try {
      return window.sessionStorage.getItem("sin_seen") === "1";
    } catch (e) {
      return false;
    }
  }

  function markSeen() {
    try {
      window.sessionStorage.setItem("sin_seen", "1");
    } catch (e) {
      /* Private mode. The preloader simply plays again. */
    }
  }

  var SinMotion = {
    booted: false,
    reduced: false,
    lenis: null,
    mm: null,
    splits: [],
    version: "1.0.0",

    /* ====================================================================
       Boot
       ==================================================================== */

    init: function (options) {
      if (this.booted) return this;
      if (!gsap) {
        document.documentElement.classList.add("motion-off");
        return this;
      }
      this.booted = true;
      this.options = options || {};
      this.reduced = prefersReduced();

      if (ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
      }
      gsap.defaults({ ease: "expo.out", duration: 0.9 });

      this.mm = gsap.matchMedia ? gsap.matchMedia() : null;

      this.smoothScroll();

      var self = this;

      // Sequences that do not wait on the preloader.
      this.m4Reveals();
      this.m3Prologue();
      this.m5Hold();
      this.m6Lanes();
      this.m7Drop();
      this.m8Tag();
      this.m8House();
      this.m9Cursor();
      this.m10Header();
      this.m11Footer();
      this.m12Transitions();

      // The hero waits for the शिरोरेखा to reach its slot in the header.
      this.m1Preloader(function () {
        self.m2Hero();
      });

      this.bindResize();
      this.refresh();

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          self.resplit();
          if (self.fitFooter) self.fitFooter();
          self.refresh();
        });
      }

      return this;
    },

    refresh: function () {
      if (ScrollTrigger) ScrollTrigger.refresh();
    },

    bindResize: function () {
      var self = this;
      var onResize = debounce(function () {
        self.resplit();
        if (self.fitFooter) self.fitFooter();
        self.refresh();
      }, 200);
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
    },

    /* ====================================================================
       Smooth scroll. Lenis drives GSAP's ticker, not its own RAF loop.
       ==================================================================== */

    smoothScroll: function () {
      if (this.reduced || !Lenis) return null;

      var lenis = new Lenis({
        duration: 1.1,
        easing: function (t) {
          return Math.min(1, 1.001 - Math.pow(2, -10 * t));
        },
        smoothWheel: true,
        touchMultiplier: 1.6
      });

      if (ScrollTrigger) {
        lenis.on("scroll", ScrollTrigger.update);
      }

      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      this.lenis = lenis;
      return lenis;
    },

    scrollTo: function (target, opts) {
      if (this.lenis) {
        this.lenis.scrollTo(target, opts || {});
      } else if (target && target.scrollIntoView) {
        target.scrollIntoView();
      }
    },

    /* ====================================================================
       Line splitter
       Wraps each visual line of an element in an overflow hidden mask.
       Written here rather than pulled from SplitText, which is not vendored.
       ==================================================================== */

    splitLines: function (el) {
      if (!el) return [];

      // Lines the writer set by hand. Each one gets a mask of its own and
      // the measuring pass is skipped, so a break that carries meaning is
      // never re-broken by the browser.
      var written = qsa("[data-line]", el);
      if (written.length) {
        var authored = [];
        for (var w = 0; w < written.length; w++) {
          var node = written[w];
          var parent = node.parentNode;
          if (!parent.classList || !parent.classList.contains("sin-line")) {
            var wrap = document.createElement("span");
            wrap.className = "sin-line";
            parent.insertBefore(wrap, node);
            wrap.appendChild(node);
            node.classList.add("sin-line__inner");
          }
          authored.push(node);
        }
        el.__sinLines = authored;
        if (this.splits.indexOf(el) === -1) this.splits.push(el);
        return authored;
      }

      if (typeof el.__sinHTML !== "string") el.__sinHTML = el.innerHTML;
      el.innerHTML = el.__sinHTML;

      var text = el.textContent.replace(/\s+/g, " ").trim();
      if (!text) return [];

      // Stage one: every word becomes an inline block so it can be measured.
      var words = text.split(" ");
      var frag = document.createDocumentFragment();
      var i;
      for (i = 0; i < words.length; i++) {
        var w = document.createElement("span");
        w.style.display = "inline-block";
        w.textContent = words[i];
        frag.appendChild(w);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
      }
      el.innerHTML = "";
      el.appendChild(frag);

      // Stage two: group words that share a baseline into one line.
      var probes = qsa("span", el);
      var lines = [];
      var current = null;
      var top = null;
      for (i = 0; i < probes.length; i++) {
        var y = Math.round(probes[i].offsetTop);
        if (top === null || Math.abs(y - top) > 2) {
          current = [];
          lines.push(current);
          top = y;
        }
        current.push(probes[i].textContent);
      }

      // Stage three: rebuild as masked lines.
      el.innerHTML = "";
      var inners = [];
      for (i = 0; i < lines.length; i++) {
        var mask = document.createElement("span");
        mask.className = "sin-line";
        var inner = document.createElement("span");
        inner.className = "sin-line__inner";
        inner.textContent = lines[i].join(" ");
        mask.appendChild(inner);
        el.appendChild(mask);
        inners.push(inner);
      }

      el.__sinLines = inners;
      if (this.splits.indexOf(el) === -1) this.splits.push(el);
      return inners;
    },

    resplit: function () {
      var self = this;
      if (!this.splits.length) return;
      this.splits.forEach(function (el) {
        var played = el.__sinPlayed === true;
        var inners = self.splitLines(el);
        if (self.reduced || played) {
          gsap.set(inners, { yPercent: 0, opacity: 1 });
          gsap.set(el, { opacity: 1 });
        } else {
          gsap.set(inners, { yPercent: 110 });
        }
      });
    },

    /* ====================================================================
       M1 Preloader
       The शिरोरेखा draws, the wordmark drops from it, both rise into the
       header. Skipped under reduced motion and on return visits.
       ==================================================================== */

    m1Preloader: function (done) {
      var pre = qs("[data-preloader]") || qs(".preloader");
      var header = qs("[data-header]") || qs(".header");
      var finish = function () {
        markSeen();
        if (typeof done === "function") done();
      };

      if (!pre) {
        finish();
        return null;
      }

      var skip = this.reduced || seen();
      if (skip) {
        document.documentElement.classList.add("sin-skip-intro");
        pre.classList.add("is-done");
        if (pre.parentNode) pre.parentNode.removeChild(pre);
        finish();
        return null;
      }

      var stage = qs(".preloader__stage", pre);
      var rule = qs(".preloader__rule", pre);
      var mark = qs(".preloader__mark", pre);
      if (!stage || !rule || !mark) {
        pre.parentNode.removeChild(pre);
        finish();
        return null;
      }

      if (this.lenis) this.lenis.stop();
      document.documentElement.classList.add("is-loading");

      // Where the line has to land: the bottom rule of the header.
      var target = header ? header.getBoundingClientRect().bottom : 64;
      var start = rule.getBoundingClientRect().top;
      var travel = target - start;

      // How far the wordmark has to shrink to sit in the header.
      var brand = header ? qs(".header__brand", header) : null;
      var scale = 1;
      if (brand) {
        var mh = mark.getBoundingClientRect().height;
        var bh = brand.getBoundingClientRect().height;
        if (mh > 0 && bh > 0) scale = Math.max(0.12, bh / mh);
      }

      if (header) gsap.set(header, { autoAlpha: 0 });

      var self = this;
      var tl = gsap.timeline({
        onComplete: function () {
          pre.classList.add("is-done");
          if (pre.parentNode) pre.parentNode.removeChild(pre);
          document.documentElement.classList.remove("is-loading");
          if (self.lenis) self.lenis.start();
          self.refresh();
          finish();
        }
      });

      tl.set(mark, { yPercent: 12, opacity: 0 })
        .fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
          0
        )
        .to(mark, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 0.6)
        .to(
          stage,
          { y: travel, duration: 0.7, ease: "expo.inOut" },
          0.9
        )
        .to(
          mark,
          {
            scale: scale,
            opacity: 0,
            transformOrigin: "left top",
            duration: 0.7,
            ease: "expo.inOut"
          },
          0.9
        );

      if (header) {
        tl.to(header, { autoAlpha: 1, duration: 0.3, ease: "none" }, 1.35);
      }

      return tl;
    },

    /* ====================================================================
       M2 Hero
       ==================================================================== */

    m2Hero: function () {
      var hero = qs("[data-hero]");
      if (!hero) return null;

      var headline = qs('[data-reveal="lines"]', hero) || qs("[data-hero-headline]", hero);
      var media = qs(".media", hero);
      var img = media ? qs("img, picture, video", media) : null;
      var rest = qsa("[data-hero-reveal]", hero);

      if (this.reduced) {
        if (headline) {
          gsap.set(headline, { opacity: 1 });
          if (headline.__sinLines) gsap.set(headline.__sinLines, { yPercent: 0 });
        }
        if (media) gsap.set(media, { "--curtain-y": "-101%" });
        if (img) gsap.set(img, { scale: 1.08 });
        if (rest.length) gsap.set(rest, { opacity: 1, y: 0 });
        return null;
      }

      var tl = gsap.timeline();

      if (headline) {
        var lines = headline.__sinLines || this.splitLines(headline);
        headline.__sinPlayed = true;
        gsap.set(headline, { opacity: 1 });
        tl.fromTo(
          lines,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" },
          0
        );
      }

      if (media) {
        tl.fromTo(
          media,
          { "--curtain-y": "0%" },
          { "--curtain-y": "-101%", duration: 1.1, ease: "power2.inOut" },
          0.2
        );
        if (img) {
          tl.fromTo(
            img,
            { scale: 1.14 },
            { scale: 1.08, duration: 1.1, ease: "power2.inOut" },
            0.2
          );
        }
      }

      if (rest.length) {
        tl.fromTo(
          rest,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: "expo.out" },
          0.5
        );
      }

      // Parallax across the first viewport. Travel stays inside 12%.
      if (ScrollTrigger && img) {
        gsap.to(img, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      }

      return tl;
    },

    /* ====================================================================
       M3 Prologue. Pinned for 300vh, four lines inking in on progress.
       ==================================================================== */

    m3Prologue: function () {
      var sec = qs("[data-prologue]");
      if (!sec || !ScrollTrigger) return null;

      var lines = qsa("[data-prologue-line]", sec);
      if (!lines.length) return null;

      var pin = qs("[data-prologue-pin]", sec) || sec.firstElementChild || sec;
      var rule = qs("[data-prologue-rule]", sec);

      if (this.reduced) {
        gsap.set(lines, { opacity: 1 });
        if (rule) gsap.set(rule, { scaleX: 1 });
        return null;
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "+=300%",
          pin: pin,
          pinSpacing: true,
          scrub: 0.4,
          invalidateOnRefresh: true
        }
      });

      lines.forEach(function (line, i) {
        tl.fromTo(
          line,
          { opacity: 0.15 },
          { opacity: 1, duration: 1, ease: "none" },
          i
        );
      });

      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: lines.length, ease: "none" },
          0
        );
      }

      return tl;
    },

    /* ====================================================================
       M4 Chapter reveals. The generic grammar every page inherits.
       ==================================================================== */

    m4Reveals: function () {
      var self = this;
      if (!ScrollTrigger) return;

      var targets = qsa("[data-reveal]").filter(function (el) {
        // The hero owns its own reveal, M2 runs it after the preloader.
        return !el.closest("[data-hero]");
      });

      targets.forEach(function (el) {
        var mode = el.getAttribute("data-reveal");
        var isMedia = el.classList.contains("media");

        if (self.reduced) {
          gsap.set(el, { opacity: 1, y: 0 });
          if (isMedia) gsap.set(el, { "--curtain-y": "-101%" });
          if (mode === "lines") {
            var reducedLines = self.splitLines(el);
            gsap.set(reducedLines, { yPercent: 0 });
          }
          return;
        }

        if (mode === "lines") {
          var lines = self.splitLines(el);
          gsap.set(el, { opacity: 1 });
          gsap.set(lines, { yPercent: 110 });
          ScrollTrigger.create({
            trigger: el,
            start: "top 80%",
            once: true,
            onEnter: function () {
              el.__sinPlayed = true;
              // Read the lines at play time. A re-split once the real face
              // arrives replaces the nodes this trigger was created with.
              gsap.to(el.__sinLines || lines, {
                yPercent: 0,
                duration: 0.9,
                stagger: 0.06,
                ease: "expo.out"
              });
            }
          });
          return;
        }

        if (isMedia) {
          var img = qs("img, picture, video", el);
          gsap.set(el, { opacity: 1 });
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: function () {
              gsap.fromTo(
                el,
                { "--curtain-y": "0%" },
                { "--curtain-y": "-101%", duration: 1.1, ease: "power2.inOut" }
              );
              if (img) {
                gsap.fromTo(
                  img,
                  { scale: 1.14 },
                  { scale: 1.08, duration: 1.1, ease: "power2.inOut" }
                );
              }
            }
          });
          return;
        }

        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 80%", once: true }
          }
        );
      });

      // Any शिरोरेखा asked to draw itself.
      qsa(".shirorekha[data-draw]").forEach(function (line) {
        if (self.reduced) {
          gsap.set(line, { scaleX: 1 });
          return;
        }
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power2.inOut",
            scrollTrigger: { trigger: line, start: "top 85%", once: true }
          }
        );
      });
    },

    /* ====================================================================
       M5 Hold to see the hands.
       Pointer, touch and keyboard all drive the same progress tween.
       ==================================================================== */

    m5Hold: function () {
      var self = this;
      var holds = qsa("[data-hold], .hold");
      if (!holds.length) return;

      holds.forEach(function (hold) {
        if (hold.__sinHold) return;
        hold.__sinHold = true;

        var front = qs(".hold__front", hold);
        var back = qs(".hold__back", hold);
        var labelEl = qs(".hold__label-text", hold);
        var progressEl = qs(".hold__progress", hold);
        if (!front || !back) return;

        var restLabel =
          hold.getAttribute("data-hold-label") ||
          (labelEl ? labelEl.textContent : "Hold to see the hands");
        var heldLabel =
          hold.getAttribute("data-hold-credit") || restLabel;

        if (hold.tagName !== "BUTTON" && !hold.hasAttribute("tabindex")) {
          hold.setAttribute("tabindex", "0");
          hold.setAttribute("role", "button");
        }
        if (!hold.hasAttribute("aria-pressed")) {
          hold.setAttribute("aria-pressed", "false");
        }

        var state = { v: 0 };

        function apply() {
          var p = state.v;
          gsap.set(front, { clipPath: "inset(0 0 " + p * 100 + "% 0)" });
          gsap.set(back, { scale: 1.06 - 0.06 * p, transformOrigin: "center" });
          if (progressEl) {
            progressEl.textContent = Math.round(p * 100) + "%";
          }
        }

        var tween = gsap.to(state, {
          v: 1,
          duration: 0.7,
          ease: "power2.inOut",
          paused: true,
          onUpdate: apply
        });

        apply();

        var held = false;

        function down(e) {
          if (held) return;
          held = true;
          hold.classList.add("is-held");
          hold.setAttribute("aria-pressed", "true");
          if (labelEl) labelEl.textContent = heldLabel;
          if (self.reduced) {
            state.v = 1;
            apply();
          } else {
            tween.play();
          }
          if (e && e.type === "pointerdown" && hold.setPointerCapture) {
            try {
              hold.setPointerCapture(e.pointerId);
            } catch (err) {
              /* Capture is a nicety, not a requirement. */
            }
          }
        }

        function up() {
          if (!held) return;
          held = false;
          hold.classList.remove("is-held");
          hold.setAttribute("aria-pressed", "false");
          if (labelEl) labelEl.textContent = restLabel;
          if (self.reduced) {
            state.v = 0;
            apply();
          } else {
            tween.reverse();
          }
        }

        hold.addEventListener("pointerdown", down);
        hold.addEventListener("pointerup", up);
        hold.addEventListener("pointercancel", up);
        hold.addEventListener("pointerleave", up);
        hold.addEventListener("blur", up);

        // Touch fallback for engines without pointer events.
        if (!window.PointerEvent) {
          hold.addEventListener("touchstart", down, { passive: true });
          hold.addEventListener("touchend", up);
          hold.addEventListener("touchcancel", up);
        }

        hold.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
            e.preventDefault();
            if (!e.repeat) down();
          }
        });

        hold.addEventListener("keyup", function (e) {
          if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
            e.preventDefault();
            up();
          }
        });
      });
    },

    /* ====================================================================
       M6 Lane cards. Hover expands one, compresses the rest.
       Mobile keeps the native scroll snap row from components.css.
       ==================================================================== */

    m6Lanes: function () {
      var self = this;
      var rows = qsa("[data-lanes], .lanes");
      if (!rows.length || !this.mm) return;

      this.mm.add("(min-width: 1080px)", function () {
        rows.forEach(function (row) {
          var cards = qsa(".lane", row);
          if (cards.length < 2) return;

          function activate(card) {
            cards.forEach(function (c) {
              var on = c === card;
              c.classList.toggle("is-active", on);
              gsap.to(c, {
                flexGrow: on ? 2.2 : 1,
                duration: self.reduced ? 0 : 0.6,
                ease: "expo.out"
              });
              if (on) {
                var media = qs(".media", c);
                if (media) {
                  gsap.to(media, {
                    "--curtain-y": "-101%",
                    duration: self.reduced ? 0 : 1.1,
                    ease: "power2.inOut"
                  });
                }
              }
            });
          }

          function reset() {
            cards.forEach(function (c) {
              c.classList.remove("is-active");
              gsap.to(c, {
                flexGrow: 1,
                duration: self.reduced ? 0 : 0.6,
                ease: "expo.out"
              });
            });
          }

          cards.forEach(function (card) {
            card.addEventListener("mouseenter", function () {
              activate(card);
            });
            card.addEventListener("focusin", function () {
              activate(card);
            });
          });

          row.addEventListener("mouseleave", reset);
          row.addEventListener("focusout", function (e) {
            if (!row.contains(e.relatedTarget)) reset();
          });
        });

        return function () {
          rows.forEach(function (row) {
            qsa(".lane", row).forEach(function (c) {
              c.classList.remove("is-active");
              gsap.set(c, { clearProps: "flexGrow" });
            });
          });
        };
      });
    },

    /* ====================================================================
       M7 The Drop. Pinned horizontal scrub on desktop, native scroll below.
       ==================================================================== */

    m7Drop: function () {
      var self = this;
      var sections = qsa("[data-drop]");
      if (!sections.length || !this.mm || !ScrollTrigger) return;

      this.mm.add("(min-width: 1080px)", function () {
        var tweens = [];
        sections.forEach(function (sec) {
          var track = qs("[data-drop-track]", sec) || qs(".pieces", sec);
          if (!track) return;

          if (self.reduced) {
            gsap.set(track, { x: 0 });
            return;
          }

          // Measured from layout offsets and the track's untransformed left
          // edge, so a refresh part way through the scrub still reads the
          // same number as a refresh at rest.
          var distance = function () {
            var kids = Array.prototype.slice.call(track.children);
            if (!kids.length) return 0;
            var first = kids[0];
            var last = kids[kids.length - 1];
            var content = last.offsetLeft + last.offsetWidth - first.offsetLeft;
            var x = Number(gsap.getProperty(track, "x")) || 0;
            var pad = track.getBoundingClientRect().left - x;
            return Math.max(
              0,
              Math.round(content - (window.innerWidth - pad * 2))
            );
          };

          if (distance() <= 0) return;

          tweens.push(
            gsap.to(track, {
              x: function () {
                return -distance();
              },
              ease: "none",
              scrollTrigger: {
                trigger: sec,
                start: "top top",
                end: function () {
                  return "+=" + distance();
                },
                pin: true,
                scrub: 0.6,
                anticipatePin: 1,
                invalidateOnRefresh: true
              }
            })
          );
        });

        return function () {
          tweens.forEach(function (t) {
            if (t.scrollTrigger) t.scrollTrigger.kill();
            t.kill();
          });
          sections.forEach(function (sec) {
            var track = qs("[data-drop-track]", sec) || qs(".pieces", sec);
            if (track) gsap.set(track, { clearProps: "transform" });
          });
        };
      });
    },

    /* ====================================================================
       M8 The Tag diagram.
       Four callout lines draw out of the woven tag, then their labels fade
       in behind them. Stroke length is measured off the geometry so the
       dash is exactly as long as the line it hides.
       ==================================================================== */

    m8Tag: function () {
      var self = this;
      var figures = qsa("[data-tag], .tag-diagram");
      if (!figures.length) return null;

      figures.forEach(function (fig) {
        if (fig.__sinTag) return;
        fig.__sinTag = true;

        var lines = qsa("[data-tag-line]", fig);
        var labels = qsa("[data-tag-label]", fig);
        if (!lines.length && !labels.length) return;

        lines.forEach(function (line) {
          var len = 0;
          if (typeof line.getTotalLength === "function") {
            try {
              len = line.getTotalLength();
            } catch (e) {
              len = 0;
            }
          }
          line.__sinLen = len > 0 ? len : 240;
        });

        if (self.reduced) {
          lines.forEach(function (line) {
            gsap.set(line, { strokeDasharray: "none", strokeDashoffset: 0 });
          });
          if (labels.length) gsap.set(labels, { opacity: 1 });
          return;
        }

        lines.forEach(function (line) {
          gsap.set(line, {
            strokeDasharray: line.__sinLen,
            strokeDashoffset: line.__sinLen
          });
        });
        if (labels.length) gsap.set(labels, { opacity: 0 });

        var play = function () {
          var tl = gsap.timeline();
          tl.to(
            lines,
            {
              strokeDashoffset: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power2.inOut"
            },
            0
          );
          if (labels.length) {
            tl.to(
              labels,
              { opacity: 1, duration: 0.5, stagger: 0.15, ease: "none" },
              0.45
            );
          }
          return tl;
        };

        if (ScrollTrigger) {
          ScrollTrigger.create({
            trigger: fig,
            start: "top 70%",
            once: true,
            onEnter: play
          });
        } else {
          play();
        }
      });

      return this;
    },

    /* ====================================================================
       M8 The House diagram. Bars draw, figures count.
       ==================================================================== */

    m8House: function () {
      var self = this;
      var sec = qs("[data-house]");
      if (!sec) return null;

      var bars = qsa("[data-house-bar]", sec);
      var figures = qsa("[data-count]", sec);

      if (this.reduced) {
        gsap.set(bars, { scaleX: 1 });
        figures.forEach(function (f) {
          f.textContent = f.getAttribute("data-count");
        });
        return null;
      }

      gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });

      var play = function () {
        gsap.to(bars, {
          scaleX: 1,
          duration: 1.2,
          stagger: 0.15,
          ease: "power2.inOut"
        });
        figures.forEach(function (f) {
          var end = parseFloat(f.getAttribute("data-count")) || 0;
          var prefix = f.getAttribute("data-count-prefix") || "";
          var suffix = f.getAttribute("data-count-suffix") || "";
          var obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 1.2,
            ease: "power2.inOut",
            snap: { v: 1 },
            onUpdate: function () {
              f.textContent = prefix + Math.round(obj.v) + suffix;
            }
          });
        });
      };

      if (ScrollTrigger) {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 75%",
          once: true,
          onEnter: play
        });
      } else {
        play();
      }

      return self;
    },

    /* ====================================================================
       M9 Cursor. 12px dot, 72px labelled ring over [data-cursor].
       ==================================================================== */

    m9Cursor: function () {
      if (this.reduced || isTouch()) return null;

      var el = qs("[data-cursor-el]") || qs(".cursor");
      if (!el) {
        el = document.createElement("div");
        el.className = "cursor";
        el.setAttribute("data-cursor-el", "");
        el.setAttribute("aria-hidden", "true");
        var label = document.createElement("span");
        label.className = "cursor__label";
        el.appendChild(label);
        document.body.appendChild(el);
      }

      var labelEl = qs(".cursor__label", el);
      // Parked and invisible until the pointer actually moves, so it never
      // sits in the middle of a screenshot or an untouched page.
      gsap.set(el, { autoAlpha: 0 });
      var woken = false;
      var target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      var pos = { x: target.x, y: target.y };
      var lerp = 0.18;
      var setX = gsap.quickSetter(el, "x", "px");
      var setY = gsap.quickSetter(el, "y", "px");

      window.addEventListener(
        "pointermove",
        function (e) {
          target.x = e.clientX;
          target.y = e.clientY;
          if (!woken) {
            woken = true;
            pos.x = target.x;
            pos.y = target.y;
            gsap.to(el, { autoAlpha: 1, duration: 0.3, ease: "none" });
          }
        },
        { passive: true }
      );

      gsap.ticker.add(function () {
        pos.x += (target.x - pos.x) * lerp;
        pos.y += (target.y - pos.y) * lerp;
        setX(pos.x);
        setY(pos.y);
      });

      var dot = 12;
      var ring = 72;

      function grow(text) {
        el.classList.add("is-ring");
        if (labelEl) labelEl.textContent = text;
        gsap.to(el, {
          width: ring,
          height: ring,
          margin: -ring / 2 + "px 0 0 " + -ring / 2 + "px",
          duration: 0.3,
          ease: "expo.out"
        });
        if (labelEl) gsap.to(labelEl, { opacity: 1, duration: 0.3 });
      }

      function shrink() {
        el.classList.remove("is-ring");
        gsap.to(el, {
          width: dot,
          height: dot,
          margin: -dot / 2 + "px 0 0 " + -dot / 2 + "px",
          duration: 0.3,
          ease: "expo.out"
        });
        if (labelEl) {
          gsap.to(labelEl, {
            opacity: 0,
            duration: 0.2,
            onComplete: function () {
              labelEl.textContent = "";
            }
          });
        }
      }

      // Delegated so cards added later still read their label.
      document.addEventListener("pointerover", function (e) {
        var t = e.target.closest ? e.target.closest("[data-cursor]") : null;
        if (t) grow(t.getAttribute("data-cursor") || "");
      });

      document.addEventListener("pointerout", function (e) {
        var t = e.target.closest ? e.target.closest("[data-cursor]") : null;
        if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) shrink();
      });

      return el;
    },

    /* ====================================================================
       M10 Header. Hides past 120px on the way down, returns on the way up.
       ==================================================================== */

    m10Header: function () {
      var header = qs("[data-header]") || qs(".header");
      if (!header) return null;

      var last = window.scrollY || 0;
      var hidden = false;
      var threshold = 120;

      function update() {
        var y = window.scrollY || window.pageYOffset || 0;
        // Lenis emits scroll events on frames where the position has not
        // moved. Those carry no direction, so they must not count as "up",
        // otherwise the header flickers between hidden and shown on the way
        // down. Anything under two pixels is treated as no movement.
        if (Math.abs(y - last) < 2 && y >= threshold) return;
        var down = y > last;
        last = y;

        // Below the threshold the header is always shown, no matter how it
        // got there: a scroll up, a jump to the top (scrollTo, an anchor
        // link, a browser scroll restore) all count.
        if (y < threshold) {
          if (hidden) {
            hidden = false;
            header.classList.remove("is-hidden");
          }
          return;
        }

        if (down && !hidden) {
          hidden = true;
          header.classList.add("is-hidden");
        } else if (!down && hidden) {
          hidden = false;
          header.classList.remove("is-hidden");
        }
      }

      if (this.lenis) {
        this.lenis.on("scroll", update);
      } else {
        window.addEventListener("scroll", update, { passive: true });
      }

      this.showHeader = function () {
        hidden = false;
        header.classList.remove("is-hidden");
      };

      return header;
    },

    /* ====================================================================
       M11 Footer. Super rule draws, giant wordmark rises.
       ==================================================================== */

    m11Footer: function () {
      var footer = qs("[data-footer]") || qs(".footer");
      if (!footer) return null;

      var rule = qs(".shirorekha", footer);
      var mask = qs(".footer__wordmark", footer);
      var mark = qs(".footer__wordmark > span", footer);

      // The wordmark hangs from the super rule, so it has to be exactly as
      // wide as the rule. Measured off the real glyphs rather than guessed
      // from a viewport unit, and measured again when the face or the width
      // changes.
      this.fitFooter = function () {
        if (!mask || !mark) return;
        mask.style.fontSize = "";
        var avail = mask.clientWidth;
        if (!avail) return;
        var base = parseFloat(window.getComputedStyle(mask).fontSize) || 16;
        var range = document.createRange();
        range.selectNodeContents(mark);
        var w = range.getBoundingClientRect().width;
        if (!w) return;
        mask.style.fontSize = (base * (avail / w)).toFixed(2) + "px";
      };
      this.fitFooter();

      if (this.reduced) {
        if (rule) gsap.set(rule, { scaleX: 1 });
        if (mark) gsap.set(mark, { yPercent: 0, opacity: 1 });
        return null;
      }

      var tl = gsap.timeline({
        scrollTrigger: ScrollTrigger
          ? { trigger: footer, start: "top 85%", once: true }
          : undefined
      });

      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, ease: "power2.inOut" },
          0
        );
      }
      if (mark) {
        tl.fromTo(
          mark,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: "expo.out" },
          0.2
        );
      }

      return tl;
    },

    /* ====================================================================
       M12 Page transitions. Ink curtain up, navigate, curtain away.
       ==================================================================== */

    m12Transitions: function () {
      var curtain = qs("[data-transition]") || qs(".transition");
      this.curtain = curtain || null;
      if (!curtain) return null;

      if (this.reduced) {
        gsap.set(curtain, { yPercent: 100, autoAlpha: 0 });
        return null;
      }
      return curtain;
    },

    // Called by site.js once fonts are ready. Lifts the arrival curtain.
    revealPage: function () {
      var curtain = this.curtain || qs("[data-transition]") || qs(".transition");
      if (!curtain) return;
      if (this.reduced) {
        gsap.set(curtain, { yPercent: 100, autoAlpha: 0 });
        return;
      }
      gsap.to(curtain, {
        yPercent: -100,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: function () {
          // Parked out of the paint tree until a link needs it again.
          gsap.set(curtain, { yPercent: 100, autoAlpha: 0 });
        }
      });
    },

    // Called by site.js on an internal link click.
    leavePage: function (href) {
      var curtain = this.curtain || qs("[data-transition]") || qs(".transition");
      if (!curtain || this.reduced || !gsap) {
        window.location.href = href;
        return;
      }
      gsap.set(curtain, { autoAlpha: 1 });
      gsap.fromTo(
        curtain,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: function () {
            window.location.href = href;
          }
        }
      );
    }
  };

  window.SinMotion = SinMotion;
})(window, document);
