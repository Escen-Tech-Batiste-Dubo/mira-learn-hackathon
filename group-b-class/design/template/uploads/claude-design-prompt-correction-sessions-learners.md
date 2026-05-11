# Prompt Claude Design — Groupe B — Correction & Add-on : vues agrégées Sessions + Apprenants

> Prompt d'incrément à coller dans Claude Design pour corriger une erreur de scope + générer les 2 vues agrégées qui étaient en placeholder.

---

## CONTEXTE (RAPPEL TRÈS COURT)

La maquette Mira Mentor Backoffice (Groupe B — dashboard, classes, édition class à 4 tabs, éditeur QCM avec génération IA) est déjà faite et fonctionne. Mêmes tokens : `#E6332A` mira-red, `#EFEAE5` warm-beige, `#1D1D1B` charcoal, `#D4A853` gold, fonts Manrope + Playfair Display, cards radius 16 sans ombre, boutons radius 12 hauteur 44, sidebar persistante 240 px.

## CORRECTION À FAIRE

Dans le prototype actuel, les routes `#/dashboard/sessions` et `#/dashboard/learners` affichent un placeholder avec ce texte :

> **Vue agrégée — Groupe C**
> Cette vue est livrée hors scope du Groupe B.

**C'est faux.** Le Groupe C est le front public apprenant (catalogue + parcours d'apprentissage), pas un dashboard mentor. Les vues agrégées Sessions et Apprenants sont **dans le scope du Groupe B** — ce sont des vues qui permettent au mentor de voir toutes ses sessions / tous ses apprenants à plat, indépendamment de la classe.

→ Il faut **supprimer ce placeholder** et **générer les deux vraies vues**.

## VUE 1 — `/dashboard/sessions` (agrégée toutes classes)

Le mentor voit ici **toutes les sessions** qu'il anime, à plat, toutes Mira Class confondues. C'est sa vue "agenda opérationnel".

### Header de page

- TopBar avec breadcrumb `Sessions`
- Titre h1 Manrope 28 semibold "Sessions"
- Sous-titre muted : "Toutes tes sessions, toutes classes confondues."
- Bouton primary à droite `+ Nouvelle session` (ouvre un drawer de création — l'utilisateur choisit d'abord à quelle class la session est rattachée)

### Filtres (chips en row sous le header)

- Status (segmented control) : `Toutes` · `Planned` · `Open enrolment` · `Full` · `In progress` · `Completed` · `Cancelled`
- Class (dropdown multi-select)
- Type (chips toggle) : `Physique` · `Virtuel` · `Hybride`
- Période (date range picker simple) : "Démarre entre [date] et [date]"
- Lien ghost `Reset filters`

### Tableau / liste de sessions

Préférer un **layout list-style dense** (style Linear), pas une grid de cards. 1 ligne par session, hover row :

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📍 Barcelone, Espagne                                  [open_enrolment]│
│    Pitcher pour lever 500k €                                            │
│    5-26 juillet 2026 · hybride · 3/8 inscrits · 1 waitlist · 80 €      │
│                                              [Gérer →]                  │
├────────────────────────────────────────────────────────────────────────┤
│ 🌐 Virtuel                                                  [planned]   │
│    UI Design pour SaaS B2B                                              │
│    1er-29 septembre · live virtuel · 0/10 inscrits · 60 €              │
│                                              [Gérer →]                  │
├────────────────────────────────────────────────────────────────────────┤
│ 📍 Lisbonne, PT                                          [completed]    │
│    Growth B2B en 8 semaines                                             │
│    Mars-mai 2026 · physique · 5/8 inscrits · 49 €                       │
│                                              [Voir bilan →]            │
└────────────────────────────────────────────────────────────────────────┘
```

Status badge inline avec les couleurs du design system. Click sur la ligne → ouvre `/dashboard/classes/{class_id}?tab=sessions&session={session_id}` (réutilise l'éditeur de session existant).

### Empty state

Si pas de sessions : empty state centré avec icône Lucide Calendar, titre "Aucune session pour l'instant", sous-titre "Crée ta première session depuis une de tes classes." + bouton primary `Voir mes classes`.

## VUE 2 — `/dashboard/learners` (agrégée toutes classes)

Le mentor voit ici **tous les apprenants** qui ont une relation avec lui (inscrits, en waitlist, candidats), à plat, toutes Mira Class confondues. C'est sa "vue CRM" mentor.

### Header de page

- TopBar avec breadcrumb `Apprenants`
- Titre h1 Manrope 28 semibold "Apprenants"
- Sous-titre muted : "Tous tes apprenants, toutes classes et sessions confondues."
- Pas de bouton primary (le mentor ne crée pas d'apprenant)

### Filtres (chips en row sous le header)

- Status enrolment (segmented) : `Tous` · `Applied` · `Accepted` · `Waitlist` · `Cancelled` · `Completed`
- Class (dropdown multi-select)
- Session (dropdown multi-select dépendant de la class sélectionnée)
- Tri (chip primary) : `Plus récent` · `Plus ancien` · `Nom A→Z`
- Lien ghost `Reset filters`

### Tableau / liste d'apprenants

Liste dense, 1 ligne par apprenant **× session** (un même apprenant inscrit à 2 sessions apparaît 2 fois). Hover row pour révéler les actions :

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◯ Anna Lopez                                              [applied]      │
│   Pitcher pour lever 500k € · Session Barcelone                          │
│   il y a 2 h · « Je veux passer du design à la levée. »                  │
│                                          [Refuser] [Accepter]             │
├──────────────────────────────────────────────────────────────────────────┤
│ ◯ Pierre Lambert                                          [waitlist]     │
│   Pitcher pour lever 500k € · Session Barcelone                          │
│   il y a 1 j · capacité atteinte                                          │
│                                          [Déplacer en active →]           │
├──────────────────────────────────────────────────────────────────────────┤
│ ◯ Nora Ahmed                                              [accepted]     │
│   Pitcher pour lever 500k € · Session Barcelone                          │
│   il y a 12 j · session démarre dans 7 sem                                │
│                                          ✓ Active                          │
├──────────────────────────────────────────────────────────────────────────┤
│ ◯ Marco Silva                                             [accepted]     │
│   UI Design pour SaaS B2B · Session septembre                            │
│   il y a 5 j · session démarre dans 12 sem                                │
│                                          ✓ Active                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Avatar + nom + status badge + class · session + timestamp + extrait motivation (si applied). Actions inline selon status (mêmes que dans `ClassEdit.jsx` tab Enrolments).

### Click sur une ligne

Ouvre un **drawer side-panel à droite** (50% largeur écran) avec la fiche apprenant détaillée :
- Avatar large + nom + bio + 📍 country
- Skills cibles + skills validées
- Toutes ses inscriptions chez ce mentor (s'il en a plusieurs)
- Réponses au form personnalisé (si applicable)
- Commentaire libre du mentor (textarea)
- Actions : Refuser / Accepter / Déplacer / Annuler selon status

### Empty state

Si pas d'apprenants : icône Users line-art, titre "Personne ne s'est encore inscrit", sous-titre "Publie ta première session pour ouvrir les inscriptions."

## CONTRAINTES D'INTÉGRATION

- **Cohérence sidebar** : ces 2 vues utilisent la sidebar persistante 240 px existante (items "Sessions" et "Apprenants" déjà présents — ils étaient juste mal câblés).
- **Cohérence atoms** : utiliser les composants existants (`Btn`, `StatusBadge`, `Avatar`, `TopBar`, `Chip`) — ne pas réinventer.
- **Densité backoffice** : style Linear / Notion DB views — lignes serrées (hauteur 64 px env.), hover révèle les actions, click ouvre détail ou drawer.
- **Personas** : utiliser les mêmes que le reste du proto :
  - Mentor connecté = Antoine Martin
  - Apprenants : Anna Lopez (applied), Pierre Lambert (waitlist), Nora Ahmed (accepted), Marco Silva (accepted sur class de Marie), Samuel Nguyen (cancelled)
  - Sessions : Barcelone (open_enrolment), Virtuelle UI Design (planned), Lisbonne Growth (completed)

## DEMANDE FINALE

1. **Supprime les 2 placeholders** actuels sur `/dashboard/sessions` et `/dashboard/learners` (avec le texte erroné "Groupe C")
2. **Génère les 2 vraies vues** décrites ci-dessus :
   - `Sessions.jsx` (liste dense filtrable de toutes les sessions du mentor)
   - `Learners.jsx` (liste dense filtrable de toutes les inscriptions × apprenants, avec drawer détail)
3. Met à jour `app.jsx` pour câbler les routes vers ces nouveaux composants au lieu du `SimplePlaceholder`
4. Met à jour `sidebar.jsx` si nécessaire (compteurs corrects)

Une fois généré, montre-moi un récap des 2 nouvelles vues côte à côte avec les vues existantes pour vérifier la cohérence visuelle.
