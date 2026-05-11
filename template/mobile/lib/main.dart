import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'app/env.dart';

/// Bootstrap de l'app Mira Learn Mobile (template hackathon).
///
/// MIGRATION HINT (post-hackathon)
/// ─────────────────────────────────────────────────────────────────────────
/// Dans le monorepo `mobile/`, mira_chat utilise un wrapper `MiraAuthClient`
/// (cf. `packages/mira_auth/`) + `MiraEnvironment` enum (cf.
/// `packages/mira_api_client/lib/src/environment.dart`) + Sentry/PostHog +
/// Firebase + purge first-launch (cf. `apps/mira_chat/lib/main.dart`).
///
/// Pour migrer ce template dans le monorepo officiel :
///   1. Renommer `lib/` → `apps/mira_learn/lib/`
///   2. Remplacer `Env` (notre enum local) par `MiraEnvironment.current`
///   3. Remplacer l'init Supabase directe par `MiraAuthClient(supabase: ...)`
///   4. Wrapper `runApp` dans `SentryService.init(...)` (cf. apps/mira_chat)
///   5. Ajouter Firebase init avant Supabase pour les notifs push (FCM)
///   6. Ajouter la purge first-launch (clean Keychain post-uninstall iOS)
/// ─────────────────────────────────────────────────────────────────────────
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Charge le .env (asset embarqué via pubspec.yaml)
  await dotenv.load(fileName: '.env');

  // 2. Init Supabase avec les credentials de la branche groupe-d
  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );

  // 3. Attente de la session initiale (3s max) pour que le router ne redirect
  //    pas vers /login si un token est déjà persisté en Keychain.
  try {
    await Supabase.instance.client.auth.onAuthStateChange
        .firstWhere((e) => e.event == AuthChangeEvent.initialSession)
        .timeout(const Duration(seconds: 3));
  } catch (_) {
    // Timeout — pas de session, le router enverra sur /login
  }

  runApp(const ProviderScope(child: MiraLearnApp()));
}
