# CLAUDE.md — Groupe D — Mobile

> Contexte automatiquement chargé par Claude Code / Cursor. Lis aussi le [`CLAUDE.md` racine](../CLAUDE.md) pour les règles globales et [`BRIEF.md`](./BRIEF.md) pour le scope fonctionnel.

## Mission du groupe

Construire l'**app mobile compagne** Mira Learn (iOS + Android via Flutter) que l'apprenant utilise au quotidien en café à Bali ou en coworking à Lisbonne :
- **Onglet Programmes** : class inscrites + modules + QCM
- **Onglet Notes** (wow feature) : prise rapide de notes + **organisation IA par concept** (pattern Reflect / Notion AI)
- **Onglet Communauté** : feed activité anonymisé + carte sessions actives
- **Onglet Profil** : skills validées + paramètres

Persona connectée pour la démo : **Anna Lopez** (inscrite à la class "Pitcher pour lever 500k €" d'Antoine, prend 3 notes pendant le module 1, passe le QCM avec 4/5, valide la skill `Pitch investor`).

## Stack

- Backend : `backend/` — FastAPI + alembic + JSend (port 8000)
- Mobile : `mobile/` — **Flutter 3.41** + Riverpod 2 + go_router + Supabase + Dio
- DB : Postgres 16 local via `docker-compose.yml` (port 5432)

⚠️ **Spécificité D** : le template Flutter dans `mobile/` est **autonome** (pas dépendant des packages `mira_*` du monorepo officiel). Chaque chose dont l'app a besoin (auth, theme, router, API client) est inclus localement avec un commentaire `MIGRATION HINT` indiquant comment basculer vers l'équivalent monorepo post-hackathon.

## Contrats à respecter

Source de vérité : [`../contracts/group-d-mobile/`](../contracts/group-d-mobile/) + [`../contracts/shared/skill.md`](../contracts/shared/skill.md).

### Tables possédées (write) par le Groupe D

| Entité | Description |
|---|---|
| `student_note` | Note prise par l'apprenant pendant un module |
| `student_note_organization` | Concept extrait par IA + notes regroupées (cluster) |
| `student_quiz_attempt` | Tentative de QCM (1 par lancement) |
| `student_quiz_answer` | Réponse de l'apprenant à une question dans une tentative |
| `community_activity_feed` | Feed anonymisé (`skill_validated`, `class_completed`, `session_started`) |

### Tables cross-group (lecture seule pour vous)

| Entité | Source | Usage |
|---|---|---|
| `mira_class` | Groupe A | Lis pour afficher la class inscrite |
| `mira_class_module` + variantes | Groupe B | Lis pour afficher modules + QCM |
| `mira_class_module_quiz*` | Groupe B | Lis questions + options |
| `mira_class_enrolment` | Groupe B | Lis pour savoir à quelles class l'apprenant est inscrit |
| `student_profile` + `student_skill` | Groupe C | Lis profil + skills + écris `student_skill` quand un quiz est validé (status `target → validated`) |

### Règles immuables

⚠️ **Les schémas SQL sont figés.** Les migrations `0001_*` et `0002_*` sont déjà appliquées. Pour évoluer : `0003+`.

CHECK constraints à respecter :
- `student_note.source_type` IN (`class_module | mira_class | free`) — où la note est attachée
- `community_activity_feed.kind` IN (`skill_validated | class_completed | session_started | module_completed | quiz_passed`)
- `student_quiz_attempt.status` IN (`in_progress | completed | abandoned`)
- `student_quiz_attempt.score_percent` BETWEEN 0 AND 100

## Patterns courants

### Ajouter un endpoint FastAPI

Mêmes patterns que les autres groupes (FastAPI + JSend + Pydantic + alembic). Voir `app/api/examples.py` pour le pattern de référence.

### Création d'une note depuis le mobile

```dart
// mobile/lib/features/notes/notes_provider.dart
class NotesNotifier extends AsyncNotifier<List<StudentNote>> {
  Future<void> createNote({
    required String moduleId,
    required String body,
  }) async {
    final api = ref.read(apiClientProvider);
    final data = await api.post('/v1/me/notes', body: {
      'source_type': 'class_module',
      'source_id': moduleId,
      'body': body,
    });
    final note = StudentNote.fromJson(data);
    state = AsyncData([note, ...state.value ?? []]);
  }
}
```

### Organisation IA des notes par concept

Wow feature — pattern central :

```python
# backend : app/api/notes.py
@router.post("/v1/me/notes/organize", response_model=dict)
async def organize_notes(
    user: AuthenticatedUser = Depends(require_role("nomad")),
    db: AsyncSession = Depends(get_session),
):
    # 1. Charger toutes les notes de l'apprenant
    notes = await db.execute(
        select(StudentNote).where(StudentNote.user_id == user.user_id)
    )
    # 2. Prompt OpenRouter pour grouper par concept
    prompt = f"""Regroupe les notes suivantes par concept thématique.

Notes :
{json.dumps([{"id": n.id, "body": n.body} for n in notes.scalars()])}

Réponds au format JSON :
{{"concepts": [
  {{"name": "Pitch", "note_ids": ["...", "..."]}},
  {{"name": "Funding", "note_ids": ["..."]}}
]}}
"""
    result = await LLMClient.complete(prompt, model="anthropic/claude-3.5-haiku")
    # 3. Insérer dans student_note_organization
```

### QCM mobile — soumission

Pattern : à la fin du quiz, le client envoie le `student_quiz_attempt` complet (avec les `student_quiz_answer`), le backend valide les réponses, calcule le score, et — si passing — crée/upgrade le `student_skill` en `status=validated`.

## Composants design (Flutter)

Source : `design/template/screens-*.jsx` — **maquettes visuelles HTML/CSS qui simulent un iPhone**. C'est un **handoff design**, pas du code Flutter à porter ligne par ligne. Le template Flutter dans `mobile/` est ton vrai point de départ code.

Mapping écran maquette → widget Flutter à créer :

| Maquette | Widget Flutter |
|---|---|
| Splash + Login | `SplashScreen` + `LoginScreen` (déjà présents dans `mobile/lib/features/`) |
| ProgrammesList | `ProgrammesScreen` + `ProgramListCard` |
| ClassDetail | `ClassDetailScreen` + `ModuleListItem` |
| ModuleDetail (FAB `+ Note`) | `ModuleDetailScreen` + `MaterialItem` + `Fab` |
| Note create sheet | `NoteCreateSheet` (`showModalBottomSheet`) |
| Tab Notes 3 modes | `NotesScreen` + `NoteCard` + `ConceptHeader` |
| Note detail | `NoteEditScreen` |
| QCM (1 question / écran) | `QuizScreen` + `QuizQuestionWidget` + `QuizProgressBar` |
| QCM résultat 🎉 | `QuizResultScreen` |
| Communauté (Carte + Feed) | `CommunityScreen` + `CommunityMapPlaceholder` + `FeedItem` |
| Profil | `ProfileScreen` |

⚠️ **Action J1 obligatoire** : renommer les onglets dans `mobile/lib/features/home/home_shell.dart` :
- Tab actuel `Bibliothèque` → renommer en `Notes`
- Tab actuel `Tutor IA` → remplacer par `Communauté` (Tutor IA est **hors scope**)
- Tab `Programmes` et `Profil` inchangés

## Migration post-hackathon

Référence : [`../template/MIGRATION_GUIDE.md`](../template/MIGRATION_GUIDE.md).

Côté mobile :
- L'app autonome `mobile/` sera intégrée dans le monorepo officiel `mobile/apps/mira_learn/`
- Les imports locaux (auth, api_client, theme) seront remplacés par les packages partagés `mira_auth`, `mira_api_client`, `mira_ui` — chaque fichier porte un commentaire `MIGRATION HINT` indiquant comment faire
- Le `MiraTheme` local devient `import 'package:mira_ui/mira_ui.dart';`
- Le router go_router perd ses imports locaux pour utiliser `rootNavigatorKey` partagé

Côté backend :
- `student_note` + `student_note_organization` → service dédié `notes-api` ou extension `users-api`
- `student_quiz_*` → `classes-api.quiz_*`
- `community_activity_feed` → extension `community-api` existante (XP, leaderboard, activity feed)

## Ne fais PAS

- Ne touche pas aux contrats des groupes A, B, C
- Ne modifie pas les packages partagés `mira_*` du monorepo (out of scope)
- Ne crée pas de WebSocket / push notifications FCM (out of scope hackathon)
- Ne hardcode pas l'URL backend (`http://localhost:8000` pour iOS, `http://10.0.2.2:8000` pour Android — voir `mobile/.env`)
- N'utilise pas `dynamic` non typé en Dart (`strict-casts` activé dans `analysis_options.yaml`)

## Test rapide après chaque tâche

```bash
# Backend
curl http://localhost:8000/v1/health

# Mobile : analyse statique stricte
cd mobile && flutter analyze

# Mobile : smoke test
flutter test

# DB : compter les notes d'Anna
docker exec pg-hackathon-group-d psql -U postgres -c "SELECT count(*) FROM student_note WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'anna.lopez@hackathon.test') LIMIT 1;"
```

## iOS Simulator + Android Emulator

- iOS Simulator : `flutter run -d <ID>` (depuis `flutter devices`). Boot du sim peut prendre ~5 min la 1ère fois — lance-le tôt en J1.
- Android Emulator : utiliser `http://10.0.2.2:8000` comme `MOBILE_API_URL` (10.0.2.2 = host vu de l'émulateur).
- Hot reload (`r`) ne reset pas les providers Riverpod — utilise hot restart (`R` majuscule) quand tu touches un provider, le router, ou l'état d'auth.
