# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

---

## Contexte du projet

Portfolio professionnel de **Yves Marti** — chargé de mission déchets & SIG en Normandie. Site statique Jekyll hébergé sur GitHub Pages, entièrement en français.

URL de production : https://yvesmarti.github.io

---

## Commandes utiles

### Développement local

```bash
bundle install          # Installer les dépendances Ruby (première fois)
bundle exec jekyll serve  # Lancer le serveur local → http://localhost:4000
bundle exec jekyll build  # Générer le site dans _site/
```

Le site se déploie automatiquement sur GitHub Pages à chaque push sur `main`. Il n'y a pas de pipeline CI/CD supplémentaire, pas de tests automatisés.

---

## Architecture du site

### Structure générale

Le site mélange deux modes de fonctionnement :

**Pages Jekyll (avec layout)** — utilisent `_layouts/default.html` ou `_layouts/page.html` :
- `index.html` — Page d'accueil, layout `default`
- `outils.html` — Liste des outils, layout `page`
- `realisations/index.html` — Portfolio réalisations, layout `default` avec CSS/JS dédiés
- `realisations/*.html` — Pages de détail des réalisations, layout `page` ou `default`

**Pages autonomes (sans layout Jekyll)** — HTML/CSS/JS auto-contenus, pas de nav/footer partagés :
- `cv/index.html` — CV interactif, optimisé impression, styles inline
- `outils/*.html` — Outils web fonctionnels (géocodage, isochrones, etc.)
- `outils/suivi/index.html` — PWA de suivi terrain (service worker inclus)

### Layouts

`_layouts/default.html` — layout maître : head complet (SEO, Open Graph, JSON-LD, GTM), `_includes/header.html`, `<main>{{ content }}</main>`, `_includes/footer.html`, chargement de `main.js` et optionnellement `page.extra_js`/`page.extra_css`.

`_layouts/page.html` — hérite de `default`, ajoute automatiquement une section `.page-header` avec titre (`page.title`) et sous-titre (`page.subtitle`) sur fond `--color-primary`.

### Données (`_data/`)

Tout le contenu modifiable est dans des fichiers YAML :

| Fichier | Utilisé dans |
|---|---|
| `timeline.yml` | Timeline horizontale défilante — section `#parcours` de `index.html` |
| `competences.yml` | Grille de compétences filtrables — section `section-dark` de `index.html` |
| `stats.yml` | Compteurs animés — section `section-dark` de `index.html` |
| `outils.yml` | Catalogue d'outils par catégorie — `outils.html` |
| `realisations.yml` | Cards du portfolio — injecté en JSON dans `realisations/index.html` via `{{ site.data.realisations | jsonify }}` |
| `experiences.yml` | Non utilisé directement côté front à ce jour |
| `formations.yml` | Non utilisé directement côté front à ce jour |

---

## Système de design — état actuel

### Variables CSS principales (`assets/css/style.css`)

```css
--color-primary: #1a3a32   /* vert forêt foncé — héros, sections sombres, nav */
--color-accent:  #3d8b6e   /* vert moyen — liens, accents, bordures actives */
--color-light:   #f7f9f8   /* fond clair principal */
--color-warm:    #e8ded4   /* fond beige chaleureux — sections intermédiaires */
--color-text:    #2c2c2c
--color-muted:   #6b7c75
```

**Typographie** — toutes chargées depuis Google Fonts :
- `--font-display: 'DM Serif Display'` — titres H1/H2, `.lead`, citations
- `--font-body: 'Source Sans 3'` — corps de texte par défaut
- `'Space Grotesk'` (700) — timeline HTL, titres géo
- `'Space Mono'` — dates monospace, hints
- `'Outfit'` (700) — titres de postes `.tl__title`
- `'Lora'` (italic) — descriptions `.tl__desc`

**Mode sombre** — basculement via `[data-theme="dark"]` sur `<html>`, persisté dans `localStorage`. Un script inline dans `<head>` (anti-FOUC) le restaure avant le rendu. Les variables CSS sont surchargées dans `[data-theme="dark"] { ... }`.

### Incohérences de style à unifier (objectif déclaré)

Trois systèmes de couleurs coexistent actuellement :

1. **Style principal** (`style.css`) — accent : `#3d8b6e`
2. **Page CV** (`cv/index.html`, styles inline) — utilise `--teal: #2a7a5e` (teinte différente), pas de dark mode, `font-family: Lora + Source Sans 3`
3. **Réalisations** (`realisations.css`) — utilise `#2a7a65` hardcodé, `font-family: system-ui` au lieu de `Source Sans 3`

La page CV est entièrement autonome pour permettre l'impression propre. Si l'on unifie ses couleurs, il faudra modifier les variables CSS inline dans `cv/index.html`.

### Séparateurs en vague SVG

Les vagues entre sections utilisent des `<path fill="COULEUR_HARDCODÉE">`. Le dark mode les surcharge via :
```css
[data-theme="dark"] .wave-separator path[fill="#f7f9f8"] { fill: #131e17; }
```
**Important** : si une couleur de fond de section change, il faut mettre à jour à la fois le `fill` dans le HTML **et** la règle CSS du dark mode correspondante.

---

## JavaScript (`assets/js/main.js`)

IIFE vanilla JS (pas de framework), 11 fonctions d'initialisation appelées sur `DOMContentLoaded` :

| Fonction | Rôle |
|---|---|
| `initMobileMenu` | Menu burger mobile |
| `initDarkMode` | Toggle thème + localStorage |
| `initNavScroll` | Nav en pill flottante après 80 px de scroll |
| `initProgressBar` | Barre de lecture verte en haut |
| `initScrollAnimations` | IntersectionObserver sur `.animate-on-scroll` |
| `initCounters` | Compteurs animés `.stat-counter[data-target]` |
| `initTypewriter` | Effet machine à écrire sur `#hero-typewriter` |
| `initParallax` | Parallaxe du dégradé héros `.hero-parallax-bg` |
| `initAnimatedTimeline` | Timeline verticale `#exp-timeline` (scroll-driven, `.tl__item → .is-lit`) |
| `initHorizontalTimeline` | Timeline horizontale `#parcours` / `#htl-track` (scroll converti en translateX) |
| `initIsolines` | Canvas Perlin noise animé `#isoline-canvas` dans le héros |
| `initSkillFilters` | Filtres `.filter-btn` sur `.skill-card[data-categorie]` |

`assets/js/realisations.js` — rendu dynamique des cards via `RL_ITEMS` (JSON injecté par Jekyll), filtrage par type.

---

## Ajouter un outil

1. Créer `outils/mon-outil.html` (page HTML autonome, sans layout Jekyll)
2. Ajouter une entrée dans `_data/outils.yml` avec `actif: true` et le bon `lien:`

## Ajouter une réalisation

1. Ajouter une entrée dans `_data/realisations.yml` — la card apparaît automatiquement
2. Si une page de détail est nécessaire, créer `realisations/ma-realisation.html` (layout `page` ou `default`)
