import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers/api_provider.dart';
import '../../app/providers/auth_provider.dart';
import '../../app/theme.dart';

/// Écran de vérification — affiche le user Supabase connecté +
/// tente un appel au backend Groupe D `GET /v1/health` pour vérifier le wiring.
class MeScreen extends ConsumerStatefulWidget {
  const MeScreen({super.key});

  @override
  ConsumerState<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends ConsumerState<MeScreen> {
  String? _healthStatus;
  String? _healthError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkHealth());
  }

  Future<void> _checkHealth() async {
    try {
      final data = await ref.read(apiClientProvider).get('/v1/health');
      if (!mounted) return;
      setState(() => _healthStatus = data['status']?.toString() ?? 'ok');
    } catch (e) {
      if (!mounted) return;
      setState(() => _healthError = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compte'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: auth.maybeWhen(
        data: (state) => state is MiraAuthAuthenticated
            ? _buildContent(state)
            : const Center(child: Text('Non connecté')),
        orElse: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Widget _buildContent(MiraAuthAuthenticated state) {
    final user = state.user;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Utilisateur',
                    style: Theme.of(context).textTheme.titleMedium,),
                const SizedBox(height: 12),
                _row('Email', user.email ?? '—'),
                _row('User ID', user.id),
                _row('Display name',
                    (user.userMetadata?['display_name'] as String?) ?? '—',),
                _row('Role',
                    (user.userMetadata?['role'] as String?) ?? '—',),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Backend (Groupe D)',
                    style: Theme.of(context).textTheme.titleMedium,),
                const SizedBox(height: 12),
                if (_healthStatus != null)
                  Row(children: [
                    const Icon(Icons.check_circle,
                        color: MiraTheme.success, size: 18,),
                    const SizedBox(width: 8),
                    Text('GET /v1/health → $_healthStatus'),
                  ],)
                else if (_healthError != null)
                  Text('Erreur : $_healthError',
                      style: const TextStyle(color: MiraTheme.error),)
                else
                  const Text('Test en cours…',
                      style: TextStyle(color: MiraTheme.muted),),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: () =>
              ref.read(authNotifierProvider.notifier).signOut(),
          child: const Text('Déconnexion'),
        ),
      ],
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 100,
              child: Text(label,
                  style: const TextStyle(color: MiraTheme.muted),),
            ),
            Expanded(
              child: Text(value,
                  style: const TextStyle(fontWeight: FontWeight.w500),),
            ),
          ],
        ),
      );
}
