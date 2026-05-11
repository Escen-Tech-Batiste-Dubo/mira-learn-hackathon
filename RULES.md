# Les 7 règles du hackathon Mira Learn

> Pour que ton travail reste **reprenable** par l'équipe Hello Mira après les 3 jours.

---

## 1. Le design system est intouchable
Couleurs, fonts, atoms : **uniquement depuis les tokens Mira** (`hackathon/design-system.md`).
Pas de hex custom, pas de Inter/Roboto à la place de Manrope, pas de remplacement de Playfair Display.

## 2. JSend partout côté API
Toutes les réponses HTTP renvoient `{ status, data, message }`.
Pas de retour brut, pas de wrapper maison, pas d'exception ad hoc.

## 3. Les contracts sont figés
Les schémas livrés (migrations `0001_*` + `0002_*`, fichiers `contracts/group-X-*/*.md`) sont **la source de vérité**.
Pour évoluer un schéma : nouvelle migration `0003+`. Pas de modif des migrations existantes.

## 4. Rien en dur
URLs, clés, ports, hosts, secrets : **tout via `.env`** (`process.env.X` / `os.getenv("X")` / `Env.x`).
Aucune valeur sensible dans le code.

## 5. Type strict, zéro `any`
- TypeScript : `strict: true` activé.
- Python : Pydantic au boundary (request/response), pas de `dict[str, Any]` qui traverse les couches.
- Dart : `strict-casts`, `strict-inference`, pas de `dynamic` non typé.

## 6. Commits atomiques et structurés
Format : `type(scope): message` — `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
**1 commit = 1 changement** qui peut être relu en 30 secondes.

## 7. Reste dans ton groupe
Chaque équipe travaille dans `group-X-*/`. Pas de modif chez le voisin.
Pour partager du code ou aligner un contract : **demande au mentor HLMR**, on fait la coordination.

---

> **Question avant d'agir :** "Si un encadrant Hello Mira reprend ma PR lundi matin, est-ce qu'il comprend tout en 5 minutes ?"

Si la réponse est non, applique les 7 règles.
