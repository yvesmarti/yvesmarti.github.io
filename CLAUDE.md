# CLAUDE.md

Ce fichier documente le dépôt pour Claude Code (claude.ai/code). Il doit rester à jour à chaque évolution significative du projet.

---

## Contexte du projet

Portfolio professionnel de **Yves Marti** — chargé de mission déchets & SIG en Normandie. Site statique Jekyll hébergé sur GitHub Pages, entièrement en français.

- URL de production : https://yvesmarti.fr
- Branche de déploiement : `main` (push → déploiement automatique GitHub Pages)
- Pas de CI/CD supplémentaire, pas de tests automatisés

---

## Commandes utiles

```bash
bundle install              # Installer les dépendances Ruby (première fois)
bundle exec jekyll serve    # Serveur local → http://localhost:4000
bundle exec jekyll build    # Générer le site dans _site/
```

---

## Architecture générale

Le site mélange deux modes de fonctionnement :

### Pages Jekyll (avec layout)

Utilisent `_layouts/default.html` ou `_layouts/page.html`, partagent nav/footer :

| Fichier | Layout | Rôle |
|---|---|---|
| `index.html` | `default` | Page d'accueil |
| `outils.html` | `page` | Catalogue des outils (extra CSS/JS) |
| `realisations/index.html` | `default` | Portfolio réalisations (extra CSS/JS) |
| `realisations/*.html` | `page` ou `default` | Pages de détail des réalisations |

### Pages autonomes (sans layout Jekyll)

HTML/CSS/JS auto-contenus, sans nav/footer partagés :

| Fichier | Rôle |
|---|---|
| `cv/index.html` | CV interactif, optimisé impression, styles et données inline |
| `outils/*.html` | Outils web fonctionnels (une appli par fichier) |
| `outils/suivi/index.html` | PWA de suivi terrain GPS (service worker inclus) |

---

## Structure des fichiers

```
yvesmarti.github.io/
├── _config.yml               # Config Jekyll (titre, plugins, SEO keywords)
├── Gemfile                   # Dépendances Ruby (github-pages, jekyll-sitemap)
├── index.html                # Page d'accueil
├── outils.html               # Page catalogue outils
├── realisations.html         # Redirect → /realisations/
├── robots.txt                # SEO
│
├── _data/                    # Contenu YAML (source de vérité)
│   ├── competences.yml       # 12 cartes de compétences filtrables
│   ├── outils.yml            # Catalogue d'outils par catégorie (17 entrées)
│   ├── outils_recommandes.yml # 4 outils tiers recommandés (Recordly, etc.)
│   ├── realisations.yml      # 12 items du portfolio
│   ├── stats.yml             # Compteurs animés (70+ collectivités, etc.)
│   └── timeline.yml          # 7 items parcours chronologique (formation + expé)
│
├── _layouts/
│   ├── default.html          # Layout maître (head SEO, GTM, nav, footer, main.js)
│   └── page.html             # Hérite de default, ajoute .page-header coloré
│
├── _includes/
│   ├── header.html           # Navigation fixe (logo YM, liens, toggle dark mode)
│   └── footer.html           # Pied de page (copyright dynamique)
│
├── assets/
│   ├── css/
│   │   ├── style.css         # Feuille principale (2 795 lignes)
│   │   ├── outils.css        # Styles page outils (501 lignes)
│   │   └── realisations.css  # Styles page réalisations (433 lignes)
│   ├── js/
│   │   ├── main.js           # Core JS (540 lignes, IIFE vanilla)
│   │   ├── hero-background.js # Canvas Perlin noise héros (316 lignes)
│   │   ├── outils.js         # Filtrage/rendu page outils (61 lignes)
│   │   └── realisations.js   # Filtrage/rendu portfolio (97 lignes)
│   └── images/
│       ├── favicon.svg / favicon-32.png / apple-touch-icon.png
│       ├── og-image.png      # 1200×630 Open Graph
│       └── preview-*.webp/png # Aperçus des réalisations
│
├── cv/
│   └── index.html            # CV autonome (données inline, print-friendly)
│
├── outils/                   # 16 applis HTML autonomes
│   ├── geocodage_adresse_ban.html
│   ├── geocodage_inverse_ban.html
│   ├── isochrones_ORS.html
│   ├── photomapviewer.html
│   ├── photogeomanager.html
│   ├── extracteurosm.html
│   ├── generateur_calendrier_collecte.html
│   ├── schemas_dalles.html
│   ├── schemas_dalles_v2.html
│   ├── implantation-pav.html
│   ├── qr-code.html
│   ├── annotateur-carte.html
│   ├── encart-gps.html
│   ├── creation_retroplanning.html
│   ├── optimisation_tournee.html
│   └── suivi/
│       ├── index.html        # PWA suivi terrain
│       ├── manifest.json     # Installabilité PWA
│       └── service-worker.js # Cache offline
│
└── realisations/
    ├── index.html            # Portfolio (rendu dynamique via realisations.js)
    ├── etude-de-cas-redevance-speciale.html
    ├── presentation-dashboard.html
    └── api-utiles.html
```

---

## Données YAML (`_data/`)

### `outils.yml`

Structure par catégorie. Chaque outil :

```yaml
- nom: "Nom de l'outil"
  description: "Courte description"
  lien: "/outils/mon-outil.html"
  icone: "🗺️"
  actif: true          # false = masqué dans le catalogue
  nouveau: true        # optionnel — badge "nouveau"
```

Catégories actuelles : `Géomatique & Cartographie`, `Analyse de Données`, `Environnement & Déchets`, `Autres outils pratiques`.

### `realisations.yml`

```yaml
- id: 10                              # entier, incrémental
  title: "Titre"
  desc: "Description courte"
  type: "site|etude|astuce|outil|guide"  # détermine le filtre et le badge
  tags: ["Tag1", "Tag2"]
  emoji: "📈"                          # fallback si pas d'image
  image: "/assets/images/preview-xxx.webp"  # optionnel
  url: "/realisations/ma-page.html"    # interne ou externe (https://...)
  featured: true                       # optionnel — remonte la carte sur l'accueil
```

Les entrées `type: guide` sont sorties de la grille filtrable et rendues dans une section
dédiée (`realisations/index.html`, filtre Liquid `where: "type", "guide"`).

**`featured: true`** pilote la section « réalisations mises en avant » de `index.html`
(3 cartes attendues). C'est le seul endroit où sélectionner les projets vitrine : aucun
titre n'est codé en dur dans `index.html`. Les liens externes (`url` contenant `://`) sont
détectés automatiquement et reçoivent `target="_blank"` + `rel="noopener noreferrer"`.

### Raccourcis outils sur l'accueil

Sous les réalisations mises en avant, la section `#outils` de `index.html` affiche un bloc
« Accès direct » (classe `.tools-shortcuts`) qui pointe vers quelques outils précis. La
sélection se fait par une liste de chemins en tête du bloc :

```liquid
{% assign raccourcis = "outils/geocodage_adresse_ban.html,outils/geocodage_inverse_ban.html" | split: "," %}
```

Chaque chemin doit correspondre exactement à un champ `lien` de `_data/outils.yml` : le nom,
l'emoji et la description sont repris de là (aucun texte dupliqué dans `index.html`). Un outil
passé en `actif: false` disparaît automatiquement du bloc.

### `competences.yml`

```yaml
- titre: "Titre compétence"
  icone: "🗺️"
  categorie: "Cartographie"   # sert au filtre JS
  couleur: "#3d8b6e"
  description: "Texte affiché dans la carte"
```

### `timeline.yml`

```yaml
- periode: "2015 – 2025"     # tiret demi-cadratin entouré d'espaces : le split Liquid en dépend
  type: exp                  # exp | edu — pilote la couleur (orange / vert) et la légende
  titre: "Poste ou diplôme"
  organisation: "Organisation - Ville"
  description: "Résumé d'une ligne affiché sur la carte"
  details:                   # optionnel — liste de puces affichées dans la lightbox
    - "Première mission"
    - "Deuxième mission"
```

La présence de `details` fait apparaître un bouton « Plus de détails » sur la carte de la
timeline horizontale, qui ouvre une lightbox (`#htl-modal` dans `index.html`, styles `.htl-modal*`
dans `style.css`, logique `initTimelineDetails` dans `main.js`). Les items sans `details` n'ont
pas de bouton. Le contenu détaillé est rendu par Jekyll dans un `<template>` inerte à l'intérieur
de la carte : ne pas le remplacer par un élément visible, `htl-track.scrollWidth` et
`item.offsetLeft` pilotent tout le défilement horizontal.

### `stats.yml`

```yaml
- valeur: 70
  suffixe: "+"
  label: "Collectivités accompagnées"
  icone: "🏛️"
```

### `outils_recommandes.yml`

Outils tiers (pas créés par Yves) affichés en section dédiée sur `outils.html` :

```yaml
- nom: "Recordly"
  description: "..."
  lien: "https://..."
  categorie: "Productivité"
```

---

## Système de design

### Règle de rédaction — pas de tiret cadratin

**Aucun `—` (tiret cadratin / em dash) dans le contenu publié.** C'est un marqueur de
rédaction par IA que le propriétaire du site refuse. Utiliser deux-points, virgule,
parenthèses ou une phrase courte à la place.

Les tirets demi-cadratin des plages de dates (`2008 – 2011` dans `timeline.yml`) sont un
caractère différent (`–`) et un usage typographique correct en français : ne pas y toucher.

Contrôle :

```bash
grep -rn "—" _data/ _includes/ _layouts/ index.html outils.html cv/ realisations/ outils/
# doit ne rien retourner
```

### Variables CSS (`assets/css/style.css`)

```css
/* Couleurs */
--color-primary:      #1a3a32   /* vert forêt foncé — héros, sections sombres, nav */
--color-primary-dark: #0a1a10   /* dark mode uniquement */
--color-accent:       #3d8b6e   /* vert moyen — liens, accents, bordures actives */
--color-accent-light: #9ed4b8   /* accents légers */
--color-light:        #f7f9f8   /* fond clair principal */
--color-warm:         #e8ded4   /* fond beige chaleureux — sections intermédiaires */
--color-text:         #2c2c2c
--color-muted:        #6b7c75

/* Typographie */
--font-display: 'DM Serif Display'
--font-body:    'Source Sans 3'
--font-mono:    ui-monospace, 'SF Mono', Menlo, Consolas, ... /* pile système, zéro requête */
```

### Polices Google Fonts (chargées dans `_layouts/default.html`)

Le site principal charge **exactement 2 familles** Google Fonts (une seule requête CSS, `display=swap` + preconnect) pour limiter le FOIT et préserver les Core Web Vitals :

| Police | Graisses | Usage |
|---|---|---|
| DM Serif Display | 400 (roman + italique) | H1/H2, `.lead`, citations (`--font-display`) |
| Source Sans 3 | 300, 400, 600, 700 (+ italique 400) | Corps de texte, labels, titres timeline (`--font-body`) |

Les anciens rôles de Space Grotesk / Outfit (labels et titres timeline) sont assurés par Source Sans 3 700 (uppercase + letter-spacing conservés), ceux de Lora (`.tl__desc`) par Source Sans 3 italique, et ceux de Space Mono (dates, hints) par la pile monospace système `--font-mono`. **Ne pas rajouter de famille Google Fonts au layout sans raison forte** ; utiliser `var(--font-display)`, `var(--font-body)` ou `var(--font-mono)` plutôt que des `font-family` hardcodés.

### Dark mode

Basculé via `data-theme="dark"` sur `<html>`, persisté en `localStorage`. Script inline dans `<head>` (anti-FOUC) le restaure avant rendu. Variables CSS surchargées dans `[data-theme="dark"] { ... }` dans `style.css`.

### Séparateurs vague SVG

Les vagues entre sections utilisent `<path fill="COULEUR_HARDCODÉE">`. Règle CSS dark mode :

```css
[data-theme="dark"] .wave-separator path[fill="#f7f9f8"] { fill: #131e17; }
```

**Important** : si une couleur de fond de section change, mettre à jour le `fill` dans le HTML **ET** la règle CSS dark mode correspondante.

### Responsive — breakpoints

| Breakpoint | Comportement notable |
|---|---|
| 1024px | Skills grid 3 cols, nav pill désactivée |
| 768px | Skills grid 2 cols, layout mobile général |
| 480px | Skills grid 1 col, hero réduit |

### Aligner un outil autonome sur la charte

Les pages de `outils/` n'ont pas de layout Jekyll : elles dupliquent les tokens au lieu de les
importer. `outils/sankey-builder.html` est la **référence** de ce qu'est un outil aligné, et le
premier à disposer du mode sombre. Le motif à reproduire :

1. **Deux couches de variables** dans `:root` : les tokens de charte copiés de `style.css`
   (`--color-*`, `--font-*`), puis les rôles propres à l'outil (`--fond-panneau`, `--accent-douce`,
   `--damier-a`…) définis à partir des premiers. Ajouter les échelles absentes de la charte
   (`--r-xs/s/m/l`, `--ombre-xs/s/m/l`), que `style.css` ne tokenise pas.
2. **Aucune couleur en dur hors de `:root`.** Contrôle :
   `awk '/^<style>/{f=1;next} /^<\/style>/{f=0} f' outils/mon-outil.html | grep -E "#[0-9a-f]{3,8}|rgba?\("`
   ne doit remonter que les définitions de variables (et les replis littéraux du `.back-link`).
3. **Mode sombre** = un bloc `[data-theme="dark"]` qui redéfinit ces variables, enfermé dans
   `@media screen` pour que l'impression reste claire (même parti pris que `cv/index.html`).
   Attention aux champs (`input`, `select`, `textarea`) sans `background` déclaré : ils restent
   blancs. Poser `color-scheme` pour que les curseurs, listes et ascenseurs natifs suivent.
4. **Anti-FOUC + bascule** : copier le script inline de `_layouts/default.html` et répliquer
   `initDarkMode` de `main.js`. La clé `localStorage` `theme` est partagée avec le site : venir de
   `/outils.html` en mode nuit doit ouvrir l'outil déjà en nuit.
5. **Contenu exporté** : pour un outil qui produit une image ou un PDF, le rendu ne suit **jamais**
   le thème (sinon les exports du soir sortent sur fond sombre). Le mode sombre habille le plan de
   travail, pas le document.

### Incohérences de style restantes (objectif futur)

- **Page CV** (`cv/index.html`, inline) : `--teal: #2a7a5e`, teinte différente de `--color-accent`.
  Autonome pour permettre l'impression propre ; toute unification passe par ses variables inline.
- **Réalisations** (`realisations.css`) : `#2a7a65` hardcodé, `font-family: system-ui`.
- **Autres outils de `outils/`** : chacun a encore sa palette locale (QR Forge `#1d5234` + Manrope,
  encart-gps `#2d7db3` + Inter, implantation-pav `#B91E27`…) et aucun mode sombre. Le seul élément
  déjà commun aux 13 outils est le composant `.back-link`.

---

## JavaScript

### `assets/js/main.js` — Core (IIFE vanilla, `DOMContentLoaded`)

| Fonction | Sélecteur / Hook | Rôle |
|---|---|---|
| `initMobileMenu` | `.hamburger` / `.nav-links` | Menu burger mobile |
| `initDarkMode` | `#theme-toggle` / `localStorage` | Toggle thème |
| `initNavScroll` | `nav` après 80 px scroll | Nav en pill flottante |
| `initProgressBar` | `#progress-bar` | Barre de lecture en haut |
| `initScrollAnimations` | `.animate-on-scroll` (IntersectionObserver) | Révèle les éléments au scroll |
| `initCounters` | `.stat-counter[data-target]` | Compteurs animés |
| `initTypewriter` | `#hero-typewriter` | Effet machine à écrire |
| `initParallax` | `.hero-parallax-bg` | Parallaxe fond héros |
| `initAnimatedTimeline` | `#exp-timeline .tl__item → .is-lit` | Timeline verticale scroll-driven |
| `initHorizontalTimeline` | `#parcours` / `#htl-track` | Timeline horizontale (scroll → translateX) |
| `initTimelineDetails` | `[data-htl-more]` / `#htl-modal` | Lightbox de détail des étapes du parcours |
| `initSkillFilters` | `.filter-btn` / `.skill-card[data-categorie]` | Filtres compétences |
| `initContactForm` | `#contact-form` / `#cf-status` | Envoi du formulaire de contact via EmailJS |

**Config EmailJS** : trois constantes en tête de `main.js`, juste après `'use strict'` :
`EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`. C'est le seul bloc de
configuration globale du fichier. Le template EmailJS consomme `{{from_name}}`, `{{from_email}}`
et `{{message}}` : si ces noms changent côté dashboard, aligner les attributs `name` du
formulaire dans `index.html` **et** les clés de l'objet passé à `emailjs.send()`.

Le formulaire porte un champ honeypot (`name="website"`, classe `.cf-hp` positionnée hors écran) :
s'il est rempli, l'envoi est abandonné en silence. La clé publique EmailJS est faite pour être
exposée côté client ; la protection du quota passe par la restriction de domaine dans le dashboard
EmailJS (Account > Security).

### `assets/js/hero-background.js`

Canvas Perlin noise animé (`#isoline-canvas`) dans la section héros. Indépendant de `main.js`, chargé séparément depuis `default.html`.

### `assets/js/outils.js`

Filtrage des cartes outils par catégorie sur `outils.html`. Filtre `.filter-pill` sur `.outil-card[data-categorie]`.

### `assets/js/realisations.js`

Rendu dynamique des cards portfolio via `RL_ITEMS` (JSON injecté par Jekyll via `{{ site.data.realisations | jsonify }}`). Filtrage par `type` (site / etude / astuce / outil). Animation cascade à l'affichage.

---

## Catalogue des outils (`outils/`)

Toutes les pages sont des applis HTML autonomes (sans layout Jekyll).

### Géomatique & Cartographie

| Fichier | Titre affiché | APIs / libs clés |
|---|---|---|
| `geocodage_adresse_ban.html` | Géocodage adresse | BAN (api.gouv.fr), PapaParse (CSV import) |
| `geocodage_inverse_ban.html` | Géocodage inverse | BAN |
| `isochrones_ORS.html` | Zones isochrones | OpenRouteService (ORS), Leaflet |
| `photomapviewer.html` | Visionneuse photos géolocalisées | Leaflet, EXIF |
| `photogeomanager.html` | Renommage photos GPS | EXIF, SheetJS |
| `extracteurosm.html` | Extraction données OSM | Overpass API, Leaflet |
| `annotateur-carte.html` | Annotation de carte | Leaflet |
| `encart-gps.html` | Badge GPS | BAN, canvas |

### Environnement & Déchets

| Fichier | Titre affiché | Libs clés |
|---|---|---|
| `generateur_calendrier_collecte.html` | Calendrier de collecte | FullCalendar ou logique custom |
| `schemas_dalles.html` | Schémas de dalles (v1) | Canvas |
| `schemas_dalles_v2.html` | Schémas de dalles (v2) | Canvas |
| `implantation-pav.html` | Implantation PAV souterrains | Leaflet |

### Autres outils

| Fichier | Titre affiché | Libs clés |
|---|---|---|
| `qr-code.html` | Générateur QR code | QRCode.js |
| `creation_retroplanning.html` | Rétro-planning | — |
| `optimisation_tournee.html` | Optimisation de tournée | — |

### PWA suivi terrain (`outils/suivi/`)

- `index.html` — Appli de suivi GPS terrain (38,8 KB)
- `manifest.json` — Installable en PWA, `theme_color: #2c5f2d`, icônes SVG data-URI
- `service-worker.js` — Cache offline

---

## Portfolio réalisations (`realisations/`)

### `_data/realisations.yml` → `realisations/index.html`

La page index affiche toutes les entrées YAML sous forme de cards filtrables. Filtres par `type` : `site`, `etude`, `astuce`, `outil`.

### Pages de détail existantes

| Fichier | Sujet |
|---|---|
| `etude-de-cas-redevance-speciale.html` | Power Query pour la redevance spéciale (42,5 KB) |
| `presentation-dashboard.html` | Présentation tableau de bord (31,6 KB) |
| `api-utiles.html` | Guide API open data utiles (35,5 KB) |

---

## CV (`cv/index.html`)

Page entièrement autonome (sans layout Jekyll) :
- Styles CSS variables inline (`--teal: #2a7a5e`, `--teal-dark: #1d5e45`)
- Layout deux colonnes : gauche (expériences), droite (compétences, contact)
- Dark mode propre (variables CSS inline, script autonome)
- Impression propre (media print intégré)
- **Données directement dans le HTML** (pas pilotées par YAML)
- Police : Lora + Source Sans 3

---

## Layouts et includes

### `_layouts/default.html`

- `<head>` complet : charset, viewport, canonical, OG, Twitter Card, JSON-LD (Person + WebPage + BreadcrumbList)
- Google Tag Manager (GTM-KC3LMQP2) dans `<head>` et `<body>`
- Script anti-FOUC dark mode (inline avant CSS)
- Chargement Google Fonts (2 familles : DM Serif Display + Source Sans 3, une seule requête)
- `{% include header.html %}`
- `<main>{{ content }}</main>`
- `{% include footer.html %}`
- `main.js` + `hero-background.js`
- Support front matter : `page.extra_css` et `page.extra_js` (tableaux de chemins)

### `_layouts/page.html`

Hérite de `default`. Ajoute :
- `<section class="page-header">` avec `page.title`, `page.subtitle`, lien retour `← Retour`
- Fond `--color-primary` sur le header

### `_includes/header.html`

- `<nav>` fixe avec logo `YM`
- Liens : Parcours (#parcours), Outils (/outils.html), Réalisations (/realisations/), CV (/cv/), Contact (#contact)
- Bouton toggle dark mode (icône soleil/lune SVG)
- Bouton hamburger mobile

### `_includes/footer.html`

Copyright dynamique via `{{ 'now' | date: '%Y' }}`.

---

## SEO & Analytics

- **Google Tag Manager** : GTM-KC3LMQP2
- **JSON-LD** : Person, WebPage, BreadcrumbList dans chaque page
- **Open Graph + Twitter Card** : titre, description, image (`og-image.png` 1200×630)
- **Sitemap** : généré par `jekyll-sitemap`
- **robots.txt** : autorise tout, pointe vers le sitemap
- **Keywords `_config.yml`** : 40+ termes (SIG, QGIS, déchets, Normandie, cartographie…)

---

## Bibliothèques externes utilisées dans les outils

| Lib | Usage |
|---|---|
| Leaflet.js | Cartographie interactive (isochrones, photomapviewer, OSM, PAV…) |
| PapaParse | Import CSV dans les outils de géocodage |
| SheetJS (xlsx) | Lecture fichiers Excel (photogeomanager) |
| QRCode.js | Génération QR codes |
| Font Awesome | Icônes dans les outils autonomes |
| @emailjs/browser (CDN jsDelivr) | Formulaire de contact ; chargé dans `default.html` sous `{% if page.url == '/' %}`, donc sur l'accueil uniquement |

### APIs externes

| API | Usage |
|---|---|
| BAN (api-adresse.data.gouv.fr) | Géocodage adresse / inverse — gratuite, pas de clé |
| OpenRouteService (ORS) | Isochrones — clé API requise (saisie utilisateur) |
| Overpass API (OSM) | Extraction données OpenStreetMap |
| EmailJS | Envoi du formulaire de contact de l'accueil ; clé publique + service ID + template ID en tête de `main.js` |

---

## Ajouter un outil

1. Créer `outils/mon-outil.html` (page HTML autonome, sans front matter Jekyll)
2. Ajouter une entrée dans `_data/outils.yml` avec `actif: true` et `lien: /outils/mon-outil.html`
3. Optionnel : ajouter `nouveau: true` pour afficher le badge

## Ajouter une réalisation

1. Ajouter une entrée dans `_data/realisations.yml` — la card apparaît automatiquement dans `/realisations/`
2. Si une page de détail est nécessaire, créer `realisations/ma-realisation.html` (layout `page` recommandé)

## Ajouter un item à la timeline parcours

Éditer `_data/timeline.yml` — la timeline horizontale de la section `#parcours` se regénère automatiquement.

---

## `_config.yml` — paramètres clés

```yaml
title: "Yves MARTI"
description: "Expert déchets / SIG / cartographie en Normandie"
profession: "Chargé de mission déchets / SIG"
location: "Normandie, France"
linkedin: yvesmarti
markdown: kramdown
plugins:
  - jekyll-sitemap
exclude:
  - README.md
  - AGENTS.md
  - CLAUDE.md
  - Gemfile
  - Gemfile.lock
```
