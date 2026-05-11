import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// État sealed-like de l'auth.
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// mira_chat utilise `MiraMiraAuthState` (sealed class Freezed) — cf.
/// `packages/mira_auth/lib/src/mira_auth_state.dart`. Pendant le hackathon
/// on utilise une hiérarchie de classes simples pour éviter le codegen
/// au boot. À migrer post-hackathon si on adopte Freezed.
/// ──────────────────────────────────────────────────────────────────────────
sealed class MiraAuthState {
  const MiraAuthState();
}

class MiraAuthInitial extends MiraAuthState {
  const MiraAuthInitial();
}

class MiraAuthUnauthenticated extends MiraAuthState {
  const MiraAuthUnauthenticated();
}

class MiraAuthAuthenticated extends MiraAuthState {
  const MiraAuthAuthenticated(this.session);
  final Session session;

  User get user => session.user;
  String get accessToken => session.accessToken;
}

class MiraAuthError extends MiraAuthState {
  const MiraAuthError(this.message);
  final String message;
}

/// AsyncNotifier qui suit la session Supabase et la propage à toute l'app.
class AuthNotifier extends AsyncNotifier<MiraAuthState> {
  StreamSubscription<AuthState>? _sub;

  @override
  Future<MiraAuthState> build() async {
    final client = Supabase.instance.client;

    ref.onDispose(() => _sub?.cancel());

    // Écoute les changements de session pour refresh l'UI (logout, refresh JWT...)
    _sub = client.auth.onAuthStateChange.listen((AuthState event) {
      final session = event.session ?? client.auth.currentSession;
      if (session != null) {
        state = AsyncData(MiraAuthAuthenticated(session));
      } else {
        state = const AsyncData(MiraAuthUnauthenticated());
      }
    });

    final session = client.auth.currentSession;
    if (session != null) return MiraAuthAuthenticated(session);
    return const MiraAuthUnauthenticated();
  }

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    try {
      final res = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      if (res.session == null) {
        state = const AsyncData(MiraAuthError('No session returned'));
      } else {
        state = AsyncData(MiraAuthAuthenticated(res.session!));
      }
    } on AuthException catch (e) {
      state = AsyncData(MiraAuthError(e.message));
    } catch (e) {
      state = AsyncData(MiraAuthError(e.toString()));
    }
  }

  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    state = const AsyncData(MiraAuthUnauthenticated());
  }
}

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, MiraAuthState>(AuthNotifier.new);

/// Accès rapide au token courant — utilisé par le client API pour injecter
/// le Bearer dans chaque requête.
final currentAccessTokenProvider = Provider<String?>((ref) {
  final state = ref.watch(authNotifierProvider);
  return state.maybeWhen(
    data: (s) => s is MiraAuthAuthenticated ? s.accessToken : null,
    orElse: () => null,
  );
});
