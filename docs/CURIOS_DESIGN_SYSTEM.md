# CURIOS DESIGN SYSTEM — "Cartographie Cognitive Futuriste"

Version : 1.0 · Statut : officielle · Couche visuelle de référence de CURIOS

> **Baseline** : *« La grammaire du jeu au service des compétences. »*
> **Identité** : *CURIOS — Explorer. Jouer. Comprendre.*

Le dépôt CURIOS adopte une identité visuelle cohérente inspirée de l'esthétique
de référence fournie par le concepteur. Ce document est la **spécification officielle**
du Design System. Il définit le concept, la palette, les tokens, le langage visuel,
les composants et les règles d'usage.

---

## 1. Concept : "Cartographie Cognitive Futuriste"

CURIOS doit évoquer **simultanément** :

| Évocation | Traduction visuelle |
|-----------|---------------------|
| exploration | courbes topographiques, repères cartographiques |
| cartographie | grilles techniques, lignes de connexion |
| intelligence | hexagones de compétences, micro-données |
| laboratoire | cadres HUD fins, points lumineux discrets |
| jeu | flux lumineux, animations courtes |
| enquête | données structurées, hiérarchie claire |
| technologie | lignes de connexion, monospace parcimonieux |
| compétences humaines | formes géométriques signifiantes |

### Règles anti-esthétique

- **Ne pas** produire une esthétique cyberpunk générique.
- **Ne pas** utiliser de néons multicolores.
- **Ne pas** surcharger les interfaces.
- **Ne pas** transformer CURIOS en interface de jeu vidéo.

L'ambiance est **technique, calme et cartographique** — jamais criarde.

---

## 2. Palette

### Couleurs de base

| Rôle | Token | Valeur |
|------|-------|--------|
| Fond principal | `--cur-bg-primary` | `#061522` |
| Fond secondaire | `--cur-bg-secondary` | `#092235` |
| Bleu CURIOS | `--cur-blue` | `#073B5C` |
| Cyan technique | `--cur-cyan` | `#7DDDE5` |
| Cyan clair | `--cur-cyan-light` | `#B8F5F3` |
| Cuivre CURIOS | `--cur-copper` | `#D99678` |
| Lueur cuivre | `--cur-copper-glow` | `#FFB58F` |
| Or | `--cur-gold` | `#E7B77A` |
| Texte principal | `--cur-text` | `#E9F0F2` |
| Texte secondaire | `--cur-text-dim` | `#8DA8B3` |
| Ligne technique | `--cur-line` | `#315468` |

### Usage des couleurs

- **Fonds** sombres (`bg-primary`, `bg-secondary`) pour toutes les surfaces.
- **Bleu CURIOS** : actions primaires, navigation, accent principal.
- **Cyan technique** : liens, focus, données actives, information.
- **Cuivre / Lueur cuivre** : découvertes, spécial, valeurs marquantes.
- **Or** : récompenses, objectifs atteints, statuts premium.
- **Texte secondaire** : légendes, aides, données secondaires.
- **Ligne technique** : bordures, séparateurs, grilles.

### Accessibilité des contrastes

- `text-primary (#E9F0F2)` sur `bg-primary (#061522)` : contraste très élevé ✓
- `text-secondary (#8DA8B3)` sur `bg-primary (#061522)` : contraste AA ✓
- Ne **jamais** utiliser la couleur seule pour transmettre une information.
- Toujours associer une couleur à une icône, un libellé ou une forme.

---

## 3. Architecture des design tokens

Tous les tokens sont centralisés en **propriétés CSS** sur `:root` et exposés
dans le module de composants. Trois familles :

### 3.1 Tokens de couleur

Définis ci-dessus (`--cur-*`). Un seul point de vérité.

### 3.2 Tokens de géométrie

| Token | Valeur | Usage |
|-------|--------|-------|
| `--cur-space-1` | `4px` | micro-espacement |
| `--cur-space-2` | `8px` | espacement interne serré |
| `--cur-space-3` | `12px` | espacement standard interne |
| `--cur-space-4` | `16px` | espacement de base |
| `--cur-space-5` | `24px` | espacement de section |
| `--cur-space-6` | `32px` | espacement de page |
| `--cur-space-7` | `48px` | grand espacement |
| `--cur-radius-sm` | `6px` | petits éléments (badges, inputs) |
| `--cur-radius` | `10px` | cartes, boutons, panneaux |
| `--cur-radius-lg` | `16px` | modales, grands panneaux |
| `--cur-radius-pill` | `999px` | pilules, badges arrondis |
| `--cur-line-thin` | `1px` | bordures discrètes |
| `--cur-line-md` | `2px` | bordures actives |
| `--cur-line-thick` | `3px` | éléments signature |

> Note : `--cur-line` désigne la **couleur** de bordure (`#315468`) — cf. §3.2. Pour l'épaisseur moyenne, utiliser `--cur-line-md` (2px).

### 3.3 Tokens de typographie

| Token | Valeur | Usage |
|-------|--------|-------|
| `--cur-font` | `'Inter', 'Segoe UI', system-ui, sans-serif` | texte principal |
| `--cur-font-mono` | `'JetBrains Mono', 'Cascadia Code', monospace` | données techniques |
| `--cur-fs-xs` | `12px` | micro-légendes |
| `--cur-fs-sm` | `13px` | légendes |
| `--cur-fs-base` | `15px` | texte courant |
| `--cur-fs-md` | `17px` | sous-titres |
| `--cur-fs-lg` | `20px` | titres de section |
| `--cur-fs-xl` | `26px` | titres de page |
| `--cur-fs-2xl` | `34px` | titres hero |
| `--cur-fw-normal` | `400` | corps |
| `--cur-fw-medium` | `600` | emphasis |
| `--cur-fw-bold` | `800` | titres |

### 3.4 Tokens d'ombre, lueur et animation

| Token | Valeur | Usage |
|-------|--------|-------|
| `--cur-shadow-sm` | `0 1px 3px rgba(6,21,34,.4)` | ombre légère |
| `--cur-shadow` | `0 4px 16px rgba(6,21,34,.5)` | cartes |
| `--cur-shadow-lg` | `0 12px 40px rgba(6,21,34,.65)` | modales |
| `--cur-glow-cyan` | `0 0 0 3px rgba(125,221,229,.18)` | focus / lueur cyan |
| `--cur-glow-gold` | `0 0 16px rgba(231,183,122,.35)` | lueur récompense |
| `--cur-ease` | `cubic-bezier(.4,0,.2,1)` | easing standard |
| `--cur-dur-sm` | `120ms` | micro-transitions |
| `--cur-dur` | `220ms` | transitions standard |
| `--cur-dur-lg` | `380ms` | entrées de page |

---

## 4. Langage visuel

Association **forme = sens** (constante sur toute l'application) :

| Forme | Signification |
|-------|---------------|
| **Hexagone** | compétence |
| **Cercle** | événement |
| **Carré** | donnée |
| **Ligne** | relation / connexion |
| **Point lumineux** | découverte |
| **Losange** | objectif |
| **Contour topographique** | parcours |

### Éléments graphiques signature

1. **Courbes topographiques discrètes** — arrière-plans des cartes, enveloppes de pièces.
2. **Lignes de connexion lumineuses** — relient les éléments, animent les dashboards.
3. **Hexagones** — icônes et indicateurs de compétence.
4. **Grilles techniques** — toiles de fond, cartes, formulaires.
5. **Petits repères cartographiques** — balises, localisation, positions.
6. **Points lumineux** — découvertes, états actifs.
7. **Cadres HUD très fins** — panneaux, cartes, vitrines de données.
8. **Micro-données décoratives** — coordonnées, codes, métadonnées (monospace).
9. **Effets de lueur extrêmement modérés** — focus, récompenses uniquement.
10. **Animations de flux** — connexions, progressions.

---

## 5. Typographie

- Police **sans-serif moderne et très lisible** : `Inter` (fallback `Segoe UI`).
- Police **monospace avec parcimonie** : pour les données techniques
  (coordonnées, codes, métriques, timestamps).
- Respecter la hiérarchie (taille, graisse, contraste) ; ne jamais scinder
  la lisibilité au profit du style.

---

## 6. Composants du Design System

> Implémentation progressive. Chaque composant vit dans
> `css/curios-design-system.css` sous la racine `.cur-`.

### 6.1 Primitives

- **Boutons** (`.cur-btn`) — variants : primaire, secondaire, fantôme, danger.
- **Cartes** (`.cur-card`, `.cur-panel`) — avec option `--cur-flow` (titre + ligne).
- **Badges / pilules** (`.cur-badge`) — statuts, rôles, catégories.
- **Indicateurs** (`.cur-indicator`) — points de statut (actif, erreur, etc.).
- **Progress bars** (`.cur-progress`) — progression, remplissages.
- **Timelines** (`.cur-timeline`) — étapes, flux.
- **Alertes** (`.cur-alert`) — info, succès, avertissement, erreur.
- **Modales** (`.cur-modal`) — boîtes de dialogue.
- **Formulaires** (`.cur-field`, `.cur-input`, `.cur-select`, `.cur-textarea`) — champs.
- **Menus / navigation** (`.cur-nav`, `.cur-menu`) — navigation, sous-menus.
- **Tableaux** (`.cur-table`) — données tabulaires.
- **Graphiques** (`.cur-chart`) — barres horizontales, jauges.

### 6.2 Blocs métier

- **Cartes géographiques** (`.cur-map`) — toile topographique + repères.
- **Hexagones de compétences** (`.cur-skillhex`) — radiants / compétences.
- **Missions** (`.cur-mission`) — cartes de mission.
- **Énigmes** (`.cur-enigma`) — présentation d'énigme.
- **Dashboard** (`.cur-dashboard`) — grille de statistiques et widgets.
- **Studio / Player / Event Engine** — réutilisent les primitives.

---

## 7. Animation

### Autorisé (court et fonctionnel)

- Apparition progressive (`fadeIn`).
- Pulsation légère (états actifs / découvertes).
- Flux lumineux (connexions, progressions).
- Transitions de cartes.
- Connexions animées (lignes de relation).

### Interdit

- Effets permanents.
- Rotations inutiles.
- Clignotements.
- Animations qui ralentissent l'utilisation.

Respecter `prefers-reduced-motion` : désactiver toute animation non essentielle.

---

## 8. Responsive

Conception **mobile-first**. Mêmes tokens et composants sur :

- smartphone
- tablette
- ordinateur
- grand écran événementiel
- Raspberry Pi
- projection

Justification des breakpoints :

| Breakpoint | Cible |
|------------|-------|
| `< 480px` | smartphone portrait |
| `≥ 480px` | smartphone paysage / petit |
| `≥ 768px` | tablette |
| `≥ 1024px` | ordinateur |
| `≥ 1440px` | grand écran / projection |

---

## 9. Objectif UX

- Perception : *« Je suis dans un système d'exploration. »*
- Compréhension immédiate : *« Voici ce que je dois faire maintenant. »*
- Priorités : 1 cohérence, 2 lisibilité, 3 hiérarchie, 4 accessibilité,
  5 performance, 6 esthétique.

---

## 10. Mise en œuvre

Le présent document est la **référence**. L'implémentation se fait
progressivement, sans refonte immédiate de toute l'application :

1. ✅ Spécification (ce document).
2. Tokens centralisés dans `css/curios-tokens.css`.
3. Composants communs dans `css/curios-design-system.css`.
4. Adoption progressive par les interfaces existantes (Player, Studio, Hub, site).

> Règle : **ne pas** refaire toute l'application d'un coup. Migrer surface
> par surface, en conservant les composants CURIOS partout.
