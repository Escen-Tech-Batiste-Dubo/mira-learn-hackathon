import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Lecture des variables d'environnement via flutter_dotenv.
///
/// Les valeurs sont injectées via le fichier `.env` à la racine du projet
/// (embarqué comme asset — cf. pubspec.yaml).
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// Le monorepo mobile utilise un enum `MiraEnvironment` (dev/staging/prod)
/// avec des constantes hardcodées (cf.
/// `packages/mira_api_client/lib/src/environment.dart`). C'est plus sûr
/// car aucun fichier `.env` n'est embarqué (risque secret leak).
/// Pendant le hackathon on garde dotenv pour la simplicité d'itération.
/// ──────────────────────────────────────────────────────────────────────────
abstract final class Env {
  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? _missing('SUPABASE_URL');

  static String get supabaseAnonKey =>
      dotenv.env['SUPABASE_ANON_KEY'] ?? _missing('SUPABASE_ANON_KEY');

  /// URL du backend FastAPI Groupe D
  /// - iOS Simulator : http://localhost:8000
  /// - Android Emulator : http://10.0.2.2:8000 (10.0.2.2 = host)
  static String get apiBaseUrl =>
      dotenv.env['MOBILE_API_URL'] ?? 'http://localhost:8000';

  static Never _missing(String key) =>
      throw StateError('Missing env var: $key (check .env file)');
}
