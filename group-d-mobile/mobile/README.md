# Template Mobile Mira Learn — Flutter (Groupe D)

Template Flutter autonome pour le Groupe D du hackathon Mira Learn. Inspiré de `mobile/apps/mira_chat` mais **sans dépendance** aux packages partagés `mira_*` du monorepo — chaque chose dont le template a besoin (auth, theme, router, API client) est inclus localement avec un commentaire `MIGRATION HINT` indiquant comment basculer vers l'équivalent monorepo post-hackathon.

## Stack

| Domaine | Choix | Version |
|---|---|---|
| SDK | Flutter / Dart | Flutter ≥ 3.22 / Dart ≥ 3.4 |
| State | Riverpod | `flutter_riverpod` 2.5 |
| Router | go_router | 14.x |
| Auth | Supabase | `supabase_flutter` 2.5 |
| HTTP | Dio | 5.4 |
| Env | `flutter_dotenv` (fichier `.env` embarqué comme asset) | 5.1 |
| i18n | `intl` + locales fr/en | 0.19 |

## Quickstart

```bash
# 1. Cloner le repo et entrer dans le template
cd hackathon/template/mobile

# 2. Initialiser Flutter (générer ios/ + android/ que `.gitignore` exclut)
flutter create . --org com.hellomira.learn --project-name mira_learn

# 3. Copier les credentials depuis l'env du Groupe D
cp ../../group-d-mobile/.env.example .env

# 4. Installer les deps
flutter pub get

# 5. Lancer
flutter devices                    # voir simulateurs dispos
flutter run -d <device-id>         # ex: iPhone 16
```

⚠️ Le `.env` est embarqué comme **asset** Flutter (cf. `pubspec.yaml`) — il est lu via `flutter_dotenv` au boot. Si tu modifies `.env`, **hot restart** (`R` majuscule), pas hot reload.

## Comptes de test

22 comptes pré-seedés dans la branche Supabase `groupe-d`. Liste canonique dans `hackathon/contracts/test-accounts.md`.

Password identique pour tous : `Hackathon2026!`

L'écran de login est pré-rempli avec `anna.lopez@hackathon.test` (nomad, profil démo end-to-end).

## Architecture

```
lib/
├── main.dart                       # Bootstrap : dotenv + Supabase + runApp
├── app/
│   ├── app.dart                    # MaterialApp.router + theme
│   ├── router.dart                 # go_router + auth guard
│   ├── theme.dart                  # Theme Mira (couleurs + tokens)
│   ├── env.dart                    # Lecture .env via dotenv
│   └── providers/
│       ├── auth_provider.dart      # AsyncNotifier Supabase auth
│       └── api_provider.dart       # Dio client + JSend unwrapper
└── features/
    ├── splash/                     # SplashScreen
    ├── login/                      # LoginScreen (email/password)
    ├── home/                       # HomeShell (BottomNav) + 4 onglets stubs
    └── me/                         # MeScreen (vérif user + GET /healthz)
```

## Wiring auth + API

Le `dioProvider` injecte automatiquement le `Bearer <token>` dans chaque requête. Quand l'utilisateur se logue/délogue, le provider est rebuild et le client Dio est ré-instancié avec le bon token.

L'`ApiClient` déballe la convention JSend Hello Mira :

```json
{"status": "success", "data": {...}}
```

→ retourne directement le `data` ou throw une `ApiException`.

## Top 5 conventions à respecter (non-négociable hackathon)

1. **Riverpod 2/3** pour tout state — pas de `StatefulWidget` pour la logique métier (les écrans pures UI peuvent rester stateful pour les controllers de formulaire).
2. **Naming** : `*_screen.dart`, `*_provider.dart`, `*_dto.dart` ; classes `PascalCase`, fichiers `snake_case`.
3. **Couleurs** : utiliser uniquement `MiraTheme.*` (pas de couleurs ad-hoc dans les widgets).
4. **Pas d'`any`** : `analysis_options.yaml` impose `strict-casts`, `strict-inference`.
5. **Pas d'URL hardcodée** : tout passe par `Env.apiBaseUrl` / `Env.supabaseUrl`.

## Routes pré-câblées

| Route | Écran | Auth | Action attendue par les étudiants |
|---|---|---|---|
| `/splash` | Splash + spinner | public | Garder tel quel, fait office de boot screen |
| `/login` | Login email/password | public | Personnaliser le branding si voulu |
| `/home/programs` | Placeholder | requise | Implémenter : liste class inscrites (GET /v1/me/enrolments) |
| `/home/library` | Placeholder | requise | Implémenter : notes perso + organisation IA (GET /v1/me/notes) |
| `/home/tutor` | Placeholder | requise | Implémenter : Q&A tutor IA (POST /v1/tutor/ask) |
| `/home/profile` | Placeholder | requise | Implémenter : profil + skills validées + map communauté |
| `/me` | Vérif user + healthz | requise | Garder en debug (utile pour QA pendant le hackathon) |

## Tests

```bash
flutter test                # tous les tests
flutter test test/widget_test.dart    # smoke test seul
```

## Que coupent les `MIGRATION HINT` ?

Chaque fichier qui diverge du monorepo mira_chat porte un commentaire `MIGRATION HINT` qui explique :
- ce que mira_chat fait à la place (package monorepo, pattern, fichier référence)
- pourquoi le template fait autrement (simplicité, autonomie hackathon)
- les étapes pour basculer vers la version monorepo

Coups secs à prévoir post-hackathon :
- **Env** : `Env` (dotenv) → `MiraEnvironment` enum (cf. `packages/mira_api_client`)
- **Auth** : init Supabase directe → `MiraAuthClient` wrapper + `mira_auth_ui` écrans OAuth
- **API** : `Dio` brut → `MiraDioClient` (refresh JWT 401 + retry + error mapping)
- **Theme** : `MiraTheme` local → `import 'package:mira_ui/mira_ui.dart';`
- **Models** : remplacer `Map<String, dynamic>` par Freezed DTOs (cf. `mira_models` + codegen)
- **Storage** : ajouter Drift pour cache local (`packages/mira_storage`)
- **Push** : ajouter Firebase + FCM (cf. `apps/mira_chat/lib/app/services/fcm_service.dart`)
- **Sentry + PostHog** : wrap `runApp` dans `SentryService.init()`

## Codemagic / CI

Non câblé dans le template (à ajouter post-hackathon). Pour valider en local :

```bash
flutter analyze
flutter test
flutter build ios --debug --no-codesign    # vérifier build iOS
```
