/* ==========================================================================
   Sinगली. Site boot.
   Waits for fonts, starts the motion layer, and owns the small pieces of
   page behaviour that are not sequences: the nav toggle, internal link
   transitions, the bag count and the footer year.
   ========================================================================== */

(function (window, document) {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function reduced() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  var Site = {
    booted: false,

    /* ---- Nav ---------------------------------------------------------- */

    nav: function () {
      var toggle = qs("[data-nav-toggle]");
      var nav = qs("[data-nav]") || qs(".nav");
      if (!toggle || !nav) return;

      var open = false;

      function set(next) {
        open = next;
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.documentElement.classList.toggle("no-scroll", open);
        var label = qs("[data-nav-toggle-label]", toggle);
        if (label) label.textContent = open ? "Close" : "Menu";
        if (window.SinMotion && window.SinMotion.lenis) {
          if (open) {
            window.SinMotion.lenis.stop();
          } else {
            window.SinMotion.lenis.start();
          }
        }
      }

      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", function () {
        set(!open);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && open) {
          set(false);
          toggle.focus();
        }
      });

      qsa("a", nav).forEach(function (a) {
        a.addEventListener("click", function () {
          if (open) set(false);
        });
      });

      // The panel only exists under 1080px. Leaving that range closes it.
      if (window.matchMedia) {
        var mq = window.matchMedia("(min-width: 1080px)");
        var onChange = function (e) {
          if (e.matches && open) set(false);
        };
        if (mq.addEventListener) {
          mq.addEventListener("change", onChange);
        } else if (mq.addListener) {
          mq.addListener(onChange);
        }
      }
    },

    /* ---- Internal link transitions (M12) ------------------------------- */

    links: function () {
      if (reduced()) return;

      document.addEventListener("click", function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }

        var a = e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;

        var href = a.getAttribute("href");
        if (!href) return;
        if (a.target && a.target !== "_self") return;
        if (a.hasAttribute("download")) return;
        if (a.hasAttribute("data-no-transition")) return;
        if (href.charAt(0) === "#") return;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

        var url;
        try {
          url = new URL(a.href, window.location.href);
        } catch (err) {
          return;
        }
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;

        e.preventDefault();
        if (window.SinMotion && window.SinMotion.leavePage) {
          window.SinMotion.leavePage(url.href);
        } else {
          window.location.href = url.href;
        }
      });

      // A page restored from the back forward cache arrives with the curtain
      // still down. Lift it again.
      window.addEventListener("pageshow", function (e) {
        if (e.persisted && window.SinMotion && window.SinMotion.revealPage) {
          window.SinMotion.revealPage();
        }
      });
    },

    /* ---- Bag count placeholder ------------------------------------------
       There is no cart yet. This reads a stored count so the header tells
       the truth the day one is wired in. */

    bag: function () {
      var els = qsa("[data-bag-count]");
      if (!els.length) return;

      var count = 0;
      try {
        count = parseInt(window.localStorage.getItem("sin_bag_count"), 10) || 0;
      } catch (err) {
        count = 0;
      }

      els.forEach(function (el) {
        el.textContent = String(count);
      });

      var labels = qsa("[data-bag-label]");
      labels.forEach(function (el) {
        el.setAttribute(
          "aria-label",
          count === 1 ? "Bag, 1 piece" : "Bag, " + count + " pieces"
        );
      });
    },

    setBagCount: function (n) {
      try {
        window.localStorage.setItem("sin_bag_count", String(n));
      } catch (err) {
        /* Storage blocked. The header simply keeps its last value. */
      }
      this.bag();
    },

    /* ---- Footer year ---------------------------------------------------- */

    year: function () {
      var y = String(new Date().getFullYear());
      qsa("[data-year]").forEach(function (el) {
        el.textContent = y;
      });
    },

    /* ---- Boot ------------------------------------------------------------ */

    boot: function () {
      if (this.booted) return;
      this.booted = true;

      this.nav();
      this.links();
      this.bag();
      this.year();

      if (window.SinMotion) {
        window.SinMotion.init();
        window.SinMotion.revealPage();
      } else {
        document.documentElement.classList.add("motion-off");
      }

      document.documentElement.classList.add("is-ready");
    }
  };

  window.SinSite = Site;

  // If the motion layer never gets there, drop every hidden state so the
  // page is readable no matter what failed.
  var failsafe = window.setTimeout(function () {
    if (!document.documentElement.classList.contains("is-ready")) {
      document.documentElement.classList.add("motion-off");
    }
  }, 6000);

  function start() {
    try {
      Site.boot();
      window.clearTimeout(failsafe);
    } catch (err) {
      window.clearTimeout(failsafe);
      document.documentElement.classList.add("motion-off");
      if (window.console && window.console.error) {
        window.console.error("Sin boot failed", err);
      }
    }
  }

  // Fonts first, so the line splitter measures the real typeface. A slow
  // font never holds the page though: after the cap we boot anyway and the
  // splitter re-measures itself when document.fonts.ready finally settles.
  var FONT_WAIT = 1200;

  function whenReady() {
    var started = false;
    function go() {
      if (started) return;
      started = true;
      start();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(go, go);
      window.setTimeout(go, FONT_WAIT);
    } else {
      go();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
})(window, document);
