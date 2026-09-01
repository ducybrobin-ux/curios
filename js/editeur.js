"use strict";

/* CURIOS — Éditeur de contenu (extrait de editeur.html) */

window.HermesToast = function (msg) {
  try {
    let t = document.getElementById("ed-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ed-toast";
      t.style.cssText = "position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#2b3a36;color:#fff;padding:12px 18px;border-radius:12px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-size:14px;max-width:90%;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    clearTimeout(window.__edToastT);
    window.__edToastT = setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  } catch (e) {}
};

const BASE_SITE = JSON.parse(JSON.stringify(SITE));
const BASE_TRAIL = JSON.parse(JSON.stringify(TRAIL));
const BASE_BALISES = JSON.parse(JSON.stringify(BALISES));
const BASE_BIRDS = JSON.parse(JSON.stringify(BIRDS));
const BASE_GUIDE = JSON.parse(JSON.stringify(GUIDE));
const DIFFS = ["facile", "moyen", "difficile"];
let edWarnings = [];
let IMG_LIST = [];
let mapUrlState = "";
const removedBalises = new Set();
const removedBirds = new Set();

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function curIco(name, cls) {
  return '<img class="cur-icon' + (cls ? " " + cls : "") + '" src="img/icons/' + name + '.svg" alt="">';
}

function setStatus(msg, cls) {
  const el = document.getElementById("ed-status");
  el.textContent = msg;
  el.className = "status-pill " + (cls || "ok");
}

function readField(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function readLines(id) {
  return readField(id).split("\n").map((s) => s.trim()).filter(Boolean);
}

function num(v, fb) {
  return isFinite(v) ? v : fb;
}

function field(id, label, value, type) {
  type = type || "text";
  return '<div class="field"><label>' + label + '</label><input type="' + type + '" id="' + id + '" value="' + esc(value) + '"></div>';
}

function fieldArea(id, label, value) {
  return '<div class="field"><label>' + label + '</label><textarea id="' + id + '">' + esc(value) + '</textarea></div>';
}

function fieldRow(parts) {
  return '<div class="field-row">' + parts.join("") + '</div>';
}

/* ---------- Section Site ---------- */
function sitePhotosHtml() {
  return (SITE.photos || []).map((ph, i) => `
    <div class="field-row" data-photo="${i}">
      <div class="field" style="flex:2"><label>Photo ${i + 1} — fichier</label><input type="text" id="s-photo-${i}-src" value="${esc(ph.src || "")}"></div>
      <div class="field" style="flex:1"><label>Légende</label><input type="text" id="s-photo-${i}-label" value="${esc(ph.label || "")}"></div>
      <div class="field" style="flex:0"><label>&nbsp;</label><button class="btn ed-remove-btn" onclick="removeSitePhoto(${i})">🗑️</button></div>
    </div>`).join("");
}

function buildSiteCard() {
  const card = document.createElement("details");
  card.className = "ed-card";
  card.id = "site-card";
  card.innerHTML =
    '<summary>🏕️ Site & thème <small style="color:var(--text-muted)">(nom, rayons GPS, centre, photos)</small><span class="ed-status-dot"></span></summary>' +
    '<div>' +
    fieldRow([
      field("s-name", "Nom du site", SITE.name),
      field("s-short", "Code court", SITE.short),
    ]) +
    fieldRow([
      field("s-region", "Région", SITE.region),
      field("s-mapTitle", "Titre de la carte", SITE.mapTitle),
    ]) +
    fieldRow([
      field("s-region", "Région", SITE.region),
      field("s-mapTitle", "Titre de la carte", SITE.mapTitle),
    ]) +
    fieldRow([
      field("s-proximityRadius", "Rayon validation GPS (m)", SITE.proximityRadius, "number"),
       field("s-hintRadius", "Rayon indice sonore (m)", SITE.hintRadius, "number"),
    ]) +
    '<div class="field"><label>Carte du parcours (URL Google Maps / OpenStreetMap)</label>' +
    '<input type="text" id="s-mapUrl" value="' + esc(mapUrlState) + '" placeholder="https://maps.app.goo.gl/… ou https://www.openstreetmap.org/…">' +
    '<small style="color:var(--text-muted)">Lien « Voir le parcours » affiché aux familles sur l\'écran Carte. Enregistrer l\'applique aussi au site (data/map.json).</small></div>' +
    '<div class="field"><label>Photos du site (galerie / mode admin)</label>' + sitePhotosHtml() +
    '<button class="btn" onclick="addSitePhoto()">➕ Ajouter une photo</button></div>' +
    '</div>';
  return card;
}

function addSitePhoto() {
  if (!Array.isArray(SITE.photos)) SITE.photos = [];
  SITE.photos.push({ src: "", label: "Nouvelle photo" });
  buildUI();
  const card = document.getElementById("site-card");
  if (card) card.open = true;
}

function removeSitePhoto(i) {
  if (Array.isArray(SITE.photos)) SITE.photos.splice(i, 1);
  buildUI();
  const card = document.getElementById("site-card");
  if (card) card.open = true;
}

function buildSiteOverride(base, cur) {
  const ov = {};
  for (const k of ["name", "short", "region", "mapTitle", "proximityRadius", "hintRadius"]) {
    if (String(base[k]) !== String(cur[k])) ov[k] = cur[k];
  }
  if (String(base.center.lat) !== String(cur.center.lat) || String(base.center.lng) !== String(cur.center.lng)) {
    ov.center = { lat: cur.center.lat, lng: cur.center.lng };
  }
  if (JSON.stringify(base.photos || []) !== JSON.stringify(cur.photos || [])) ov.photos = cur.photos || [];
  return ov;
}

function collectSite() {
  const cur = {
    name: readField("s-name").trim(),
    short: readField("s-short").trim(),
    region: readField("s-region").trim(),
    mapTitle: readField("s-mapTitle").trim(),
    proximityRadius: num(parseFloat(readField("s-proximityRadius")), BASE_SITE.proximityRadius),
    hintRadius: num(parseFloat(readField("s-hintRadius")), BASE_SITE.hintRadius),
    center: {
      lat: num(parseFloat(readField("s-center-lat")), BASE_SITE.center.lat),
      lng: num(parseFloat(readField("s-center-lng")), BASE_SITE.center.lng),
    },
    photos: (SITE.photos || []).map((_, i) => ({
      src: readField("s-photo-" + i + "-src").trim(),
      label: readField("s-photo-" + i + "-label").trim(),
    })),
  };
  return buildSiteOverride(BASE_SITE, cur);
}

/* ---------- Section Sentier ---------- */
function buildTrailCard() {
  const card = document.createElement("details");
  card.className = "ed-card";
  card.id = "trail-card";
  const pathText = TRAIL.path.map((p) => p[0] + " " + p[1]).join("\n");
  card.innerHTML =
    '<summary>🛤️ Sentier <small style="color:var(--text-muted)">(tracé de la carte)</small><span class="ed-status-dot"></span></summary>' +
    '<div>' +
    field("t-label", "Label", TRAIL.label) +
    '<div class="field"><label>Points du tracé (x y par ligne)</label><textarea id="t-path">' + esc(pathText) + '</textarea>' +
    '<small style="color:var(--text-muted)">Coordonnées SVG de la carte : une paire « x y » par ligne. Les lignes invalides sont ignorées.</small></div>' +
    '</div>';
  return card;
}

function buildTrailOverride(base, cur) {
  const ov = {};
  if ((base.label || "") !== (cur.label || "")) ov.label = cur.label;
  if (JSON.stringify(base.path) !== JSON.stringify(cur.path)) ov.path = cur.path;
  return ov;
}

function collectTrail() {
  const raw = readField("t-path");
  const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
  const path = [];
  let bad = false;
  lines.forEach((l) => {
    const m = l.split(/[\s,;]+/).map(Number);
    if (m.length >= 2 && isFinite(m[0]) && isFinite(m[1])) path.push([m[0], m[1]]);
    else bad = true;
  });
  if (bad) edWarnings.push("Sentier : ligne(s) de tracé invalide(s) ignorées.");
  const cur = { label: readField("t-label").trim(), path: bad ? TRAIL.path : path };
  return buildTrailOverride(BASE_TRAIL, cur);
}

/* ---------- Section Balises ---------- */
function buildBaliseCard(b) {
  const card = document.createElement("details");
  card.className = "ed-card";
  card.setAttribute("data-balise", b.id);
  const title = document.createElement("summary");
  title.innerHTML = esc(b.label) + ' <small style="color:var(--text-muted)">(' + esc(b.id) + ')</small><span class="ed-status-dot"></span>' +
    ' <button class="btn ed-remove-btn" onclick="event.stopPropagation();removeBalise(\'' + esc(b.id) + '\')" title="Supprimer cette balise">🗑️</button>';
  card.appendChild(title);

  const body = document.createElement("div");
  const birdOpts = BIRDS.map((bb) => `<option value="${esc(bb.id)}" ${bb.id === b.bird ? "selected" : ""}>${esc(bb.nom || bb.id)}</option>`).join("");
  body.innerHTML = `
    <div class="field-row">
      <div class="field"><label>Code</label><input type="text" id="b-${b.id}-code" value="${esc(b.code)}"></div>
      <div class="field"><label>Label</label><input type="text" id="b-${b.id}-label" value="${esc(b.label)}"></div>
    </div>
    <div class="field"><label>Découverte associée</label><select id="b-${b.id}-bird"><option value="">— Aucun —</option>${birdOpts}</select></div>
    <div class="field-row">
      <div class="field"><label>X (carte %)</label><input type="number" step="0.1" id="b-${b.id}-x" value="${b.x}"></div>
      <div class="field"><label>Y (carte %)</label><input type="number" step="0.1" id="b-${b.id}-y" value="${b.y}"></div>
      <div class="field"><label>Latitude</label><input type="number" step="0.0000001" id="b-${b.id}-lat" value="${b.lat}"></div>
      <div class="field"><label>Longitude</label><input type="number" step="0.0000001" id="b-${b.id}-lng" value="${b.lng}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Rayon GPS propre (m, vide = défaut du site)</label><input type="number" step="0.5" min="1" id="b-${b.id}-radius" value="${b.radius == null ? "" : b.radius}"></div>
    </div>
    <div class="field"><button class="btn btn-outline" type="button" onclick="useMyGps('${b.id}')">${curIco("location")} Ma position GPS</button>
      <small style="color:var(--text-muted)">Remplit Latitude/Longitude avec la position actuelle de cet appareil (déplacez-vous sur la balise, ou saisissez à la main).</small></div>
    <div class="field"><label>Image de l'énigme</label>
      <div class="img-box">
        <img id="b-${b.id}-img-preview" src="${esc(b.hintImg || "")}" alt="">
        <input type="text" id="b-${b.id}-hintImg" value="${esc(b.hintImg || "")}" style="flex:1 1 220px">
        <input type="file" id="b-${b.id}-file" accept="image/*" class="hidden">
        <button class="btn" onclick="pickImg('b-${b.id}')">${curIco("camera")} Envoyer</button>
        <button class="btn btn-outline" onclick="openImgBrowser('b-${b.id}-hintImg','b-${b.id}-img-preview','b-${b.id}-img-sel')">🖼️</button>
      </div>
      <select id="b-${b.id}-img-sel" onchange="onImgSelect('b-${b.id}')">${imgSelectOptions(b.hintImg || "")}</select>
    </div>
    ${DIFFS.map((d) => {
      const e = (b.enigmes && b.enigmes[d]) || {};
      return `
      <div class="diff-block">
        <h3>${esc(d[0].toUpperCase() + d.slice(1))}</h3>
        <div class="field"><label>Question</label><textarea id="b-${b.id}-${d}-text">${esc(e.text || "")}</textarea></div>
        <div class="field"><label>Indice</label><input type="text" id="b-${b.id}-${d}-indice" value="${esc(e.indice || "")}"></div>
        <div class="field"><label>Le saviez-vous ?</label><textarea id="b-${b.id}-${d}-saviez">${esc(e.saviez || "")}</textarea></div>
        <div class="field"><label>Réponses acceptées (une par ligne)</label><textarea id="b-${b.id}-${d}-reponses">${esc((e.reponses || []).join("\n"))}</textarea></div>
      </div>`;
    }).join("")}`;
  card.appendChild(body);
  return card;
}

function buildBaliseOverride(base, cur) {
  base = base || {};
  const ov = {};
  for (const k of ["code", "label", "x", "y", "lat", "lng", "radius", "hintImg", "bird"]) {
    if (String(base[k] || "") !== String(cur[k] || "")) ov[k] = cur[k];
  }
  const en = {};
  for (const d of DIFFS) {
    const bd = (base.enigmes && base.enigmes[d]) || {};
    const cd = (cur.enigmes && cur.enigmes[d]) || {};
    const eo = {};
    for (const k of ["text", "indice", "saviez"]) {
      if ((bd[k] || "") !== (cd[k] || "")) eo[k] = cd[k] || "";
    }
    if (JSON.stringify(bd.reponses || []) !== JSON.stringify(cd.reponses || [])) eo.reponses = cd.reponses || [];
    if (Object.keys(eo).length) en[d] = eo;
  }
  if (Object.keys(en).length) ov.enigmes = en;
  return ov;
}

function collectBalises() {
  const out = {};
  BALISES.forEach((b) => {
    const cur = {
      code: readField("b-" + b.id + "-code"),
      label: readField("b-" + b.id + "-label"),
      bird: readField("b-" + b.id + "-bird"),
      x: num(parseFloat(readField("b-" + b.id + "-x")), b.x),
      y: num(parseFloat(readField("b-" + b.id + "-y")), b.y),
      lat: num(parseFloat(readField("b-" + b.id + "-lat")), b.lat),
      lng: num(parseFloat(readField("b-" + b.id + "-lng")), b.lng),
      radius: (() => { const v = parseFloat(readField("b-" + b.id + "-radius")); return isFinite(v) && v > 0 ? v : undefined; })(),
      hintImg: readField("b-" + b.id + "-hintImg"),
      enigmes: {},
    };
    DIFFS.forEach((d) => {
      cur.enigmes[d] = {
        text: readField("b-" + b.id + "-" + d + "-text"),
        indice: readField("b-" + b.id + "-" + d + "-indice"),
        saviez: readField("b-" + b.id + "-" + d + "-saviez"),
        reponses: readLines("b-" + b.id + "-" + d + "-reponses"),
      };
    });
    const ov = buildBaliseOverride(BASE_BALISES.find((bb) => bb.id === b.id), cur);
    if (Object.keys(ov).length) out[b.id] = ov;
  });
  return out;
}

/* ---------- Section Découvertes du parcours (fiches + quiz) ---------- */
function buildQuizCard(bird) {
  const card = document.createElement("details");
  card.className = "ed-card";
  card.setAttribute("data-bird", bird.id);
  const title = document.createElement("summary");
  title.innerHTML = esc(bird.nom || bird.id) + ' <small style="color:var(--text-muted)">(' + esc(bird.id) + ")</small><span class=\"ed-status-dot\"></span>" +
     ' <button class="btn ed-remove-btn" onclick="event.stopPropagation();removeBird(\'' + esc(bird.id) + '\')" title="Supprimer cette découverte">🗑️</button>';
  card.appendChild(title);

  const body = document.createElement("div");
  const img = bird.img || "";
  const qs = (bird.quiz || []).map((q, qi) => quizQuestionHtml(bird.id, qi, q)).join("");
  const chantText = bird.chant ? JSON.stringify(bird.chant, null, 2) : "";
  body.innerHTML = `
    <div class="field-row">
      ${field("q-" + bird.id + "-nom", "Nom", bird.nom)}
      ${field("q-" + bird.id + "-latin", "Nom latin", bird.latin)}
    </div>
    <div class="field-row">
      ${field("q-" + bird.id + "-emoji", "Émoticône", bird.emoji)}
      <div class="field"><label>Couleur</label><input type="color" id="q-${bird.id}-couleur" value="${esc(bird.couleur || "#666666")}"></div>
      ${field("q-" + bird.id + "-categorie", "Catégorie", bird.categorie)}
      ${field("q-" + bird.id + "-taille", "Taille", bird.taille)}
    </div>
    <div class="field"><label>Photo</label>
      <div class="img-box">
        <img id="q-${bird.id}-img-preview" src="${esc(img)}" alt="">
        <input type="text" id="q-${bird.id}-img" value="${esc(img)}" style="flex:1 1 220px">
        <input type="file" id="q-${bird.id}-file" accept="image/*" class="hidden">
        <button class="btn" onclick="pickImg('q-${bird.id}')">${curIco("camera")} Envoyer</button>
        <button class="btn btn-outline" onclick="openImgBrowser('q-${bird.id}-img','q-${bird.id}-img-preview','q-${bird.id}-img-sel')">🖼️</button>
      </div>
      <select id="q-${bird.id}-img-sel" onchange="onImgSelect('q-${bird.id}')">${imgSelectOptions(img)}</select>
    </div>
    ${field("q-" + bird.id + "-audioFile", "Chant réel (chemin audio, optionnel)", bird.audioFile || "")}
    ${fieldArea("q-" + bird.id + "-anecdotes", "Anecdotes (une par ligne)", (bird.anecdotes || []).join("\n"))}
    <details class="ed-adv"><summary>Avancé : signature sonore synthétique (JSON)</summary>
      ${fieldArea("q-" + bird.id + "-chant", "Signature sonore (Web Audio : tempo + notes)", chantText)}
    </details>
    <div id="q-${bird.id}-list">${qs}</div>
    <button class="btn" onclick="addQuestion('${bird.id}')">➕ Ajouter une question</button>`;
  card.appendChild(body);
  return card;
}

function buildBirdOverride(base, cur) {
  base = base || {};
  const ov = {};
  for (const k of ["nom", "latin", "emoji", "couleur", "categorie", "taille", "img", "audioFile", "anecdotes"]) {
    if (JSON.stringify(base[k] || null) !== JSON.stringify(cur[k] || null)) ov[k] = cur[k] || "";
  }
  if (JSON.stringify(base.quiz || []) !== JSON.stringify(cur.quiz || [])) ov.questions = cur.quiz || [];
  if (cur.chant !== undefined && JSON.stringify(base.chant || null) !== JSON.stringify(cur.chant || null)) {
    ov.chant = cur.chant || null;
  }
  return ov;
}

/* Oiseaux AJOUTÉS uniquement (objet complet, sauvé dans admin.birds) */
function collectBirds() {
  const out = {};
  BIRDS.forEach((bird) => {
    const base = BASE_BIRDS.find((bb) => bb.id === bird.id);
    if (base) return;
    const full = JSON.parse(JSON.stringify(bird));
    if (Array.isArray(full.quiz) && !full.quiz.length) delete full.quiz;
    if (full.chant === null) delete full.chant;
    out[bird.id] = full;
  });
  return out;
}

function collectQuiz() {
  const out = {};
  BIRDS.forEach((bird) => {
    const base = BASE_BIRDS.find((bb) => bb.id === bird.id);
    if (!base) return;
    const questions = (bird.quiz || []).map((_, i) => ({
      q: readField("q-" + bird.id + "-" + i + "-q"),
      options: readLines("q-" + bird.id + "-" + i + "-options"),
      reponse: parseInt(readField("q-" + bird.id + "-" + i + "-reponse"), 10) || 0,
    })).filter((q) => q.q || q.options.length);
    const chantRaw = readField("q-" + bird.id + "-chant").trim();
    let chant;
    if (chantRaw) {
      try { chant = JSON.parse(chantRaw); }
      catch (e) { edWarnings.push("Découverte " + bird.id + " : signature JSON invalide, non enregistrée."); chant = undefined; }
    } else {
      chant = null;
    }
    const cur = {
      nom: readField("q-" + bird.id + "-nom"),
      latin: readField("q-" + bird.id + "-latin"),
      emoji: readField("q-" + bird.id + "-emoji"),
      couleur: readField("q-" + bird.id + "-couleur"),
      categorie: readField("q-" + bird.id + "-categorie"),
      taille: readField("q-" + bird.id + "-taille"),
      img: readField("q-" + bird.id + "-img"),
      audioFile: readField("q-" + bird.id + "-audioFile"),
      anecdotes: readLines("q-" + bird.id + "-anecdotes"),
      chant: chant,
      quiz: questions,
    };
    const ov = buildBirdOverride(base, cur);
    if (Object.keys(ov).length) out[bird.id] = ov;
  });
  return out;
}

function quizQuestionHtml(birdId, qi, q) {
  const opts = (q.options || []).join("\n");
  const rep = (q.reponse == null ? 0 : q.reponse);
  const selOpts = (q.options || []).map((o, j) =>
    `<option value="${j}" ${j === rep ? "selected" : ""}>${j} — ${esc(o.length > 40 ? o.slice(0, 40) + "…" : o)}</option>`
  ).join("");
  return `
    <div class="quiz-q" data-qidx="${qi}">
      <div class="q-head"><b>Question ${qi + 1}</b><button class="btn" style="--btn-bg:var(--err)" onclick="removeQuestion('${birdId}',${qi})">${curIco("close")}</button></div>
      <div class="field"><label>Question</label><textarea id="q-${birdId}-${qi}-q">${esc(q.q || "")}</textarea></div>
      <div class="field"><label>Options (une par ligne)</label><textarea id="q-${birdId}-${qi}-options" oninput="refreshRepSelect('${birdId}',${qi})">${esc(opts)}</textarea></div>
      <div class="field"><label>Bonne réponse</label><select id="q-${birdId}-${qi}-reponse">${selOpts}</select></div>
    </div>`;
}

function refreshRepSelect(birdId, qi) {
  const optsEl = document.getElementById("q-" + birdId + "-" + qi + "-options");
  const repEl = document.getElementById("q-" + birdId + "-" + qi + "-reponse");
  if (!optsEl || !repEl) return;
  const opts = optsEl.value.split("\n").map((s) => s.trim()).filter(Boolean);
  repEl.innerHTML = opts.map((o, j) =>
    `<option value="${j}">${j} — ${esc(o.length > 40 ? o.slice(0, 40) + "…" : o)}</option>`
  ).join("");
  if (repEl.selectedIndex < 0) repEl.selectedIndex = 0;
}

function addQuestion(birdId) {
  const list = document.getElementById("q-" + birdId + "-list");
  const n = list.querySelectorAll(".quiz-q").length;
  list.insertAdjacentHTML("beforeend", quizQuestionHtml(birdId, n, { q: "", options: [], reponse: 0 }));
  list.closest("details").open = true;
  markChanged(list.closest("[data-bird]"));
}

function removeQuestion(birdId, qi) {
  const list = document.getElementById("q-" + birdId + "-list");
  const el = list.querySelector('[data-qidx="' + qi + '"]');
  if (el) el.remove();
  list.querySelectorAll(".quiz-q").forEach((q, i) => {
    q.querySelector(".q-head b").textContent = "Question " + (i + 1);
  });
  markChanged(list.closest("[data-bird]"));
}

/* ---------- Section Guide des découvertes ---------- */
function buildGuideCard(g) {
  const card = document.createElement("details");
  card.className = "ed-card";
  card.setAttribute("data-guide", g.id);
  const title = document.createElement("summary");
  title.innerHTML = esc(g.nom || g.id) + ' <small style="color:var(--text-muted)">(' + esc(g.id) + ")</small><span class=\"ed-status-dot\"></span>";
  card.appendChild(title);

  const body = document.createElement("div");
  const img = g.img || "";
  body.innerHTML = `
    <div class="field-row">
      ${field("g-" + g.id + "-nom", "Nom", g.nom)}
      ${field("g-" + g.id + "-latin", "Nom latin", g.latin)}
    </div>
    <div class="field-row">
      ${field("g-" + g.id + "-emoji", "Émoticône", g.emoji)}
      <div class="field"><label>Couleur</label><input type="color" id="g-${g.id}-couleur" value="${esc(g.couleur || "#666666")}"></div>
      ${field("g-" + g.id + "-categorie", "Catégorie", g.categorie)}
      ${field("g-" + g.id + "-taille", "Taille", g.taille)}
    </div>
    <div class="field"><label>Photo</label>
      <div class="img-box">
        <img id="g-${g.id}-img-preview" src="${esc(img)}" alt="">
        <input type="text" id="g-${g.id}-img" value="${esc(img)}" style="flex:1 1 220px">
        <input type="file" id="g-${g.id}-file" accept="image/*" class="hidden">
        <button class="btn" onclick="pickImg('g-${g.id}')">${curIco("camera")} Envoyer</button>
        <button class="btn btn-outline" onclick="openImgBrowser('g-${g.id}-img','g-${g.id}-img-preview','g-${g.id}-img-sel')">🖼️</button>
      </div>
      <select id="g-${g.id}-img-sel" onchange="onImgSelect('g-${g.id}')">${imgSelectOptions(img)}</select>
    </div>
    ${fieldArea("g-" + g.id + "-description", "Description", g.description || "")}
    ${fieldArea("g-" + g.id + "-anecdotes", "Anecdotes (une par ligne)", (g.anecdotes || []).join("\n"))}`;
  card.appendChild(body);
  return card;
}

function buildGuideOverride(base, cur) {
  const ov = {};
  for (const k of ["nom", "latin", "emoji", "couleur", "categorie", "taille", "img", "description", "anecdotes"]) {
    if (JSON.stringify(base[k] || null) !== JSON.stringify(cur[k] || null)) ov[k] = cur[k] || "";
  }
  return ov;
}

function collectGuide() {
  const out = {};
  GUIDE.forEach((g) => {
    const base = BASE_GUIDE.find((x) => x.id === g.id) || {};
    const cur = {
      nom: readField("g-" + g.id + "-nom"),
      latin: readField("g-" + g.id + "-latin"),
      emoji: readField("g-" + g.id + "-emoji"),
      couleur: readField("g-" + g.id + "-couleur"),
      categorie: readField("g-" + g.id + "-categorie"),
      taille: readField("g-" + g.id + "-taille"),
      img: readField("g-" + g.id + "-img"),
      description: readField("g-" + g.id + "-description"),
      anecdotes: readLines("g-" + g.id + "-anecdotes"),
    };
    const ov = buildGuideOverride(base, cur);
    if (Object.keys(ov).length) out[g.id] = ov;
  });
  return out;
}

/* ---------- Images ---------- */
function imgSelectOptions(current) {
  const cur = current || "";
  const seen = new Set();
  let html = '<option value="">— Aucune / choisir —</option>';
  if (cur && IMG_LIST.indexOf(cur) === -1) {
    html += '<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>';
    seen.add(cur);
  }
  IMG_LIST.forEach((p) => {
    if (seen.has(p)) return;
    seen.add(p);
    html += '<option value="' + esc(p) + '"' + (p === cur ? " selected" : "") + '>' + esc(p) + '</option>';
  });
  return html;
}

function onImgSelect(prefix) {
  const sel = document.getElementById(prefix + "-img-sel");
  if (!sel) return;
  const val = sel.value;
  const box = sel.closest(".img-box");
  const fieldEl = box ? box.querySelector('input[type="text"]') : null;
  const preview = document.getElementById(prefix + "-img-preview");
  if (fieldEl) fieldEl.value = val;
  if (preview) preview.src = val;
  const card = sel.closest(".ed-card");
  if (card) markChanged(card);
}

function pickImg(prefix) {
  const file = document.getElementById(prefix + "-file");
  if (file) file.click();
}

function bindFileInputs() {
  document.querySelectorAll('input[type="file"][id$="-file"]').forEach((input) => {
    input.addEventListener("change", () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const prefix = input.id.slice(0, -5);
      const reader = new FileReader();
      reader.onload = () => {
        const name = f.name.replace(/[\\/]/g, "").replace(/[^A-Za-z0-9_% .\u00C0-\u00FF\-]/g, "_");
        const data = String(reader.result).split(",")[1];
        setStatus("⏳ Envoi de l'image…", "ok");
        fetch("/api/editor/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok && res.url) {
              const box = input.closest(".img-box");
              const fieldEl = box ? box.querySelector('input[type="text"]') : null;
              const preview = document.getElementById(prefix + "-img-preview");
              if (fieldEl) fieldEl.value = res.url;
              if (preview) preview.src = res.url;
              if (IMG_LIST.indexOf(res.url) === -1) { IMG_LIST.push(res.url); IMG_LIST.sort(); }
              const sel = document.getElementById(prefix + "-img-sel");
              if (sel) sel.innerHTML = imgSelectOptions(res.url);
              setStatus("✅ Image envoyée : " + res.url, "ok");
              const card = input.closest(".ed-card");
              if (card) markChanged(card);
            } else {
              setStatus("❌ Échec de l'envoi de l'image", "err");
            }
          })
          .catch(() => setStatus("❌ Échec de l'envoi de l'image", "err"));
      };
      reader.readAsDataURL(f);
    });
  });
}

function markChanged(card) {
  if (card) card.classList.add("changed");
}

/* ---------- Navigateur d'images ---------- */
let imgBrowserTarget = null;
let imgBrowserPreview = null;
let imgBrowserSelect = null;

function openImgBrowser(targetId, previewId, selId) {
  imgBrowserTarget = targetId || null;
  imgBrowserPreview = previewId || null;
  imgBrowserSelect = selId || null;
  const t = document.getElementById("img-browser-target");
  if (t) {
    t.textContent = imgBrowserTarget
      ? "Cible : " + imgBrowserTarget
      : "Exploration libre — cliquez pour voir le fichier.";
  }
  renderImgGrid();
  document.getElementById("img-browser").classList.remove("hidden");
}

function closeImgBrowser() {
  document.getElementById("img-browser").classList.add("hidden");
  imgBrowserTarget = null;
  imgBrowserPreview = null;
  imgBrowserSelect = null;
}

function renderImgGrid() {
  const grid = document.getElementById("img-browser-grid");
  const q = (document.getElementById("img-browser-filter").value || "").trim().toLowerCase();
  const list = IMG_LIST.filter((p) => !q || String(p).toLowerCase().indexOf(q) !== -1);
  document.getElementById("img-browser-count").textContent = list.length + " image(s)";
  grid.innerHTML = list.map((p) =>
    '<div class="img-cell" data-url="' + esc(p) + '"><img src="' + esc(p) + '" loading="lazy" alt=""><span>' + esc(p) + '</span></div>'
  ).join("") || '<p class="note" style="grid-column:1/-1">Aucune image trouvée.</p>';
}

function assignImgToTarget(url) {
  if (!imgBrowserTarget) return;
  const inp = document.getElementById(imgBrowserTarget);
  if (inp) {
    inp.value = url;
    const card = inp.closest(".ed-card");
    if (card) markChanged(card);
  }
  if (imgBrowserPreview) {
    const pv = document.getElementById(imgBrowserPreview);
    if (pv) pv.src = url;
  }
  if (imgBrowserSelect) {
    const sel = document.getElementById(imgBrowserSelect);
    if (sel) sel.innerHTML = imgSelectOptions(url);
  }
}

function bindImgBrowser() {
  const overlay = document.getElementById("img-browser");
  document.getElementById("img-browser-close").addEventListener("click", closeImgBrowser);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeImgBrowser(); });
  document.getElementById("img-browser-filter").addEventListener("input", renderImgGrid);
  document.getElementById("img-browser-grid").addEventListener("click", (e) => {
    const cell = e.target.closest(".img-cell");
    if (!cell) return;
    const url = cell.getAttribute("data-url");
    if (imgBrowserTarget) {
      assignImgToTarget(url);
      setStatus("🖼️ Image attribuée : " + url, "ok");
      closeImgBrowser();
    } else {
      window.open(url, "_blank");
    }
  });
  const uploadBtn = document.getElementById("img-browser-upload-btn");
  const uploadInput = document.getElementById("img-browser-upload");
  uploadBtn.addEventListener("click", () => uploadInput.click());
  uploadInput.addEventListener("change", () => {
    const f = uploadInput.files && uploadInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const name = f.name.replace(/[\\/]/g, "").replace(/[^A-Za-z0-9_% .\u00C0-\u00FF\-]/g, "_");
      const data = String(reader.result).split(",")[1];
      setStatus("⏳ Envoi de l'image…", "ok");
      fetch("/api/editor/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.url) {
            if (IMG_LIST.indexOf(res.url) === -1) { IMG_LIST.push(res.url); IMG_LIST.sort(); }
            renderImgGrid();
            setStatus("✅ Image envoyée : " + res.url, "ok");
          } else {
            setStatus("❌ Échec de l'envoi de l'image", "err");
          }
        })
        .catch(() => setStatus("❌ Échec de l'envoi de l'image", "err"));
    };
    reader.readAsDataURL(f);
    uploadInput.value = "";
  });
}

/* ---------- Éditeur de carte (Leaflet / OpenStreetMap) ---------- */
let mapEditor = null;
let mapLayer = null;
let __mapMarkers = {};
let __mapAddMode = false;
const __mapOnly = new URLSearchParams(location.search).get("map") === "1";

function loadLeaflet(cb) {
  if (window.L) { cb(); return; }
  if (window.__leafletLoading) { (window.__leafletQueue = window.__leafletQueue || []).push(cb); return; }
  window.__leafletLoading = true;
  window.__leafletQueue = [];
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);
  const s = document.createElement("script");
  s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  s.onload = () => {
    window.__leafletLoading = false;
    (window.__leafletQueue || []).forEach((f) => { try { f(); } catch (e) {} });
    window.__leafletQueue = [];
    cb();
  };
  s.onerror = () => {
    window.__leafletLoading = false;
    setStatus("❌ Carte indisponible : connexion internet requise pour charger OpenStreetMap. Utilisez les champs Latitude/Longitude.", "err");
  };
  document.head.appendChild(s);
}

function openMapEditor() {
  const ov = document.getElementById("map-editor");
  ov.classList.remove("hidden");
  loadLeaflet(() => initMapEditor());
}

function closeMapEditor() {
  if (__mapOnly) { try { window.close(); } catch (e) {} return; }
  document.getElementById("map-editor").classList.add("hidden");
  __mapAddMode = false;
  const btn = document.getElementById("btn-map-add");
  if (btn) btn.classList.remove("active");
}

function openMapFullscreen() {
  const w = window.open("editeur.html?map=1", "_blank", "width=1400,height=900");
  if (w) {
    setStatus("🖥️ Carte ouverte en plein écran dans une nouvelle fenêtre.", "ok");
  } else {
    setStatus("❌ Fenêtre bloquée : autorisez les fenêtres pop-up pour ce site.", "err");
  }
}

function syncToOpener() {
  if (!__mapOnly || !window.opener) return;
  try { if (window.opener.__mapEdSync) window.opener.__mapEdSync(BALISES); } catch (e) {}
}

function mapOnlySave() {
  syncToOpener();
  saveAll();
  setTimeout(() => { try { window.close(); } catch (e) {} }, 900);
}

/* Reçoit les balises modifiées depuis la fenêtre plein écran (?map=1) */
window.__mapEdSync = function (incoming) {
  if (!Array.isArray(incoming)) return;
  const byId = new Map(BALISES.map((b) => [b.id, b]));
  const ids = new Set();
  incoming.forEach((nb) => {
    if (!nb || nb.id == null) return;
    ids.add(nb.id);
    let b = byId.get(nb.id);
    if (!b) { b = {}; BALISES.push(b); byId.set(nb.id, b); }
    Object.keys(nb).forEach((k) => { b[k] = nb[k]; });
  });
  for (let i = BALISES.length - 1; i >= 0; i--) { if (!ids.has(BALISES[i].id)) BALISES.splice(i, 1); }
  const root = document.getElementById("balises-root");
  if (root) {
    root.innerHTML = "";
    BALISES.forEach((b) => root.appendChild(buildBaliseCard(b)));
    bindFileInputs();
    markChangedFromOverrides();
  }
};

function initMapEditor() {
  if (!window.L) return;
  const mapEl = document.getElementById("map-editor-map");
  if (!mapEditor) {
    mapEditor = L.map(mapEl).setView([SITE.center.lat, SITE.center.lng], 17);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapEditor);
    mapEditor.on("click", (e) => { if (__mapAddMode) mapEdAddAt(e.latlng); });
  }
  mapEditor.invalidateSize();
  renderMapMarkers();
  if (__mapOnly && mapLayer) {
    const bb = mapLayer.getBounds();
    if (bb.isValid()) mapEditor.fitBounds(bb.pad(0.15));
  }
  if (!BALISES.length) setStatus("🗺️ Aucune balise : activez le mode ➕ Ajouter puis cliquez sur la carte.", "ok");
}

function renderMapMarkers() {
  if (!mapEditor) return;
  if (mapLayer) { mapEditor.removeLayer(mapLayer); }
  mapLayer = L.featureGroup().addTo(mapEditor);
  __mapMarkers = {};
  BALISES.forEach((b) => {
    if (!isFinite(b.lat) || !isFinite(b.lng)) return;
    const bird = getBird(b.bird);
    const num = (b.id || "").replace(/[^0-9]/g, "") || "?";
    const color = (bird && bird.couleur) || "#3a6ea5";
    const icon = L.divIcon({
      className: "map-ed-marker",
      html: '<div class="map-ed-pin" style="background:' + esc(color) + '">' + esc(num) + "</div>",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -16],
    });
    const m = L.marker([b.lat, b.lng], { icon: icon, draggable: true, title: b.label || b.id });
    m.bindPopup(mapEdPopupHtml(b));
    m.on("dragend", () => {
      const ll = m.getLatLng();
      b.lat = +ll.lat.toFixed(7);
      b.lng = +ll.lng.toFixed(7);
      syncBaliseLatLngToForm(b);
      m.setPopupContent(mapEdPopupHtml(b));
      m.openPopup();
      if (mapEditor) mapEditor.setView(ll, mapEditor.getZoom());
      syncToOpener();
    });
    mapLayer.addLayer(m);
    __mapMarkers[b.id] = m;
  });
}

function markerById(id) { return __mapMarkers[id] || null; }

function syncBaliseLatLngToForm(b) {
  const fLat = document.getElementById("b-" + b.id + "-lat");
  const fLng = document.getElementById("b-" + b.id + "-lng");
  if (fLat) fLat.value = b.lat;
  if (fLng) fLng.value = b.lng;
  markChanged(document.querySelector('[data-balise="' + b.id + '"]'));
}

function mapEdPopupHtml(b) {
  const bird = getBird(b.bird);
  const img = b.hintImg || "";
  return `<b>${esc(b.label || b.id)}</b> <small style="color:var(--text-muted)">(${esc(b.id)}${bird ? " · " + esc(bird.nom) : ""})</small>
    <div class="field-row" style="margin-top:8px">
      <div class="field"><label>Latitude</label><input type="number" step="0.0000001" id="mappop-${b.id}-lat" value="${b.lat}"></div>
      <div class="field"><label>Longitude</label><input type="number" step="0.0000001" id="mappop-${b.id}-lng" value="${b.lng}"></div>
    </div>
    <div class="map-pop-actions">
      <button class="btn" onclick="mapEdApplyInput('${b.id}')">✓ Appliquer les coordonnées</button>
      <button class="btn btn-outline" onclick="mapEdUseGps('${b.id}')">${curIco("location")} Ma position GPS</button>
      <button class="btn btn-outline" onclick="mapEdCenterOn('${b.id}')">🎯 Recentrer</button>
    </div>
    <div class="field" style="margin-top:10px"><label>Photo de la balise</label>
      <div class="img-box">
        <img id="mappop-${b.id}-img-preview" src="${esc(img)}" alt="">
        <input type="text" id="mappop-${b.id}-img" value="${esc(img)}" style="flex:1 1 140px">
        <input type="file" id="mappop-${b.id}-file" accept="image/*" class="hidden">
        <button class="btn" onclick="pickImg('mappop-${b.id}')">${curIco("camera")} Envoyer</button>
      </div>
      <select id="mappop-${b.id}-img-sel" onchange="mapOnImgSelect('${b.id}')">${imgSelectOptions(img)}</select>
    </div>
    <div class="note" style="margin-top:8px">Glissez la pastille sur la carte pour déplacer la balise.</div>`;
}

function mapEdApplyInput(id) {
  const b = getBalise(id);
  if (!b) return;
  const lat = parseFloat(readField("mappop-" + id + "-lat"));
  const lng = parseFloat(readField("mappop-" + id + "-lng"));
  if (!isFinite(lat) || !isFinite(lng)) { setStatus("❌ Coordonnées invalides.", "err"); return; }
  b.lat = +lat.toFixed(7);
  b.lng = +lng.toFixed(7);
  syncBaliseLatLngToForm(b);
  const m = markerById(id);
  if (m) {
    m.setLatLng([b.lat, b.lng]);
    m.setPopupContent(mapEdPopupHtml(b));
    m.openPopup();
    if (mapEditor) mapEditor.setView([b.lat, b.lng], mapEditor.getZoom());
  }
  syncToOpener();
  setStatus("📍 Coordonnées de la balise " + id + " : " + b.lat + ", " + b.lng, "ok");
}

    /* ---------- GPS de précision : conserve la meilleure fixe ---------- */
    let __mapAccCircle = null;
    let __mapChain = false;

    function gpsBestFix(opts) {
      const maxMs = (opts && opts.maxMs) || 20000;
      const good = (opts && opts.goodEnough) != null ? opts.goodEnough : 6;
      const onAcc = opts && opts.onAccuracy;
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("GPS indisponible sur cet appareil.")); return; }
        let best = null, done = false, watchId = null;
        const accOf = (p) => (p.coords.accuracy == null ? 9999 : p.coords.accuracy);
        const stop = () => { if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; } };
        const finish = () => {
          if (done) return;
          done = true; stop();
          if (best) resolve(best); else reject(new Error("aucune position reçue"));
        };
        const t0 = Date.now();
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!best || accOf(pos) < accOf(best)) best = pos;
            if (onAcc) { try { onAcc(accOf(pos)); } catch (e) {} }
            if (accOf(pos) <= good || Date.now() - t0 >= maxMs) finish();
          },
          (err) => {
            if (!done && !best) { done = true; stop(); reject(new Error(err && err.message ? err.message : "position refusée")); }
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: maxMs }
        );
        setTimeout(finish, maxMs + 1500);
      });
    }

    function showAccuracyCircle(lat, lng, accM) {
      if (!mapEditor || !window.L) return;
      if (__mapAccCircle) { mapEditor.removeLayer(__mapAccCircle); }
      __mapAccCircle = L.circle([lat, lng], {
        radius: Math.max(accM, 1),
        color: "#e67e22", weight: 2, fillColor: "#e67e22", fillOpacity: 0.12
      }).addTo(mapEditor);
      setTimeout(() => {
        if (__mapAccCircle) { mapEditor.removeLayer(__mapAccCircle); __mapAccCircle = null; }
      }, 12000);
    }

    function mapEdChainToggle() {
      __mapChain = !__mapChain;
      const btn = document.getElementById("btn-map-chain");
      if (btn) btn.classList.toggle("active", __mapChain);
      setStatus(__mapChain
        ? "⛓️ Mode terrain actif : après chaque capture réussie, la balise suivante s'ouvre automatiquement."
        : "Mode terrain désactivé.", "ok");
    }

    async function mapEdUseGps(id) {
      const b = getBalise(id);
      if (!b) return;
      setStatus("🎯 Acquisition précise pour " + id + "… restez immobile au point exact.", "");
      try {
        const pos = await gpsBestFix({
          maxMs: 25000,
          goodEnough: 5,
          onAccuracy: (acc) => setStatus("🎯 " + id + " : précision ≈ " + Math.round(acc) + " m…", "")
        });
        const acc = Math.round(pos.coords.accuracy == null ? 0 : pos.coords.accuracy);
        b.lat = +pos.coords.latitude.toFixed(7);
        b.lng = +pos.coords.longitude.toFixed(7);
        syncBaliseLatLngToForm(b);
        const m = markerById(id);
        if (m) {
          m.setLatLng([b.lat, b.lng]);
          m.setPopupContent(mapEdPopupHtml(b));
          m.openPopup();
          if (mapEditor) mapEditor.setView([b.lat, b.lng], Math.max(mapEditor.getZoom(), 18));
        }
        showAccuracyCircle(b.lat, b.lng, pos.coords.accuracy || 3);
        syncToOpener();
        let msg = "✅ Balise " + id + " capturée à ±" + acc + " m (" + b.lat + ", " + b.lng + "). Pensez à 💾 Enregistrer.";
        if (__mapChain) {
          const idx = BALISES.indexOf(b);
          const next = idx !== -1 ? BALISES[idx + 1] : null;
          if (next) {
            const nm = markerById(next.id);
            if (nm && mapEditor) {
              mapEditor.setView([isFinite(next.lat) ? next.lat : b.lat, isFinite(next.lng) ? next.lng : b.lng], Math.max(mapEditor.getZoom(), 18));
              nm.openPopup();
            }
            msg += " ⛓️ Suivante : " + next.id + " — marchez jusqu'au point, la capture part toute seule.";
            setTimeout(() => { if (__mapChain) mapEdUseGps(next.id); }, 1200);
          } else {
            msg += " 🏁 Dernière balise du parcours !";
          }
        }
        setStatus(msg, "ok");
      } catch (e) {
        setStatus("❌ Capture impossible (" + e.message + "). Vérifiez le ciel dégagé ou saisissez à la main.", "err");
      }
    }


function mapEdCenterOn(id) {
  const b = getBalise(id);
  if (!b || !mapEditor) return;
  mapEditor.setView([b.lat, b.lng], 18);
}

function mapEdFitAll() {
  if (!mapEditor || !mapLayer) return;
  const bounds = mapLayer.getBounds();
  if (bounds.isValid()) mapEditor.fitBounds(bounds.pad(0.15));
}

function mapEdLocateMe() {
  if (!mapEditor) return;
  if (!navigator.geolocation) { setStatus("❌ GPS indisponible sur cet appareil.", "err"); return; }
  setStatus("📍 Localisation en cours…", "ok");
  navigator.geolocation.getCurrentPosition(
    (pos) => { mapEditor.setView([pos.coords.latitude, pos.coords.longitude], 18); setStatus("📍 Carte centrée sur votre position.", "ok"); },
    (err) => setStatus("❌ Position refusée (" + (err && err.message ? err.message : "erreur GPS") + ").", "err"),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
}

function mapEdToggleAdd() {
  __mapAddMode = !__mapAddMode;
  const btn = document.getElementById("btn-map-add");
  if (btn) btn.classList.toggle("active", __mapAddMode);
  setStatus(__mapAddMode ? "➕ Mode ajout actif : cliquez sur la carte pour créer une balise." : "Mode ajout désactivé.", "ok");
}

function mapEdAddAt(latlng) {
  addBalise();
  const b = BALISES[BALISES.length - 1];
  b.lat = +latlng.lat.toFixed(7);
  b.lng = +latlng.lng.toFixed(7);
  syncBaliseLatLngToForm(b);
  renderMapMarkers();
  if (mapEditor) mapEditor.setView([b.lat, b.lng], Math.max(mapEditor.getZoom(), 17));
  syncToOpener();
  setStatus("➕ Balise " + b.id + " placée sur la carte. Renseignez-la puis Enregistrer.", "ok");
}

/* ---------- Recherche dans l'éditeur de carte ---------- */
function mapEdSearch(q) {
  const box = document.getElementById("map-ed-results");
  if (!box) return;
  q = (q || "").trim().toLowerCase();
  if (!q) { box.classList.add("hidden"); box.innerHTML = ""; return; }
  const hits = BALISES.filter((b) =>
    String(b.id || "").toLowerCase().indexOf(q) !== -1 ||
    String(b.code || "").toLowerCase().replace("jdp-", "").indexOf(q) !== -1 ||
    String(b.label || "").toLowerCase().indexOf(q) !== -1);
  box.innerHTML = hits.length
    ? hits.map((b, i) => '<button class="btn btn-outline" style="display:block;width:100%;text-align:left;border:none;border-radius:0" onclick="mapEdGoTo(\'' + b.id + '\')">' + (i + 1) + '. ' + esc(String(b.code || b.id)) + " · " + esc(String(b.label || "")) + "</button>").join("")
    : '<span class="note" style="padding:8px;display:block">Aucune balise trouvée.</span>';
  box.classList.remove("hidden");
}

function mapEdGoTo(id) {
  const box = document.getElementById("map-ed-results");
  if (box) { box.classList.add("hidden"); }
  const input = document.getElementById("map-ed-search");
  if (input) input.value = "";
  mapEdCenterOn(id);
  const b = getBalise(id);
  if (!b || !mapLayer) return;
  mapLayer.eachLayer((m) => {
    if (m.getLatLng && Math.abs(m.getLatLng().lat - b.lat) < 1e-9 && Math.abs(m.getLatLng().lng - b.lng) < 1e-9) m.openPopup();
  });
}

/* ---------- Import KML / Google My Maps ---------- */
function mapEdToggleImport() {
  const p = document.getElementById("map-ed-import");
  if (p) p.classList.toggle("hidden");
}

function myMapsToKml(url) {
  const m = String(url || "").match(/mid=([A-Za-z0-9_-]+)/);
  if (m) return "https://www.google.com/maps/d/kml?mid=" + m[1] + "&forcekml=1";
  return url;
}

async function mapEdImportKmlUrl() {
  const el = document.getElementById("map-ed-kml-url");
  const raw = el ? el.value.trim() : "";
  if (!raw) { setStatus("🌐 Collez d'abord l'adresse de votre carte My Maps (ou un lien KML).", "err"); return; }
  setStatus("⬇️ Import des repères…", "");
  try {
    const r = await fetch("/api/kml?u=" + encodeURIComponent(myMapsToKml(raw)), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const text = await r.text();
    mapEdApplyKml(text, "URL importée");
  } catch (e) {
    setStatus("❌ Impossible de charger l'URL (" + e.message + "). Utilisez « 📄 Fichier .kml… » (Télécharger KML depuis Google My Maps).", "err");
  }
}

function mapEdImportKmlFile(file) {
  const reader = new FileReader();
  reader.onload = () => mapEdApplyKml(String(reader.result || ""), file.name);
  reader.readAsText(file);
}

function kmlPoints(text) {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const marks = Array.from(doc.getElementsByTagName("Placemark"));
  const pts = [];
  for (const mk of marks) {
    const name = (mk.getElementsByTagName("name")[0] || {}).textContent || "";
    const coord = ((mk.getElementsByTagName("coordinates")[0] || {}).textContent || "").trim().split(/\s+/)[0] || "";
    const parts2 = coord.split(",");
    if (parts2.length >= 2) {
      const lng = parseFloat(parts2[0]), lat = parseFloat(parts2[1]);
      if (isFinite(lat) && isFinite(lng)) pts.push({ name: name.trim(), lat: lat, lng: lng });
    }
  }
  pts.sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  return pts;
}

function mapEdApplyKml(text, source) {
  const pts = kmlPoints(text);
  if (!pts.length) { setStatus("❌ Aucun repère trouvé dans ce fichier KML.", "err"); return; }
  const n = Math.min(pts.length, BALISES.length);
  for (let i = 0; i < n; i++) {
    const b = BALISES[i];
    b.lat = +pts[i].lat.toFixed(7);
    b.lng = +pts[i].lng.toFixed(7);
    syncBaliseLatLngToForm(b);
  }
  if (pts.length > BALISES.length) setStatus("⚠️ " + pts.length + " repères pour " + BALISES.length + " balises : les " + BALISES.length + " premières ont été positionnées.", "err");
  mapEdRefreshMarkers();
  mapEdCenterFromBalises();
  mapEdAutoLayout(true);
  const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const cLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  const sLat = document.getElementById("s-center-lat"), sLng = document.getElementById("s-center-lng");
  if (sLat) sLat.value = (+cLat.toFixed(7));
  if (sLng) sLng.value = (+cLng.toFixed(7));
  setStatus("✅ " + n + " repères attribués (" + source + ") · centre du site mis à jour · carte du jeu ajustée. Pensez à 💾 Enregistrer.", "ok");
  syncToOpener();
}

function mapEdRefreshMarkers() {
  renderMapMarkers();
}

function mapEdCenterFromBalises() {
  const ok = BALISES.filter((b) => isFinite(b.lat) && isFinite(b.lng) && (b.lat !== 0 || b.lng !== 0));
  if (!ok.length || !mapEditor) return;
  const bb = L.latLngBounds(ok.map((b) => [b.lat, b.lng]));
  mapEditor.fitBounds(bb.pad(0.25));
}

/* Projette les positions GPS sur la carte schématique du jeu (480×620)
   et régénère le tracé. Si tous les points sont très proches (< 30 m),
   ils sont répartis en ellipse lisible autour du centre. */
function mapEdAutoLayout(silent) {
  const W = 480, H = 620, PAD = 70;
  const ok = BALISES.filter((b) => isFinite(b.lat) && isFinite(b.lng));
  if (ok.length < 2) { setStatus("🧭 Il faut au moins deux balises avec coordonnées GPS.", "err"); return; }
  const latMin = Math.min.apply(null, ok.map((b) => b.lat));
  const latMax = Math.max.apply(null, ok.map((b) => b.lat));
  const lngMin = Math.min.apply(null, ok.map((b) => b.lng));
  const lngMax = Math.max.apply(null, ok.map((b) => b.lng));
  const midLat = (latMin + latMax) / 2;
  const wM = (lngMax - lngMin) * 111320 * Math.cos(midLat * Math.PI / 180);
  const hM = (latMax - latMin) * 110574;
  let pos = {};
  if (wM < 30 && hM < 30) {
    ok.forEach((b, i) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / ok.length;
      pos[b.id] = [Math.round(W / 2 + (W / 2 - PAD) * Math.cos(ang)), Math.round(H / 2 + (H / 2 - PAD) * Math.sin(ang))];
    });
  } else {
    ok.forEach((b) => {
      const x = PAD + (b.lng - lngMin) / Math.max(lngMax - lngMin, 1e-12) * (W - 2 * PAD);
      const y = H - PAD - (b.lat - latMin) / Math.max(latMax - latMin, 1e-12) * (H - 2 * PAD);
      pos[b.id] = [Math.round(x), Math.round(y)];
    });
  }
  ok.forEach((b) => {
    const fx = document.getElementById("b-" + b.id + "-x");
    const fy = document.getElementById("b-" + b.id + "-y");
    if (fx) fx.value = pos[b.id][0];
    if (fy) fy.value = pos[b.id][1];
  });
  const ta = document.getElementById("t-path");
  if (ta) ta.value = ok.map((b) => pos[b.id][0] + " " + pos[b.id][1]).join("\n");
  if (!silent) setStatus("🧭 Carte du jeu recalculée depuis les coordonnées GPS (" + ok.length + " balises). Vérifiez puis 💾 Enregistrer.", "ok");
}


function mapOnImgSelect(id) {
  const sel = document.getElementById("mappop-" + id + "-img-sel");
  if (!sel) return;
  const b = getBalise(id);
  if (!b) return;
  const url = sel.value;
  b.hintImg = url;
  const fInp = document.getElementById("b-" + id + "-hintImg");
  const fPv = document.getElementById("b-" + id + "-img-preview");
  const fSel = document.getElementById("b-" + id + "-img-sel");
  if (fInp) fInp.value = url;
  if (fPv) fPv.src = url;
  if (fSel) fSel.innerHTML = imgSelectOptions(url);
  const pv = document.getElementById("mappop-" + id + "-img-preview");
  const pInp = document.getElementById("mappop-" + id + "-img");
  if (pv) pv.src = url;
  if (pInp) pInp.value = url;
  markChanged(document.querySelector('[data-balise="' + id + '"]'));
  syncToOpener();
}

/* Envoi d'une image depuis la popup de la carte (délégation d'événement) */
document.addEventListener("change", (e) => {
  const t = e.target;
  if (!t || !t.id) return;
  if (t.type === "file" && t.id.indexOf("mappop-") === 0 && t.id.endsWith("-file")) {
    const id = t.id.slice(7, -5);
    const f = t.files && t.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const name = f.name.replace(/[\\/]/g, "").replace(/[^A-Za-z0-9_% .\u00C0-\u00FF\-]/g, "_");
      const data = String(reader.result).split(",")[1];
      setStatus("⏳ Envoi de l'image…", "ok");
      fetch("/api/editor/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.url) {
            const b = getBalise(id);
            if (b) b.hintImg = res.url;
            const fInp = document.getElementById("b-" + id + "-hintImg");
            const fPv = document.getElementById("b-" + id + "-img-preview");
            const fSel = document.getElementById("b-" + id + "-img-sel");
            if (fInp) fInp.value = res.url;
            if (fPv) fPv.src = res.url;
            if (fSel) fSel.innerHTML = imgSelectOptions(res.url);
            const pv = document.getElementById("mappop-" + id + "-img-preview");
            const pInp = document.getElementById("mappop-" + id + "-img");
            const pSel = document.getElementById("mappop-" + id + "-img-sel");
            if (pv) pv.src = res.url;
            if (pInp) pInp.value = res.url;
            if (pSel) pSel.innerHTML = imgSelectOptions(res.url);
            if (IMG_LIST.indexOf(res.url) === -1) { IMG_LIST.push(res.url); IMG_LIST.sort(); }
            markChanged(document.querySelector('[data-balise="' + id + '"]'));
            syncToOpener();
            setStatus("✅ Photo de la balise " + id + " : " + res.url, "ok");
          } else {
            setStatus("❌ Échec de l'envoi de l'image", "err");
          }
        })
        .catch(() => setStatus("❌ Échec de l'envoi de l'image", "err"));
    };
    reader.readAsDataURL(f);
    t.value = "";
  }
});

    /* ---------- GPS : position réelle d'une balise (capture précise) ---------- */
    async function useMyGps(id) {
      const latEl = document.getElementById("b-" + id + "-lat");
      const lngEl = document.getElementById("b-" + id + "-lng");
      if (!latEl || !lngEl) { setStatus("❌ Champs Latitude/Longitude introuvables pour la balise " + id + ".", "err"); return; }
      setStatus("🎯 Acquisition précise pour " + id + "… restez immobile au point exact.", "");
      try {
        const pos = await gpsBestFix({
          maxMs: 25000,
          goodEnough: 5,
          onAccuracy: (acc) => setStatus("🎯 " + id + " : précision ≈ " + Math.round(acc) + " m…", "")
        });
        latEl.value = pos.coords.latitude.toFixed(7);
        lngEl.value = pos.coords.longitude.toFixed(7);
        const card = document.querySelector('[data-balise="' + id + '"]');
        if (card) markChanged(card);
        const acc = Math.round(pos.coords.accuracy == null ? 0 : pos.coords.accuracy);
        setStatus("✅ Position de " + id + " capturée à ±" + acc + " m : " + latEl.value + ", " + lngEl.value, "ok");
      } catch (err) {
        setStatus("❌ Capture impossible (" + err.message + "). Saisissez les coordonnées à la main.", "err");
      }
    }


/* ---------- IA : génération locale des énigmes (indépendante du thème) ---------- */
function genReponses(s) {
  const out = [];
  const push = (v) => {
    const x = String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    if (x && out.indexOf(x) === -1) out.push(x);
  };
  const nom = String(s.nom || s.id || "").trim();
  if (nom) {
    const bare = nom.replace(/^(le |la |les |l'|un |une )/, "").trim();
    const first = (bare.split(/[\s-]+/)[0] || "").trim();
    push(bare);
    push(bare.replace(/ /g, "-"));
    push(first);
    if (nom !== bare) push(nom);
    if (bare !== first && bare.indexOf("-") === -1) push(bare.replace(/\s+/g, "-"));
  }
  if (s.latin) push(String(s.latin || "").trim());
  return out.length ? out : ["?"];
}

function genEnigme(s, diff, idx, reponses) {
  const nom = String(s.nom || s.id || "").trim();
  const latin = String(s.latin || "").trim();
  const anecdotes = (s.anecdotes || []).map((a) => String(a || "").trim()).filter(Boolean);
  const taille = String(s.taille || "").trim();
  const categorie = String(s.categorie || "").trim();
  const firstWord = (nom.split(/[\s-]+/)[0] || "").toLowerCase();
  const a0 = anecdotes[0] || "";
  const a1 = anecdotes[1] || "";
  const a2 = anecdotes[2] || "";
  let text, indice, saviez;
  if (diff === "facile") {
    text = a0
      ? "D'après ma fiche : « " + a0 + " » … Quel est mon nom ?"
      : (categorie ? "Je suis " + categorie : "On me cherche dans ce parc") + (taille ? " et je mesure environ " + taille : "") + ". Qui suis-je ?";
    indice = "Mon nom commence par « " + (firstWord[0] || "").toUpperCase() + " ».";
    saviez = a1 || (categorie ? "Ma catégorie : " + categorie + "." : "");
  } else if (diff === "moyen") {
    text = a1
      ? "Une autre histoire de moi : « " + a1 + " » … Quel est mon nom ?"
      : "Je suis reconnaissable à ma fiche : " + (categorie ? categorie + ", " : "") + (taille ? taille : "petit format") + ". Quel est mon nom ?";
    indice = "Mon nom compte " + nom.length + " lettres (sans accents).";
    saviez = a2 || a0 || "";
  } else {
    if (latin) {
      text = "Les experts m'appellent « " + latin + " ». Mais quel est mon nom courant ?";
      indice = "Mon nom courant commence par « " + (firstWord[0] || "").toUpperCase() + " ».";
    } else {
      text = "Rassemblez les indices : " + (categorie ? categorie + ", " : "") + (taille ? taille : "petit format") + " (émoticône " + (s.emoji || "?") + "). Quel est mon nom ?";
      indice = "Mon nom commence par « " + (firstWord.slice(0, 2) || "?") + " ».";
    }
    saviez = a0 || "Consultez ma fiche pour en savoir plus.";
  }
  return { text: text, reponses: reponses, indice: indice, saviez: saviez };
}

function aiGenerate() {
  const withSubject = BALISES.filter((b) => getBird(b.bird));
  if (!withSubject.length) { setStatus("❌ Aucune balise n'a de fiche associée : rien à générer. Associez d'abord une découverte.", "err"); return; }
  const total = withSubject.length * DIFFS.length;
  if (!confirm("🤖 Générer " + total + " questions/réponses (" + withSubject.length + " balises × " + DIFFS.length + " niveaux) à partir des fiches associées ? Les contenus existants seront remplacés.")) return;
  withSubject.forEach((b) => {
    const s = getBird(b.bird);
    const reponses = genReponses(s);
    b.enigmes = {};
    DIFFS.forEach((d, i) => { b.enigmes[d] = genEnigme(s, d, i, reponses); });
  });
  buildUI();
  withSubject.forEach((b) => {
    const card = document.querySelector('[data-balise="' + b.id + '"]');
    if (card) markChanged(card);
  });
  setStatus("🤖 " + total + " énigmes générées pour " + withSubject.length + " balises à partir de leurs fiches. Cliquez sur Enregistrer pour appliquer.", "ok");
}

/* ---------- Ajout / suppression de balises et de découvertes ---------- */
function nextBaliseId() {
  const used = new Set(BALISES.map((b) => b.id));
  let n = 1;
  while (used.has("B" + n)) n++;
  return "B" + n;
}

function nextBirdId() {
  const used = new Set(BIRDS.map((b) => b.id));
  let n = 1;
  while (used.has("oiseau" + n)) n++;
  return "oiseau" + n;
}

function addBalise() {
  const id = nextBaliseId();
  BALISES.push({
    id: id,
    bird: BIRDS.length ? BIRDS[0].id : "",
    code: "JDP-" + id.toUpperCase(),
    x: 200, y: 400,
    lat: SITE.center.lat, lng: SITE.center.lng,
    label: "Nouvelle balise",
    hintImg: "",
    enigmes: { facile: {}, moyen: {}, difficile: {} },
    enigme: null,
  });
  buildUI();
  const card = document.querySelector('[data-balise="' + id + '"]');
  if (card) card.open = true;
  setStatus("➕ Balise " + id + " ajoutée. Renseignez-la puis Enregistrer.", "ok");
}

function removeBalise(id) {
  const b = getBalise(id);
  if (!b) return;
  if (!confirm("Supprimer la balise " + id + " (« " + b.label + " ») ?")) return;
  if (BASE_BALISES.find((bb) => bb.id === id)) removedBalises.add(id);
  const idx = BALISES.findIndex((x) => x.id === id);
  if (idx !== -1) BALISES.splice(idx, 1);
  buildUI();
  setStatus("🗑️ Balise " + id + " supprimée. Enregistrez pour appliquer.", "ok");
}

function addBird() {
  const id = nextBirdId();
  BIRDS.push({
     id: id, nom: "Nouvelle découverte", latin: "", emoji: "🧠", couleur: "#6a6a6a",
    categorie: "diurne", taille: "?", img: "", audioFile: null,
    anecdotes: [], chant: null, quiz: [],
  });
  buildUI();
  const card = document.querySelector('[data-bird="' + id + '"]');
  if (card) card.open = true;
  setStatus("➕ Oiseau " + id + " ajouté. Renseignez-le puis Enregistrer.", "ok");
}

function removeBird(id) {
  const b = getBird(id);
  if (!b) return;
  if (!confirm("Supprimer la découverte " + id + " (« " + (b.nom || id) + " ») ? Les balises associées perdront leur découverte.")) return;
  if (BASE_BIRDS.find((bb) => bb.id === id)) removedBirds.add(id);
  const idx = BIRDS.findIndex((x) => x.id === id);
  if (idx !== -1) BIRDS.splice(idx, 1);
  BALISES.forEach((bl) => { if (bl.bird === id) bl.bird = ""; });
  buildUI();
  setStatus("🗑️ Découverte " + id + " supprimée. Enregistrez pour appliquer.", "ok");
}

/* ---------- Surcharges ---------- */
function buildAdminData() {
  edWarnings = [];
  const data = {};
  const site = collectSite();
  const trail = collectTrail();
  const balises = collectBalises();
  const quiz = collectQuiz();
  const guide = collectGuide();
  const birds = collectBirds();
  if (Object.keys(site).length) data.site = site;
  if (Object.keys(trail).length) data.trail = trail;
  if (Object.keys(balises).length) data.balises = balises;
  if (Object.keys(quiz).length) data.quiz = quiz;
  if (Object.keys(guide).length) data.guide = guide;
  if (Object.keys(birds).length) data.birds = birds;
  if (removedBalises.size) data.removedBalises = Array.from(removedBalises).sort();
  if (removedBirds.size) data.removedBirds = Array.from(removedBirds).sort();
  return data;
}

function saveAll() {
  const data = buildAdminData();
  const mapUrl = readField("s-mapUrl").trim();
  setStatus("⏳ Enregistrement…", "ok");
  const saveMap = fetch("/api/map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: mapUrl }),
  }).then((r) => r.json()).catch(() => ({ ok: false }));
  fetch("/api/editor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (res.ok) {
        const warn = edWarnings.length ? " — ⚠️ " + edWarnings.join(" | ") : "";
        setStatus("✅ Enregistré. Pensez à actualiser l'app des participants (F5)." + warn, edWarnings.length ? "err" : "ok");
        document.querySelectorAll(".ed-card.changed").forEach((c) => c.classList.remove("changed"));
      } else {
        setStatus("❌ " + (res.error || "Échec de l'enregistrement"), "err");
      }
      saveMap.then((mr) => { if (!mr.ok && mapUrl !== (mapUrlState || "")) setStatus("⚠️ Contenu enregistré, mais échec de la sauvegarde de la carte du parcours.", "err"); });
    })
    .catch(() => setStatus("❌ Échec de l'enregistrement", "err"));
}

function resetAll() {
  if (!confirm("Réinitialiser TOUTES les surcharges éditeur ? Les données de base (data.js) seront restaurées.")) return;
  fetch("/api/editor/reset", { method: "POST" })
    .then((r) => r.json())
    .then((res) => {
      if (res.ok) {
        setStatus("✅ Surcharges supprimées. Rechargement…", "ok");
        setTimeout(() => location.reload(), 700);
      } else {
        setStatus("❌ Échec de la réinitialisation", "err");
      }
    })
    .catch(() => setStatus("❌ Échec de la réinitialisation", "err"));
}

/* ---------- Fonctions utiles ---------- */
function exportJSON() {
  const data = buildAdminData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "admin-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("📥 Fichier admin-data.json exporté (contenu actuel).", "ok");
}

function bindImport() {
  const input = document.getElementById("import-file");
  input.addEventListener("change", () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(String(reader.result)); } catch (e) {
        setStatus("❌ Fichier JSON invalide.", "err");
        return;
      }
      if (!data || typeof data !== "object") { setStatus("❌ Fichier JSON invalide.", "err"); return; }
      setStatus("⏳ Importation…", "ok");
      fetch("/api/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.ok) { setStatus("✅ Importé. Rechargement…", "ok"); setTimeout(() => location.reload(), 700); }
          else setStatus("❌ Échec de l'importation", "err");
        })
        .catch(() => setStatus("❌ Échec de l'importation", "err"));
    };
    reader.readAsText(f);
  });
}

async function checkIntegrity() {
  setStatus("⏳ Vérification en cours…", "ok");
  const issues = [];
  BALISES.forEach((b) => {
    if (!b.label || !b.label.trim()) issues.push("Balise " + b.id + " : label vide.");
    if (b.bird && !getBird(b.bird)) issues.push("Balise " + b.id + " référence une découverte inconnue : " + b.bird);
    const filled = b.enigmes ? Object.keys(b.enigmes).filter((d) => b.enigmes[d] && (b.enigmes[d].text || "").trim()).length : 0;
    if (!filled) issues.push("Balise " + b.id + " : aucune énigme remplie.");
    if (b.enigmes) {
      Object.keys(b.enigmes).forEach((d) => {
        const e = b.enigmes[d];
        if (e && (e.text || "").trim() && !(e.reponses && e.reponses.length)) issues.push("Balise " + b.id + " (" + d + ") : énigme sans réponse.");
      });
    }
  });
  BIRDS.forEach((b) => {
    if (!b.quiz || !b.quiz.length) issues.push("Découverte " + b.id + " : aucun quiz.");
    (b.quiz || []).forEach((q, i) => {
      if (!q.q || !q.options || !q.options.length) issues.push("Découverte " + b.id + " : question " + (i + 1) + " incomplète.");
    });
  });
  const codes = BALISES.map((b) => b.code).filter(Boolean);
  const dup = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (dup.length) issues.push("Codes balises dupliqués : " + dup.filter((c, i, a) => a.indexOf(c) === i).join(", "));
  const images = new Set();
  BALISES.forEach((b) => { if (b.hintImg) images.add(b.hintImg); });
  BIRDS.forEach((b) => { if (b.img) images.add(b.img); });
  GUIDE.forEach((g) => { if (g.img) images.add(g.img); });
  let n = 0;
  for (const url of images) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (!r.ok) issues.push("Image manquante (HTTP " + r.status + ") : " + url);
    } catch (e) { issues.push("Image injoignable : " + url); }
    if (++n >= 60) { issues.push("(vérification des images limitée à 60)"); break; }
  }
  if (!issues.length) {
    setStatus("✅ Vérification OK : rien à signaler.", "ok");
  } else {
    let head = "⚠️ " + issues.length + " point(s) à corriger :\n" + issues.slice(0, 12).join("\n");
    if (issues.length > 12) head += "\n…et " + (issues.length - 12) + " autre(s).";
    setStatus(head, "err");
  }
}

function showStats() {
  const enigmesFilled = BALISES.reduce((acc, b) => acc + (b.enigmes ? Object.keys(b.enigmes).filter((d) => b.enigmes[d] && (b.enigmes[d].text || "").trim()).length : 0), 0);
  const quizCount = BIRDS.reduce((acc, b) => acc + (b.quiz ? b.quiz.length : 0), 0);
  const guideWithDesc = GUIDE.filter((g) => g.description && g.description.trim()).length;
  setStatus("📊 Balises : " + BALISES.length + " · Énigmes remplies : " + enigmesFilled + "/" + BALISES.length * DIFFS.length +
    " · Questions quiz : " + quizCount + " · Guide : " + GUIDE.length + " espèces (" + guideWithDesc + " avec description).", "ok");
}

function toggleAll(open) {
  document.querySelectorAll("details.ed-card").forEach((d) => { d.open = open; });
}

    /* ---------- Panneau Terrain : distances entre balises ---------- */
function haversineMeters(la1, lo1, la2, lo2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLa = (la2 - la1) * rad, dLo = (lo2 - lo1) * rad;
  const s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

function defaultRadius() {
  return (typeof SITE !== "undefined" && Number.isFinite(SITE.proximityRadius)) ? SITE.proximityRadius : 12;
}

function baliseHasGps(b) {
  return isFinite(b.lat) && isFinite(b.lng) && !(b.lat === 0 && b.lng === 0);
}

function openTerrainPanel() {
  const old = document.getElementById("terrain-panel");
  if (old) old.remove();
  const defR = defaultRadius();
  const rows = [];
  let missing = 0;
  let total = 0;
  for (let i = 0; i < BALISES.length; i++) {
    const a = BALISES[i];
    const hasA = baliseHasGps(a);
    if (!hasA) missing++;
    if (i === 0) continue;
    const p = BALISES[i - 1];
    const hasP = baliseHasGps(p);
    if (!hasA || !hasP) {
      rows.push('<tr><td>' + esc(p.id) + ' &rarr; ' + esc(a.id) + '</td><td colspan="3" style="color:var(--text-muted)">coordonnées manquantes</td></tr>');
      continue;
    }
    const d = haversineMeters(p.lat, p.lng, a.lat, a.lng);
    total += d;
    const ra = Number.isFinite(a.radius) && a.radius > 0 ? a.radius : defR;
    const rp = Number.isFinite(p.radius) && p.radius > 0 ? p.radius : defR;
    const sum = ra + rp;
    const fmt = (x) => (x < 1000 ? x.toFixed(1) + " m" : (x / 1000).toFixed(2) + " km");
    rows.push(
      '<tr><td>' + esc(p.id) + ' &rarr; ' + esc(a.id) + '</td>' +
      '<td style="text-align:right">' + fmt(d) + '</td>' +
      '<td style="text-align:right;color:var(--text-muted)">rayons ' + (ra === defR ? defR + ' (déf.)' : ra + '') + ' + ' + (rp === defR ? defR + ' (déf.)' : rp + '') + '</td>' +
      '<td>' + (d < sum ? curIco("warning") + ' cercles GPS qui se chevauchent : QR code conseillé ou rayons plus petits' : curIco("check")) + '</td></tr>'
    );
  }
  const head = '<strong>📏 Préparation du terrain</strong> — ' + BALISES.length + ' balises · ' +
    (missing ? '<span style="color:var(--err)">' + missing + ' sans coordonnées GPS</span>' : 'toutes géolocalisées') +
    ' · distance totale du parcours ≈ ' + (total < 1000 ? total.toFixed(0) + " m" : (total / 1000).toFixed(2) + " km") +
    ' · rayon par défaut ' + defR + ' m';
  const ov = document.createElement("div");
  ov.id = "terrain-panel";
  ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2200;display:flex;align-items:center;justify-content:center;padding:18px";
  ov.innerHTML = '<div style="background:var(--card,#fff);color:var(--text,#222);max-width:860px;width:100%;max-height:82vh;overflow:auto;border-radius:14px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.45)">' +
    '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px"><span>' + head + '</span>' +
    '<button class="btn btn-primary" id="terrain-close">' + curIco("close") + ' Fermer</button></div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:2px solid var(--line,#ddd)">Étape</th>' +
    '<th style="text-align:right;padding:6px 8px;border-bottom:2px solid var(--line,#ddd)">Distance</th>' +
    '<th style="text-align:right;padding:6px 8px;border-bottom:2px solid var(--line,#ddd)">Rayons</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:2px solid var(--line,#ddd)">Analyse</th>' +
    '</tr></thead><tbody>' + (rows.join("") || '<tr><td colspan="4">Pas assez de balises.</td></tr>') + '</tbody></table>' +
    '<p class="note" style="margin-top:10px">Astuce : deux balises dont les cercles de validation se chevauchent doivent être distinguées par QR code, ou avec un rayon propre plus petit (champ « Rayon GPS propre » de chaque balise).</p>' +
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
  document.getElementById("terrain-close").addEventListener("click", () => ov.remove());
}

function bindFilter() {
  const input = document.getElementById("ed-filter");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll("details.ed-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = (!q || text.indexOf(q) !== -1) ? "" : "none";
    });
  });
  const ms = document.getElementById("map-ed-search");
  if (ms) {
    ms.addEventListener("input", () => mapEdSearch(ms.value));
    ms.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { ms.value = ""; mapEdSearch(""); } });
  }
  const kf = document.getElementById("map-ed-kml-file");
  if (kf) kf.addEventListener("change", () => { if (kf.files && kf.files[0]) mapEdImportKmlFile(kf.files[0]); kf.value = ""; });
}

async function sendReport() {
  setStatus("⏳ Génération du rapport…", "ok");
  try {
    const r = await fetch("/api/report", { cache: "no-store" });
    const d = await r.json();
    if (!d.ok || !d.text) { setStatus("❌ Rapport indisponible.", "err"); return; }
    window.location.href = "mailto:contact@exemple.fr?subject=" + encodeURIComponent(d.subject) + "&body=" + encodeURIComponent(d.text);
    setStatus("📧 Rapport prêt (" + d.text.length + " caractères). Votre messagerie s'ouvre — envoyez-le à contact@exemple.fr.", "ok");
  } catch (e) {
    setStatus("❌ Échec du rapport : " + e.message, "err");
  }
}

function bindToolbar() {
  document.getElementById("btn-save").addEventListener("click", saveAll);
  document.getElementById("btn-reset").addEventListener("click", resetAll);
  if (document.getElementById("btn-ed-dict")) Dictation.bindFocused(document.getElementById("btn-ed-dict"), "fr-FR");
  document.getElementById("btn-export").addEventListener("click", exportJSON);
  document.getElementById("btn-import").addEventListener("click", () => document.getElementById("import-file").click());
  bindImport();
  document.getElementById("btn-check").addEventListener("click", checkIntegrity);
  document.getElementById("btn-stats").addEventListener("click", showStats);
  document.getElementById("btn-open-all").addEventListener("click", () => toggleAll(true));
  document.getElementById("btn-close-all").addEventListener("click", () => toggleAll(false));
  document.getElementById("btn-add-balise").addEventListener("click", addBalise);
  document.getElementById("btn-add-bird").addEventListener("click", addBird);
  document.getElementById("btn-report").addEventListener("click", sendReport);
  document.getElementById("btn-images").addEventListener("click", () => openImgBrowser(null));
  document.getElementById("btn-map").addEventListener("click", openMapEditor);
  document.getElementById("btn-ai").addEventListener("click", aiGenerate);
  bindImgBrowser();
  bindFilter();
}

/* ---------- Interface ---------- */
function buildUI() {
  const roots = {
    "site-root": buildSiteCard(),
    "trail-root": buildTrailCard(),
    "balises-root": BALISES.map((b) => buildBaliseCard(b)),
    "birds-root": BIRDS.map((bird) => buildQuizCard(bird)),
    "guide-root": GUIDE.map((g) => buildGuideCard(g)),
  };
  for (const id of Object.keys(roots)) {
    const root = document.getElementById(id);
    root.innerHTML = "";
    const items = Array.isArray(roots[id]) ? roots[id] : [roots[id]];
    items.forEach((c) => root.appendChild(c));
  }
  bindFileInputs();
  markChangedFromOverrides();
}

function markChangedFromOverrides() {
  BALISES.forEach((b) => {
    const ov = buildBaliseOverride(BASE_BALISES.find((bb) => bb.id === b.id), b);
    if (Object.keys(ov).length) markChanged(document.querySelector('[data-balise="' + b.id + '"]'));
  });
  BIRDS.forEach((bird) => {
    const ov = buildBirdOverride(BASE_BIRDS.find((bb) => bb.id === bird.id), bird);
    if (Object.keys(ov).length) markChanged(document.querySelector('[data-bird="' + bird.id + '"]'));
  });
  GUIDE.forEach((g) => {
    const ov = buildGuideOverride(BASE_GUIDE.find((x) => x.id === g.id), g);
    if (Object.keys(ov).length) markChanged(document.querySelector('[data-guide="' + g.id + '"]'));
  });
  const siteOv = buildSiteOverride(BASE_SITE, SITE);
  if (Object.keys(siteOv).length) markChanged(document.getElementById("site-card"));
  const trailOv = buildTrailOverride(BASE_TRAIL, TRAIL);
  if (Object.keys(trailOv).length) markChanged(document.getElementById("trail-card"));
}

Promise.all([
  fetch("/api/editor", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { data: {} })).catch(() => ({ data: {} })),
  fetch("/api/editor/images", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
  fetch("/api/map", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
])
  .then(([ed, imgs, map]) => {
    IMG_LIST = Array.isArray(imgs) ? imgs : [];
    mapUrlState = (map && map.url) || "";
    if (ed.data && typeof ed.data === "object") applyAdminData(ed.data);
    buildUI();
    bindToolbar();
    setStatus("Prêt. Éditez puis cliquez sur Enregistrer.", "ok");
    if (__mapOnly) {
      document.body.classList.add("map-only");
      openMapEditor();
    }
  })
  .catch(() => {
    IMG_LIST = [];
    buildUI();
    bindToolbar();
    setStatus("⚠️ Surcharges serveur illisibles — édition sur les données de base.", "err");
  });
