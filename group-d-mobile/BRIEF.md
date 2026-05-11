# Brief — Groupe D — Mira Learn Mobile (app compagne)

> **Pitch en 1 phrase** : Construire l'**app mobile compagne** pour suivre ses classes, prendre des notes intelligentes (organisées par IA), passer les QCM, et voir la communauté nomade en mouvement.

## Pourquoi cette feature ?

Le voyage est mobile — un nomade ne se traîne pas un laptop dans un café à Bali. Sans app mobile, Mira Learn rate sa cible. Le Groupe D livre :

1. **App Flutter** (iOS Simulator + Android Emulator) avec auth Supabase
2. **Onglet Programmes** : liste des Mira Class auxquelles l'apprenant est inscrit + modules + progression
3. **Onglet Notes (wow feature)** : prise rapide de notes pendant les modules, **organisées automatiquement par concept** via IA (Reflect / Notion AI pattern), avec 3 modes de vue : Récentes / Par concept / Par module
4. **Onglet Communauté** : carte mondiale des sessions actives + feed d'activité anonymisé
5. **Onglet Profil** : avatar, skills validées, paramètres, déconnexion
6. **QCM mobile** : passer les quiz d'un module, scoring, résultat affiché, skill validée

C'est aussi la première fois qu'on **expose Mira Learn dans le format Flutter du monorepo** — vous validez que le pattern marche pour une nouvelle app (`apps/mira_learn`).

## Ce qui est attendu (livrables fin J3)

### Must-have (démo end-to-end)

- [ ] **Login Supabase** (email + password) — déjà câblé dans le template
- [ ] **Onglet Programmes** : liste des `enrolments` actifs + détail class + liste modules + **FAB `+ Note`** sur détail module
- [ ] **Détail module** : titre, description, durée, status, accès au QCM, matériel (PDF, vidéo)
- [ ] **QCM mobile** : passer un quiz (5-10 questions), scoring final, badge si > 70 %
- [ ] **Onglet Notes (wow feature)** : 3 modes de vue (Récentes / **Par concept** / Par module) ; création via bottom sheet avec suggestions de concepts auto-générées par IA en temps réel ; bouton "Réorganiser maintenant" qui regroupe par concept (call OpenRouter)
- [ ] **Onglet Communauté** : toggle Carte (markers pulsants sur sessions actives) / Feed (activité anonymisée)
- [ ] **Onglet Profil** : avatar + display_name + skills validées + paramètres + déconnexion
- [ ] **Démo storytelling** : Anna ouvre l'app → class Pitch → module 1 → FAB `+ Note` (suggestion IA `[Pitch]` acceptée) → QCM (4/5 = 80 %) → skill `Pitch investor` validée → Tab Notes mode "Par concept" → voit ses 3 notes regroupées sous "Pitch" (wow moment) → Tab Communauté feed → "Une nomade vient de valider Pitch investor · Portugal" (c'est elle, anonymisée)

### Nice-to-have (si temps)

- [ ] Carte mondiale `community/map` avec markers par session active (mock data OK)
- [ ] Notifications locales (badge ou modal) quand un nouveau module débloque
- [ ] Notes vocales avec transcription IA
- [ ] Mode offline (cache des modules consultés)

### Out of scope

- Pas de notifications push FCM (Firebase) — trop lourd à câbler en 3j
- Pas de WebSocket real-time
- Pas d'i18n EN
- Pas d'animations Rive complexes (CircularProgressIndicator suffit)

## Contraintes

### Techniques

- **Stack** : Flutter 3.41+, Riverpod 2, go_router 14, Supabase, Dio (déjà câblés dans le template)
- **Pas de packages partagés `mira_*`** : l'app est autonome (cf. MIGRATION HINTs)
- **JSend** côté backend, déballé par `ApiClient`
- **Couleurs Mira** : `MiraTheme.miraRed` (`#E6332A`), `warmBeige` (`#EFEAE5`), `charcoal` (`#1D1D1B`)
- **Pas de mods packages partagés** : si tu touches `packages/mira_*` dans le monorepo officiel, c'est NO

### Organisationnelles

- 5-6 étudiants, 3 jours, mentor HLMR dédié
- ⚠️ **Setup iOS Simulator** : la 1ère build prend ~5 min, lance-la tôt en J1
- ⚠️ Android Emulator : utiliser `MOBILE_API_URL=http://10.0.2.2:8000` (10.0.2.2 = host vu de l'émulateur)

## Comment démarrer

```bash
cd hackathon/group-d-mobile
docker compose up -d
cp .env.example backend/.env
cp .env.example mobile/.env

# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head      # 0001 schema + 0002 seed (3 student_profiles)
uvicorn main:app --reload --port 8000

# Terminal 2 — mobile
cd ../mobile
flutter create . --org com.hellomira.learn --project-name mira_learn --no-overwrite
flutter pub get
flutter devices
flutter run -d <device-id>
```

Login pré-rempli sur le splash : `anna.lopez@hackathon.test` / `Hackathon2026!`

## Personas clés pour la démo

| Email | Rôle démo | Pourquoi |
|---|---|---|
| `anna.lopez@hackathon.test` | **Protagoniste** | Inscrite à la class Antoine, prend des notes, passe le QCM, valide la skill |
| `nora.ahmed@hackathon.test` | Démo QCM répété | Plusieurs tentatives sur le même quiz |
| `eva.fischer@hackathon.test` | Démo notes IA | Beaucoup de notes prises → IA les regroupe par concept |

## Inspirations / refs

- **Programmes / modules** : style Duolingo, Mimo — progression claire, badges, gamification light
- **Notes IA** (wow feature) : style Notion AI, Reflect — un input simple, l'IA suggère des concepts en temps réel et regroupe les notes par concept en mode "Par concept"
- **Carte communauté** : style Polywork, Tribes mira_chat — points pulsants, hover = info
- **Mira mobile** : voir `mobile/apps/mira_chat` pour le ton visuel (bottom tabs, glass effects, beige warm)

## Mentor HLMR référent

**mentor HLMR** — mobile / Flutter, Slack `#hackathon-mira-learn-d`.
