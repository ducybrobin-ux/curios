# AUDIT CURIOS 3.0 — Diagnostic & Plan de mise à niveau

> **Date** : 2026-08-31
> **Dépôt** : https://github.com/ducybrobin-ux/curios (branche `main`)
> **Cadre** : `Optimisation.txt` (PHASE 1 — Audit) + `CURIOS_Audit_et_Plan_Packs_Complet.txt`
> **Principe** : ne rien supprimer sans expliquer, corriger/simplifier/réorganiser progressivement, **source de vérité unique**.
> **État du P0 Bug A** : **corrigé** (voir §5) — validation des réponses réparée + tests.

---

## 0. État du dépôt (mesuré)

| Élément | Constat |
|---|---|
| Paquets modulaires (`packages/`) | 12 : core, content-schema, game-engine, geolocation, offline, pedagogy-engine, server, shared, store, studio, editorial-governance, analytics |
| Pages HTML | 8 : index, catalogue, dashboard, editeur, studio, atelier, debriefing, questionnaire (+ `hub/app.html`, `hub/login.html`) |
| Packs de contenu (`content/packs/`) | 10 : biais-cognitifs, cemea-education-populaire, cosmos-mission-orion, cristaux-de-balto, demo, harcelement-scolaire, metiers-tension, passeur-relais, phantom-cybersecurite, tsle1-ornithologie |
| Modèles `content/curios-parcours/` | 8 (manquent `cristaux-de-balto`, `tsle1-ornithologie`) |
| Tests unitaires | 22 fichiers, **388 tests, tous verts** |
| Pack d'icônes | 49 SVG (`img/icons/`) + sprite + `css/curios-icons.css` — **intégrés au rendu de toutes les surfaces** (catalogue, joueur, hub, studio, editeur, atelier, dashboard) |
| Dépôt | `sw.js`, `js/data.js`, `js/engine.js` **générés ET commités** |

---

## 1. Problèmes critiques (bugs rapportés)

### 🔴 1.1 — Des bonnes réponses ne se valident pas → **CORRIGÉ (P0)**
`packages/game-engine/src/answers.js:21` (répliquée via build dans `js/engine.js:47`) retirait l'article initial **uniquement côté joueur**, jamais côté référence acceptée.

Conséquence (confirmée sur le contenu réel) :
- `content/packs/phantom-cybersecurite/balises/B1.json` (moyen) : référence `"l'urgence artificielle"`, `"l'urgence"` → joueur tapant `"urgence artificielle"` (juste, sans article) → **rejeté**.
- Idem `"la troisième"` → `"troisieme"`, `"l'adresse du site"` → `"adresse du site"`.

Correctif appliqué : retrait symétrique + déterminants élargis (`de la/de l/de/le/la/les/l/un/une/des/du/aux/d`), robustesse des champs `reponses`/`answers`, 10 tests de régression. **388/388 tests verts, lint OK, `js/engine.js` resynchronisé.** Détails §5.

### 🟠 1.2 — Les fiches « ne correspondent pas » / catalogue incomplet
Le catalogue ne lit **que** `js/catalogue-data.js`, qui :
- **n'a aucun champ `description`** (vérifié : 0 occurrence) → la modale « fiche » affiche une description **vide** ;
- n'a ni `ages`/public, ni `theme`, ni `missions`/`nbMissions` (fonction `nbMissions()` définie `js/catalogue.js:45-48` mais **jamais appelée**), ni `environment` (présent, non rendu) ;
- n'a ni `dramatisation`, ni `épreuves`, ni `énigmes`, ni `balises` **au niveau pack** — ces données existent ailleurs : `content/curios-parcours/*.json` (`stations[]`, `missions[*].type:"enigme"`, `audience`, `pedagogy`) et `content/packs/<id>/balises|decouvertes|guide`.

Les fiches proviennent d'une **vue dérivée** (S2 `catalogue-data.js`) décorrélée des packs réels (S3 `content/packs/*` et S4 `curios-parcours`). Cf. doublons §3.

### ✅ 1.3 — Les émojis sont toujours ceux du projet initial
Le pack de 49 SVG (`img/icons/`, `css/curios-icons.css`, sprite `img/curios-icons-sprite.svg`) n'est référencé **que** dans le HTML statique de `catalogue.html`. **Zéro usage dans le JS** : `js/catalogue.js:81-85,122,147,156,160-162,176,191` garde 📍🗺️⏱️🎂🔍✨🧩◆ ; idem `js/app.js:498`, hub, studio (`packages/studio/src/workflow.js:11-67`), atelier, editeur, dashboard, et les émojis de données (`js/catalogue-data.js`, `js/data.js`). Même `catalogue.html:23,68` utilise le 🧭 en texte et non `brand-compass.svg`.

> **Statut (Bug C, step 2 — ⏳ terminé)** : les émojis **structurels 1:1** sont migrés sur **toutes les surfaces** :
> - **Catalogue** : `js/catalogue.js` (helper `ico()`) + `brand-compass.svg` dans `catalogue.html`.
> - **Joueur** (`index.html` + `js/i18n.js`) : les libellés à icône sont rendus via `data-i18n-html` et convertis par `icoify()` à la frontière du dict (`ICON_MAP` : ▶→play, ⚙️→settings, 📍→location, 🗺️→map, 🎙️/🎤→micro, 💡→hint, ✅→check, 🔊→audio, 📷/📸→camera, ⚠️→warning, 📶→offline) ; swaps directs pour les tiles, nav, dict-boutons 🎤, selfie placeholder, kicker ⚙️.
> - **JS joueur** (`js/app.js`) : sites `innerHTML` (timer, offline, warning/check, hint) ; toasts/statuts `textContent` volontairement inchangés.
> - **Hub** : `js/hub-shell.js` (`iconTag`), `js/hub-pages/dashboard.js` (`iconEl`), `js/hub-pages/catalogue.js` ; `hub/app.html` (titres/empty/quick-action Parcours→map, Clients→team, Settings→settings, Lancer le player→play, stat Participants→team).
> - **Studio** : `packages/studio/src/workflow.js` (STEPS) + `studio.html` (`iconOf`).
> - **Outils** : `js/editeur.js`, `js/atelier.js`, `js/dashboard.js` (helper `curIco`) + `editeur.html`, `dashboard.html` (5 libellés passés en `data-i18n-html` + `icoify` dans `js/dashboard.js`), `questionnaire.html` (dict 🎤).
> - **Conservés en émoji** (pas d'équivalent 1:1 ou contenu) : 📊📁📦🎨📅💰📈🎯📔🏆🛠️🗝️🚪💾🗑️✉️📄📤🖼️🚨☎️… et le 🧭 de marque.
> - Vérifications : 388/388 tests unitaires, eslint **0 erreur**, smoke `icoify()` OK. Note : `studio.html` (racine) importe `../packages/studio/src/workflow.js` (résout hors repo, pré-existant, non corrigé).

---

## 2. Fonctions cassées / liens morts

| Problème | Références | Impact |
|---|---|---|
| Liens `../player/*` | `hub/app.html:61-62,193-197`, `js/hub-pages/dashboard.js:72-78` (dossier `player/` inexistant) | Boutons Hub morts |
| URLs sans extension non servies (server statique sans rewrite) | `atelier.html:62→'/editeur'`, `editeur.html:108→'/dashboard'`, `dashboard.html:249→'/editeur'`, `studio.html:234-235`, `app.js:2105,2174`, `catalogue.js:304` | 404 |
| Boutons Hub sans handler | `hub-shell.js:124-133` n'appelle que les `hubAction_*` existants ; seul `hubAction_catalogue` existe. `new-projet`, `new-parcours`, `import-pack`, `new-client`, `new-materiel`, `new-devis`, `save-settings`… | Boutons morts |
| Branche `SKIP_WAITING` morte | `sw.js:88` `skipWaiting()` inconditionnel + `clients.claim()` → `app.js:1630` jamais rejoint | Mise à jour SW non maîtrisée |
| `updateApp()` recharge toujours | `app.js:1638` `location.reload(true)` | Rechargement inutile |

---

## 3. Doublons fonctionnels

**Vérité d'exécution = `js/*` (globales via `<script>`) ; `packages/*` ne servent qu'aux tests Node et ont divergé.**

| Système | Runtime (autorisé) | Package (test-only) | Risque |
|---|---|---|---|
| Persistance | `js/store.js` (clé `jdp_data_v1`) | `packages/store` (clé `curios_data_v1` + migration, comportements différents) | Divergence |
| Accès données | `js/data.js` (globals) | `packages/core/src/data-loader.js` | Divergence |
| Admin overlay | `applyAdminData` inline dans `js/data.js:1610-1745` (**généré**) | `packages/core/src/apply-admin.js` | Logique dupliquée |
| Moteur | `js/engine.js` **généré** | `packages/game-engine/src/*` | OK par design, régénérer |
| Game flow | `js/game-flow.js` **généré** | `packages/game-engine/src/game-flow.js` | ✅ résolu (source unique) |
| Échappement HTML | `esc()` recopié dans **~9 fichiers** | `packages/shared/src/escape.js` | 8 copies alignées sur le canonique |

**Métadonnées de packs — 5 sources non synchronisées** :
1. `content/catalog/packs/*.json` (S1, 10 packs, sans `nbBalises`/`ages`) ;
2. `js/catalogue-data.js` (S2, embarqué, +`nbBalises`, **−`description`**) ;
3. `content/packs/<id>/pack.json` (S3, manifest, `ages` surtout) ;
4. `content/curios-parcours/<id>.json` (S4, modèle v1, 8 packs) ;
5. `js/data.js` (S5, généré).

Incohérences relevées : `cristaux-de-balto` & `tsle1-ornithologie` absents de `content/manifest.json` (donc jamais chargés) mais **précachés dans `sw.js:31,35`** ; `content/catalog/packs.json` **omet `demo`** ; divergences `location`/`description` entre S1 et S2 ; 4 bundles seulement (`content/bundles/`) pour 10 packs → repli hors-ligne impossible pour 6 packs.

---

## 4. UX & architecture

### 4.1 Cinq langages visuels coexistent
| Surface | Système | Migré `cur-*` ? |
|---|---|---|
| `catalogue.html` | tokens + design-system + icons + catalogue.css | ✅ (seul) |
| player & concepteur (`index`, `atelier`, `editeur`, `dashboard`, `questionnaire`) | `styles.css` (palette light propre + `body.night`) | ❌ (0 `cur-*`) |
| `studio.html`, `debriefing.html` | palettes internes (`#0f172a`, `#64ffda`), **sans** design system | ❌ |
| Hub (`hub/app.html`, `hub/login.html`) | `hub.css` (3ᵉ palette `hub-*`) | ❌ |

### 4.2 Navigation fragmentée (4 mécanismes)
Router SPA (`router.js` + `data-go`) × nav multi-fichiers `.html` × hash-router Hub (`#/page`) × boutons topbar concepteur. Séparation des rôles incohérente : le panneau « Administrer » du joueur (`index.html:127-140`) mélange formateur/concepteur ; pas de hub de navigation global Jouer ↔ Catalogue ↔ Hub ↔ Studio.

### 4.3 Risques d'architecture & sécurité
- **Offline/update** : `sw.js:88` `skipWaiting()` inconditionnel ; version de cache codée en dur `packages/offline/src/config.js:12-14` (bump manuel) ; `tools/build-sw.mjs:32` inclut vs `:40` exclut `docs/` (contradiction).
- **Sécurité** : mot de passe organisateur **haché en PBKDF2** (plus d'aucun clair dans `data/auth.json`) ✓ ; 2 stacks d'auth (API PBKDF2 organisateur + Hub PBKDF2, paramètres alignés ✓). Secrets `data/*`, `admin-data.json` **gitignorés, 0 fichier sensible tracké** ✓ ; path traversal protégé ; XSS majoritairement échappé ✓.
- **Gouvernance/versionnage « dead code »** : `packages/editorial-governance` (audit-log, versioning, permissions, signature) **jamais branché au serveur** → pas de vrai journal d'audit persistant.
- **Hygiène** : fichiers générés commités (`js/data.js`, `js/engine.js`, `sw.js`) sans `--check` dans `npm test` ; `content/bundles/*.json` (4) commités et polluent ; packs orphelins (`cristaux-de-balto`, `tsle1`) ; absence de typecheck (pas de TS).

---

## 5. P0 CORRIGÉ — Bug de validation des réponses

**Fichiers modifiés**
- `packages/game-engine/src/answers.js` — comparaison symétrique des articles initiaux, déterminants complets, robustesse `reponses`/`answers` vide.
- `js/engine.js` — **régénéré** via `node tools/build-engine.mjs` (vérifié `--check` OK).
- `tests/unit/game-engine.test.mjs` — +10 tests de régression (reverse-article, pluriels, `de la`, faux positifs, champ vide).

**Vérifications**
- `node --test tests/unit/*.test.mjs` → **388/388 verts**
- `node tools/build-engine.mjs --check` → `OK js/engine.js synchronisé`
- eslint sur les fichiers modifiés → `exit 0`

---

## 6. Audit des packs — grille de complétude (`CURIOS_Audit_et_Plan_Packs_Complet.txt`)

Axes d'audit de chaque pack : **identité · public · pédagogie · connaissances · gameplay · géolocalisation · médias · animateur · joueur · évaluation · qualité · accessibilité · technique**.
Scores attendus : technique /100, pédagogique /100, thématique /100, richesse /100, global /100 — statuts 🟢 PRÊT / 🟡 À COMPLÉTER / 🟠 À RECONSTRUIRE PARTIELLEMENT / 🔴 À REVOIR EN PROFONDEUR.

**Priorité d'enrichissement** (proposée) :
1. Cristaux de Balto (modèle) → 2. Phantom → 3. Ornithologie → 4. Cosmos → 5. Harcèlement scolaire → 6. CEMÉA → 7. Métiers en tension → 8. Biais cognitifs → 9. Passeur-relais. **Le Pack Démo doit être le pack par défaut chargé** et le « tour guidé de toutes les possibilités du moteur » (16 missions : onboarding → balise → énigme → quiz → indices → observation → média → défi → choix → score → accessibilité → offline → pédagogie → animateur → débriefing → retour hub).

> Les 9 packs thématiques sont de **très bonnes bases** ; aucun n'est encore un « Pack Curi🧭s Premium » complet (métadonnées, sources datées, débriefing, variantes, évaluation à compléter).

---

## 7. Plan de correction par priorité

### P0 — Réparer les bugs terrain (en cours / 3/3 fait)
- [x] **Bug A** — validation des réponses (`answers.js`) : **fait**.
- [x] **Bug B** — source de vérité unique des métadonnées de packs + catalogue complet : **fait**.
  - Nouveau générateur `tools/build-catalogue.mjs` (+ `--check`) → régénère `js/catalogue-data.js` depuis `content/catalog/packs/*.json` **+** `content/packs/<id>/pack.json` (public `ages`, version) **+** balises réelles (`balises/*.json`), avec dérivation exacte de `nbBalises`/`nbMissions`/`nbEnigmes` + liste `balises`.
  - La modale (`js/catalogue.js`) affiche désormais **description, thème/milieu, public/âges (rendu `X ans et +`), épreuves, missions, énigmes, liste des épreuves du parcours, métadonnées (version/auteur)** ; `nbMissions()` réactivée ; blocs optionnels `dramatisation`/`public`/`epreuves`/`enigmes` rendus seulement si présents dans la source (copie du modèle gérée, aucune donnée inventée).
  - `catalogue.html` réconcilié : modale `#cat-modal-body` (déterrée), sections/boutons morts retirés. `css/catalogue.css` : ajout `.cat-md-list`.
  - Format de sortie conservé `{ id: "…", nom: "…" }` (clés non quotées) → les parsers regex historiques (tests `e2e-parcours` + rendu offline) restent compatibles.
  - **388/388 tests verts** ; `js/catalogue-data.js` synchronisé (`--check` OK).
- [x] **Bug C** — intégrer le pack d'icônes au rendu JS : **fait sur toutes les surfaces**.
  - Catalogue (`js/catalogue.js` helper `ico()`, `brand-compass.svg`), **joueur** (`js/i18n.js` `icoify()` à la frontière `data-i18n-html` + `index.html`, `js/app.js`), **hub** (`js/hub-shell.js` `iconTag`, `js/hub-pages/dashboard.js` `iconEl`, `js/hub-pages/catalogue.js`, `hub/app.html`), **studio** (`workflow.js` + `studio.html` `iconOf`), **outils** (`js/editeur.js`, `js/atelier.js`, `js/dashboard.js` `curIco`, `editeur.html`, `dashboard.html`, `questionnaire.html`).
  - Mapping 1:1 : ▶→play, ⚙️→settings, 📍→location, 🗺️→map, 🎙️/🎤→micro, 💡→hint, ✅→check, 🔊→audio, 📷/📸→camera, ⚠️→warning, 📶→offline, timer, team, navigation… ; émojis de contenu (📊📁📦🎨📅💰📈🎯…et 🧭 de marque) conservés.
  - **388/388 tests verts ; eslint 0 erreur ; smoke `icoify()` OK**.

### P1 — Doublons & fonctions cassées
- [x] **Hacher le mot de passe organisateur** (`packages/server/src/auth.js`) : fini.
  - Le mot de passe est désormais stocké **haché en PBKDF2** (100 000 itérations, SHA-512, sel aléatoire) — plus jamais en clair dans `data/auth.json`.
  - Migration transparente : un ancien `auth.json` en clair est authentiqué puis **réécrit en hash** dès le premier login réussi ; aucun hash n'est écrit en cas d'échec.
  - Nouveau helper `hasPassword()` (remplace les lectures brutes de `state.password`) ; endpoints `/api/auth/login`, `/api/auth/setup`, `/api/auth/me` et `index.js` mis à jour.
  - **392/392 tests verts** (dont `tests/unit/auth-hash.test.mjs`, 4 nouveaux : stockage hash, rejet mauvais hash, migration clair→hash, non-migration sur échec) ; eslint 0 erreur.
- [x] **Source de vérité unique `packages/*` — bundle game-flow généré + unifier `esc()`** : fait.
  - **Game flow** : logique pur déplacée dans `packages/game-engine/src/game-flow.js` (source de vérité ESM, 9 fonctions). Nouveau générateur `tools/build-game-flow.mjs` (miroir de `build-engine.mjs`) → produit `js/game-flow.js` (IIFE → `window.GameFlow`). `js/game-flow-export.mjs` (maintenu à la main) **supprimé** ; `tests/unit/game-flow.test.mjs` importe désormais depuis `packages/game-engine/src/index.js`. `window.GameFlow` exposé identique (vérifié : 9 clés). CI : étape `node tools/build-game-flow.mjs --check`.
  - **`esc()` unifié** : les 8 copies navigateur (app, board, dashboard, atelier, catalogue, editeur, questionnaire, hub-pages/catalogue) normalisées sur le canonique `packages/shared/src/escape.js` (null-guard + `[&<>"']`). Corrigés les variantes affaiblies : `app.js`/`board.js` (pas de null-guard, `'` non échappé) et `hub-pages/catalogue.js` (`'` manquant). Vérifié : les 8 corps sont désormais identiques à la source de vérité.
  - **394/394 tests verts ; eslint 0 erreur ; tous les générateurs `--check` OK** (build-game-flow, build-engine, build-catalogue).
- [ ] Consolider les 2 stacks d'auth (API PBKDF2 organisateur + Hub multi-user) — hachage déja aligné (`PBKDF2_ITERATIONS`, `KEY_LENGTH`, `DIGEST` identiques).
- [x] **Corriger les liens morts (`../player/*`, sans-extension) + boutons Hub sans handler** : fait.
  - **`../player/*`** (dossier inexistant) → pointent vers les vraies pages à la racine : `hub/app.html` (8 liens) et `js/hub-pages/dashboard.js` (4 liens) → `../studio.html`, `../atelier.html`, `../editeur.html`, `../dashboard.html`, `../index.html`.
  - **URLs sans extension** : généralisation dans `packages/server/src/http.js` `resolvePathSafe()` — tout `/<nom>` sans extension dont `<nom>.html` existe est servi (remplace les 2 cas codés en dur `/dashboard`+`/editeur`). `/editeur`, `/dashboard`, `/atelier`, `/studio`, `/catalogue` désormais tous servis.
  - **Boutons Hub morts** (`new-projet`, `new-parcours`, `create-pack`, `new-session`, `import-pack`, `save-settings`…) : fallback dans `hub-shell.js` — si aucun `hubAction_*` n'existe, un toast « Fonctionnalité à venir » s'affiche au lieu d'un clic muet (implémentation UI complète = travail futur, non inventé ici).
  - **394/394 tests verts** (+2 `server.test.mjs` : pages sans extension servies, 404 sur chemin inexistant) ; eslint 0 erreur.
- [x] **Réconcilier le pack actif `packdemo`** : l'upstream a activé `packdemo` comme pack par défaut (`content/manifest.json`, commit `b0ccc64`/`be93661`) mais 5 tests codaient `phantom-cybersecurite` actif et l'id catalogue était mal orthographié.
  - Le fichier catalogué s'appelait `packDemo.json` (id `packDemo`, majuscule) alors que manifest + `content/packs/packdemo/` utilisent `packdemo` → renommé en `packdemo.json` + id corrigé en `packdemo` (`git mv`).
  - `tests/unit/e2e-parcours.test.mjs` (01, 03) et `tests/unit/server.test.mjs` (Packs API) : attentes alignées sur `packdemo` ACTIVE (phantom → DISABLED, reste listé).
  - `node tools/build-catalogue.mjs` régénéré : `js/catalogue-data.js` (11 packs, `packdemo` présent) ; suite complète **394/394** ; commits `3ac10c1` + `ad2cb4c` pusher sur `origin/main`.

### P2 — UX / architecture
- [ ] Migrer player/concepteur/studio/debriefing/hub vers le design system unique (`cur-*`, palette officielle, `img/icons`).
- [ ] Navigation unifiée **JOUER / PARCOURS / CRÉER / PILOTER / ⚙** (Optimisation.txt §2) ; tableau de bord/carnet/stats dans les espaces appropriés.
- [ ] Maîtriser la mise à jour SW (garder l'ancienne version, proposer « Mettre à jour / Redémarrer », supprimer le `skipWaiting` inconditionnel).
- [ ] **Packs** : créer le Pack Démo complet par défaut ; compléter les 9 packs ; `npm run validate:packs` / `validate:all` (PACK_COMPLETENESS_SCHEMA) ; normaliser catalogue/manifest/parcours (éliminer packs invisibles & doublons).
- [ ] Hygiène : `.gitignore` `content/bundles/`; réconcilier orphelins avec `manifest.json`+`sw.js`; brancher `editorial-governance` ou le retirer.

---

## 8. Définition of done (rattachée à `Optimisation.txt` §29)

Réussite CURIOS = un utilisateur **comprend immédiatement comment jouer** ; installateur de pack valide ; erreur compréhensible sur pack invalide ; session complète jouable **offline** ; mises à jour **sans boucle** ; formateur qui **pilote** ; contenu **validé humainement** ; identité CURIOS **cohérente** ; **CURIOS RELAY** supporté ; architecture ouverte à **CURIOS WORLD / LEGEND** ; fournir à chaque fin de phase : modifications, problèmes corrigés, fichiers modifiés, tests exécutés/réussis/échoués, problèmes restants, prochaine étape.

---

*Prochaine étape recommandée : passer aux **P1** — Doublons & fonctions cassées. En tête de liste : hachage du mot de passe organisateur (`auth.js`, en clair → hash) et correction des liens morts/sans-extension + boutons Hub sans handler. Les P0 (A, B, C) sont corrigés et vérifiés (388/388 tests, eslint 0 erreur).*
