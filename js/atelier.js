/* =========================================================
   JDP_BC — Atelier de packs (création de contenu modulaire)
   État local → validation → export d'un bundle JSON
   réimportable via tools/import-pack.mjs.
   ========================================================= */
"use strict";

const AT = {
  pack: null,
  decouvertes: [],
  guide: [],
  balises: [],
  events: [],
};

/* ---------- utilitaires ---------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function slug(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function uid(prefix) { return `${prefix  }-${  Math.random().toString(36).slice(2, 7)}`; }
function setStatus(msg, cls) { const st = document.getElementById("at-status"); st.textContent = msg; st.className = `status-pill ${  cls || ""}`; }
function curIco(name, cls) { return `<img class="cur-icon${  cls ? " " + cls : ""  }" src="img/icons/${  name  }.svg" alt="">`; }

/* écrit v à l'emplacement « d.0.quiz.1.q », « g.2.nom », « pack.id »… */
function applyPath(p, v) {
  const m = p.match(/^([dgb])\.(\d+)\.(.+)$/);
  if (!m) {
    if (p.startsWith("pack.")) setDeep(AT.pack, p.slice(5), v);
    else if (p.startsWith("ev.")) {
      const parts = p.slice(3).split(".");
      const idx = Number(parts[0]);
      const key = parts.slice(1).join(".");
      setDeep(AT.events[idx], key, v);
    }
    return;
  }
  const sec = m[1] === "d" ? AT.decouvertes : m[1] === "g" ? AT.guide : AT.balises;
  setDeep(sec[Number(m[2])], m[3], v);
}
function setDeep(obj, path, val) {
  const ks = path.split(".");
  const last = ks.pop();
  const target = ks.reduce((o, k) => (o == null ? o : o[k]), obj);
  if (target != null) target[last] = val;
}

/* ---------- fabriques ---------- */
function nouveauPack() {
  return { id: "", nom: "", theme: "", description: "", version: 1, ages: [6, 99] };
}
function nouvelleDecouverte() {
  return {
    type: "decouverte", version: 1,
    id: slug(uid("notion")), nom: "", latin: "", emoji: "🧠",
    couleur: "#2e6fb3", categorie: "diurne", taille: "Antidote : ",
    img: "", audioFile: null,
    anecdotes: ["", "", ""],
    pedagogie: { ages: [6, 99], duree_min: 8, objectif: "", programme: ["cycle 3", "cycle 4", "lycée"] },
    chant: null,
    quiz: [{ q: "", options: ["", "", ""], reponse: 0 }],
  };
}
function nouvelleNotionGuide() {
  return {
    type: "notion-guide", version: 1,
    id: slug(uid("notion")), nom: "", latin: "", emoji: "🧠",
    couleur: "#6a6a6a", categorie: "diurne", taille: "Antidote : ",
    img: "", description: "",
    anecdotes: ["", ""],
    pedagogie: { ages: [6, 99], duree_min: 5, objectif: "", programme: ["cycle 3", "cycle 4", "lycée"] },
  };
}
function nouvelleBalise(n) {
  return {
    type: "balise", version: 1,
    id: `B${  n}`, bird: "", code: "", label: "",
    x: 200, y: 400, lat: null, lng: null,
    hintImg: "",
    enigmes: {
      facile:    { text: "", reponses: [""], indice: "", saviez: "", ages: [6, 9] },
      moyen:     { text: "", reponses: [""], indice: "", saviez: "", ages: [10, 13] },
      difficile: { text: "", reponses: [""], indice: "", saviez: "", ages: [14, 99] },
    },
  };
}
function nouvelEvent() {
  return {
    type: "BALISE_FOUND",
    trigger: "always",
    conditions: [],
    actions: [],
    description: "",
  };
}
function packExemple() {
  const p = {
    pack: Object.assign(nouveauPack(), { id: "mon-theme", nom: "Mon thème", theme: "à préciser", description: "Pack de démonstration à personnaliser." }),
    decouvertes: [], guide: [], balises: [],
  };
  const d = nouvelleDecouverte();
  d.id = "exemple"; d.nom = "Biais d'exemple"; d.latin = "Exemplum · Démo, 2026";
  d.taille = "Antidote : toujours vérifier un exemple";
  d.anecdotes = [
    "Premier exemple concret tiré du quotidien.",
    "Deuxième exemple : ce que font la publicité ou les réseaux sociaux.",
    "Troisième exemple : l'astuce à retenir pour ne pas se faire piéger.",
  ];
  d.quiz = [{ q: "Que fait le biais d'exemple ?", options: ["Il illustre le format", "Il chante", "Il disparaît"], reponse: 0 }];
  d.pedagogie.objectif = "Reconnaître le format d'une fiche puis le remplacer par sa propre notion.";
  const g = nouvelleNotionGuide();
  g.id = "notion-exemple"; g.nom = "Notion d'exemple"; g.latin = "Notio exemplum";
  g.description = "Une phrase claire qui explique la notion en une respiration.";
  g.anecdotes = ["Un détail amusant.", "Un deuxième éclairage."];
  g.pedagogie.objectif = "Comprendre comment une notion du guide est structurée.";
  const b = nouvelleBalise(1);
  b.bird = "exemple"; b.code = "JDP-B1"; b.label = "Le poste de démonstration"; b.lat = 48.8566; b.lng = 2.3522;
  b.enigmes.facile.text = "Énigme facile : je suis une question à résoudre sur le terrain. Qui suis-je ?";
  b.enigmes.facile.reponses = ["exemple"];
  b.enigmes.facile.indice = "Lisez la fiche de la découverte associée.";
  b.enigmes.facile.saviez = "Chaque niveau raconte le même piège autrement.";
  b.enigmes.moyen.text = "Énigme moyenne : plus de contexte, plus de subtilité. Qui suis-je ?";
  b.enigmes.moyen.reponses = ["exemple"];
  b.enigmes.moyen.indice = "Relisez les exemples de la fiche.";
  b.enigmes.moyen.saviez = "Les indices aident sans donner la réponse.";
  b.enigmes.difficile.text = "Énigme difficile : réservée aux experts du sentier. Qui suis-je ?";
  b.enigmes.difficile.reponses = ["exemple"];
  b.enigmes.difficile.indice = "La référence scientifique au secours.";
  b.enigmes.difficile.saviez = "Le champ « Le saviez-vous » prolonge la découverte.";
  p.decouvertes.push(d); p.guide.push(g); p.balises.push(b); p.events = [];
  return p;
}

/* ---------- validation ---------- */
function validerPack(st) {
  const errs = [];
  const warn = [];
  const err = (ref, msg) => errs.push({ ref, msg });
  const ids = new Set();
  const seenId = (scope, id) => {
    if (!id) return;
    if (ids.has(id)) err(scope, `identifiant dupliqué « ${  id  } »`);
    ids.add(id);
  };

  if (!st.pack.id || !/^[a-z0-9-]+$/.test(st.pack.id)) err("pack.id", "id de pack requis (minuscules, chiffres, tirets)");
  if (!st.pack.nom) err("pack.nom", "nom du pack requis");
  if (!(st.pack.ages[0] <= st.pack.ages[1])) err("pack.ages", "tranche d'âges invalide");

  st.decouvertes.forEach((d, i) => {
    const ref = `découverte ${  i + 1}`;
    seenId(ref, d.id);
    ["id", "nom", "latin", "taille"].forEach((k) => { if (!String(d[k] || "").trim()) err(ref, `champ requis manquant : ${  k}`); });
    if (!(d.anecdotes || []).some((a) => String(a).trim())) err(ref, "au moins une anecdote requise");
    (d.quiz || []).forEach((q, j) => {
      if (!q.q.trim()) err(`${ref  }, quiz ${  j + 1}`, "question vide");
      const opts = q.options.map((o) => String(o).trim()).filter(Boolean);
      if (opts.length < 2) err(`${ref  }, quiz ${  j + 1}`, "au moins deux options non vides");
      else if (!opts[q.reponse]) err(`${ref  }, quiz ${  j + 1}`, "la bonne réponse pointe vers une option vide");
    });
    if (!String(d.pedagogie.objectif || "").trim()) err(ref, "objectif pédagogique requis");
    if (!(d.pedagogie.ages[0] <= d.pedagogie.ages[1])) err(ref, "tranche d'âges invalide");
  });

  st.guide.forEach((g, i) => {
    const ref = `notion guide ${  i + 1}`;
    seenId(ref, g.id);
    ["id", "nom", "description"].forEach((k) => { if (!String(g[k] || "").trim()) err(ref, `champ requis manquant : ${  k}`); });
    if (!String(g.pedagogie.objectif || "").trim()) err(ref, "objectif pédagogique requis");
  });

  const birdIds = new Set(st.decouvertes.map((d) => d.id));
  st.balises.forEach((b, i) => {
    const ref = `balise ${  b.id || i + 1}`;
    if (!birdIds.has(b.bird)) err(ref, `découverte liée inconnue « ${  b.bird || "?"  } »`);
    if (!String(b.code || "").trim()) err(ref, "code de validation requis");
    if (!String(b.label || "").trim()) err(ref, "libellé requis");
    ["facile", "moyen", "difficile"].forEach((niv) => {
      const e = b.enigmes[niv];
      if (!e.text.trim()) err(`${ref  }, énigme ${  niv}`, "texte requis");
      if (!(e.reponses || []).some((r) => String(r).trim())) err(`${ref  }, énigme ${  niv}`, "au moins une réponse acceptée");
      if (!e.indice.trim() || !e.saviez.trim()) err(`${ref  }, énigme ${  niv}`, "indice et « saviez-vous » requis");
      if (!(e.ages[0] <= e.ages[1])) err(`${ref  }, énigme ${  niv}`, "tranche d'âges invalide");
    });
  });

  if (st.pack.id && !st.balises.length) warn("aucune balise : pensez au parcours");
  return { errs, warn };
}

/* ---------- gabarits ---------- */
function inp(path, label, value, opts) {
  opts = opts || {};
  const id = `f-${  path.replace(/\./g, "-")}`;
  if (opts.type === "textarea") {
    return `<div class="field"><label for="${  id  }">${  esc(label)  }</label><textarea id="${  id  }" rows="${  opts.rows || 2  }" data-p="${  esc(path)  }">${  esc(value)  }</textarea></div>`;
  }
  if (opts.type === "select") {
    const os = opts.options.map((o) => `<option value="${  esc(o)  }"${  o === value ? " selected" : ""  }>${  esc(o)  }</option>`).join("");
    return `<div class="field"><label for="${  id  }">${  esc(label)  }</label><select id="${  id  }" data-p="${  esc(path)  }">${  os  }</select></div>`;
  }
  const t = opts.type === "color" ? "color" : opts.type === "number" ? "number" : "text";
  return `<div class="field"><label for="${  id  }">${  esc(label)  }</label><input id="${  id  }" type="${  t  }" value="${  esc(value)  }"${  opts.min != null ? ` min="${  opts.min  }"` : ""  } data-p="${  esc(path)  }"></div>`;
}
function agesInputs(path, ages) {
  return `<div class="field"><label>Tranche d\u2019âge</label><div class="field-row">` +
    `<input type="number" min="3" max="99" value="${  ages[0]  }" data-p="${  esc(path)  }.0" aria-label="âge minimum">` +
    `<input type="number" min="3" max="99" value="${  ages[1]  }" data-p="${  esc(path)  }.1" aria-label="âge maximum">` +
    `</div></div>`;
}
function pedagoBlock(prefix, ped) {
  return `<details class="ed-adv"><summary>🎓 Pédagogie</summary>${ 
    inp(`${prefix  }.objectif`, "Objectif d'apprentissage", ped.objectif, { type: "textarea" }) 
    }<div class="field-row">${ 
    inp(`${prefix  }.duree_min`, "Durée (min)", ped.duree_min, { type: "number", min: 1 }) 
    }${inp(`${prefix  }.programme`, "Référentiels (virgules)", (ped.programme || []).join(", ")) 
    }</div>${ 
    agesInputs(`${prefix  }.ages`, ped.ages) 
    }</details>`;
}
function quizBlock(di, quiz) {
  return quiz.map((q, qi) => {
    const base = `d.${  di  }.quiz.${  qi}`;
    const opts = q.options.map((o, oi) =>
      `<div class="field-row">` +
      `<input type="radio" name="rep-${  di  }-${  qi  }" value="${  oi  }"${  q.reponse === oi ? " checked" : ""  } data-rep title="Bonne réponse">` +
      `<input type="text" placeholder="Option ${  oi + 1  }" value="${  esc(o)  }" data-p="${  base  }.options.${  oi  }">` +
      `</div>`).join("");
    return `<div class="quiz-q" data-qidx="${  qi  }" data-di="${  di  }">` +
      `<div class="q-head"><b>Question ${  qi + 1  }</b>` +
      `<button class="btn btn-outline" data-act="del-q" data-i="${  di  }" data-j="${  qi  }">🗑️</button></div>${ 
      inp(`${base  }.q`, "Question", q.q)  }${opts 
      }<small>Cochez la bonne réponse ; les options vides sont ignorées.</small>` +
      `</div>`;
  }).join("");
}

/* ---------- rendu ---------- */
function render() {
  if (!AT.pack) { document.getElementById("pack-root").innerHTML = ""; document.getElementById("lists-root").innerHTML = ""; return; }

  document.getElementById("pack-root").innerHTML =
    `<details class="ed-card" open><summary>📦 Pack</summary>` +
    `<div class="field-row">${ 
    inp("pack.id", "Identifiant (minuscules-tirets)", AT.pack.id) 
    }${inp("pack.nom", "Nom affiché", AT.pack.nom) 
    }</div>` +
    `<div class="field-row">${ 
    inp("pack.theme", "Thème", AT.pack.theme) 
    }${inp("pack.version", "Version", AT.pack.version, { type: "number", min: 1 }) 
    }</div>${ 
    inp("pack.description", "Description", AT.pack.description, { type: "textarea" }) 
    }${agesInputs("pack.ages", AT.pack.ages) 
    }</details>`;

  const dCards = AT.decouvertes.map((d, i) =>
    `<details class="ed-card" open><summary>${  esc(d.emoji)  } ${  esc(d.nom || "(sans nom)") 
    }<button class="btn ed-remove-btn" data-act="del-d" data-i="${  i  }">➖</button></summary>` +
    `<p class="ed-id">${  esc(d.id)  }</p>` +
    `<div class="field-row">${  inp(`d.${  i  }.id`, "Identifiant", d.id)  }${inp(`d.${  i  }.emoji`, "Emoji", d.emoji)  }</div>` +
    `<div class="field-row">${  inp(`d.${  i  }.nom`, "Nom", d.nom)  }${inp(`d.${  i  }.latin`, "Référence · auteur", d.latin)  }</div>` +
    `<div class="field-row">${  inp(`d.${  i  }.couleur`, "Couleur", d.couleur, { type: "color" })  }${inp(`d.${  i  }.categorie`, "Catégorie", d.categorie, { type: "select", options: ["diurne", "nocturne"] })  }</div>${ 
    inp(`d.${  i  }.taille`, "Antidote (sous-titre affiché)", d.taille) 
    }${d.anecdotes.map((a, ai) => inp(`d.${  i  }.anecdotes.${  ai}`, `Anecdote / exemple ${  ai + 1}`, a, { type: "textarea" })).join("") 
    }${pedagoBlock(`d.${  i  }.pedagogie`, d.pedagogie) 
    }<div class="q-head" style="margin-top:10px;"><b>${curIco("help")} Quiz</b><button class="btn btn-outline" data-act="add-q" data-i="${  i  }">➕ Question</button></div>${ 
    quizBlock(i, d.quiz) 
    }</details>`).join("");

  const gCards = AT.guide.map((g, i) =>
    `<details class="ed-card" open><summary>${  esc(g.emoji)  } ${  esc(g.nom || "(sans nom)") 
    }<button class="btn ed-remove-btn" data-act="del-g" data-i="${  i  }">➖</button></summary>` +
    `<p class="ed-id">${  esc(g.id)  }</p>` +
    `<div class="field-row">${  inp(`g.${  i  }.id`, "Identifiant", g.id)  }${inp(`g.${  i  }.emoji`, "Emoji", g.emoji)  }</div>` +
    `<div class="field-row">${  inp(`g.${  i  }.nom`, "Nom", g.nom)  }${inp(`g.${  i  }.latin`, "Référence · auteur", g.latin)  }</div>` +
    `<div class="field-row">${  inp(`g.${  i  }.couleur`, "Couleur", g.couleur, { type: "color" })  }${inp(`g.${  i  }.categorie`, "Catégorie", g.categorie, { type: "select", options: ["diurne", "nocturne"] })  }</div>${ 
    inp(`g.${  i  }.taille`, "Antidote", g.taille) 
    }${inp(`g.${  i  }.description`, "Description", g.description, { type: "textarea" }) 
    }${g.anecdotes.map((a, ai) => inp(`g.${  i  }.anecdotes.${  ai}`, `Anecdote ${  ai + 1}`, a, { type: "textarea" })).join("") 
    }${pedagoBlock(`g.${  i  }.pedagogie`, g.pedagogie) 
    }</details>`).join("");

  const birdOpts = AT.decouvertes.map((d) => d.id);
  const bCards = AT.balises.map((b, i) =>
    `<details class="ed-card" open><summary>${curIco("location")} ${  esc(b.id)  } — ${  esc(b.label || "(sans libellé)") 
    }<button class="btn ed-remove-btn" data-act="del-b" data-i="${  i  }">➖</button></summary>` +
    `<p class="ed-id">${  esc(b.code)  }</p>` +
    `<div class="field-row">${  inp(`b.${  i  }.id`, "Identifiant", b.id)  }${inp(`b.${  i  }.code`, "Code de validation", b.code)  }</div>${ 
    inp(`b.${  i  }.bird`, "Découverte liée", b.bird, { type: "select", options: birdOpts }) 
    }${inp(`b.${  i  }.label`, "Libellé du lieu", b.label) 
    }<div class="field-row">${  inp(`b.${  i  }.x`, "X carte", b.x, { type: "number" })  }${inp(`b.${  i  }.y`, "Y carte", b.y, { type: "number" })  }</div>` +
    `<div class="field-row">${  inp(`b.${  i  }.lat`, "Latitude GPS", b.lat == null ? "" : b.lat)  }${inp(`b.${  i  }.lng`, "Longitude GPS", b.lng == null ? "" : b.lng)  }</div>${ 
    ["facile", "moyen", "difficile"].map((niv) => {
      const e = b.enigmes[niv];
      const eb = `b.${  i  }.enigmes.${  niv}`;
      return `<div class="diff-block"><h3>Énigme ${  niv  }</h3>${ 
        inp(`${eb  }.text`, "Texte de l'énigme", e.text, { type: "textarea", rows: 3 }) 
        }${inp(`${eb  }.reponses`, "Réponses acceptées (une par ligne)", e.reponses.join("\n"), { type: "textarea" }) 
        }<div class="field-row">${  inp(`${eb  }.indice`, "Indice", e.indice)  }${inp(`${eb  }.saviez`, "Le saviez-vous", e.saviez)  }</div>${ 
        agesInputs(`${eb  }.ages`, e.ages) 
        }</div>`;
    }).join("") 
    }</details>`).join("");

  const eventTypes = ["BALISE_FOUND", "RIDDLE_SOLVED", "QUIZ_COMPLETED", "BIRD_REVEALED", "SEED_OFFERED", "RUN_FINISHED"];
  const evCards = AT.events.map((ev, i) =>
    `<details class="ed-card" open><summary>⚡ Événement ${  i + 1  }<button class="btn ed-remove-btn" data-act="del-ev" data-i="${  i  }">➖</button></summary>` +
    `<div class="field-row">${ inp(`ev.${  i  }.type`, "Type", ev.type, { type: "select", options: eventTypes }) }${ inp(`ev.${  i  }.trigger`, "Déclencheur", ev.trigger, { type: "select", options: ["always", "first_time", "daily"] }) }</div>` +
    inp(`ev.${  i  }.description`, "Description", ev.description, { type: "textarea" })
    + `</details>`).join("");

  document.getElementById("lists-root").innerHTML =
    `<h3 class="sec-title">🧠 Découvertes (${  AT.decouvertes.length  })</h3>` +
    `<button class="btn btn-outline" data-act="add-d">➕ Ajouter une découverte</button>${  dCards 
    }<h3 class="sec-title">${curIco("info")} Notions du guide (${  AT.guide.length  })</h3>` +
    `<button class="btn btn-outline" data-act="add-g">➕ Ajouter une notion</button>${  gCards 
    }<h3 class="sec-title">${curIco("location")} Balises (${  AT.balises.length  })</h3>` +
    `<button class="btn btn-outline" data-act="add-b">➕ Ajouter une balise</button>${  bCards
    }<h3 class="sec-title">⚡ Événements (${  AT.events.length  })</h3>` +
    `<button class="btn btn-outline" data-act="add-ev">➕ Ajouter un événement</button>${  evCards}`;

  markDirty();
}

/* ---------- écouteurs globaux (délégation) ---------- */
document.addEventListener("input", (ev) => {
  const t = ev.target;
  if (!t.dataset || t.dataset.p === undefined) return;
  let v = t.value;
  if (t.type === "number") v = v === "" ? null : Number(v);
  const p = t.dataset.p;
  if (/\breponses$/.test(p)) v = v.split("\n").map((s) => s.trim()).filter(Boolean);
  if (/programme$/.test(p)) v = v.split(",").map((s) => s.trim()).filter(Boolean);
  applyPath(p, v);
  markDirty();
});

document.addEventListener("change", (ev) => {
  const t = ev.target;
  if (!t.dataset || !t.hasAttribute || !t.hasAttribute("data-rep")) return;
  const holder = t.closest(".quiz-q");
  const di = Number(t.closest("[data-di]").dataset.di);
  AT.decouvertes[di].quiz[Number(holder.dataset.qidx)].reponse = Number(t.value);
  markDirty();
});

document.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const i = btn.dataset.i != null ? Number(btn.dataset.i) : null;
  const j = btn.dataset.j != null ? Number(btn.dataset.j) : null;
  if (act === "add-d") AT.decouvertes.push(nouvelleDecouverte());
  else if (act === "add-g") AT.guide.push(nouvelleNotionGuide());
  else if (act === "add-b") AT.balises.push(nouvelleBalise(AT.balises.length + 1));
  else if (act === "del-d") AT.decouvertes.splice(i, 1);
  else if (act === "del-g") AT.guide.splice(i, 1);
  else if (act === "del-b") AT.balises.splice(i, 1);
  else if (act === "add-q") AT.decouvertes[i].quiz.push({ q: "", options: ["", "", ""], reponse: 0 });
  else if (act === "del-q") AT.decouvertes[i].quiz.splice(j, 1);
  else if (act === "add-ev") AT.events.push(nouvelEvent());
  else if (act === "del-ev") AT.events.splice(i, 1);
  else return;
  render();
});

function markDirty() {
  if (!AT.pack) return;
  const r = validerPack(AT);
  setStatus(r.errs.length ? `⚠️ ${  r.errs.length  } problème(s) — bouton 🔎 pour le détail` : "✅ Pack cohérent", r.errs.length ? "err" : "ok");
}

/* ---------- preview ---------- */
function previewParcours() {
  if (!AT.pack) { setStatus("Aucun pack ouvert.", "err"); return; }
  const r = validerPack(AT);
  if (r.errs.length) { setStatus(`❌ Corrigez d'abord les ${  r.errs.length  } problème(s) avant de prévisualiser.`, "err"); return; }
  const lines = [];
  lines.push(`📦 ${AT.pack.nom || AT.pack.id}`);
  lines.push(`Thème : ${AT.pack.theme || "—"}`);
  lines.push(`Ages : ${AT.pack.ages[0]}–${AT.pack.ages[1]} ans`);
  lines.push("");
  lines.push(`🧠 Découvertes (${AT.decouvertes.length}) :`);
  AT.decouvertes.forEach((d) => { lines.push(`  ${d.emoji} ${d.nom} (${d.id}) — ${d.quiz ? d.quiz.length : 0} questions`); });
  lines.push("");
  lines.push(`📚 Guide (${AT.guide.length}) :`);
  AT.guide.forEach((g) => { lines.push(`  ${g.emoji} ${g.nom} — ${g.description ? g.description.slice(0, 60) : "…"}`); });
  lines.push("");
  lines.push(`📍 Balises (${AT.balises.length}) :`);
  AT.balises.forEach((b) => { lines.push(`  ${b.id} «${b.label}» (${b.code}) → ${b.bird || "?"} — GPS: ${b.lat ?? "?"}, ${b.lng ?? "?"}`); });
  lines.push("");
  lines.push(`⚡ Événements (${AT.events.length}) :`);
  AT.events.forEach((ev) => { lines.push(`  ${ev.type} (${ev.trigger}) — ${ev.description || "…"}`); });
  lines.push("");
  const totalEnigmes = AT.balises.reduce((n, b) => n + ["facile", "moyen", "difficile"].filter((lv) => b.enigmes[lv].text).length, 0);
  lines.push(`Score total : ${totalEnigmes} énigmes, ${AT.decouvertes.reduce((n, d) => n + (d.quiz || []).length, 0)} quiz, ${AT.balises.length} étapes`);
  const previewEl = document.getElementById("at-preview");
  if (previewEl) { previewEl.textContent = lines.join("\n"); previewEl.classList.remove("hidden"); }
  setStatus("Aperçu affiché ci-dessous.", "ok");
}

/* ---------- boutons principaux ---------- */
document.getElementById("btn-new").addEventListener("click", () => {
  AT.pack = nouveauPack(); AT.decouvertes = []; AT.guide = []; AT.balises = []; AT.events = [];
  render(); setStatus("Nouveau pack vide — commencez par le nommer.", "");
});
document.getElementById("btn-exemple").addEventListener("click", () => {
  const ex = packExemple();
  AT.pack = ex.pack; AT.decouvertes = ex.decouvertes; AT.guide = ex.guide; AT.balises = ex.balises; AT.events = ex.events || [];
  render(); setStatus("Pack d'exemple chargé : remplacez le contenu par votre thème.", "ok");
});
document.getElementById("btn-export").addEventListener("click", () => {
  if (!AT.pack) { setStatus("Aucun pack ouvert.", "err"); return; }
  const r = validerPack(AT);
  if (r.errs.length) { setStatus("❌ Export bloqué : corrigez d'abord les problèmes (bouton 🔎).", "err"); return; }
  const bundle = { $format: "jdpbc-pack", $version: 1, pack: AT.pack, decouvertes: AT.decouvertes, guide: AT.guide, balises: AT.balises, events: AT.events };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug(AT.pack.id) || "pack"  }.jdpbc.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  setStatus(`📥 Bundle exporté : ${  a.download  } — installez-le avec node tools/import-pack.mjs`, "ok");
});
document.getElementById("btn-preview").addEventListener("click", previewParcours);
document.getElementById("btn-import").addEventListener("click", () => document.getElementById("import-file").click());
document.getElementById("import-file").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  try {
    const bundle = JSON.parse(await f.text());
    if (bundle.$format !== "jdpbc-pack") throw new Error("format inattendu ($format ≠ jdpbc-pack)");
    AT.pack = bundle.pack; AT.decouvertes = bundle.decouvertes || []; AT.guide = bundle.guide || []; AT.balises = bundle.balises || []; AT.events = bundle.events || [];
    render();
    const r = validerPack(AT);
    setStatus(r.errs.length ? `⚠️ Importé avec ${  r.errs.length  } problème(s)` : "✅ Bundle importé", r.errs.length ? "err" : "ok");
  } catch (e) {
    setStatus(`❌ Import impossible : ${  e.message}`, "err");
  }
});
document.getElementById("btn-check").addEventListener("click", () => {
  if (!AT.pack) { setStatus("Aucun pack ouvert.", "err"); return; }
  const r = validerPack(AT);
  if (!r.errs.length && !r.warn.length) { setStatus("✅ Tout est conforme aux schémas content/schemas/.", "ok"); return; }
  setStatus(r.errs.map((e) => `• ${  e.ref  } : ${  e.msg}`).concat(r.warn.map((w) => `◦ ${  w}`)).join("\n"), r.errs.length ? "err" : "");
});

/* ouverture directe d'un bundle du projet : atelier.html#content/bundles/x.json */
(async function init() {
  const h = location.hash.replace(/^#/, "");
  if (/^[\w./-]+\.json$/.test(h)) {
    try {
      const b = await (await fetch(h)).json();
      if (b.$format === "jdpbc-pack") {
        AT.pack = b.pack; AT.decouvertes = b.decouvertes || []; AT.guide = b.guide || []; AT.balises = b.balises || []; AT.events = b.events || [];
        render();
        setStatus(`✅ Pack du projet chargé : ${  b.pack.nom || b.pack.id}`, "ok");
        return;
      }
    } catch (_e) { /* accueil classique */ }
  }
  setStatus("Créez un pack 🆕, chargez l'exemple ✨ ou importez un bundle 📤.", "");
})();
