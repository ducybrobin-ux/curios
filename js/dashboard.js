"use strict";
/* CURIOS — Dashboard (extrait de dashboard.html) */

const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function curIco(name, cls) {
  return '<img class="cur-icon' + (cls ? " " + cls : "") + '" src="img/icons/' + name + '.svg" alt="">';
}

const DASH_LANGS = { fr: "Français" };
let dashLang = "fr";
try { dashLang = localStorage.getItem("jdp_dash_lang") || "fr"; } catch (e) {}
if (!DASH_LANGS[dashLang]) dashLang = "fr";
const DASH_T = {
  fr: {
    dash_title: "Curi🧭s — Tableau de bord", lang_sel: "Langue du tableau de bord", editor_title: "Éditeur de contenu", refresh_title: "Actualiser",
    org_title: "🎛️ Organisateur", org_sub: "Communiquez avec les familles qui jouent : message diffusé, suivi en direct des équipes et épreuves aléatoires.",
    col_comm: "🗣️ Communication", col_field: "🗺️ Suivi du terrain", col_config: "⚙️ Configuration",
    msg_title: "📣 Message aux participants", msg_note: "Écrivez le message en <b>français</b> : il sera traduit automatiquement dans la langue de chaque équipe (en / nl / de / zh / ja). En cas d'absence de connexion, les équipes recevront la version française.",
    msg_fr_label: "Français", msg_ph: "Ex : Retrouvez-vous devant l'accueil pour l'épreuve surprise !", msg_send: "Diffuser le message", msg_clear: "Effacer le message",
    ans_title: "💬 Réponses des familles", ans_empty: "Aucune réponse pour l'instant.", ans_fam: "Famille",
    pos_title: "🗺️ Suivi des équipes", pos_wait: "En attente des positions…", pos_map_aria: "Carte du sentier avec les positions des équipes",
    pos_visible: "🟢 {n} équipe(s) visible(s) — mise à jour toutes les 5 s. Cliquez « ⏻ » pour déconnecter un appareil.",
    pos_none: "Aucune position reçue : les familles doivent avoir la carte ouverte avec le GPS.",
    pos_kick_title: "Déconnecter l'équipe {team}", pos_kick_confirm: "Déconnecter l'équipe « {team} » ? Son appareil reviendra à l'écran d'accueil.", pos_kicked: "⏻ Déconnexion demandée pour {team}.",
    srv_title: "🌐 Serveur", srv_note: "Choisissez les accès pour les équipes : <b>Local</b> (Wi-Fi du site) et/ou <b>Internet</b> (tunnel public pour les équipes à distance, en 4G/5G). Au moins un mode doit rester actif.",
    srv_local: "Serveur Local", srv_local_sub: "Réseau Wi-Fi du site", srv_local_tip: "Accès des téléphones sur le réseau Wi-Fi local",
    srv_int: "Serveur Internet", srv_int_sub: "Tunnel public (cloudflared)", srv_int_tip: "Tunnel public cloudflared : URL https accessible partout",
    srv_status: "Lecture de l'état du serveur…", srv_lan_url: "🏠 URL réseau local", srv_int_url: "🌍 URL internet (tunnel public)",
    copy: "Copier", srv_copy_lan: "URL réseau local", srv_copy_int: "URL internet", srv_copied: "✅ {what} copiée.",
    srv_tunnel_on: "🌍 Tunnel public actif — les équipes à distance peuvent se connecter via l'URL internet ci-dessous.",
    srv_tunnel_starting: "⏳ Tunnel en cours de démarrage… (quelques secondes)",
    srv_tunnel_err: "❌ Tunnel indisponible : {err}",
    srv_int_pending: "🌐 Mode Internet sélectionné : le tunnel n'est pas encore prêt.",
    srv_local_active: "🟢 Mode Local actif — les équipes utilisent l'URL réseau local (même Wi-Fi que le serveur).",
    srv_tunnel_tip: "Conseil : le tunnel public nécessite une connexion internet sur le PC du serveur.",
    srv_need_one: "⚠️ Au moins un mode (Local ou Internet) doit rester actif.",
    srv_int_on: "🌍 Mode Internet activé — tunnel en démarrage…", srv_int_off: "🌐 Mode Internet désactivé.", srv_refused: "❌ Mise à jour refusée par le serveur.",
    chal_title: "🎲 Épreuve aléatoire", chal_type_tip: "Type d'épreuve", chal_all: "Tous les types", chal_draw: "Tirer une épreuve",
    chal_send: "📢 Diffuser l'épreuve", chal_stop: "Arrêter l'épreuve", chal_name: "Épreuve", chal_live: "📡 EN DIRECT : ",
    chal_hint: "💡 Indice (optionnel) : ", chal_drawn: "🎲 Épreuve tirée : « {title} » — clique « Diffuser » pour l'envoyer.",
    chal_draw_first: "⚠️ Tire d'abord une épreuve.", chal_sent: "📢 Épreuve diffusée aux participants.", chal_stopped: "🛑 Épreuve arrêtée.",
    type_chant: "🎵 Signature sonore", type_enquete: "🔍 Enquête", type_observation: "👀 Observation", type_rapidite: "⚡ Rapidité",
    fin_title: "🏁 Équipes terminées", fin_status_empty: "Aucune équipe n'a encore terminé le parcours.", fin_empty: "Aucune équipe terminée pour l'instant.",
    fin_status: "🏁 {n} équipe(s) terminée(s).",
    val_title: "✅ Balises validées par équipe", val_status_wait: "En attente des validations…",
    val_ph: "Nom d'une équipe à ajouter…", val_add: "➕ Ajouter", val_empty: "Aucune équipe pour l'instant.",
    val_note: "Les équipes apparaissent ici dès qu'elles valident une balise, envoient leur position ou terminent le parcours.",
    val_status: "{n} équipe(s) — cliquez sur une balise pour la valider ou la dévalider pour l'équipe.",
    val_on: "validée (cliquer pour retirer)", val_off: "non validée (cliquer pour valider)",
    val_need_name: "⚠️ Entrez un nom d'équipe.", val_added: "✅ Équipe « {name} » ajoutée.", val_add_fail: "❌ Échec de l'ajout.", val_toggle_fail: "❌ Échec de la mise à jour.",
    fam_title: "📱 Familles — connexion & appareils", fam_wait: "En attente des connexions…",
    fam_empty: "Aucune famille connectée pour l'instant.", fam_n: "{n} appareil(s) connu(s) — états rafraîchis toutes les 5 s.",
    fam_online: "📶 en ligne", fam_offline: "📴 hors ligne", fam_net: " ({net})",
    fam_cam_ok: "📷 autorisée", fam_cam_no: "📷 refusée", fam_cam_ask: "📷 non demandée",
    fam_seen: "vu à {t}",
    val_mode_title: "Valider {id} :", vm_manual: "✋ Manuel", vm_gps: "🛰️ GPS", vm_q: "❓ Question", vm_code: "🔑 Code",
    vm_remove: "➖ Retirer la validation",
    vm_gps_ok: "Famille à {d} m de la balise — validée.", vm_gps_far: "Trop loin : {d} m (rayon ~{r} m). GPS non concluant.",
    vm_gps_nopos: "⚠️ Aucune position GPS récente pour cette équipe.",
    vm_q_title: "Énigme — balise {id}", vm_q_answers: "Réponses acceptées : {a}", vm_q_validate: "✅ Valider (réponse vérifiée)",
    vm_code_prompt: "Code inscrit sur la balise {id} :", vm_code_bad: "❌ Code incorrect.",
    val_removed: "➖ Balise {id} retirée.",
    map_title: "🗺️ Carte du parcours", map_note: "Collez l'URL d'une carte (Google Maps, OpenStreetMap…) montrant le parcours. Un bouton « Voir le parcours » apparaîtra sur l'écran Carte des participants.",
    map_ph: "https://www.google.com/maps/dir/…", map_save: "💾 Enregistrer", map_none: "Aucune carte configurée pour l'instant.",
    map_active: "Carte active : {url}", map_saved: "✅ Carte du parcours enregistrée.", map_deleted: "✅ Carte du parcours supprimée.",
    acc_title: "🔐 Accès des familles", acc_note: "Au début de l'activité, affichez ce panneau : les familles scannent d'abord le <b>QR Wi-Fi</b> (1️⃣), puis le <b>QR du jeu</b> (2️⃣) qui ouvre l'application.",
    wifi_title: "1️⃣ Se connecter au Wi-Fi", wifi_ssid_ph: "SSID (nom du réseau)", wifi_pass_ph: "Mot de passe", wifi_open: "Réseau ouvert",
    wifi_save: "💾 Enregistrer", wifi_detect: "📡 Détection automatique", wifi_note: "Renseignez le SSID et le mot de passe du Wi-Fi, puis Enregistrer.",
    wifi_qr_shown: "QR Wi-Fi « {ssid} » affiché (1️⃣).", wifi_detecting: "📡 Détection…",
    wifi_detected: "Wi-Fi détecté : « {ssid} »{sig}. Vérifiez le mot de passe, puis Enregistrer.",
    wifi_ssid_detected: "📡 SSID détecté : « {ssid} »",
    wifi_no_detect: "⚠️ Aucun Wi-Fi détecté sur cette machine (câble Ethernet ? Wi-Fi éteint ?). Renseignez le SSID à la main.",
    wifi_detect_fail: "❌ Détection impossible (serveur injoignable).",
    wifi_need_ssid: "⚠️ Entrez le nom du réseau (SSID).", wifi_saved: "✅ QR Wi-Fi « {ssid} » enregistré.",
    game_title: "2️⃣ Lancer le jeu", game_url_unavailable: "URL indisponible pour l'instant.",
    export: "📤 Exporter les QR", edit_full: "✏️ Éditer le jeu complet", edit_full_tip: "Ouvrir l'éditeur de contenu (balises, découvertes, quiz)",
    pdf: "📄 PDF", jpeg: "🖼️ JPEG", print: "🖨️ Imprimer", mail: "📧 Envoyer par mail",
    export_note: "Les deux QR (Wi-Fi + jeu) sont assemblés sur une page A4 prête à imprimer.",
    need_wifi_first: "⚠️ Renseignez d'abord le Wi-Fi.", pdf_dl: "📄 PDF téléchargé.", jpeg_dl: "🖼️ JPEG téléchargé.",
    popup_needed: "⚠️ Autorisez les fenêtres pop-up pour imprimer.", mail_dl: "📧 PDF téléchargé — joignez-le à votre e-mail.",
    qr_folder: "🗂️ JPG dans qrcodes", qr_folder_tip: "Enregistre les QR de connexion et des balises en JPG dans D:\\qrcodes", qr_folder_need_url: "⚠️ Aucune URL de jeu disponible pour l'instant.", qr_folder_ok: "✅ {n} JPG enregistrés dans D:\\qrcodes.", qr_folder_fail: "❌ Enregistrement refusé par le serveur : {err}",
    urg_title: "🆘 Urgences des équipes", urg_status_empty: "Aucune urgence en cours. Les alertes des familles apparaissent ici, sur la carte, avec un signal sonore.",
    urg_empty: "Aucune urgence pour l'instant.",
    urg_banner: "🚨 {n} URGENCE(S) EN COURS — traitez-les dans le panneau ci-dessous",
    urg_summary: "⚠️ {e} appel(s) aux secours · {l} équipe(s) perdue(s){m}", urg_msgs: " · {n} message(s)",
    urg_section_emerg: "🚨 Appels aux secours", urg_section_lost: "😱 Équipes perdues", urg_section_msg: "✉️ Messages",
    urg_msg_empty: "(message vide)", urg_pos_unknown: "📍 Position inconnue", urg_orig: "🗣️ (original {lang}) : {text}",
    urg_map_btn: "🗺️ Carte", urg_resolve_btn: "✅ Résolu", urg_resolved: "✅ Urgence de {team} résolue.", urg_fail: "❌ Échec de la résolution.",
    live_none: "⚪ Aucun message diffusé", live_msg: "🟢 Message diffusé", live_msg_chal: "🟢 Message diffusé · Épreuve en cours : « {title} »",
    live_srv_down: "❌ Serveur injoignable : {err}", live_need_fr: "⚠️ Écris un message en français avant de diffuser.",
    live_translating: "⏳ Envoi en cours…", live_sent: "✅ Message diffusé.", live_cleared: "✅ Message effacé.",
    footer: "Chargé depuis le serveur (page <code>/dashboard</code>). Rafraîchissement automatique toutes les 5 s.",
    table_aria: "Tableau de bord organisateur", dict_fr_title: "🎤 Dicter (français)", srv_local_full: "Serveur Local<small>Réseau Wi-Fi du site</small>", srv_int_full: "Serveur Internet<small>Tunnel public (cloudflared)</small>", unknown_err: "erreur inconnue", srv_down: "❌ Serveur injoignable.", copy_addr: "Copiez l'adresse :", save_refused: "❌ Enregistrement refusé par le serveur.", qr_unavailable: "QR indisponible", poster_title: "Curi🧭s — Accès des familles", poster_sub: "Scannez le QR pour connecter le Wi-Fi, puis pour lancer le jeu.", poster_wifi: "1) Se connecter au Wi-Fi", poster_game: "2) Lancer le jeu", poster_footer: "Curi🧭s — jeu familial d'énigmes", qr_doc_title: "Curi🧭s — QR d'accès", mail_share_text: "QR d'accès Wi-Fi et jeu (à imprimer).",
    packs_title: "📦 Packs disponibles", packs_sub: "Catalogue des packs installés et leurs états (actif, désactivé, disponible, erreur). Lecture seule.",
    packs_summary: "{a} actif(s) · {d} désactivé(s) · {v} disponible(s) · {e} en erreur",
    packs_empty: "Aucun pack installé pour le moment.",
    packs_offline: "Hors ligne : catalogue indisponible.",
  },
};
/* Émojis structurels → icônes du pack officiel (img/img/icons/*.svg),
       réservé aux nœuds rendus en HTML (data-i18n-html). */
const ICON_MAP = {
  "🗺️": "map",
  "⚙️": "settings",
  "✅": "check",
};
const ICON_RE = new RegExp(Object.keys(ICON_MAP).sort((a, b) => b.length - a.length).join("|"));
function icoify(str) {
  return String(str).replace(ICON_RE, (e) => '<img class="cur-icon" src="img/icons/' + ICON_MAP[e] + '.svg" alt="">');
}
function T(key) {
  const v = (DASH_T[dashLang] && DASH_T[dashLang][key]) || DASH_T.fr[key];
  return v == null ? key : v;
}
function TF(key, o) {
  return T(key).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] != null ? o[k] : m));
}
function applyLang() {
  document.documentElement.lang = dashLang;
  document.title = T("dash_title");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = T(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = icoify(T(el.getAttribute("data-i18n-html"))); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", T(el.getAttribute("data-i18n-ph"))); });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.setAttribute("title", T(el.getAttribute("data-i18n-title"))); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", T(el.getAttribute("data-i18n-aria"))); });
  const sel = $("dash-lang");
  if (sel) sel.value = dashLang;
  if (modeState) renderMode();
  renderWifi();
  renderMapField();
  renderFinishList();
  if (lastPositions.length || $("pos-status")) {
    refreshPos();
  }
  renderUrgencies(lastUrgencies);
  renderUrgencyBanner(lastUrgencies);
  renderValidations();
  refresh();
}
const state = { message: {}, messageSeq: -1, challenge: null, challengeSeq: -1 };
let pending = null;
const MSG_LANGS = ["fr"];
const LANG_LABEL = { fr: "Français" };

window.HermesToast = function (msg) {
  let el = document.getElementById("dash-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "dash-toast";
    el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#c33;color:#fff;padding:10px 16px;border-radius:12px;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:15px;max-width:90%;transition:opacity .4s;";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = "0"; }, 2600);
};

if (window.Dictation) {
  const REGION = {};
  (typeof I18N !== "undefined" ? I18N.LANGUAGES : []).forEach((l) => { REGION[l.code] = l.region; });
  MSG_LANGS.forEach((l) => {
    Dictation.attach($("msg-" + l), $("btn-dict-" + l), REGION[l] || l);
  });
}

function messageFilled(msg) {
  return MSG_LANGS.some((k) => (msg && msg[k] || "").trim().length > 0);
}

function setLive(text, color) {
  const el = $("live-status");
  el.textContent = text;
  el.style.color = color || "";
}

function typeLabel(t) {
  const map = { chant: T("type_chant"), enquete: T("type_enquete"), observation: T("type_observation"), rapidite: T("type_rapidite") };
  return map[t] || t;
}

function fillTypeSelect() {
  const sel = $("chal-type");
  challengeTypes().forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = typeLabel(t);
    sel.appendChild(opt);
  });
}

function renderChallengePreview(ch, editable) {
  const box = $("chal-preview");
  box.classList.remove("hidden");
  const ta = box.querySelector(".type-tag");
  if (ta) ta.textContent = typeLabel(ch.type);
  box.innerHTML = "";
  const tag = document.createElement("span");
  tag.className = "type-tag";
  tag.textContent = typeLabel(ch.type);
  box.appendChild(tag);
  const title = document.createElement("h3");
  title.textContent = ch.title || T("chal_name");
  box.appendChild(title);
  const q = document.createElement("p");
  q.textContent = ch.question;
  box.appendChild(q);
  if (editable && ch.hint) {
    const hint = document.createElement("p");
    hint.className = "note";
    hint.textContent = T("chal_hint") + ch.hint;
    box.appendChild(hint);
  }
  $("chal-actions").style.display = "flex";
}

function renderLiveChallenge(ch) {
  const box = $("chal-preview");
  if (!ch) {
    box.classList.add("hidden");
    $("chal-actions").style.display = "none";
    return;
  }
  renderChallengePreview(ch, false);
  const title = box.querySelector("h3");
  title.textContent = T("chal_live") + (ch.title || T("chal_name"));
}

async function postBoard(action, extra) {
  try {
    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action: action }, extra || {})),
    });
    return await res.json();
  } catch (e) {
    setLive(TF("live_srv_down", { err: e.message }), "var(--err)");
    return { ok: false };
  }
}

async function refresh() {
  try {
    const res = await fetch("/api/board");
    const data = await res.json();
    state.message = data.message || "";
    state.messageSeq = data.seq;
    state.challenge = data.challenge || null;
    state.challengeSeq = data.challengeSeq;
    renderLiveChallenge(state.challenge);
    state.message = data.message || {};
    MSG_LANGS.forEach((k) => {
      const el = $("msg-" + k);
      if (el && document.activeElement !== el) el.value = state.message[k] || "";
    });
    const el = $("live-status");
    if (state.challenge) {
      el.textContent = TF("live_msg_chal", { title: state.challenge.title || "" });
      el.style.color = "var(--gold)";
    } else if (messageFilled(state.message)) {
      el.textContent = T("live_msg");
      el.style.color = "var(--ok)";
    } else {
      el.textContent = T("live_none");
      el.style.color = "var(--text-muted)";
    }
    await refreshAnswers();
  } catch (e) {
    setLive(TF("live_srv_down", { err: e.message }), "var(--err)");
  }
}

async function refreshAnswers() {
  try {
    const res = await fetch("/api/answers");
    const data = await res.json();
    const list = data.answers || [];
    const box = $("answers-list");
    if (!list.length) {
      box.innerHTML = '<p class="empty">' + esc(T("ans_empty")) + "</p>";
      return;
    }
    box.innerHTML = "";
    list.slice().reverse().forEach((a) => {
      const div = document.createElement("div");
      div.className = "answer-item";
      const team = document.createElement("b");
      team.textContent = (a.team || T("ans_fam")) + " — ";
      div.appendChild(team);
      div.appendChild(document.createTextNode(a.text || ""));
      const small = document.createElement("small");
      small.textContent = (a.challengeId || "") + " · " + (a.at || "");
      div.appendChild(small);
      box.appendChild(div);
    });
  } catch (e) { /* silencieux */ }
}

$("btn-refresh").addEventListener("click", refresh);

$("btn-msg-send").addEventListener("click", async () => {
  const fr = $("msg-fr").value.trim();
  if (!fr) { setLive(T("live_need_fr"), "var(--err)"); return; }
  const btn = $("btn-msg-send");
  btn.disabled = true;
  btn.textContent = T("live_translating");
  const r = await postBoard("message", { text: fr });
  btn.disabled = false;
  btn.textContent = T("msg_send");
  if (r.ok) {
    const st = $("msg-trans-status");
    st.textContent = "✅ Message diffusé à toutes les équipes.";
    st.style.color = "var(--ok)";
    setLive(T("live_sent"), "var(--ok)");
    refresh();
  }
});

$("btn-msg-clear").addEventListener("click", async () => {
  const r = await postBoard("clear");
  if (r.ok) { setLive(T("live_cleared"), "var(--ok)"); refresh(); }
});

$("btn-chal-draw").addEventListener("click", () => {
  pending = randomChallenge($("chal-type").value);
  renderChallengePreview(pending, true);
  setLive(TF("chal_drawn", { title: pending.title }), "var(--gold)");
});

$("btn-chal-send").addEventListener("click", async () => {
  const ch = pending || state.challenge;
  if (!ch) { setLive(T("chal_draw_first"), "var(--err)"); return; }
  const r = await postBoard("challenge", { challenge: ch });
  if (r.ok) { setLive(T("chal_sent"), "var(--ok)"); pending = null; refresh(); }
});

$("btn-chal-stop").addEventListener("click", async () => {
  const r = await postBoard("clear");
  if (r.ok) { setLive(T("chal_stopped"), "var(--err)"); refresh(); }
});

/* ---------- Suivi des équipes sur la carte ---------- */
const TEAM_COLORS = ["#c33c3c", "#2f6fd0", "#0c8f4f", "#8a4baf", "#d9822b", "#0a6b3c", "#b0327c", "#556b2f"];
let projData = null;
let finishedTeams = [];
let lastPositions = [];
let lastUrgencies = [];
let lastValidations = {};
let modeState = null;
let knownUrgency = {};
let alarmCtx = null;
let urgencyReady = false;

function playUrgencyAlarm() {
  try {
    if (!alarmCtx) alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (alarmCtx.state === "suspended") alarmCtx.resume();
    const now = alarmCtx.currentTime;
    [0, 0.3, 0.6].forEach((t) => {
      const osc = alarmCtx.createOscillator();
      const gain = alarmCtx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.3, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.28);
      osc.connect(gain).connect(alarmCtx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.3);
    });
  } catch (e) { /* silencieux */ }
}

function urgencyKey(u) {
  return String(u.team || "").toLowerCase() + "|" + (u.type || "");
}

function renderUrgencyBanner(list) {
  const b = $("urgency-banner");
  const card = $("urgency-card");
  if (!b || !card) return;
  if (list.length) {
    b.classList.remove("hidden");
    b.textContent = TF("urg_banner", { n: list.length });
  } else {
    b.classList.add("hidden");
  }
  card.style.borderColor = list.length ? "var(--err)" : "";
}

function renderUrgencies(list) {
  const groups = $("urgency-groups");
  const status = $("urgency-status");
  const lost = list.filter((u) => u.type !== "emergency" && u.type !== "message");
  const emerg = list.filter((u) => u.type === "emergency");
  const msgs = list.filter((u) => u.type === "message");
  renderUrgencyBanner(list);
  if (!list.length) {
    status.textContent = T("urg_status_empty");
    groups.innerHTML = '<p class="empty">' + esc(T("urg_empty")) + "</p>";
    return;
  }
  status.textContent = TF("urg_summary", { e: emerg.length, l: lost.length, m: msgs.length ? TF("urg_msgs", { n: msgs.length }) : "" }) + ".";
  groups.innerHTML = "";
  const section = (label, cls, items) => {
    if (!items.length) return;
    const wrap = document.createElement("div");
    wrap.className = "urgency-group";
    const h = document.createElement("h3");
    h.textContent = label;
    wrap.appendChild(h);
    const ul = document.createElement("div");
    ul.className = "urgency-list";
    items.forEach((u) => {
      const row = document.createElement("div");
      row.className = "urgency-item " + cls;
      const b = document.createElement("b");
      if (u.type === "message") {
        b.textContent = "✉️ " + (u.message || T("urg_msg_empty")) + " — " + (u.team || "?");
      } else {
        b.textContent = (u.type === "emergency" ? "🚨 " : "❓ ") + (u.team || "?");
      }
      row.appendChild(b);
      const small = document.createElement("small");
      small.textContent = (u.lat && u.lng) ? "📍 " + u.lat.toFixed(5) + ", " + u.lng.toFixed(5) : T("urg_pos_unknown");
      row.appendChild(small);
      if (u.type === "message" && u.messageOrig && u.lang && u.lang !== "fr" && u.messageOrig.trim() !== (u.message || "").trim()) {
        const orig = document.createElement("small");
        orig.textContent = TF("urg_orig", { lang: u.lang.toUpperCase(), text: u.messageOrig });
        orig.style.color = "var(--text-muted)";
        row.appendChild(orig);
      }
      if (u.lat && u.lng) {
        const map = document.createElement("a");
        map.className = "btn btn-ghost";
        map.href = "https://www.google.com/maps?q=" + u.lat + "," + u.lng;
        map.target = "_blank";
        map.rel = "noopener";
        map.textContent = T("urg_map_btn");
        row.appendChild(map);
      }
      const done = document.createElement("button");
      done.className = "btn btn-primary";
      done.textContent = T("urg_resolve_btn");
      done.addEventListener("click", async () => {
        try {
          await fetch("/api/urgency/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: u.team }),
          });
          window.HermesToast(TF("urg_resolved", { team: u.team }));
          await refreshUrgency();
        } catch (e) { window.HermesToast(T("urg_fail")); }
      });
      row.appendChild(done);
      ul.appendChild(row);
    });
    wrap.appendChild(ul);
    groups.appendChild(wrap);
  };
  section(T("urg_section_emerg"), "emergency", emerg);
  section(T("urg_section_lost"), "lost", lost);
  section(T("urg_section_msg"), "message", msgs);
}

async function refreshUrgency() {
  try {
    const res = await fetch("/api/urgency");
    const data = await res.json();
    const list = data.urgencies || [];
    const seen = {};
    list.forEach((u) => {
      const k = urgencyKey(u);
      seen[k] = true;
      if (urgencyReady && !knownUrgency[k]) playUrgencyAlarm();
    });
    urgencyReady = true;
    knownUrgency = seen;
    lastUrgencies = list;
    renderUrgencies(list);
    if (lastPositions.length) drawPosMap(lastPositions);
  } catch (e) { /* silencieux */ }
}

function fmtTime(s) {
  s = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(sec).padStart(2, "0");
  return h > 0 ? h + "h" + mm + "m" + ss + "s" : mm + ":" + ss;
}
function isFinished(name) {
  return finishedTeams.some((f) => String(f.team || "").toLowerCase() === String(name || "").toLowerCase());
}

function computeProj() {
  const xs = BALISES.map((b) => b.x), ys = BALISES.map((b) => b.y);
  const lats = BALISES.map((b) => b.lat), lngs = BALISES.map((b) => b.lng);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    proj: (lat, lng) => ({
      x: minX + (lat - minLat) / (maxLat - minLat) * (maxX - minX),
      y: minY + (lng - minLng) / (maxLng - minLng) * (maxY - minY),
    }),
  };
}

function drawPosMap(positions) {
  const svg = $("pos-map");
  if (!svg) return;
  if (!projData) projData = computeProj();
  const parts = [];
  parts.push('<rect class="map-bg" x="0" y="0" width="480" height="620" rx="18"/>');
  const d = TRAIL.path.map(([x, y], i) => (i ? "L" : "M") + x + " " + y).join(" ");
  parts.push('<path class="map-trail" d="' + d + '"/>');
  BALISES.forEach((b, i) => {
    parts.push('<circle cx="' + b.x + '" cy="' + b.y + '" r="9" fill="#9fb3a8"/>');
    parts.push('<text x="' + b.x + '" y="' + (b.y + 5) + '" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">' + (i + 1) + "</text>");
  });
  positions.forEach((t, i) => {
    const c = projData.proj(t.lat, t.lng);
    const col = TEAM_COLORS[i % TEAM_COLORS.length];
    const fin = isFinished(t.team);
    parts.push(
      '<g><circle cx="' + c.x + '" cy="' + c.y + '" r="16" fill="none" stroke="' + col + '" stroke-width="2" opacity="0.5"/>' +
      '<circle cx="' + c.x + '" cy="' + c.y + '" r="9" fill="' + col + '" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + c.x + '" y="' + (c.y + 28) + '" text-anchor="middle" font-weight="800" font-size="12" fill="#12302a" paint-order="stroke" stroke="#fff" stroke-width="4">' + (fin ? "🏁 " : "") + esc(t.team) + "</text></g>"
    );
  });
  lastUrgencies.forEach((u) => {
    if (!(u.lat && u.lng)) return;
    const c = projData.proj(u.lat, u.lng);
    const em = u.type === "emergency" ? "🚨" : (u.type === "message" ? "✉️" : "❓");
    const fill = u.type === "emergency" ? "#ff3b30" : (u.type === "message" ? "#5856d6" : "#ff9500");
    const lbl = u.type === "emergency" ? "SECOURS" : (u.type === "message" ? "MSG" : "PERDU");
    parts.push(
      '<g><circle class="urg-ring" cx="' + c.x + '" cy="' + c.y + '" r="18" fill="none" stroke="' + fill + '" stroke-width="3"/>' +
      '<circle cx="' + c.x + '" cy="' + c.y + '" r="11" fill="' + fill + '" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + c.x + '" y="' + (c.y + 4) + '" text-anchor="middle" font-size="12">' + em + '</text>' +
      '<text x="' + c.x + '" y="' + (c.y + 34) + '" text-anchor="middle" font-weight="800" font-size="11" fill="' + fill + '" paint-order="stroke" stroke="#fff" stroke-width="4">' + lbl + ' · ' + esc(u.team) + "</text></g>"
    );
  });
  svg.innerHTML = parts.join("");
}

function renderPosChips(list) {
  const pl = $("pos-list");
  pl.innerHTML = "";
  list.forEach((t, i) => {
    const col = TEAM_COLORS[i % TEAM_COLORS.length];
    const chip = document.createElement("span");
    chip.className = "pos-chip";
    chip.innerHTML = '<span class="pos-dot" style="background:' + col + '"></span>' + (isFinished(t.team) ? "🏁 " : "") + esc(t.team) + " <small>(" + esc(t.at || "") + ")</small>";
    const kick = document.createElement("button");
    kick.type = "button";
    kick.className = "kick-btn";
    kick.title = TF("pos_kick_title", { team: t.team });
    kick.textContent = "⏻";
    kick.addEventListener("click", async () => {
      if (!confirm(TF("pos_kick_confirm", { team: t.team }))) return;
      const r = await postBoard("logout", { team: t.team });
      if (r.ok) window.HermesToast(TF("pos_kicked", { team: t.team }));
    });
    chip.appendChild(kick);
    pl.appendChild(chip);
  });
}

let lastStatuses = [];
function hmsToSec(s) {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(s || ""));
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : null;
}
function ageSec(hms) {
  const v = hmsToSec(hms);
  if (v == null) return null;
  const n = new Date();
  const u = n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds();
  let d = u - v;
  if (d < -43200) d += 86400;
  return d;
}
function hav(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function teamCoords(name) {
  const k = String(name || "").toLowerCase();
  const st = lastStatuses.find((s) => String(s.team || "").toLowerCase() === k);
  const po = lastPositions.find((s) => String(s.team || "").toLowerCase() === k);
  const src = po && Number(po.lat) ? po : (st && Number(st.lat) ? st : null);
  return src ? { lat: Number(src.lat), lng: Number(src.lng) } : null;
}

async function refreshPos() {
  try {
    const res = await fetch("/api/pos");
    const data = await res.json();
    const list = data.positions || [];
    lastPositions = list;
    lastStatuses = data.statuses || [];
    drawPosMap(list);
    $("pos-status").textContent = list.length
      ? TF("pos_visible", { n: list.length })
      : T("pos_none");
    renderPosChips(list);
    renderFamilies();
  } catch (e) { /* silencieux */ }
}

/* ---------- Familles : connexion & appareils ---------- */
function renderFamilies() {
  const box = $("fam-list");
  if (!box) return;
  const teams = new Map();
  const add = (name) => {
    const k = String(name || "").toLowerCase();
    if (k && !teams.has(k)) teams.set(k, { name: name });
  };
  Object.keys(lastValidations || {}).forEach((k) => add(k));
  (lastStatuses || []).forEach((s) => add(s.team));
  lastPositions.forEach((p) => add(p.team));
  finishedTeams.forEach((f) => add(f.team));
  const list = Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const status = $("fam-status");
  if (!list.length) {
    box.innerHTML = '<p class="empty">' + esc(T("fam_empty")) + "</p>";
    status.textContent = T("fam_wait");
    return;
  }
  status.textContent = TF("fam_n", { n: list.length });
  box.innerHTML = "";
  list.forEach((tm, i) => {
    const k = tm.name.toLowerCase();
    const st = (lastStatuses || []).find((s) => String(s.team || "").toLowerCase() === k) || {};
    const done = new Set(lastValidations[tm.name] || lastValidations[k] || []);
    const fin = isFinished(tm.name);
    const age = ageSec(st.seen);
    const stale = age == null || age > 180;
    const card = document.createElement("div");
    card.className = "fam-card" + (stale ? " fam-stale" : "");
    const col = TEAM_COLORS[i % TEAM_COLORS.length];
    const parts = [];
    parts.push('<span class="fam-name"><span class="pos-dot" style="background:' + col + '"></span>' + (fin ? "🏁 " : "") + esc(tm.name) + "</span>");
    parts.push('<span class="fam-tags">');
    const onl = Number(st.onl);
    parts.push('<span class="fam-tag ' + (onl === 1 ? "ok" : (onl === 0 ? "ko" : "")) + '">' +
      (onl === 1 ? T("fam_online") : (onl === 0 ? T("fam_offline") : "📶 —")) +
      (st.net ? TF("fam_net", { net: esc(st.net) }) : "") + "</span>");
    if (st.bat != null && st.bat !== "") {
      parts.push('<span class="fam-tag">' + curIco("battery") + ' ' + esc(String(st.bat)) + " %" + (st.chg ? " ⚡" : "") + "</span>");
    } else {
      parts.push('<span class="fam-tag">' + curIco("battery") + ' —</span>');
    }
    const cam = String(st.cam || "");
    parts.push('<span class="fam-tag ' + (cam === "granted" ? "ok" : (cam === "denied" ? "ko" : "")) + '">' +
      (cam === "granted" ? T("fam_cam_ok") : (cam === "denied" ? T("fam_cam_no") : (cam === "prompt" ? T("fam_cam_ask") : "📷 —"))) + "</span>");
    if (st.acc != null && st.acc !== "") {
      parts.push('<span class="fam-tag">' + curIco("gps") + ' ±' + esc(String(st.acc)) + " m" + (st.posAt ? " (" + esc(st.posAt) + ")" : "") + "</span>");
    } else {
      parts.push('<span class="fam-tag">' + curIco("gps") + ' —</span>');
    }
    parts.push('<span class="fam-tag">' + curIco("check") + ' ' + done.size + "/" + BALISES.length + "</span>");
    if (st.seen) parts.push('<span class="fam-tag">' + curIco("observation") + ' ' + TF("fam_seen", { t: esc(st.seen) }) + "</span>");
    parts.push("</span>");
    card.innerHTML = parts.join("");
    const kick = document.createElement("button");
    kick.type = "button";
    kick.className = "kick-btn";
    kick.title = TF("pos_kick_title", { team: tm.name });
    kick.textContent = "⏻";
    kick.addEventListener("click", async () => {
      if (!confirm(TF("pos_kick_confirm", { team: tm.name }))) return;
      const r = await postBoard("logout", { team: tm.name });
      if (r.ok) window.HermesToast(TF("pos_kicked", { team: tm.name }));
    });
    card.appendChild(kick);
    box.appendChild(card);
  });
}

function renderFinishList() {
  const box = $("finish-list");
  const status = $("finish-status");
  if (!finishedTeams.length) {
    box.innerHTML = '<p class="empty">' + esc(T("fin_empty")) + "</p>";
    status.textContent = T("fin_status_empty");
    return;
  }
  status.textContent = TF("fin_status", { n: finishedTeams.length });
  box.innerHTML = "";
  finishedTeams.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "finish-item";
    const rank = document.createElement("span");
    rank.className = "finish-rank";
    rank.textContent = i + 1;
    const name = document.createElement("b");
    name.textContent = t.team || "?";
    row.appendChild(rank);
    row.appendChild(name);
    const st = document.createElement("span");
    st.className = "finish-stat";
    st.innerHTML = "⭐ " + (t.stars || 0) + " · " + curIco("timer") + " " + fmtTime(t.seconds || 0);
    row.appendChild(st);
    const det = document.createElement("small");
    det.textContent = "🏁 " + (t.balises || 0) + "/" + BALISES.length;
    row.appendChild(det);
    if (t.selfie) {
      const si = document.createElement("img");
      si.className = "finish-selfie";
      si.src = t.selfie;
      si.alt = t.team || "selfie";
      row.appendChild(si);
    } else {
      const se = document.createElement("span");
      se.className = "finish-selfie-empty";
      se.textContent = "🙂";
      row.appendChild(se);
    }
    if (t.message) {
      const m = document.createElement("p");
      m.className = "finish-msg";
      m.textContent = "« " + t.message + " »";
      row.appendChild(m);
    }
    box.appendChild(row);
  });
}

async function refreshFinish() {
  try {
    const res = await fetch("/api/finish");
    const data = await res.json();
    finishedTeams = (data.finishes || []).slice().sort((a, b) => (b.stars - a.stars) || (a.seconds - b.seconds));
    renderFinishList();
    if (lastPositions.length) {
      drawPosMap(lastPositions);
      renderPosChips(lastPositions);
    }
  } catch (e) { /* silencieux */ }
}

/* ---------- Serveur : modes Local / Internet ---------- */
function renderMode() {
  if (!modeState) return;
  const localCb = $("mode-local");
  const intCb = $("mode-internet");
  if (!localCb || !intCb) return;
  localCb.checked = !!modeState.local;
  intCb.checked = !!modeState.internet;
  const st = $("mode-status");
  const status = modeState.tunnelStatus;
  if (status === "on") {
    st.textContent = T("srv_tunnel_on");
    st.style.color = "var(--ok)";
  } else if (status === "starting") {
    st.textContent = T("srv_tunnel_starting");
    st.style.color = "var(--gold)";
  } else if (status === "error") {
    st.textContent = TF("srv_tunnel_err", { err: modeState.tunnelError || T("unknown_err") });
    st.style.color = "var(--err)";
  } else {
    st.textContent = modeState.internet
      ? T("srv_int_pending")
      : T("srv_local_active");
    st.style.color = "var(--text-muted)";
  }
  $("mode-lan-url").textContent = modeState.lanUrl || "—";
  const tunBox = $("mode-tun-box");
  if (modeState.tunnelUrl) {
    tunBox.style.display = "";
    $("mode-tun-url").textContent = modeState.tunnelUrl;
  } else {
    tunBox.style.display = "none";
  }
  const errEl = $("mode-tun-error");
  errEl.textContent = (modeState.internet && !modeState.tunnelUrl && status !== "starting") ? T("srv_tunnel_tip") : "";
  errEl.style.color = "var(--text-muted)";
  renderGameQr();
}

async function refreshMode() {
  try {
    const res = await fetch("/api/server-mode");
    const data = await res.json();
    modeState = data;
    renderMode();
  } catch (e) { /* silencieux */ }
}

async function setMode(key, val) {
  const next = Object.assign({ local: true, internet: false }, modeState || {});
  next[key] = !!val;
  if (!next.local && !next.internet) {
    window.HermesToast(T("srv_need_one"));
    renderMode();
    return;
  }
  try {
    const res = await fetch("/api/server-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const j = await res.json();
    if (j && j.local != null) {
      modeState = j;
      window.HermesToast(next.internet ? T("srv_int_on") : T("srv_int_off"));
      renderMode();
    } else {
      window.HermesToast(T("srv_refused"));
      await refreshMode();
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

function copyUrl(url, what) {
  if (!url) return;
  const done = () => window.HermesToast(TF("srv_copied", { what }));
  const fail = () => { window.prompt(T("copy_addr"), url); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(fail);
  } else {
    fail();
  }
}

$("mode-local").addEventListener("change", (e) => setMode("local", e.target.checked));
$("mode-internet").addEventListener("change", (e) => setMode("internet", e.target.checked));
$("btn-copy-lan").addEventListener("click", () => copyUrl($("mode-lan-url").textContent, T("srv_copy_lan")));
$("btn-copy-tun").addEventListener("click", () => copyUrl($("mode-tun-url").textContent, T("srv_copy_int")));
$("btn-wifi-save").addEventListener("click", saveWifi);
$("btn-wifi-detect").addEventListener("click", detectWifi);
$("btn-wifi-edit").addEventListener("click", () => { location.href = "/editeur"; });

/* ---------- Validations de balises par équipe ---------- */
function renderValidations() {
  const box = $("val-list");
  const status = $("val-status");
  const teams = new Map();
  Object.keys(lastValidations || {}).forEach((k) => {
    teams.set(String(k).toLowerCase(), { name: k, done: new Set(lastValidations[k] || []) });
  });
  lastPositions.forEach((t) => {
    const k = String(t.team || "").toLowerCase();
    if (k && !teams.has(k)) teams.set(k, { name: t.team, done: new Set() });
  });
  finishedTeams.forEach((f) => {
    const k = String(f.team || "").toLowerCase();
    if (k && !teams.has(k)) teams.set(k, { name: f.team, done: new Set() });
  });
  const list = Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  if (!list.length) {
    box.innerHTML = '<p class="empty">' + esc(T("val_empty")) + "</p>";
    status.textContent = T("val_note");
    return;
  }
  status.textContent = TF("val_status", { n: list.length });
  box.innerHTML = "";
  list.forEach((tm) => {
    const div = document.createElement("div");
    div.className = "val-team";
    const head = document.createElement("div");
    head.className = "val-team-head";
    const b = document.createElement("b");
    b.textContent = tm.name;
    const small = document.createElement("small");
    small.innerHTML = curIco("check") + " " + tm.done.size + "/" + BALISES.length;
    head.appendChild(b);
    head.appendChild(small);
    div.appendChild(head);
    const chips = document.createElement("div");
    chips.className = "val-chips";
    BALISES.forEach((bb) => {
      const isOn = tm.done.has(bb.id);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "val-chip" + (isOn ? " on" : "");
      chip.textContent = bb.id;
      chip.title = (bb.label || bb.id) + " — " + (isOn ? T("val_on") : T("val_off"));
      chip.addEventListener("click", () => openValModes(div, tm.name, bb, isOn));
      chips.appendChild(chip);
    });
    div.appendChild(chips);
    box.appendChild(div);
  });
}

/* ---------- Modes de validation à distance ---------- */
let openValKey = null;
function normCode(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}
function closeValMenus() {
  document.querySelectorAll(".val-modes").forEach((el) => el.remove());
  openValKey = null;
}
function openValModes(teamDiv, team, balise, isOn) {
  const key = team.toLowerCase() + "/" + balise.id;
  const had = openValKey === key;
  closeValMenus();
  if (had) return;
  openValKey = key;
  const menu = document.createElement("div");
  menu.className = "val-modes";
  const label = document.createElement("span");
  label.className = "vm-label";
  label.textContent = TF("val_mode_title", { id: balise.id });
  menu.appendChild(label);
  const mkBtn = (txt, fn, cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vm-btn" + (cls ? " " + cls : "");
    b.textContent = txt;
    b.addEventListener("click", fn);
    return b;
  };
  if (!isOn) {
    menu.appendChild(mkBtn(T("vm_manual"), async () => { closeValMenus(); await toggleBalise(team, balise.id, true); }, ""));
    menu.appendChild(mkBtn(T("vm_gps"), () => validateByGps(team, balise), ""));
    menu.appendChild(mkBtn(T("vm_q"), () => showValQuestion(menu, team, balise), ""));
    menu.appendChild(mkBtn(T("vm_code"), () => validateByCode(team, balise), ""));
  } else {
    menu.appendChild(mkBtn(T("vm_remove"), async () => { closeValMenus(); window.HermesToast(TF("val_removed", { id: balise.id })); await toggleBalise(team, balise.id, false); }, "danger"));
  }
  const cancel = mkBtn("✕", () => closeValMenus(), "danger");
  menu.appendChild(cancel);
  teamDiv.appendChild(menu);
}
function showValQuestion(menu, team, balise) {
  let qbox = menu.querySelector(".val-qbox");
  if (qbox) { qbox.remove(); return; }
  qbox = document.createElement("div");
  qbox.className = "val-qbox";
  const e = getEnigme(balise, "facile") || {};
  const answers = Array.isArray(e.reponses) ? e.reponses.join(", ") : "";
  qbox.innerHTML = "<b>" + esc(TF("vm_q_title", { id: balise.id })) + "</b><br>" +
    esc(e.text || "") + "<br><small>" + esc(TF("vm_q_answers", { a: answers })) + "</small>";
  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "vm-btn";
  ok.style.marginTop = "6px";
  ok.textContent = T("vm_q_validate");
  ok.addEventListener("click", async () => {
    closeValMenus();
    await toggleBalise(team, balise.id, true);
  });
  qbox.appendChild(ok);
  menu.appendChild(qbox);
}
function validateByGps(team, balise) {
  const c = teamCoords(team);
  if (!c) { window.HermesToast(T("vm_gps_nopos")); return; }
  const rBase = Number(balise.radius) > 0 ? Number(balise.radius) : (Number(SITE.proximityRadius) > 0 ? Number(SITE.proximityRadius) : 12);
  const r = rBase + 15;
  const d = hav(c.lat, c.lng, Number(balise.lat), Number(balise.lng));
  if (d <= r) {
    window.HermesToast("🛰️ " + TF("vm_gps_ok", { d: Math.round(d) }));
    closeValMenus();
    toggleBalise(team, balise.id, true);
  } else {
    window.HermesToast("❌ " + TF("vm_gps_far", { d: Math.round(d), r: Math.round(r) }));
  }
}
function validateByCode(team, balise) {
  const c = window.prompt(TF("vm_code_prompt", { id: balise.id }), "");
  if (c == null) return;
  if (normCode(c) === normCode(balise.code)) {
    closeValMenus();
    toggleBalise(team, balise.id, true);
  } else {
    window.HermesToast(T("vm_code_bad"));
  }
}

/* ---------- QR d'accès : Wi-Fi (1) puis jeu (2) ---------- */
let wifiState = { ssid: "", password: "", security: "WPA" };
let mapState = { url: "" };

function wifiQrPayload(ssid, pass, sec) {
  const escWifi = (s) => String(s || "").replace(/([\\;,:"])/g, "\\$1");
  if (sec === "nopass") return "WIFI:T:nopass;S:" + escWifi(ssid) + ";;";
  return "WIFI:T:" + sec + ";S:" + escWifi(ssid) + ";P:" + escWifi(pass) + ";;";
}

function makeQr(el, data) {
  if (!el) return;
  el.innerHTML = "";
  el.classList.remove("empty");
  if (!data || !data.trim() || typeof qrcode !== "function") {
    el.classList.add("empty");
    el.textContent = "—";
    return;
  }
  try {
    const qr = qrcode(0, "M");
    qr.addData(data);
    qr.make();
    el.innerHTML = qr.createSvgTag(3, 2);
  } catch (e) {
    el.classList.add("empty");
    el.textContent = T("qr_unavailable");
  }
}

function renderWifi() {
  const ssidEl = $("wifi-ssid");
  if (!ssidEl) return;
  ssidEl.value = wifiState.ssid || "";
  $("wifi-pass").value = wifiState.password || "";
  $("wifi-sec").value = ["WPA", "WEP", "nopass"].indexOf(wifiState.security) !== -1 ? wifiState.security : "WPA";
  const note = $("wifi-note");
  if (wifiState.ssid) {
    makeQr($("qr-wifi"), wifiQrPayload(wifiState.ssid, wifiState.password, wifiState.security));
    note.textContent = TF("wifi_qr_shown", { ssid: wifiState.ssid });
  } else {
    makeQr($("qr-wifi"), "");
    note.textContent = T("wifi_note");
  }
  renderGameQr();
}

function effectiveGameUrl() {
  if (modeState) {
    if (modeState.internet && modeState.tunnelUrl) return modeState.tunnelUrl;
    if (modeState.lanUrl) return modeState.lanUrl;
  }
  return "";
}

function renderGameQr() {
  const url = effectiveGameUrl();
  makeQr($("qr-game"), url);
  const cap = $("qr-game-url");
  cap.textContent = url ? url : T("game_url_unavailable");
}

async function refreshMap() {
  try {
    const res = await fetch("/api/map");
    const data = await res.json();
    if (data) {
      mapState = { url: data.url || "" };
      renderMapField();
    }
  } catch (e) { /* silencieux */ }
}

async function saveMap() {
  const url = ($("map-url").value || "").trim();
  try {
    const res = await fetch("/api/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const j = await res.json();
    if (j && j.ok) {
      mapState = { url: j.url || "" };
      window.HermesToast(url ? T("map_saved") : T("map_deleted"));
      renderMapField();
    } else {
      window.HermesToast(T("save_refused"));
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

function renderMapField() {
  const el = $("map-url");
  if (el) el.value = mapState.url || "";
  const note = $("map-note");
  if (note) note.textContent = mapState.url ? TF("map_active", { url: mapState.url }) : T("map_none");
}

async function refreshWifi() {
  try {
    const res = await fetch("/api/wifi");
    const data = await res.json();
    if (data) {
      wifiState = { ssid: data.ssid || "", password: data.password || "", security: data.security || "WPA" };
      renderWifi();
    }
  } catch (e) { /* silencieux */ }
}

async function detectWifi() {
  const btn = $("btn-wifi-detect");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = T("wifi_detecting");
  try {
    const res = await fetch("/api/wifi/detect");
    const j = await res.json();
    if (j && j.detected && j.ssid) {
      const ssidEl = $("wifi-ssid");
      ssidEl.value = j.ssid;
      const note = $("wifi-note");
      note.textContent = TF("wifi_detected", { ssid: j.ssid, sig: j.signal ? " (signal " + j.signal + ")" : "" });
      window.HermesToast(TF("wifi_ssid_detected", { ssid: j.ssid }));
    } else {
      window.HermesToast(T("wifi_no_detect"));
    }
  } catch (e) {
    window.HermesToast(T("wifi_detect_fail"));
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

async function saveWifi() {
  const ssid = ($("wifi-ssid").value || "").trim();
  const password = $("wifi-pass").value || "";
  const security = $("wifi-sec").value || "WPA";
  if (!ssid) { window.HermesToast(T("wifi_need_ssid")); return; }
  try {
    const res = await fetch("/api/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid, password, security }),
    });
    const j = await res.json();
    if (j && j.ok) {
      wifiState = { ssid: j.ssid || "", password, security };
      window.HermesToast(TF("wifi_saved", { ssid: j.ssid || "" }));
      renderWifi();
    } else {
      window.HermesToast(T("save_refused"));
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

/* ---------- Export des QR d'accès (PDF / JPEG / imprimer / mail) ---------- */
function qrCanvas(data, size) {
  const cv = document.createElement("canvas");
  cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
  if (!data || !data.trim() || typeof qrcode !== "function") return cv;
  try {
    const qr = qrcode(0, "M");
    qr.addData(data); qr.make();
    const n = qr.getModuleCount();
    const quiet = 4;
    const cell = Math.max(1, Math.floor(size / (n + quiet * 2)));
    const pad = Math.floor((size - cell * n) / 2);
    ctx.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell);
    }
  } catch (e) { /* QR indisponible : canvas blanc */ }
  return cv;
}

function shortenUrl(s, max) {
  s = String(s || "");
  if (s.length <= max) return s;
  return s.slice(0, Math.floor(max / 2)) + "…" + s.slice(-Math.floor(max / 2));
}

function buildPosterCanvas() {
  const W = 1240, H = 1754;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0c3b2e"; ctx.fillRect(0, 0, W, 220);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 62px Arial, sans-serif";
  ctx.fillText(T("poster_title"), W / 2, 125);
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(T("poster_sub"), W / 2, 182);
  const qrSize = 460, gap = 60, startY = 330;
  const leftX = (W - qrSize * 2 - gap) / 2;
  const rightX = leftX + qrSize + gap;
  const q1 = qrCanvas(wifiQrPayload(wifiState.ssid, wifiState.password, wifiState.security), qrSize);
  ctx.drawImage(q1, leftX, startY);
  ctx.fillStyle = "#0c3b2e";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText(T("poster_wifi"), leftX + qrSize / 2, startY + qrSize + 60);
  ctx.font = "34px Arial, sans-serif";
  ctx.fillText(shortenUrl(wifiState.ssid, 30), leftX + qrSize / 2, startY + qrSize + 118);
  const url = effectiveGameUrl();
  const q2 = qrCanvas(url, qrSize);
  ctx.drawImage(q2, rightX, startY);
  ctx.fillStyle = "#0c3b2e";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText(T("poster_game"), rightX + qrSize / 2, startY + qrSize + 60);
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(shortenUrl(url, 40), rightX + qrSize / 2, startY + qrSize + 118);
  ctx.fillStyle = "#666";
  ctx.font = "26px Arial, sans-serif";
  ctx.fillText(T("poster_footer"), W / 2, H - 60);
  return cv;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function buildPdfBlob(posterCanvas) {
  const jpeg = posterCanvas.toDataURL("image/jpeg", 0.92);
  const bin = atob(jpeg.split(",")[1]);
  const imgBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) imgBytes[i] = bin.charCodeAt(i);
  const W = posterCanvas.width, H = posterCanvas.height;
  const pageW = 595.28, pageH = 841.89, margin = 24;
  const scale = Math.min((pageW - 2 * margin) / W, (pageH - 2 * margin) / H);
  const dw = W * scale, dh = H * scale;
  const x = (pageW - dw) / 2, y = (pageH - dh) / 2;
  const content = "q " + dw + " 0 0 " + dh + " " + x + " " + y + " cm /Im0 Do Q";
  const obj = (n, body) => n + " 0 obj\n" + body + "\nendobj\n";
  const units = [];
  const push = (s) => { for (let i = 0; i < s.length; i++) units.push(s.charCodeAt(i)); };
  push("%PDF-1.4\n");
  const offsets = [0, 0, 0, 0, 0, 0];
  offsets[1] = units.length; push(obj(1, "<< /Type /Catalog /Pages 2 0 R >>"));
  offsets[2] = units.length; push(obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  offsets[3] = units.length; push(obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageW + " " + pageH + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"));
  offsets[4] = units.length;
  push(obj(4, "<< /Type /XObject /Subtype /Image /Width " + W + " /Height " + H + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + imgBytes.length + " >>\nstream\n"));
  for (let i = 0; i < imgBytes.length; i++) units.push(imgBytes[i]);
  push("\nendstream\n");
  offsets[5] = units.length;
  push(obj(5, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"));
  const xrefPos = units.length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) push(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF");
  const bytes = new Uint8Array(units.length);
  for (let i = 0; i < units.length; i++) bytes[i] = units[i] & 0xFF;
  return new Blob([bytes], { type: "application/pdf" });
}

function exportPdf() {
  if (!wifiState.ssid) { window.HermesToast(T("need_wifi_first")); return; }
  downloadBlob(buildPdfBlob(buildPosterCanvas()), "Curi-QR-acces.pdf");
  window.HermesToast(T("pdf_dl"));
}

function exportJpeg() {
  if (!wifiState.ssid) { window.HermesToast(T("need_wifi_first")); return; }
  const a = document.createElement("a");
  a.href = buildPosterCanvas().toDataURL("image/jpeg", 0.92);
  a.download = "Curi-QR-acces.jpg";
  document.body.appendChild(a); a.click(); a.remove();
  window.HermesToast(T("jpeg_dl"));
}

function qrJpegDataUrl(qrCanvas) {
  return qrCanvas.toDataURL("image/jpeg", 0.92).split(",")[1];
}

async function exportQrToFolder() {
  const files = [];
  const size = 800;
  const url = effectiveGameUrl();
  if (url) {
    files.push({ name: "Curi-acces-connexion.jpg", data: qrJpegDataUrl(qrCanvas(url, size)) });
  }
  if (typeof BALISES !== "undefined" && Array.isArray(BALISES)) {
    for (const b of BALISES) {
      const code = String(b.code || b.id || "");
      if (!code) continue;
      files.push({ name: "Curi-balise-" + String(b.id || code) + ".jpg", data: qrJpegDataUrl(qrCanvas(code, size)) });
    }
  }
  if (files.length === 0) { window.HermesToast(T("qr_folder_need_url")); return; }
  try {
    const res = await fetch("/api/qr/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
    const j = await res.json();
    if (j && j.ok) {
      window.HermesToast(T("qr_folder_ok").replace("{n}", String(j.saved ? j.saved.length : files.length)));
    } else {
      const err = j && j.errors && j.errors.length ? j.errors.join(", ") : T("unknown_err");
      window.HermesToast(T("qr_folder_fail").replace("{err}", err));
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

function printPoster() {
  if (!wifiState.ssid) { window.HermesToast(T("need_wifi_first")); return; }
  const win = window.open("", "_blank", "width=800,height=1100");
  if (!win) { window.HermesToast(T("popup_needed")); return; }
  const img = buildPosterCanvas().toDataURL("image/jpeg", 0.92);
  win.document.write('<!DOCTYPE html><html><head><title>' + esc(T("qr_doc_title")) + '</title><style>body{margin:0}img{width:100%;height:auto}</style></head><body><img src="' + img + '"></body></html>');
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch (e) {} }, 500);
}

async function mailPoster() {
  if (!wifiState.ssid) { window.HermesToast(T("need_wifi_first")); return; }
  const file = new File([buildPdfBlob(buildPosterCanvas())], "Curi-QR-acces.pdf", { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: T("qr_doc_title"), text: T("mail_share_text") });
      return;
    } catch (e) { /* annulé par l'utilisateur */ }
  }
  downloadBlob(file, "Curi-QR-acces.pdf");
  window.HermesToast(T("mail_dl"));
}

async function toggleBalise(team, baliseId, add) {
  try {
    const res = await fetch(add ? "/api/validations" : "/api/validations/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, balise: baliseId }),
    });
    const j = await res.json();
    if (j && j.ok) {
      window.HermesToast((add ? "✅ " : "➖ ") + baliseId + " — " + team);
      await refreshVal();
    } else {
      window.HermesToast(T("val_toggle_fail"));
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

async function addValTeam() {
  const input = $("val-team-input");
  const name = (input.value || "").trim();
  if (!name) { window.HermesToast(T("val_need_name")); return; }
  try {
    const res = await fetch("/api/validations/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: name }),
    });
    const j = await res.json();
    if (j && j.ok) {
      input.value = "";
      window.HermesToast(TF("val_added", { name }));
      await refreshVal();
    } else {
      window.HermesToast(T("val_add_fail"));
    }
  } catch (e) {
    window.HermesToast(T("srv_down"));
  }
}

async function refreshVal() {
  try {
    const res = await fetch("/api/validations");
    const data = await res.json();
    lastValidations = (data && data.validations) || {};
    renderValidations();
  } catch (e) { /* silencieux */ }
}

let lastPacks = null;
function renderPacks() {
  const list = $("packs-list");
  if (!list) return;
  const b = (st) => {
    const lib = { ACTIVE: "Actif", DISABLED: "Désactivé", AVAILABLE: "Disponible", ERROR: "Erreur" };
    return `<span class="parc-badge badge-${esc(st)}">${lib[st] || esc(st)}</span>`;
  };
  if (!lastPacks) {
    list.innerHTML = `<p class="note">${T("packs_empty")}</p>`;
    return;
  }
  const d = lastPacks;
  const sum = $("packs-summary");
  if (sum && d.states) {
    sum.innerHTML = `<span class="parc-sub">${T("packs_summary", { a: d.states.active || 0, d: d.states.disabled || 0, v: d.states.available || 0, e: d.states.error || 0 })}</span>`;
  }
  if (!Array.isArray(d.packs) || !d.packs.length) {
    list.innerHTML = `<p class="note">${T("packs_empty")}</p>`;
    return;
  }
  let out = "";
  for (const pk of d.packs) {
    let ages = "";
    if (pk.audience) {
      if (pk.audience.minAge !== undefined && pk.audience.maxAge !== undefined) ages = `${pk.audience.minAge}–${pk.audience.maxAge} ans`;
      else if (Array.isArray(pk.audience) && pk.audience.length) ages = `${pk.audience[0]}–${pk.audience[1]} ans`;
    }
    const nb = pk.stations ? `${pk.stations} balises` : "";
    const missions = pk.missions ? `${pk.missions} missions` : "";
    const meta = [nb, missions, ages].filter(Boolean).join(" · ");
    out += `<div class="cur-parc-item">`;
    out += `<div class="parc-head"><span class="parc-name">${esc(pk.name)}</span>${b(pk.state)}</div>`;
    if (meta) out += `<div class="parc-sub">${esc(meta)}</div>`;
    if (pk.description) out += `<div class="parc-desc">${esc(pk.description).slice(0, 140)}${pk.description.length > 140 ? "…" : ""}</div>`;
    out += `</div>`;
  }
  list.innerHTML = out;
}
async function refreshPacks() {
  try {
    const res = await fetch("/api/packs", { cache: "no-store" });
    if (!res.ok) throw new Error("http");
    lastPacks = await res.json();
    renderPacks();
  } catch {
    const list = $("packs-list");
    if (list) list.innerHTML = `<p class="note">${T("packs_offline")}</p>`;
  }
}

$("btn-val-add-team").addEventListener("click", addValTeam);
$("val-team-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addValTeam(); });
$("btn-map-save").addEventListener("click", saveMap);

$("btn-qr-export").addEventListener("click", () => {
  const o = $("qr-export-options");
  o.classList.toggle("hidden");
  const note = $("qr-export-note");
  if (note) note.style.display = o.classList.contains("hidden") ? "" : "block";
});
$("btn-qr-pdf").addEventListener("click", exportPdf);
$("btn-qr-jpeg").addEventListener("click", exportJpeg);
$("btn-qr-folder").addEventListener("click", exportQrToFolder);
$("btn-qr-print").addEventListener("click", printPoster);
$("btn-qr-mail").addEventListener("click", mailPoster);

fillTypeSelect();
$("dash-lang").addEventListener("change", (e) => {
  dashLang = e.target.value;
  try { localStorage.setItem("jdp_dash_lang", dashLang); } catch (err) {}
  applyLang();
});
applyLang();
refresh();
refreshPos();
refreshFinish();
refreshUrgency();
refreshVal();
refreshMode();
refreshWifi();
refreshMap();
refreshPacks();
function tickAll() {
  refresh();
  refreshPos();
  refreshFinish();
  refreshUrgency();
  refreshVal();
  refreshMode();
  refreshPacks();
}
setInterval(tickAll, 5000);
setInterval(refreshWifi, 10000);
setInterval(refreshMap, 15000);
