# Portfolio 3D — Damien Sabau

Un CV interactif en WebGL : une pièce sombre remplie de télés cathodiques. Le menu s'affiche dans la télé principale, chaque section s'allume sur sa propre télé, et les projets sont des cassettes VHS à glisser dans un magnétoscope.

## Ce qu'on peut faire

- Naviguer dans le guide des chaînes au clavier, à la souris ou au toucher
- Tourner le bouton chromé pour zapper (mire, chaînes vides, terminal caché sur le canal 12)
- Cliquer une cassette pour lire la fiche d'un projet
- Éteindre la pièce avec la lampe posée sur la télé
- Passer du français à l'anglais
- Ouvrir une version texte du CV, accessible et sans 3D

## Lancer en local

Le site est une seule page statique, `index.html`. Il faut la servir en HTTP (les modules ES ne marchent pas en `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Three.js 0.160 est chargé depuis jsDelivr via une import map.

## Modifier le contenu

Les sources sont découpées dans `src/` et assemblées en `index.html` par `build.py` :

| Fichier | Rôle |
| --- | --- |
| `src/00_head.html` | Titre, styles, interface HTML, import map |
| `src/10_content.js` | Contenu du CV en français, liens, photo et captures |
| `src/11_content_en.js` | Contenu en anglais |
| `src/20_boot.js` | Mire de chargement, version texte |
| `src/30_engine.js` | Rendu, matériaux, pièce, shader CRT |
| `src/41..43_screens_*.js` | Dessin des écrans (menu, sections, projets, terminal) |
| `src/50_world.js` | Construction des télés |
| `src/55_props.js` | Meuble, magnétoscope, cassettes, lampe |
| `src/60..80_*.js` | Caméra, sons, état, interactions, boucle de rendu |

Après une modification :

```bash
python3 build.py
```

### Ajouter des images

Dans `src/10_content.js`, renseigner `MEDIA.photo` et `MEDIA.shots[id]` avec le chemin d'une image placée à côté de `index.html` (par exemple `img/photo.jpg`). Sans image, un aperçu dessiné s'affiche avec la mention « capture à venir ».

## Test sans navigateur

`test/run.mjs` exécute toute la logique avec un faux three.js et un faux DOM (boot, zapping, terminal, cassettes, lumière, langue, clics) et signale les erreurs :

```bash
python3 build.py && node test/run.mjs
```
