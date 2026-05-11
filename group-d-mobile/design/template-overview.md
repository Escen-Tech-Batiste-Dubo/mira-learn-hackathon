# Template Mira Learn Mobile — Groupe D (app Flutter)

Maquette **visuelle** générée via Claude Design, livrée dans `design/template/`. Format **HTML/CSS qui simule un iPhone 14** (390 × 844) — sert de **référence visuelle** aux développeurs Flutter du Groupe D, qui réécriront ces 12 écrans en Dart natif.

> Source : prompts conservés dans `design/template/uploads/` pour traçabilité.
> **Spécificité D** : contrairement aux groupes A/B/C (web React), ce template n'a **pas vocation à être porté ligne par ligne**. C'est un **design handoff** — les étudiants Flutter regardent, prennent des mesures + comportements, et reproduisent en widgets Flutter + Riverpod.

## Comment l'ouvrir

Prototype React standalone (React UMD + Babel standalone, pas de build step). Tous les écrans sont affichés **côte à côte** dans un grand canvas (12 iPhones disposés sur une grille).

```bash
cd hackathon
python3 -m http.server 8765
# Puis ouvrir : http://localhost:8765/group-d-mobile/design/template/index.html
```

Le canvas affiche les 12 écrans simultanément avec le cadre iPhone visible — pas de navigation interactive entre écrans (pas pertinent pour un handoff design vers Flutter).

## Arborescence

```
template/
├── index.html                    Point d'entrée — bootstrap React + scripts JSX
├── styles.css                    Tokens couleurs + fonts + atoms mobile (boutons 48 px, radius 12, padding 20)
├── assets/
│   ├── hellomira.svg             Logo wordmark
│   └── hmira.svg                 Mark seul
├── design-canvas.jsx             Système de canvas (grille d'iPhones avec labels + sections)
├── ios-frame.jsx                 Wrapper iPhone 14 (status bar, notch, home indicator)
├── shared.jsx                    Atoms : Avatar, Chip, BottomNav, FAB, Skeleton, etc.
├── app.jsx                       Orchestrateur — place chaque écran dans un PhoneFrame sur le canvas
├── screens-a.jsx                 4 écrans : Splash, Login, Programmes list, Class detail
├── screens-b.jsx                 3 écrans : Module detail, QCM, QCM result
├── screens-c.jsx                 3 écrans : Note create sheet, Tab Notes (3 modes), Note detail edit
├── screens-d.jsx                 2 écrans : Communauté (Carte + Feed), Profil
└── uploads/
    ├── claude-design-prompt.md             Prompt initial (avec Tutor IA erroné)
    └── claude-design-prompt-3ddfb540.md    Prompt v2 (Tutor IA → Notes + organisation IA par concept)
```

## Mapping des 12 écrans → fichiers → composants Flutter

| # | Écran | Fichier source | Widget Flutter à créer |
|---|---|---|---|
| 1 | Splash | `screens-a.jsx` · `ScreenSplash` | `SplashScreen` (déjà présent dans `template/mobile/lib/features/splash/`) |
| 2 | Login | `screens-a.jsx` · `ScreenLogin` | `LoginScreen` (déjà présent dans `template/mobile/lib/features/login/`) |
| 3 | Programmes list (Tab 1) | `screens-a.jsx` · `ScreenProgrammesList` | `ProgrammesScreen` + `ProgramListCard` |
| 4 | Class detail | `screens-a.jsx` · `ScreenClassDetail` + `ModuleRow` utility | `ClassDetailScreen` + `ModuleListItem` |
| 5 | Module detail (avec FAB `+ Note`) | `screens-b.jsx` · `ScreenModuleDetail` | `ModuleDetailScreen` + `MaterialItem` + `Fab` |
| 6 | QCM (1 question / écran) | `screens-b.jsx` · `ScreenQcm` | `QuizScreen` + `QuizQuestionWidget` + `QuizProgressBar` |
| 7 | Résultat QCM 🎉 | `screens-b.jsx` · `ScreenQcmResult` | `QuizResultScreen` |
| 8 | Note create (bottom sheet) | `screens-c.jsx` · `ScreenNoteCreate` | `NoteCreateSheet` (modalBottomSheet) |
| 9 | Tab Notes (3 modes) | `screens-c.jsx` · `ScreenNotes` | `NotesScreen` + `NoteCard` + `ConceptHeader` |
| 10 | Note detail / édition | `screens-c.jsx` · `ScreenNoteDetail` | `NoteEditScreen` |
| 11 | Tab Communauté (Carte + Feed) | `screens-d.jsx` · `ScreenCommunity` | `CommunityScreen` + `CommunityMapPlaceholder` + `FeedItem` |
| 12 | Tab Profil | `screens-d.jsx` · `ScreenProfile` | `ProfileScreen` + sections Settings |

## Points clés à reproduire en Flutter

### Wow feature — Tab Notes mode "Par concept"

C'est **la fonctionnalité différenciante** de l'app mobile. À reproduire fidèlement :

- Toggle segmented control en haut : `Récentes` / `Par concept` / `Par module`
- Header explicatif card warm-beige : "✨ Tes notes ont été regroupées par concept par Mira AI · dernière analyse il y a 2 h" + bouton ghost `Réorganiser maintenant ↻`
- Sections grouped par concept avec titres Playfair Display 24 px : `Pitch (3 notes)`, `Funding (1 note)`, `Non classées (2 notes)`
- Animation Flutter recommandée : `AnimatedSize` ou `AnimatedList` quand on bascule entre modes (fade + reorder)

### Bottom sheet de création de note

Pattern central :
- Déclenchée par FAB sur n'importe quel écran de module → `showModalBottomSheet`
- Drag handle visible en haut
- Header "Note · Module X" (module source attaché automatiquement)
- Textarea autofocus
- **Suggestions de concepts IA en temps réel** sous le textarea (chips cliquables, débouncées 800 ms via `Timer` ou `Debouncer`)
- Boutons `Annuler` / `Enregistrer`
- Sauvegarde + toast "Note enregistrée"

### QCM avec célébration

- Progress bar haute mira-red filled (`LinearProgressIndicator` ou custom)
- 1 question par écran, transitions slide (Flutter `PageView` ou push avec slideTransition)
- Bouton "Suivant" disabled tant que pas de sélection
- Écran résultat : 🎉 + titre Playfair "Bravo, Anna !" + score + bloc success "Skill validée"

### Communauté

Toggle `Carte` / `Feed` :
- **Carte** : placeholder en MVP (image stylisée + dots pulsants avec `AnimationController`). Vraie carte interactive = post-hackathon (library `flutter_map` + Protomaps).
- **Feed** : `ListView` simple avec `FeedItem` (icône colorée selon kind + texte anonymisé + timestamp + lieu).

## Tokens design appliqués (`styles.css`)

Identiques aux 3 autres templates : `--mira-red #E6332A`, `--warm-beige #EFEAE5`, `--charcoal #1D1D1B`, `--muted #888`, `--gold #D4A853`, `--sage-soft #D6E3D0`, `--beige-deep #E2DCD3`, `--success #16A34A`, `--error #EF4444`.
Fonts : Manrope + Playfair Display via Google Fonts CDN.

**Particularité mobile** : padding latéral 20 px (au lieu de 24+), boutons hauteur 48 px (au lieu de 44), radius 12.

→ Cohérent avec `hackathon/design-system.md` section "Layout mobile".

## Cohérence Flutter — où poser le code

Les étudiants ont déjà un **template Flutter** dans `hackathon/template/mobile/` (généré à l'étape précédente) avec :
- Bootstrap Supabase auth + go_router + Riverpod 2 déjà câblé
- `MiraTheme` avec les tokens couleurs (`MiraTheme.miraRed`, `warmBeige`, etc.)
- 4 onglets stubs : Programmes / Library / Tutor / Profil ⚠️ **à renommer**

### Action J1 : renommer les onglets dans le template Flutter

Les tabs actuels du template (`HomeShell` dans `lib/features/home/home_shell.dart`) sont :
```
📚 Programmes (label "Programmes")
📖 Biblio (label "Bibliothèque")
✨ Tutor (label "Tutor IA")
👤 Profil (label "Profil")
```

À mettre à jour pour matcher le nouveau scope :
```
📚 Programmes  → /home/programs (inchangé)
📝 Notes       → /home/notes    (renommé de "library")
🌍 Communauté  → /home/community (nouveau, remplace "tutor")
👤 Profil      → /home/profile  (inchangé)
```

Mise à jour à faire dans `template/mobile/lib/features/home/home_shell.dart` + `template/mobile/lib/app/router.dart`.

### Mapping écrans → routes Flutter

```
/login                            → screens-a.ScreenLogin
/splash                           → screens-a.ScreenSplash
/home/programs                    → screens-a.ScreenProgrammesList   (Tab 1)
/home/programs/class/{id}         → screens-a.ScreenClassDetail
/home/programs/module/{id}        → screens-b.ScreenModuleDetail + FAB → bottom sheet ScreenNoteCreate
/home/programs/module/{id}/quiz/{quizId}  → screens-b.ScreenQcm + result
/home/notes                       → screens-c.ScreenNotes             (Tab 2 — wow feature)
/home/notes/{noteId}              → screens-c.ScreenNoteDetail
/home/community                   → screens-d.ScreenCommunity         (Tab 3)
/home/profile                     → screens-d.ScreenProfile           (Tab 4)
```

## Limites connues du template

⚠️ **C'est un design handoff, pas un code à porter** :
- Le canvas affiche les 12 écrans en parallèle, sans navigation interactive entre eux
- Aucun appel API simulé (les données affichées sont hardcodées dans `shared.jsx` / chaque screen)
- Aucune logique d'état (state local React simple, pas de simulation d'auth, pas de persistance)
- Pas d'animations Flutter — les transitions doivent être codées en Dart

**Manques par rapport au scope BRIEF.md** :
1. Le détail d'un module ne montre pas en richesse comment `student_quiz_answer` / `student_quiz_attempt` sont matérialisés (à inférer depuis la partie "résultat QCM")
2. La création note utilise des suggestions IA simulées — l'intégration OpenRouter reste à coder
3. La carte communauté est un placeholder statique — vraie carte interactive en V2

## Prochaines actions Groupe D (J1-J3)

1. **J1 matin** : lecture du template + brief → distribution stories
2. **J1 après-midi** :
   - Renommage des onglets (`template/mobile/lib/features/home/`)
   - Setup iOS Simulator + Android Emulator (1ère build prend ~5 min, lancer tôt)
   - Implémentation Tab Programmes : `ProgrammesScreen` + `ClassDetailScreen` + appels API `/v1/me/enrolments`
3. **J2 matin** : `ModuleDetailScreen` + FAB → `NoteCreateSheet` (bottom sheet) + persistance notes via backend
4. **J2 après-midi** : Tab Notes 3 modes + intégration OpenRouter pour suggestions concepts en temps réel + organisation IA
5. **J3 matin** : QCM (1 question/écran) + résultat + validation skill backend + Tab Communauté (feed + placeholder carte)
6. **J3 après-midi** : Tab Profil + paramètres + démo storytelling Anna end-to-end + iOS Simulator demo
