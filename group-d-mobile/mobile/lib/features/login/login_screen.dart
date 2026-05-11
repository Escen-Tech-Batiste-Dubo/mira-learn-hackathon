import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers/auth_provider.dart';
import '../../app/theme.dart';

/// Login email/password basique pour le hackathon.
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// Le monorepo utilise `mira_auth_ui` qui fournit des écrans OAuth (Google,
/// Apple, magic link) avec `flutter_web_auth_2` et un design system complet.
/// Le login email/password n'est PAS utilisé en prod (auth Hello Mira = magic
/// link uniquement). On le garde pour la simplicité de démo hackathon.
/// ──────────────────────────────────────────────────────────────────────────
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'anna.lopez@hackathon.test');
  final _passCtrl = TextEditingController(text: 'Hackathon2026!');
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    await ref.read(authNotifierProvider.notifier).signInWithPassword(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
        );
    if (!mounted) return;
    final state = ref.read(authNotifierProvider).valueOrNull;
    if (state is MiraAuthError) {
      setState(() {
        _error = state.message;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Text(
                'Mira',
                style: TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.w700,
                  color: MiraTheme.miraRed,
                  letterSpacing: -1.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Learn',
                style: TextStyle(
                  fontSize: 14,
                  color: MiraTheme.charcoal.withValues(alpha: 0.6),
                  letterSpacing: 4,
                ),
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  hintText: 'mentor.demo@hackathon.test',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mot de passe',
                  hintText: 'Hackathon2026!',
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Se connecter'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: const TextStyle(color: MiraTheme.error),
                  textAlign: TextAlign.center,
                ),
              ],
              const Spacer(),
              const Text(
                'Comptes test : voir contracts/test-accounts.md',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: MiraTheme.muted,
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
