import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/home/home_shell.dart';
import '../features/login/login_screen.dart';
import '../features/me/me_screen.dart';
import '../features/splash/splash_screen.dart';
import 'providers/auth_provider.dart';

/// Router go_router avec auth guard.
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// mira_chat utilise un `rootNavigatorKey` global (exposé pour les handlers
/// FCM/deep links), un drain de pending deep-links, et un pattern
/// `miraapp://` parsing centralisé (`app/services/miraapp_uri.dart`). À
/// migrer si on ajoute push notifications + deep links externes.
/// ──────────────────────────────────────────────────────────────────────────
final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshNotifier(ref),
    redirect: (context, state) {
      // Tant que l'auth n'est pas résolue, on reste sur /splash
      if (auth.isLoading) {
        return state.matchedLocation == '/splash' ? null : '/splash';
      }

      final loggedIn = auth.maybeWhen(
        data: (s) => s is MiraAuthAuthenticated,
        orElse: () => false,
      );
      final isOnSplash = state.matchedLocation == '/splash';
      final isOnLogin = state.matchedLocation == '/login';

      // Auth résolue → on quitte /splash
      if (isOnSplash) {
        return loggedIn ? '/home/programs' : '/login';
      }
      if (!loggedIn && !isOnLogin) return '/login';
      if (loggedIn && isOnLogin) return '/home/programs';

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/me',
        builder: (_, __) => const MeScreen(),
      ),
      // Shell route avec bottom navigation persistante
      ShellRoute(
        builder: (context, state, child) =>
            HomeShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(
            path: '/home/programs',
            builder: (_, __) => const HomeTabPlaceholder(
              title: 'Programmes',
              hint:
                  'Liste des Mira Class auxquelles l\'apprenant est inscrit.\n'
                  'API : GET /v1/me/enrolments',
            ),
          ),
          GoRoute(
            path: '/home/library',
            builder: (_, __) => const HomeTabPlaceholder(
              title: 'Bibliothèque',
              hint:
                  'Notes personnelles, organisées par concept via IA.\n'
                  'API : GET /v1/me/notes',
            ),
          ),
          GoRoute(
            path: '/home/tutor',
            builder: (_, __) => const HomeTabPlaceholder(
              title: 'Tutor IA',
              hint:
                  'Conversation Q&A avec un tutor IA (OpenRouter).\n'
                  'API : POST /v1/tutor/ask',
            ),
          ),
          GoRoute(
            path: '/home/profile',
            builder: (_, __) => const HomeTabPlaceholder(
              title: 'Profil',
              hint:
                  'Profil apprenant + skills validées + carte communauté.\n'
                  'API : GET /v1/me',
            ),
          ),
        ],
      ),
    ],
  );
});

/// Adapter Riverpod → go_router refreshListenable (le router se rebuild quand
/// l'auth state change, donc le `redirect` est ré-évalué).
class GoRouterRefreshNotifier extends ChangeNotifier {
  GoRouterRefreshNotifier(Ref ref) {
    ref.listen(authNotifierProvider, (_, __) => notifyListeners());
  }
}
