/* =========================================================
   Curi🧭s — Reconnaissance sonore
   Principe : enregistrement 8 s via le micro, puis analyse par
   une API BirdNET (à configurer) ou par un serveur local.
   Hors-ligne / zone blanche : message clair + mode démo.
   ========================================================= */

const CONFIG = {
  // URL de l'API BirdNET si vous en hébergez une (BirdNET-Analyzer REST).
  // Laissez vide pour utiliser uniquement le mode démo hors-ligne.
  BIRDNET_URL: "",
  // Endpoint secondaire : service public BirdNET (nécessite réseau).
  BIRDNET_PUBLIC: "https://api.birdweather.com/v1/identification",
  RECORD_MS: 8000,
};

const BirdReco = (function () {
  let mediaStream = null;
  let recorder = null;
  let analyser = null;
  let meterRaf = null;
  let ctx = null;

  const statusEl = () => document.getElementById("reco-status");
  const fillEl = () => document.getElementById("reco-meter-fill");

  function setStatus(msg) {
    if (statusEl()) statusEl().textContent = msg;
  }

  function setMeter(v) {
    if (fillEl()) fillEl().style.width = `${Math.round(v * 100)  }%`;
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("❌ Micro non disponible sur cet appareil.");
      return null;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = ctx || new AC();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src = ctx.createMediaStreamSource(mediaStream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    tickMeter();
    recorder = new MediaRecorder(mediaStream);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    });
    recorder.start();
    return { stop: () => recorder.stop(), blobPromise: done };
  }

  function tickMeter() {
    if (!analyser) return;
    const arr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(arr);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = (arr[i] - 128) / 128;
      sum += v * v;
    }
    setMeter(Math.min(1, Math.sqrt(sum / arr.length) * 4));
    meterRaf = requestAnimationFrame(tickMeter);
  }

  function stopRecording() {
    if (meterRaf) { cancelAnimationFrame(meterRaf); meterRaf = null; }
    setMeter(0);
    if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
    if (analyser) { analyser.disconnect(); analyser = null; }
  }

  async function analyze(blob) {
    if (!navigator.onLine) return { offline: true };
    const targets = [CONFIG.BIRDNET_URL, CONFIG.BIRDNET_PUBLIC].filter(Boolean);
    for (const url of targets) {
      try {
        const fd = new FormData();
        fd.append("audio", blob, "chant.webm");
        fd.append("lat", SITE.center.lat);
        fd.append("lon", SITE.center.lng);
        const resp = await fetch(url, { method: "POST", body: fd, signal: AbortSignal.timeout(20000) });
        if (resp.ok) {
          const json = await resp.json();
          const result = extractResult(json);
          if (result) return { ok: true, result };
        }
      } catch (e) { /* essaie l'endpoint suivant */ }
    }
    return { ok: false, message: "Analyse impossible : serveur BirdNET non joignable." };
  }

  function extractResult(json) {
    // Formats possibles selon l'API BirdNET utilisée.
    const list = json.results || json.detections || json.prediction || null;
    if (Array.isArray(list) && list.length) {
      const top = list[0];
      const name = top.commonName || top.label || top.species || "Inconnu";
      const prob = top.confidence || top.score || 0;
      return { name, prob, sci: top.sciName || top.scientific_name || "" };
    }
    if (list && typeof list === "object") {
      const name = list.commonName || list.species || list.label || "Inconnu";
      const prob = list.confidence || list.score || 0;
      return { name, prob, sci: list.sciName || "" };
    }
    return null;
  }

  function demoResult() {
    const pool = ["Chouette hulotte", "Mésange charbonnière", "Rouge-gorge familier", "Roitelet huppé", "Pic épeiche", "Fauvette à tête noire"];
    const name = pool[Math.floor(Math.random() * pool.length)];
    return { name, prob: 0.62 + Math.random() * 0.3, sci: "", demo: true };
  }

  return { startRecording, stopRecording, analyze, demoResult, setStatus };
})();
