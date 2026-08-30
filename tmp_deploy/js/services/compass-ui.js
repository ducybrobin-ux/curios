/* services/compass-ui.js — UI boussole, extrait de app.js.
 *
 * Gère le lissage de distance/cap, la proximité, le rendu lumineux
 * et les émoticônes. Expose window.CompassUI.
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  const EMOJI_CHAINS = {
    faces: ["😟", "😕", "😐", "🙂", "😍"],
    hearts: ["🖤", "💜", "💙", "💛", "❤️"],
    cats: ["😿", "🙀", "😺", "😸", "😻"],
    moons: ["🌑", "🌒", "🌔", "🌕", "✨"],
  };

  function createCompassUI({ $, normDeg, cardinal, Store, I18N }) {
    let compassLastRaw = null;
    let compassState = null;
    let compassGlow = 0;
    let proxAwayCount = 0;
    let proxOnTarget = false;
    let smoothDist = null;
    let headingBuf = [];
    let smoothHeading = null;
    let lastHaptic = 0;
    const HEADING_WINDOW = 5;

    function smoothDistance(d) {
      if (d == null) return null;
      if (smoothDist == null) smoothDist = d;
      else smoothDist = smoothDist * 0.7 + d * 0.3;
      return smoothDist;
    }

    function smoothedHeading(h) {
      if (h == null) return null;
      headingBuf.push(h);
      if (headingBuf.length > HEADING_WINDOW) headingBuf.shift();
      const sorted = headingBuf.slice().sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      if (smoothHeading == null) smoothHeading = med;
      else {
        let d = normDeg(med - smoothHeading);
        if (Math.abs(d) > 120) d = 0;
        smoothHeading = normDeg(smoothHeading + d * 0.4);
      }
      return (smoothHeading + 360) % 360;
    }

    function proximity(dist) {
      if (dist == null) return null;
      if (proxOnTarget) {
        if (dist <= 10) return { away: false, onTarget: true, t: 1 };
        proxOnTarget = false;
      }
      if (dist <= 6) {
        proxOnTarget = true;
        proxAwayCount = 0;
        compassLastRaw = dist;
        compassState = "near";
        return { away: false, onTarget: true, t: 1 };
      }
      let state = compassState;
      if (compassLastRaw != null) {
        const delta = dist - compassLastRaw;
        if (delta > 6) { proxAwayCount++; if (proxAwayCount >= 2) state = "away"; }
        else if (delta < -6) { proxAwayCount = 0; state = "near"; }
      }
      compassLastRaw = dist;
      compassState = state;
      return {
        away: state === "away",
        onTarget: false,
        t: Math.min(1, Math.max(0, 1 - dist / 150)),
      };
    }

    function renderLight(p) {
      const light = $("compass-light");
      if (!light) return;
      if (!p) { light.style.background = "#000"; light.style.boxShadow = ""; return; }
      if (p.onTarget) {
        light.style.background = "#fff";
        light.style.boxShadow = "0 0 24px rgba(255,255,255,1), inset 0 0 6px rgba(0,0,0,0.15)";
        return;
      }
      if (p.away) {
        light.style.background = "#000";
        light.style.boxShadow = "0 0 4px rgba(0,0,0,0.5)";
        return;
      }
      compassGlow += (p.t - compassGlow) * 0.18;
      const hue = Math.round(compassGlow * 270);
      light.style.background = `hsl(${hue}, 100%, 55%)`;
      light.style.boxShadow = `0 0 ${Math.round(6 + compassGlow * 22)}px hsla(${hue}, 100%, 65%, 0.95), inset 0 0 4px rgba(255,255,255,0.5)`;
    }

    function emojiChain() {
      return EMOJI_CHAINS[Store.getSettings().proximityEmoji] || EMOJI_CHAINS.faces;
    }

    function renderEmoji(p) {
      const el = $("compass-emoji");
      if (!el) return;
      const chain = emojiChain();
      if (!p) { el.textContent = chain[0]; el.classList.remove("happy"); el.classList.add("dim"); return; }
      el.classList.remove("dim");
      if (p.onTarget) { el.textContent = chain[4]; el.classList.add("happy"); return; }
      el.classList.remove("happy");
      if (p.away) { el.textContent = chain[0]; return; }
      const idx = p.t < 0.25 ? 1 : p.t < 0.5 ? 2 : p.t < 0.75 ? 3 : 4;
      el.textContent = chain[idx];
      if (idx === 4) el.classList.add("happy");
    }

    function resetLight() {
      compassLastRaw = null;
      compassState = null;
      compassGlow = 0;
      smoothDist = null;
      proxAwayCount = 0;
      proxOnTarget = false;
      headingBuf = [];
      smoothHeading = null;
      lastHaptic = 0;
      const light = $("compass-light");
      if (light) { light.style.background = "#000"; light.style.boxShadow = ""; }
      const rose = $("compass-rose");
      if (rose) rose.style.transform = "rotate(0deg)";
      const emoji = $("compass-emoji");
      if (emoji) { emoji.textContent = emojiChain()[0]; emoji.classList.remove("happy", "dim"); }
      const guide = $("compass-guide");
      if (guide) guide.textContent = I18N.t("compass_guide_wait");
      const head = $("compass-head");
      if (head) head.textContent = "\u2026";
    }

    /* Retour haptique (vibration) en approche de la cible, style boussole 3D. */
    function haptic(p) {
      if (!p || !navigator.vibrate) return;
      const now = Date.now();
      if (p.onTarget) {
        if (now - lastHaptic > 1400) { navigator.vibrate(140); lastHaptic = now; }
        return;
      }
      if (p.t > 0.35 && now - lastHaptic > 750) {
        navigator.vibrate(30);
        lastHaptic = now;
      }
    }

    function onUpdate(out) {
      const here = $("compass-here"), tgt = $("compass-target"),
            dist = $("compass-distance"), az = $("compass-azimut"),
            dir = $("compass-direction"), needle = $("compass-needle"),
            dest = $("compass-dest"), st = $("compass-status"),
            guide = $("compass-guide"), rose = $("compass-rose");
      const head = $("compass-head");
      if (head) {
        if (out.bearing != null) {
          const c = cardinal(out.bearing);
          head.innerHTML = `${I18N.t("compass_head")} <b>${c}</b> <small>\u00b7 ${Math.round(out.bearing)}\u00b0</small>`;
        } else {
          head.textContent = "\u2026";
        }
      }
      if (out.pos) here.textContent = `${out.pos.lat.toFixed(5)}, ${out.pos.lng.toFixed(5)}`;
      else here.textContent = I18N.t("compass_wait");
      if (out.target) tgt.textContent = `${out.target.id} \u00b7 ${out.target.lat.toFixed(5)}, ${out.target.lng.toFixed(5)}`;
      const sDist = smoothDistance(out.distance);
      if (sDist != null) dist.textContent = `${Math.round(sDist)} m`;
      else dist.textContent = "\u2014";
      if (out.bearing != null) az.textContent = `${Math.round(out.bearing)}\u00b0 ${cardinal(out.bearing)}`;
      else az.textContent = "\u2014";

      const heading = smoothedHeading(out.heading);
      if (rose && heading != null) rose.style.transform = `rotate(${-heading}deg)`;
      let rel = null;
      if (out.bearing != null && heading != null) {
        rel = normDeg(out.bearing - heading);
        dir.textContent = `${cardinal(out.bearing)} \u00b7 ${rel >= 0 ? "+" : "-"}${Math.abs(Math.round(rel))}\u00b0`;
      } else if (out.bearing != null) {
        dir.textContent = cardinal(out.bearing);
      } else {
        dir.textContent = "\u2014";
      }

      if (needle) {
        if (out.bearing != null && heading != null) needle.style.transform = `rotate(${normDeg(out.bearing - heading)}deg)`;
        else if (out.bearing != null) needle.style.transform = `rotate(${out.bearing}deg)`;
      }
      if (dest && out.bearing != null) dest.style.transform = `rotate(${out.bearing}deg)`;

      if (guide) {
        if (rel == null) {
          guide.textContent = out.pos ? I18N.t("compass_guide_far") : I18N.t("compass_guide_wait");
        } else {
          const absRel = Math.abs(rel);
          if (absRel <= 22) guide.textContent = I18N.t("compass_guide_here");
          else if (rel > 0) guide.textContent = I18N.t("compass_guide_right");
          else guide.textContent = I18N.t("compass_guide_left");
          if (absRel > 157) guide.textContent = I18N.t("compass_guide_back");
        }
      }

      const p = proximity(sDist);
      renderLight(p);
      renderEmoji(p);
      haptic(p);
      if (st) {
        if (heading != null) {
          const dec = out.decl != null
            ? ` \u00b7 nord vrai (d\u00e9c. ${out.decl >= 0 ? "+" : ""}${out.decl.toFixed(1)}\u00b0)` : "";
          st.textContent = `\ud83e\udded ${Math.round(heading)}\u00b0 ${cardinal(heading)}${dec}`;
        } else if (!out.pos) st.textContent = I18N.t("compass_wait");
        else st.textContent = "\u2139\ufe0f \u2026";
      }
    }

    return { resetLight, onUpdate, smoothDistance, smoothedHeading, proximity, renderLight, renderEmoji };
  }

  window.CompassUI = { createCompassUI, EMOJI_CHAINS };
})();
