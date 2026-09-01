# Journal des modifications

Historique Curi🧭s (moteur universel) puis héritage Multi JDP.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) — versionnement sémantique.

## [Curi🧭s v2026.09.01] — 2026-09-01

### Corrigé
- **P0** : validateur de réponses, catalogue, icônes SVG (sprite upstream + helper `icon()`).
- **P1** : hachage PBKDF2 du mot de passe organisateur (`auth.js`, en clair → hash) ; liens morts/sans-extension + boutons Hub sans handler.
- **Dérive des bundles commités** résorbée (tous les `--check` CI de nouveau verts).

### Modifié
- **Mise à jour SW maîtrisée** : suppression du `skipWaiting()` inconditionnel à l'`install` — la nouvelle version reste en attente jusqu'au choix de l'utilisateur. Bandeau « Mise à jour disponible / 🔄 Redémarrer » à la détection (`updatefound`/`statechange`) + rechargement après prise de contrôle. Bump `curios-v4` → `curios-v5`.
- **Source unique `game-flow`** (générée par `tools/build-game-flow.mjs`) + `esc()` unifié sur `packages/shared/src/escape.js`.
- **Consolidation des 2 stacks d'auth** sur `packages/shared/src/password.js` (PBKDF2 partagé `sha512` 100k itérations, vérification Hub à temps constant).

### Ajouté
- **Réconciliation des packs orphelins** : `cristaux-de-balto` & `tsle1-ornithologie` déclarés dans `content/manifest.json` (11 packs au total, 1 actif : `packdemo`). `tsle1-ornithologie` (16 fichiers) migré vers le schéma `jdpbc-pack` (découvertes en `category`/`size` anglais sans `emoji`/`couleur`/`pedagogie` corrigées) ; documents `content/curios-parcours/{cristaux-de-balto,tsle1-ornithologie}.json` générés.
- **Pack actif `packdemo`** réconcilié (fichier `packDemo.json` → `packdemo.json`, id corrigé), `content/catalog/packs.json` (S1) aligné sur 11 packs.

### Vérifié
- **398/398** tests unitaires verts ; eslint **0 erreur** (warnings de style pré-existants) ; tous les `--check` CI verts (`build-data`, `build-catalogue`, `build-sw`, `build-engine`, `build-game-flow`, `build-geo`, `build-editions`, `convert-packs` 11/11).
- `validate-parcours` : 12/12 documents valides ; smoke-engine / smoke-geo : OK.

## [Curi🧭s v1.7.0] — 2026-08-30

### Corrigé
- **Bug racine `js/data.js`** : le module ne s'exécutait jamais en navigateur. Une collision de redéclaration (`const { normalize, checkAnswer, makeQuiz, getEnigme } = window.CURIOS_ENGINE;` entrait en conflit avec les `function normalize/checkAnswer/makeQuiz/getEnigme` déjà globales chargées par `js/engine.js`) provoquait une `SyntaxError` qui jetait tout `data.js`. Résultat : `BALISES` / `SITE` / `ACTIVE_PACKS` étaient **undefined** au runtime (écran « Choisir un parcours » vide). Corrigé en supprimant la déstructuration redondante. Bug pré-existant (présent depuis le commit `b349aa9`).
- **Liste « Choisir un parcours »** : la vitrine des parcours ne listait rien ; désormais rendue hors-ligne via `CATALOGUE_DATA` + `ACTIVE_PACKS` + `js/catalogue-data.js` (voir **Ajouté**).

### Ajouté
- **Liste offline des parcours** : `renderParcours` / `renderPackList` dans `js/app.js`, génération de `ACTIVE_PACKS` dans `js/data.js` (région contenu) via `tools/build-data.mjs`, `js/catalogue-data.js` (données hors-ligne du catalogue) et inclusion du script dans `index.html`.
- **Tests E2E** : 15 tests de non-régression + `docs/VERIFICATION_FONCTIONNELLE.md`.
- **Test navigateur permanent** : `tests/e2e/parcours-flow.test.mjs` (5 tests `node:test` + `playwright-core` sur Chrome installé) qui vérifie l'exécution réelle de `data.js`, l'affichage des 9 packs + Phantom « Actif », la réponse des boutons « Choisir ce parcours » et la création de profil. Dépendance `playwright-core` ajoutée en `devDependencies`.

### Vérifié
- Au runtime navigateur : `BALISES=9`, `ACTIVE_PACKS=['phantom-cybersecurite']`, `SITE` défini, 0 erreur JS (plus de collision).
- Écran parcours : 9 packs listés + Phantom « Actif », packs non-actifs avec bouton d'activation ; clic « Choisir ce parcours » répond (toast organisateur sans auth, 401 — pas un bouton mort) ; formulaire profil crée un profil actif ; bouton « Jouer / continuer » apparaît.
- `node tools/build-data.mjs --check` OK ; `node tools/build-sw.mjs --check` « sw.js est à jour » ; eslint 0 erreur ; tests unitaires 380/380.

## [Curi🧭s v1.6.0] — 2026-08-29

### Ajouté
- **Catalogue premium immersif** des packs Curi🧭s (vitrine immersive des parcours).
- **Nouveaux packs** : 🌌 `cosmos-mission-orion` (Cosmos) et 🚧 `passeur-relais` (Passeur Relais).

## [Curi🧭s v1.5.0] — 2026-08-29

### Ajouté
- **Positions GPS réelles** sur cartes Google My Maps pour l'ensemble des packs.
- **Boussole 3D** : anneau rotatif + retour haptique.

## [Curi🧭s v1.4.0] — 2026-08-29

### Corrigé
- Correctifs Curi🧭s : parcours activable, dossier, boussole.

### Ajouté
- **Pack 🛡️ `phantom-cybersecurite`** (cybersécurité).

## [Curi🧭s v1.3.0] — 2026-08-28

### Ajouté
- **Hub intégré** : authentification multi-utilisateurs `/api/hub/auth` (register/login/me/logout).
- **Pack Manager** dans le dashboard (Phase 3).
- **Hub complet** : CRUD clients / matériel / sessions / planning / commercial + analytics (phases Hub 10, CURIOS 2.0).
- Accès au Hub sans login + lien explicite vers le Catalogue.

## [Curi🧭s v1.2.0] — 2026-08-28

### Ajouté
- **Phase 2 (slice)** : accueil simplifié + espaces « Parcours » / « Administrer ».
- **Design System v1.0** (cartographie cognitive futuriste) appliqué au CURIOS.

## [Curi🧭s v1.1.1] — 2026-08-28

### Corrigé
- **Réparation du service worker** + rebuild `dist` (jeu bloqué + visuelles périmées).

## [Curi🧭s v1.1.0] — 2026-08-28

### Modifié
- **Application du Design System v1.0 au Player** (habillage futuriste).

## [Curi🧭s v1.0.0] — 2026-08-26

### Ajouté
- **CURIOS 2.0** : infrastructure complète + Hub patches.
- **Opération Phantom** : pack cybersécurité + documentation complète + packages manquants.
- **Éditions incluses** : 4 éditions, Studio de création, Dashboard organisateur, Mode hors-ligne.

## [Curi🧭s 0.5.0] — 2026-08-25

### Renommé
- **Projet DUCYB rebaptisé Curi🧭s** — « Créez des expériences qui font apprendre »
- `@ducyb/*` → `@curios/*` (packages npm)
- `ducyb-parcours` → `curios-parcours` (format de données universel)
- `window.DUCYB_ENGINE` → `window.CURIOS_ENGINE`
- `sw.js` : bump `jdpbc-v9` → `curios-v1`
- Tous les fichiers HTML, JS, CSS, docs et wiki mis à jour

### Ajouté
- **`packages/offline`** (zéro dépendance) : config du service worker (VERSION, CACHE, RUNTIME, PRECACHE) + stratégies de cache (shouldBypassCache, fetchStrategy, shouldCacheRuntime, offlineFallback, cachesToDelete) — 23 tests unitaires
- `tools/build-sw.mjs` : génère `sw.js` depuis `packages/offline/src/` avec `--check`
- Logo et icônes Curi🧭s (SVG + PNG 192/512/maskable)

## [DUCYB 0.4.0] — 2026-08-24

### Ajouté
- **`packages/game-engine`** (zéro dépendance, ES modules pur) : `normalize`, `checkAnswer`, `makeQuiz` (rng injectable), `getEnigme` — importable en Node.js pour les tests
- `tools/build-engine.mjs` : génère `js/engine.js` (script classique navigateur) depuis les sources ESM avec `--check`
- CLI `tools/smoke-engine.mjs` : smoke test VM de toutes les fonctions moteur
- **Tests unitaires** `tests/unit/game-engine.test.mjs` (17 tests : normalize, checkAnswer, makeQuiz, getEnigme)
- Étapes CI : « Synchronisation packages/game-engine → js/engine.js » + « Tests unitaires game-engine »

### Modifié
- `js/data.js` : les 4 fonctions moteur sont maintenant des adapters `var {...}=window.CURIOS_ENGINE` (les définitions originales vivent dans `packages/game-engine/src/`)
- `index.html`, `dashboard.html`, `editeur.html`, `questionnaire.html` : ajout de `js/engine.js` avant `data.js`
- `sw.js` : ajout de `js/engine.js` au précache, bump `jdpbc-v7` → `jdpbc-v8`

## [DUCYB 0.3.0] — 2026-08-24

### Ajouté
- **Exemple canonique** `content/examples/exemple-quartier.json` : démo complète du format `curios-parcours` v1 (stations GPS/schématiques, énigmes ×3 niveaux, quiz, observation, médias, récompenses, débriefing)
- CLI `tools/validate-parcours.mjs` : validation de tous les documents universels (convertis + exemples)
- Étape CI « Validation des documents curios-parcours »
- PHASE 2 terminée (étapes 1-3)

## [DUCYB 0.2.0] — 2026-08-24

### Ajouté
- **`packages/content-schema`** (zéro dépendance) : règles de validation du contenu historique extraites de `tools/build-data.mjs` (source de vérité unique), convertisseur déterministe vers `curios-parcours` v1 avec vérification de couverture, validateur structurel du format universel
- CLI `tools/convert-packs.mjs` : conversion des 4 packs → `content/curios-parcours/*.json`, mode `--check`
- Étape CI « Conversion curios-parcours à jour »

### Modifié
- `tools/build-data.mjs` consomme `@curios/content-schema` (−138 lignes, sortie byte-identique vérifiée)
- docs/DATA_MODEL.md : table de correspondance réelle du convertisseur

## [DUCYB 0.1.0] — 2026-08-24

### Ajouté
- Dépôt fondateur : copie fidèle de la plateforme Multi JDP v2.0.3 (commit `b9dc7f9`) comme base de migration
- Documentation fondatrice : AUDIT, ARCHITECTURE, ROADMAP (7 phases), DATA_MODEL (`curios-parcours` v1), MIGRATION
- Gouvernance : README, CONTRIBUTING, SECURITY (dette auth `/api` documentée), CODE_OF_CONDUCT
- CI reprise de la plateforme (syntaxe JS, synchronisation content↔data.js, JSON)

### Vérifié
- Non-régression complète de la copie (voir docs/MIGRATION.md)

## [Multi JDP 2.0.3] — 2026-08-24

### Corrigé
- **Blocage après la validation d'une énigme** : la fonction `allBirds()` (découvertes + guide) avait été perdue lors du passage au contenu modulaire — `getBird()` échouait, la fiche découverte ne s'affichait plus (plus de boussole, d'émojis ni de son). Fonction restaurée dans le moteur

### Ajouté
- **Panneau « 📱 Familles »** dans le tableau de bord : état de connexion de chaque famille en direct — en ligne/hors ligne + type de réseau (wifi/4g…), batterie (%) et charge ⚡, autorisation caméra 📷, précision GPS 🛰️ (± m) avec heure du dernier fix, balises validées ✅ n/N, dernier signe de vie 👁️ — et bouton ⏻ pour déconnecter la famille
- **Télémétrie des appareils** : l'application envoie désormais toutes les 20 s batterie/réseau/caméra/GPS au serveur (en plus des positions), visibles par l'organisateur
- **Validation à distance multi-modes** : dans « Balises validées par équipe », cliquer une balise ouvre le choix ✋ Manuel · 🛰️ GPS (vérifie que la famille est bien sur place via sa dernière position) · ❓ Question (affiche l'énigme et les réponses acceptées) · 🔑 Code (saisie du code de la balise)

### Modifié
- Première balise de chaque pack repositionnée sur le point de départ commun des événements (50.7258178, 3.1329639)
- Service worker reversionné (v7)

## [2.0.2] — 2026-08-23

### Ajouté
- **Panneau « 📏 Terrain »** dans l'éditeur : distances réelles entre balises consécutives, longueur totale du parcours, alerte quand les cercles de validation GPS se chevauchent (→ QR code ou rayon plus petit)
- **Rayon GPS par balise éditable** : champ « Rayon GPS propre » dans le formulaire de chaque balise

### Modifié
- **Mot de passe des thèmes toujours visible** dans Réglages dès que la protection est active, avec rappel du mot de passe par défaut (Sam) — plus besoin de tenter un changement pour découvrir le champ
- Service workers reversionnés (v5 / v3) pour invalider les caches des visiteurs

## [2.0.1] — 2026-08-23

### Ajouté
- **Précision GPS maximale** : acquisition à la meilleure fixe (`watchPosition` jusqu'à ±5 m ou fin de fenêtre) dans l'éditeur ET dans le jeu ; cercle d'incertitude affiché sur la carte de l'éditeur
- **Mode terrain ⛓️** : après chaque capture réussie, la balise suivante s'ouvre automatiquement — placement sur site en une marche
- **Rayon de validation par balise** : champ optionnel `radius` (mètres) dans les balises JSON ; défaut global resserré de 30 m à **12 m**
- **Pack CEMÉA étendu à 11 balises** : nouvelles découvertes Éducation du Dehors, Erasmus+, Yakamédia, Économie sociale, Accueillir tout·es — parcours CEMÉA complet positionné sur les repères GPS réels du site (import depuis Google My Maps)
- **Éditeur de carte** : import KML / Google My Maps par URL (proxy serveur `/api/kml`, anti-CORS) ou fichier `.kml` ; attribution des repères aux balises dans l'ordre, recentrage automatique
- **Recherche dans l'éditeur de carte** : retrouvez une balise par numéro, code ou nom et centrez la carte dessus
- **Ajustement de la carte du jeu** : projection automatique des coordonnées GPS vers la carte schématique (répartition en ellipse si le terrain est compact) et régénération du tracé

### Modifié
- Identité visuelle CEMÉA Nord-Pas-de-Calais : logo officiel (variante blanche pour le mode nuit), mise à jour des écrans

## [2.0.0] — 2026-08-23

### Ajouté
- **Plateforme multi-packs** : le parcours combine les packs actifs de `content/manifest.json` — 🧠 `biais-cognitifs` + 🤝 `cemea-education-populaire` (14 découvertes, 14 notions, 14 balises) ; modules 🛡️ `harcelement-scolaire` (cycle 3/4) et 🚜 `metiers-tension` (orientation 3e) livrés prêts à activer
- **Thèmes visuels** (`content/themes/*.json`) : Nuit étoilée, Nature, Espace, Futuriste, Rétro — appliqués en direct, anti-flash au démarrage, meta theme-color synchronisée
- **Mot de passe organisateur** sur le changement de thème (défaut `Sam`, modifiable depuis Réglages par le profil Admin) ; déverrouillage valable pour la session
- Schéma balise assoupli : codes multi-packs (`B1`, `C1`, `HS1`, `MT1`…)

### Modifié
- Habillage neutre et inclusif (« Multi Jeu de Piste », métaphore des graines 🌱) ; les contenus spécifiques restent dans leurs packs

### Compatibilité
- Identifiants historiques conservés (`BIRDS`, `chant`, préfixes éditeur) ; données de partie locales inchangées

## [1.1.1] — 2026-08-23

### Ajouté
- **Atelier de packs** (`atelier.html` + `js/atelier.js`) : application embarquée de création de contenu — pack metadata, découvertes avec quiz et objectifs pédagogiques, notions du guide, balises avec énigmes par niveau d'âge, validation en direct, export/import de bundles
- `tools/import-pack.mjs` : installe un bundle exporté par l'atelier (validation, éclatement en fichiers, mise à jour du manifest)
- `tools/build-data.mjs` génère désormais aussi `content/bundles/<id>.json` (bundle complet par pack, ouvrable dans l'atelier)
- Lien « Atelier de packs » dans l'éditeur ; atelier préchargé hors-ligne (cache SW v2)

## [1.1.0] — 2026-08-23

### Ajouté
- **Architecture de contenu modulaire** : le contenu pédagogique vit dans `content/` — un fichier JSON par notion (8 découvertes, 10 notions du guide, 8 balises), regroupés en packs activables via `manifest.json`
- Métadonnées pédagogiques par notion : `ages`, `duree_min`, `objectif`, `programme` ; tranches d'âge par niveau d'énigme (facile 6-9, moyen 10-13, difficile 14+)
- Schémas JSON Schema (draft-07) dans `content/schemas/` comme contrat pour les contributions
- `tools/build-data.mjs` : régénération validée de `js/data.js` depuis les packs + mode `--check` (contrôle de synchronisation exécuté en CI)
- `tools/split-content.mjs` : migration one-shot de l'ancien `data.js` monolithique vers les packs

### Modifié
- `js/data.js` : la région contenu est désormais générée (marqueurs explicites) ; SITE, TRAIL et les fonctions moteur restent manuels

### Compatibilité
- Aucun changement d'interface runtime : éditeur, serveur, PDF et PWA fonctionnent à l'identique

## [1.0.0] — 2026-08-23

### Ajouté
- Jeu complet : 8 balises sur le sentier, 8 pièges cognitifs (énigmes, quiz 3 niveaux, antidotes), guide de 10 notions supplémentaires
- Avertisseur d'approche au choix : signature sonore, radar, bip-bip, pulsation — ou enregistrement micro personnalisé (5 s max)
- Fiche pédagogique PDF (4 pages) générée depuis les données du jeu, consultable hors-ligne depuis l'écran Guide
- Tableau de bord organisateur : messages aux équipes, épreuves en direct (enquête, son, observation, rapidité), suivi GPS, panneau urgences, affiche QR Wi-Fi + jeu imprimable
- Éditeur intégré (`/editeur`) : site, balises, découvertes, quiz, guide — export/import JSON
- Modes classique / aléatoire / course chronométrée ; palmarès hebdomadaire ; carnet de terrain ; livre d'or avec selfie
- Mode hors-ligne complet via service worker (`jdpbc-*`)
- Serveur local HTTPS PowerShell (`server.ps1`) avec tunnel cloudflared optionnel
- Accessibilité : dictée vocale, lecture d'écran, mode nuit
- Démo statique sur GitHub Pages

### Dérivation
- Œuvre dérivée de TSLE1 « La toile sous les étoiles » (ornithologie) : mécanique de jeu conservée, thème remplacé par les biais cognitifs, interface entièrement francisée — voir NOTICE.md

[1.0.0]: https://github.com/ducybrobin-ux/jpd/releases/tag/v1.0.0
