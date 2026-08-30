/* router.js — Routeur de screens, extrait de app.js.
 *
 * Gère la navigation entre écrans, le title, les nav buttons,
 * et les effets de bord (stop camera, stop compass, etc.).
 *
 * Expose window.Router pour usage dans app.js.
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  /**
   * Crée un routeur de screens.
   * @param {object} deps
   * @param {Function} deps.$ — DOM getElementById
   * @param {Function} deps.t — I18N.t
   * @param {object} deps.state — objet avec .screen, .cameraOn, .compassOn
   * @param {object} deps.effects — { stopCamera, stopCompass, stopAudio, stopVoice, onIntro }
   * @returns {{ navigate, current, canGoBack }}
   */
  function createRouter({ $, t, state, effects }) {
    let history = [];

    function navigate(name) {
      const prev = state.screen;

      // Hide all screens, show target
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const scr = $(`screen-${name}`);
      if (scr) scr.classList.add("active");

      // Update state
      state.screen = name;

      // Update page title
      const titleEl = $("page-title");
      if (titleEl) titleEl.textContent = name === "home" ? "JDP" : (t(`title_${name}`) || "JDP");

      // Update nav buttons
      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.go === name || (name === "scan" && b.dataset.go === "map"));
      });

      // Side effects: stop camera, compass, audio, voice
      if (name !== "scan" && state.cameraOn) effects.stopCamera();
      state.cameraOn = false;
      if (name !== "map") effects.stopCompass();
      if (name !== "bird" && name !== "map") effects.stopAudio();
      effects.stopVoice();

      // Intro rules
      if (name === "intro") effects.onIntro();

      // Home button visibility
      const btnHome = $("btn-home");
      if (btnHome) btnHome.style.visibility = name === "home" ? "hidden" : "visible";

      // Scroll to top
      window.scrollTo(0, 0);

      // Track history
      if (prev && prev !== name) history.push(prev);
    }

    function current() {
      return state.screen;
    }

    function canGoBack() {
      return history.length > 0;
    }

    function goBack() {
      if (history.length > 0) {
        navigate(history.pop());
      }
    }

    return { navigate, current, canGoBack, goBack };
  }

  window.Router = { createRouter };
})();
