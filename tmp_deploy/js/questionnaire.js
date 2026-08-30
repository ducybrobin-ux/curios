/* CURIOS — Questionnaire (extrait de questionnaire.html) */
"use strict";

const $ = (id) => document.getElementById(id);

window.HermesToast = function (msg) {
  try {
    let t = document.getElementById("dict-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "dict-toast";
      t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#2b3a36;color:#fff;padding:12px 18px;border-radius:12px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-size:14px;max-width:90%;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    clearTimeout(window.__dictToastT);
    window.__dictToastT = setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  } catch (e) {}
};

const Q = {
  fr: {
    title: "🧪 Questionnaire de test",
    intro: "Merci d'avoir testé le jeu ! Vos réponses (et le rapport technique automatique) nous aident à améliorer l'application.",
    mTitle: "📋 Contexte du test",
    submit: "📤 Envoyer mes réponses",
    copy: "📋 Copier le rapport",
    doneOk: "Merci ! Vos réponses ont été envoyées. 🎉",
    doneCopy: "Serveur injoignable : le rapport a été copié dans le presse-papiers. Collez-le dans votre message.",
    l: { date: "Date", team: "Équipe", device: "Appareil", browser: "Navigateur", role: "Rôle", place: "Lieu", conn: "Connexion", lang: "Langue de l'app", ver: "Version" },
    sections: [
      { id: "B", title: "Installation et démarrage", items: [
        { id: "b1", type: "yesno", q: "L'installation « Ajouter à l'écran d'accueil » a-t-elle fonctionné ?" },
        { id: "b2", type: "rate", q: "Notez l'accueil (écran de départ, tuiles, bouton Commencer)" },
        { id: "b3", type: "yesno", q: "La création du profil / nom d'équipe était-elle claire ?" },
        { id: "b4", type: "yesno", q: "Avez-vous compris immédiatement quoi faire au début ?" }
      ]},
      { id: "C", title: "Carte, navigation et validation", items: [
        { id: "c1", type: "rate", q: "Notez la carte (sentier, repérage, état des balises)" },
        { id: "c2", type: "multi", q: "Comment avez-vous validé les balises ?", opts: ["📍 Bouton GPS", "📷 Scan QR", "⌨️ Saisie manuelle", "🧭 Boussole / indices sonores"] },
        { id: "c3", type: "sel", q: "GPS : trouvait-il votre position rapidement ?", opts: ["Oui", "Lentement", "Non"] },
        { id: "c4", type: "sel", q: "Validation à distance : précise ?", opts: ["Trop stricte", "Juste", "Trop laxiste"] },
        { id: "c5", type: "sel", q: "La distance affichée semblait correcte ?", opts: ["Oui", "Non", "Non affichée"] },
        { id: "c6", type: "sel", q: "Scan QR :", opts: ["A fonctionné du premier coup", "Après plusieurs essais", "Pas fonctionné (saisie manuelle)"] },
        { id: "c7", type: "sel", q: "Saisie manuelle / codes imprimés :", opts: ["Facile à lire", "Code difficile à déchiffrer", "Pas testé"] }
      ]},
      { id: "D", title: "Contenu et jeu", items: [
        { id: "d1", type: "rate", q: "Fiches découvertes (photo, antidote, anecdotes)" },
        { id: "d2", type: "rate", q: "Signatures sonores des découvertes" },
        { id: "d2b", type: "multi", q: "Problème de son ?", opts: ["Signature irréaliste", "Pas de son", "Son trop faible / fort", "Aucun problème"] },
        { id: "d3", type: "sel", q: "Énigmes : difficulté ?", opts: ["Trop faciles", "Bien dosées", "Trop difficiles"] },
        { id: "d4", type: "sel", q: "Réponses tolérantes (accents, articles) :", opts: ["Oui", "Parfois", "Non"] },
        { id: "d5", type: "sel", q: "Quiz :", opts: ["Bien", "Mal", "Pas rencontré"] },
        { id: "d6", type: "sel", q: "Indice sonore directionnel :", opts: ["A aidé", "Confus", "Pas testé"] },
        { id: "d7", type: "sel", q: "Mode nuit :", opts: ["Pratique", "Textes difficiles à lire", "Pas testé"] },
        { id: "d8", type: "rate", q: "Carnet d'observation / collection" },
        { id: "d9", type: "sel", q: "Palmarès / classement :", opts: ["Motivant", "Peu clair", "Pas testé"] }
      ]},
      { id: "E", title: "Messages et épreuves de l'organisateur", items: [
        { id: "e1", type: "sel", q: "Le message diffusé est-il bien arrivé ?", opts: ["Oui", "Non", "Non reçu", "Pas testé"] },
        { id: "e2", type: "sel", q: "Le message était-il visible / lisible ?", opts: ["Oui", "Il a disparu trop vite", "Peu visible"] },
        { id: "e3", type: "yesno", q: "Avez-vous reçu des épreuves / défis pendant la partie ?" },
        { id: "e4", type: "sel", q: "Épreuve en direct : fluide ?", opts: ["Oui", "Non", "Pas testé"] }
      ]},
      { id: "F", title: "Tableau de bord de l'organisateur", items: [
        { id: "f1", type: "rate", q: "Carte de suivi des équipes (position en direct)" },
        { id: "f2", type: "sel", q: "Positions des équipes à jour / correctes ?", opts: ["Oui", "Parfois", "Non / vides"] },
        { id: "f3", type: "sel", q: "Diffusion d'un message aux équipes :", opts: ["Facile", "Compliqué", "Pas testé"] },
        { id: "f4", type: "sel", q: "Diffuser une épreuve :", opts: ["Simple", "Compliqué", "Pas testé"] },
        { id: "f5", type: "text", q: "Une fonction manque-t-elle au tableau de bord ?" }
      ]},
      { id: "G", title: "Technique : performance, hors-ligne, bugs", items: [
        { id: "g1", type: "sel", q: "Rapidité générale :", opts: ["Rapide", "Correct", "Lente"] },
        { id: "g2", type: "sel", q: "Consommation batterie :", opts: ["Normale", "Élevée", "Pas remarqué"] },
        { id: "g3", type: "sel", q: "Mode hors-ligne :", opts: ["A fonctionné", "Partiellement", "Non", "Pas testé"] },
        { id: "g4", type: "sel", q: "Textes lisibles en plein soleil :", opts: ["Oui", "Non", "Pas testé"] },
        { id: "g5", type: "yesno", q: "Plantages ou blocages rencontrés ?" },
        { id: "g6", type: "text", q: "🐞 Décrivez chaque bug (écran, actions, résultat, reproductible ?)" }
      ]},
      { id: "I", title: "Bilan et idées", items: [
        { id: "i1", type: "rate", q: "Satisfaction générale" },
        { id: "i2", type: "sel", q: "Adapté au public (familles, enfants dès 6 ans) ?", opts: ["Oui", "Plutôt oui", "Non"] },
        { id: "i3", type: "sel", q: "Difficulté globale du parcours :", opts: ["Trop facile", "Bien", "Trop dur"] },
        { id: "i4", type: "text", q: "Ce que vous avez le plus aimé :" },
        { id: "i5", type: "text", q: "Ce qui vous a le plus gêné :" },
        { id: "i6", type: "text", q: "Votre meilleure idée d'amélioration :" },
        { id: "i7", type: "sel", q: "Recommanderiez-vous le jeu ?", opts: ["Oui", "Peut-être", "Non"] }
      ]}
    ]
  },
};
let cur = "fr";
const ANSWERS = {};

function detect() {
  const ua = navigator.userAgent;
  let device = "Ordinateur"; if (/Mobi/i.test(ua)) device = "Mobile"; else if (/Tablet|iPad/i.test(ua)) device = "Tablette";
  if (/Android/i.test(ua)) device = device === "Mobile" ? "Android" : "Tablette";
  if (/iPhone|iPod/i.test(ua)) device = "iPhone";
  let browser = "Autre";
  if (/Edg\//i.test(ua)) browser = "Edge"; else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox"; else if (/Safari\//i.test(ua)) browser = "Safari";
  let os = "Unknown"; if (/Android/i.test(ua)) os = "Android"; else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows"; else if (/Mac/i.test(ua)) os = "Mac"; else if (/Linux/i.test(ua)) os = "Linux";
  return { device, browser, os };
}
const DET = detect();

function autoMeta() {
  const ua = navigator.userAgent;
  return {
    os: DET.os,
    screen: innerWidth + "x" + innerHeight + " (dpr=" + (window.devicePixelRatio || 1) + ")",
    online: navigator.onLine,
    gps: "geolocation" in navigator,
    secure: !!window.isSecureContext,
    sw: ("serviceWorker" in navigator && navigator.serviceWorker.controller) ? navigator.serviceWorker.controller.state : "no-controller",
    ua: ua.slice(0, 300),
    url: location.href
  };
}

function setLang(lang) {
  cur = lang;
  document.documentElement.lang = lang === "en" ? "en" : "fr";
  document.querySelectorAll(".q-lang-btn").forEach((b) => b.classList.toggle("sel", b.dataset.qlang === lang));
  const L = Q[lang];
  $("q-title").textContent = L.title;
  $("q-intro").textContent = L.intro;
  $("m-title").textContent = L.mTitle;
  const lm = L.l;
  $("l-date").firstChild.textContent = lm.date + " ";
  $("l-team").firstChild.textContent = lm.team + " ";
  $("l-device").firstChild.textContent = lm.device + " ";
  $("l-browser").firstChild.textContent = lm.browser + " ";
  $("l-role").firstChild.textContent = lm.role + " ";
  $("l-place").firstChild.textContent = lm.place + " ";
  $("l-conn").firstChild.textContent = lm.conn + " ";
  $("l-lang").firstChild.textContent = lm.lang + " ";
  $("l-ver").firstChild.textContent = lm.ver + " ";
  $("btn-submit").textContent = L.submit;
  $("btn-copy").textContent = L.copy;
  renderForm();
}

function renderForm() {
  const form = $("q-form");
  const L = Q[cur];
  form.innerHTML = L.sections.map((sec) =>
    `<fieldset class="q-sec"><legend>${sec.title}</legend>` +
    sec.items.map((it) => {
      const val = ANSWERS[it.id] || null;
      let inner = "";
      if (it.type === "rate") {
        inner = `<div class="q-rate" data-a="${it.id}">` +
          [1,2,3,4,5].map((n) =>
            `<label data-v="${n}"><input type="radio" name="${it.id}" value="${n}" ${val == n ? "checked" : ""}>${n}</label>`).join("") + `</div>`;
      } else if (it.type === "multi") {
        inner = `<div class="q-opt" data-a="${it.id}">` +
          it.opts.map((o, i) => {
            const on = Array.isArray(val) && val.indexOf(String(i)) >= 0 ? " on" : "";
            return `<label class="${on}" data-v="${i}"><input type="checkbox" value="${i}" ${on ? "checked" : ""}>${o}</label>`;
          }).join("") + `</div>`;
      } else if (it.type === "sel") {
        inner = `<div class="q-opt" data-a="${it.id}">` +
          it.opts.map((o, i) => {
            const on = val === String(i) ? " on" : "";
            return `<label class="${on}" data-v="${i}"><input type="radio" name="${it.id}" value="${i}" ${on ? "checked" : ""}>${o}</label>`;
          }).join("") + `</div>`;
      } else if (it.type === "yesno") {
        inner = `<div class="q-opt" data-a="${it.id}">` +
          [["1","✔ Oui"],["0","✖ Non"]].map(([v, lab]) => {
            const on = val === v ? " on" : "";
            return `<label class="${on}" data-v="${v}"><input type="radio" name="${it.id}" value="${v}" ${on ? "checked" : ""}>${lab}</label>`;
          }).join("") + `</div>`;
      } else if (it.type === "text") {
        inner = `<div class="q-dict-row"><textarea class="q-text" id="a-${it.id}" placeholder="…">${esc(val || "")}</textarea><button type="button" id="btn-da-${it.id}" class="dict-btn" aria-label="Dicter" title="🎤 Dicter">🎤</button></div>`;
      }
      return `<div class="q-item"><span class="q-txt">${it.q}</span>${inner}</div>`;
    }).join("") + `</fieldset>`).join("");

  form.querySelectorAll(".q-opt, .q-rate").forEach((box) => {
    const id = box.dataset.a;
    box.addEventListener("change", (e) => {
      const input = e.target;
      if (input.tagName !== "INPUT") return;
      const lab = input.closest("label");
      if (!lab) return;
      if (input.type === "radio") {
        box.querySelectorAll("label").forEach((x) => x.classList.remove("on"));
        lab.classList.add("on");
        ANSWERS[id] = lab.dataset.v;
      } else {
        const arr = ANSWERS[id] = Array.isArray(ANSWERS[id]) ? ANSWERS[id] : [];
        const v = lab.dataset.v;
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else arr.push(v);
        lab.classList.toggle("on", input.checked);
      }
    });
  });
  form.querySelectorAll("textarea").forEach((ta) => {
    ta.addEventListener("input", () => { ANSWERS[ta.id.slice(2)] = ta.value; });
    const btn = document.getElementById("btn-da-" + ta.id.slice(2));
    if (btn) Dictation.attach(ta, btn, cur === "en" ? "en-GB" : "fr-FR");
  });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildReport(answers, meta, m) {
  const L = Q[cur];
  const lines = [];
  lines.push("=== Curi🧭s — QUESTIONNAIRE (beta) ===");
  lines.push("Date : " + m.date);
  lines.push("Équipe : " + (m.team || "-"));
  lines.push("Langue questionnaire : " + cur + " | Langue app : " + m.lang);
  lines.push("Version : " + m.ver);
  lines.push("Rôle : " + m.role + " | Lieu : " + m.place + " | Connexion : " + m.conn);
  lines.push("Appareil : " + m.device + " / " + m.browser);
  L.sections.forEach((sec) => {
    lines.push("-- " + sec.title + " --");
    sec.items.forEach((it) => {
      const v = answers[it.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
      let val;
      if (Array.isArray(v)) val = v.map((x) => it.opts[+x]).join(", ");
      else if (it.type === "rate") val = v + "/5";
      else if (it.type === "yesno") val = v === "1" ? "Oui/Yes" : "Non/No";
      else if (it.type === "sel") val = it.opts[+v] || v;
      else val = String(v);
      lines.push("- " + it.q + " : " + val);
    });
  });
  lines.push("-- RAPPORT TECHNIQUE (auto) --");
  lines.push("URL : " + meta.url);
  lines.push("OS : " + meta.os + " | Écran : " + meta.screen);
  lines.push("En ligne : " + meta.online + " | GPS : " + meta.gps + " | Contexte sécurisé : " + meta.secure);
  lines.push("Service worker : " + meta.sw);
  lines.push("UA : " + meta.ua);
  return lines.join("\n");
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}
function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

async function submit() {
  const m = {
    date: $("m-date").value,
    team: $("m-team").value.trim(),
    device: $("m-device").value,
    browser: $("m-browser").value,
    role: $("m-role").value,
    place: $("m-place").value,
    conn: $("m-conn").value,
    lang: $("m-lang").value,
    ver: $("m-ver").value
  };
  const meta = autoMeta();
  const answers = Object.assign({}, ANSWERS);
  answers.role = m.role; answers.place = m.place; answers.conn = m.conn;
  const payload = { lang: cur, team: m.team, answers, meta };
  const btn = $("btn-submit");
  btn.disabled = true;
  btn.textContent = "⏳ " + Q[cur].submit;
  let sent = false;
  try {
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    sent = r.ok;
  } catch (e) {}
  const report = buildReport(answers, meta, m);
  $("q-report").textContent = report;
  $("q-report").classList.remove("hidden");
  $("btn-copy").classList.remove("hidden");
  if (sent) {
    $("q-done").textContent = "✅ " + Q[cur].doneOk;
    $("q-done").classList.remove("hidden");
    btn.textContent = Q[cur].submit;
    btn.disabled = false;
  } else {
    await copyText(report);
    $("q-done").textContent = "📋 " + Q[cur].doneCopy;
    $("q-done").classList.remove("hidden");
    btn.textContent = Q[cur].submit;
    btn.disabled = false;
  }
}

document.querySelectorAll(".q-lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.qlang)));
$("btn-submit").addEventListener("click", submit);
$("btn-copy").addEventListener("click", async () => {
  const ok = await copyText($("q-report").textContent);
  const done = $("q-done");
  done.textContent = ok ? ("✅ " + Q[cur].copy) : "❌ Copy failed.";
  done.classList.remove("hidden");
});

$("m-date").value = new Date().toISOString().slice(0, 10);
$("m-device").value = DET.device === "Mobile" ? "Android" : (DET.device);
$("m-browser").value = DET.browser;
try { if (window.Store && Store.getActive()) $("m-team").value = Store.getActive().name; } catch (e) {}
try { $("m-lang").value = typeof I18N !== "undefined" ? I18N.lang : (navigator.language || "").slice(0, 2); } catch (e) {}
try { $("m-ver").value = typeof I18N !== "undefined" ? I18N.t("set_version") : "?"; } catch (e) {}
setLang("fr");
const teamBtn = $("btn-dict-team");
if (teamBtn) Dictation.attach($("m-team"), teamBtn, cur === "en" ? "en-GB" : "fr-FR");
