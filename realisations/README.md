# Handoff Design — Page Réalisations (Variante A)

## Vue d'ensemble

Redesign de la page `realisations/index.html` du portfolio [yvesmarti.github.io](https://yvesmarti.github.io).

L'objectif est de **conserver la cohérence visuelle** du reste du site (blanc, typographie neutre, sobre) tout en donnant à la section Réalisations une identité légèrement distincte : mise en page plus riche, grille de cards, filtres interactifs et animations légères au survol.

---

## À propos des fichiers fournis

> **Les fichiers HTML de ce package sont des références de design** — des prototypes montrant l'apparence et le comportement souhaités. La tâche est de **recréer ce design dans l'environnement existant du dépôt** (Jekyll + GitHub Pages), en s'appuyant sur ses conventions de structure de fichiers, ses layouts et ses includes existants.
>
> Ne pas copier le HTML tel quel — l'adapter aux templates Liquid/Jekyll du site.

**Fichier de référence principal :** `realisations-variant-a.html`

---

## Fidélité

**Haute fidélité.** Les couleurs, la typographie, les espacements et les transitions sont finaux et doivent être reproduits avec précision.

---

## Structure de la page

### 1. Navigation

Identique au reste du site. Lien « Réalisations » marqué comme actif (`font-weight: 700`, `border-bottom: 1.5px solid #111`).

### 2. Hero

| Propriété | Valeur |
|---|---|
| Padding | `3.5rem 2.5rem 2.5rem` |
| Bordure basse | `1px solid #ece9e3` |
| Eyebrow | `font-size: .72rem`, `letter-spacing: .12em`, `text-transform: uppercase`, `color: #888` |
| Titre `<h1>` | `font-size: 2.4rem`, `font-weight: 700`, `letter-spacing: -.02em`, `color: #111` |
| Sous-titre | `font-size: .95rem`, `color: #666`, `max-width: 520px`, `line-height: 1.65` |

### 3. Barre de filtres

Filtre par type de contenu via des **pills cliquables**. Un seul filtre actif à la fois. Un compteur de résultats s'affiche à droite (`color: #999`).

**Filtres disponibles :**
- Tout
- Étude de cas → `type: "etude"`
- Astuce → `type: "astuce"`
- Outil → `type: "outil"`
- Site web → `type: "site"`

**Styles des pills :**

| État | Background | Bordure | Couleur texte |
|---|---|---|---|
| Repos | `#f4f2ee` | `1.5px solid #e5e2dc` | `#555` |
| Hover | `#e8f4f0` | `1.5px solid #6abfaa` | `#2a7a65` |
| Actif | `#2a7a65` | `1.5px solid #2a7a65` | `#fff` |

Transition : `all 0.18s ease`

### 4. Grille de cards

**Layout :** `display: grid`, `grid-template-columns: repeat(3, 1fr)`, `gap: 1.25rem`

Points de rupture responsive :
- `≤ 900px` → 2 colonnes
- `≤ 580px` → 1 colonne

---

## Composant Card

### Structure

```
.card
  .card-thumb        ← zone emoji/image (hauteur fixe 148px)
  .card-body
    .card-tags       ← badge de type
    h2.card-title
    p.card-desc
    .card-footer
      .card-meta-tags  ← tags techniques (#Excel, #APIs…)
      a.card-link      ← "Lire →"
```

### Styles de la card

| Propriété | Valeur |
|---|---|
| Bordure | `1.5px solid #ece9e3` |
| Border-radius | `10px` |
| Background | `#fff` |

**État hover :**
- `transform: translateY(-5px)`
- `box-shadow: 0 14px 36px rgba(0,0,0,.09)`
- `border-color: #6abfaa`
- Transition : `0.22s ease`

### Thumbnail `.card-thumb`

- Hauteur : `148px`
- Background : `#f7f5f1`
- Emoji centré, `font-size: 2.4rem`
- Pseudo-élément `::after` : overlay dégradé teinté vert très léger
  ```css
  background: linear-gradient(135deg,
    oklch(55% .12 182 / .06) 0%,
    oklch(55% .12 182 / .14) 100%);
  ```

> **Note :** Si des captures d'écran réelles des projets sont disponibles, elles peuvent remplacer l'emoji en tant qu'`<img>` dans `.card-thumb`. L'overlay dégradé s'applique dans les deux cas.

### Badges de type

| Type | Background | Couleur texte |
|---|---|---|
| `etude` (Étude de cas) | `#f0faf6` | `#2a7a65` |
| `astuce` | `#fff8ed` | `#b87a00` |
| `outil` | `#f0f4ff` | `#4060c0` |
| `site` (Site web) | `#fdf0f8` | `#9040a0` |

Style commun : `font-size: .68rem`, `letter-spacing: .06em`, `text-transform: uppercase`, `font-weight: 700`, `border-radius: 4px`, `padding: .22rem .6rem`

### Tags techniques

Affichés sous forme de `#tag` (`color: #aaa`, `font-size: .65rem`). Pas de comportement interactif.

### Lien "Lire →"

- `font-size: .78rem`, `font-weight: 700`, `color: #2a7a65`
- La flèche `→` se décale de `+3px` en `translateX` au hover de la card (transition `0.18s ease`)

---

## Tokens de design

### Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `--color-text` | `#111` | Titres, texte principal |
| `--color-text-muted` | `#666` | Descriptions |
| `--color-text-light` | `#999` / `#aaa` | Compteur, meta |
| `--color-border` | `#ece9e3` | Bordures cards, séparateurs |
| `--color-bg-subtle` | `#f4f2ee` | Pills, thumbnail |
| `--color-accent` | `#2a7a65` | Accent vert sauge — pills actives, liens, badges étude |
| `--color-accent-hover-bg` | `#e8f4f0` | Hover pill |
| `--color-accent-border-hover` | `#6abfaa` | Hover pill + card |
| `--color-badge-astuce` | `#b87a00` / `#fff8ed` | Badge astuce |
| `--color-badge-outil` | `#4060c0` / `#f0f4ff` | Badge outil |
| `--color-badge-site` | `#9040a0` / `#fdf0f8` | Badge site |

### Typographie

Le site utilise `system-ui, -apple-system, sans-serif`. Pas de font externe à importer.

| Élément | Taille | Poids | Autre |
|---|---|---|---|
| Eyebrow | `.72rem` | 400 | uppercase, `letter-spacing: .12em` |
| `<h1>` hero | `2.4rem` | 700 | `letter-spacing: -.02em` |
| Sous-titre hero | `.95rem` | 400 | `line-height: 1.65` |
| Titre card | `.95rem` | 700 | `line-height: 1.35` |
| Description card | `.80rem` | 400 | `line-height: 1.58` |
| Badge | `.68rem` | 700 | uppercase |
| Pill filtre | `.78rem` | 500 | — |
| Nav links | `.85rem` | 400 | — |

### Espacements clés

| Zone | Valeur |
|---|---|
| Padding page (horizontal) | `2.5rem` |
| Padding hero (vertical) | `3.5rem` haut, `2.5rem` bas |
| Gap grille | `1.25rem` |
| Padding card-body | `1.1rem 1.2rem 1.3rem` |

### Ombres

| État | Valeur |
|---|---|
| Card hover | `0 14px 36px rgba(0,0,0,.09)` |

---

## Comportement interactif (JavaScript)

La logique de filtrage est en vanilla JS pur — à adapter selon l'environnement cible :

1. Clic sur un pill → retire `.active` de tous, applique `.active` au pill cliqué
2. Filtre les `items` par `type` (ou affiche tout si filtre = `"all"`)
3. Met à jour le compteur `"N résultat(s)"`
4. Re-rend la grille

Les données des items peuvent être :
- Gérées statiquement dans un fichier `_data/realisations.yml` (Jekyll)
- Lues depuis le front matter des pages de collection `_realisations/`

---

## Structure de données d'un item

```yaml
# _data/realisations.yml  (exemple)
- id: 1
  title: "Auto-École Marti"
  desc: "Site vitrine pour l'auto-école familiale..."
  type: site          # etude | astuce | outil | site
  tags: [HTML, CSS, Jekyll]
  emoji: "🚗"         # ou chemin vers une image
  url: "https://autoecolemarti.fr"
```

---

## Assets

- Pas de police externe
- Pas d'icônes SVG — les emojis font office de visuels provisoires
- Capture d'écran `preview-autoecole-marti.png` déjà présente dans `assets/images/` du dépôt → peut être utilisée comme thumbnail en remplacement de l'emoji

---

## Fichiers fournis

| Fichier | Description |
|---|---|
| `realisations-variant-a.html` | Page de référence complète, interactive, avec filtres fonctionnels |
| `README.md` | Ce document |

---

## Remarques pour l'implémentation Jekyll

- La page cible est `realisations/index.html` (ou `realisations/index.md` avec layout)
- Utiliser le layout existant pour la nav et le footer
- Le CSS spécifique à la page peut aller dans un fichier `assets/css/realisations.css` ou dans un bloc `<style>` dans le front matter via un layout dédié
- La logique JS de filtrage peut être un fichier `assets/js/realisations.js`
- Si les réalisations deviennent nombreuses, envisager une collection Jekyll `_realisations/` avec un fichier par entrée

---

*Package généré le 29 avril 2026.*
