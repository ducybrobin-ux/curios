/* =========================================================
   Curi🧭s — Boussole directionnelle vers la balise cible
   - Coordonnées GPS courantes et de la balise
   - Distance restante
   - Cap à suivre (boussole), calibré avec l'orientation du
     téléphone (deviceorientation / webkitCompassHeading)
   - Correction de la déclinaison magnétique (WMM2025, js/declination.js)
     : l'aiguille et le cap affiché indiquent le NORD VRAI.
   ========================================================= */

const Compass = (function () {
  let geoId = null;
  let oriHandler = null;
  let target = null;
  let pos = null;
  let heading = null;   // cap magnétique brut du capteur (0-360)
  let decl = null;      // déclinaison magnétique en degrés (+ est), au point courant
  let cb = null;

  function support() {
    return "DeviceOrientationEvent" in window;
  }

  /* iOS 13+ exige l'autorisation explicite (à lancer sur un geste) */
  async function requestPermission() {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const r = await DeviceOrientationEvent.requestPermission();
        return r === "granted";
      }
    } catch (e) { /* refus ou indisponible */ }
    return true;
  }

  function start(t, onUpdate) {
    stop();
    target = t;
    cb = onUpdate;
    heading = null;
    pos = null;

    if (navigator.geolocation) {
      try {
        geoId = navigator.geolocation.watchPosition(
          (p) => {
            pos = { lat: p.coords.latitude, lng: p.coords.longitude };
            /* Déclinaison magnétique à l'endroit où l'on se trouve :
               le modèle est embarqué, aucun réseau requis. */
            try {
              decl = (typeof GeoMag !== "undefined" && GeoMag.declination)
                ? GeoMag.declination(pos.lat, pos.lng, (p.coords.altitude || 0) / 1000)
                : null;
            } catch (e) { decl = null; }
            emit();
          },
          () => { emit(); },
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
      } catch (e) { /* géolocalisation indisponible */ }
    }

    oriHandler = (e) => {
      const h = readHeading(e);
      if (h != null) { heading = h; emit(); }
    };
    /* On écoute d'abord l'événement absolu (référence au nord) ; l'événement
       non absolu ne sert que de secours tant qu'aucun cap absolu n'est reçu. */
    window.addEventListener("deviceorientationabsolute", oriHandler, true);
    window.addEventListener("deviceorientation", oriHandler, true);
    emit();
  }

  /* Cap de l'appareil (0° = nord), corrigé de l'inclinaison :
     - iOS : webkitCompassHeading est déjà compensé par le navigateur ;
     - Android : événement absolu -> formule W3C valable à plat ET tenu
       vertical (corrige le « nord » quand l'écran n'est pas à plat) ;
     - Secours : alpha non absolu (relatif à l'orientation de départ), à
       ignorer dès qu'un cap absolu a été reçu, sinon la boussole dérive. */
  let hasAbsolute = false;
  function readHeading(e) {
    if (typeof e.webkitCompassHeading === "number") {
      hasAbsolute = true;
      return ((e.webkitCompassHeading % 360) + 360) % 360;
    }
    if (e.absolute === true && e.alpha != null && e.beta != null && e.gamma != null) {
      hasAbsolute = true;
      const rad = Math.PI / 180;
      const cX = Math.cos((e.beta || 0) * rad);
      const cY = Math.cos((e.gamma || 0) * rad);
      const cZ = Math.cos((e.alpha || 0) * rad);
      const sX = Math.sin((e.beta || 0) * rad);
      const sY = Math.sin((e.gamma || 0) * rad);
      const sZ = Math.sin((e.alpha || 0) * rad);
      if (Math.abs(e.beta) < 30) {
        /* Téléphone à plat : le nord se lit directement sur alpha. */
        return (360 - e.alpha) % 360;
      }
      /* Téléphone tenu vertical : projection du cap sur l'horizon
         (exemple de calcul du W3C — worké pour l'usage « boussole en main »). */
      const Vx = -cZ * sY - sZ * sX * cY;
      const Vy = -sZ * sY + cZ * sX * cY;
      let h = Math.atan(Vx / Vy);
      if (Vy < 0) h += Math.PI;
      else if (Vx < 0) h += 2 * Math.PI;
      return (h * (180 / Math.PI) + 360) % 360;
    }
    if (!hasAbsolute && typeof e.alpha === "number") {
      return (360 - e.alpha) % 360;
    }
    return null;
  }

  /* Cap vrai : cap magnétique du capteur + déclinaison locale (nord géographique). */
  function trueHeading(h) {
    if (h == null || decl == null) return h;
    return (((h + decl) % 360) + 360) % 360;
  }

  function emit() {
    if (!cb) return;
    const out = { heading: trueHeading(heading), decl, pos, target, bearing: null, distance: null };
    if (pos) {
      out.distance = GeoMath.haversine(pos.lat, pos.lng, target.lat, target.lng);
      out.bearing = GeoMath.bearing(pos.lat, pos.lng, target.lat, target.lng);
    }
    cb(out);
  }

  /* bearing déplacé dans packages/geolocation → window.GeoMath.bearing */

  function stop() {
    if (geoId != null && navigator.geolocation) navigator.geolocation.clearWatch(geoId);
    geoId = null;
    if (oriHandler) {
      window.removeEventListener("deviceorientationabsolute", oriHandler, true);
      window.removeEventListener("deviceorientation", oriHandler, true);
    }
    oriHandler = null;
    hasAbsolute = false;
    heading = null;
    decl = null;
    pos = null;
  }

  return { support, requestPermission, start, stop, bearing: GeoMath.bearing, haversine: GeoMath.haversine };
})();
