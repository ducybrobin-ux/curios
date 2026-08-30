/* =========================================================
   Curi🧭s — Dictée vocale des réponses (Web Speech API)
   Bouton 🎤 à côté d'un champ : dicte la réponse dans le champ.
   bindFocused : dicte dans le dernier champ focalisé (ex. éditeur).
   ========================================================= */

const Dictation = (function () {
  "use strict";

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SR;
  let current = null;
  let lastInput = null;

  if (typeof document !== "undefined") {
    document.addEventListener("focusin", (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) lastInput = t;
    });
  }

  /* Clé de traduction sécurisée (I18N optionnel, ex. page éditeur) */
  function L(key, fallback) {
    if (typeof I18N !== "undefined" && I18N && typeof I18N.t === "function") {
      const v = I18N.t(key);
      if (v != null && v !== "") return v;
    }
    return fallback;
  }

  function notify(msg) {
    if (window.HermesToast) window.HermesToast(msg);
  }

  function off() {
    if (current) {
      const rec = current.rec;
      const btn = current.btn;
      current = null;
      try { rec.stop(); } catch (e) {}
      if (btn) {
        btn.classList.remove("on");
        btn.setAttribute("aria-pressed", "false");
        btn.title = L("dict_start", "🎤 Dicter");
      }
    }
  }

  function startRec(input, btn, lang) {
    if (current) { off(); return; }
    const rec = new SR();
    rec.lang = lang || ((typeof I18N !== "undefined" && I18N && I18N.region) || "fr-FR");
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : "";
      input.value = text.trim();
      input.focus();
    };
    rec.onend = () => off();
    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        notify(L("dict_error", "La dictée a échoué."));
      }
      off();
    };
    try {
      rec.start();
      current = { rec: rec, btn: btn };
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
      btn.title = L("dict_stop", "■ Arrêter la dictée");
    } catch (e) {
      off();
      notify(L("dict_unsupported", "La dictée vocale n'est pas disponible sur cet appareil."));
    }
  }

  function attach(input, btn, lang) {
    if (!input || !btn) return;
    if (!supported) { btn.classList.add("hidden"); return; }
    btn.addEventListener("click", () => startRec(input, btn, lang));
  }

  function bindFocused(btn, lang) {
    if (!btn) return;
    if (!supported) { btn.classList.add("hidden"); return; }
    btn.addEventListener("click", () => {
      const input = lastInput;
      if (!input) { notify("Cliquez d'abord dans le champ à remplir."); return; }
      startRec(input, btn, lang);
    });
  }

  function stop() {
    if (current) off();
  }

  return { supported: supported, attach: attach, bindFocused: bindFocused, stop: stop };
})();
