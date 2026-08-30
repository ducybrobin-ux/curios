/* =========================================================
   Curi🧭s — Lecture des QR codes des balises
   - BarcodeDetector quand disponible (Chrome / Android)
   - jsQR + canvas en secours (iPhone / Safari, universel)
   - Saisie manuelle du code en secours (solution fiable partout)
   ========================================================= */

const QrScan = (function () {
  const video = document.getElementById("scanner");
  let stream = null;
  let loop = false;
  let detector = null;
  let last = null;
  let lastAt = 0;
  let onDetect = null;
  let cv = null;
  let cctx = null;
  let lastRun = 0;
  let hiddenStop = false;

  function support() {
    return "BarcodeDetector" in window;
  }

  async function start(cb) {
    onDetect = cb;
    bindHideHandlers();
    if (!window.isSecureContext || !navigator.mediaDevices) {
      setStatus("❌ Caméra bloquée : cette page n'est pas servie en HTTPS (obligatoire pour la caméra).");
      fetch("api/ip", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((info) => {
          if (info && info.url) {
            setStatus(`❌ Caméra bloquée : la page n'est pas en HTTPS (obligatoire pour la caméra). Rechargez-la via ${  info.url  } (l'adresse HTTPS du serveur) pour activer la caméra et le GPS.`);
          } else if (window.location.protocol === "http:" && /^localhost|127\./.test(window.location.hostname)) {
            setStatus("❌ Caméra bloquée : sur cet appareil (hors contexte sécurisé), ouvrez l'adresse HTTPS affichée dans le panneau « Connecter un autre appareil » pour activer la caméra et le GPS.");
          }
        })
        .catch(() => {});
      return false;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      await video.play();
      if (support()) {
        detector = new BarcodeDetector({ formats: ["qr_code"] });
        loop = true;
        scanLoop();
      } else if (typeof window.jsQR === "function") {
        loop = true;
        scanCanvas(0);
      } else {
        setStatus("📷 Caméra allumée. Le scan auto n'est pas disponible sur cet appareil : utilise la saisie du code ci-dessous.");
      }
      return true;
    } catch (e) {
      setStatus(`❌ Impossible d'accéder à la caméra : ${  e && e.message ? e.message : e  } — sinon, saisissez le code inscrit sous le QR.`);
      return false;
    }
  }

  async function scanLoop() {
    if (!loop || !detector) return;
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length) {
        const raw = codes[0].rawValue || "";
        const now = Date.now();
        if (raw && (raw !== last || now - lastAt > 3000)) {
          last = raw; lastAt = now;
          if (onDetect) onDetect(raw);
        }
      }
    } catch (e) { /* frame suivante */ }
    requestAnimationFrame(scanLoop);
  }

  /* Décodage universel (iPhone / Safari) : le flux vidéo est dessiné
     dans un canvas réduit puis analysé par jsQR. Cadencé (~6 images/s)
     pour préserver la batterie sur mobile. */
  function scanCanvas(ts) {
    if (!loop) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) { requestAnimationFrame(scanCanvas); return; }
    if (ts - lastRun < 160) { requestAnimationFrame(scanCanvas); return; }
    lastRun = ts;
    if (!cv) { cv = document.createElement("canvas"); cctx = cv.getContext("2d"); }
    const maxW = 480;
    const scale = Math.min(1, maxW / w);
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    cctx.drawImage(video, 0, 0, cv.width, cv.height);
    const side = Math.min(cv.width, cv.height);
    const img = cctx.getImageData((cv.width - side) / 2, (cv.height - side) / 2, side, side);
    try {
      const code = window.jsQR(img.data, side, side, { inversionAttempts: "attemptBoth" });
      if (code && code.data) {
        const raw = String(code.data);
        const now = Date.now();
        if (raw && (raw !== last || now - lastAt > 3000)) {
          last = raw; lastAt = now;
          if (onDetect) onDetect(raw);
        }
      }
    } catch (e) { /* frame illisible */ }
    requestAnimationFrame(scanCanvas);
  }

  function stop() {
    loop = false;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (video) { video.srcObject = null; }
    detector = null;
  }

  /* iOS met la caméra en pause quand l'app passe en arrière-plan :
     on coupe le flux pour éviter une image noire au retour. */
  function onHide() {
    if (!loop || hiddenStop) return;
    hiddenStop = true;
    stop();
  }

  function onShow() {
    hiddenStop = false;
  }

  function bindHideHandlers() {
    if (QrScan._bound) return;
    QrScan._bound = true;
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onHide(); else onShow();
    });
  }

  function setStatus(msg) {
    const el = document.getElementById("scan-status");
    if (el) el.textContent = msg;
  }

  /* Valide un code saisi ou lu contre les balises (tolérant) */
  function matchCode(raw) {
    const s = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    return BALISES.find((b) => b.code.toUpperCase() === s || b.id.toUpperCase() === s) || null;
  }

  return { support, start, stop, matchCode, setStatus };
})();
