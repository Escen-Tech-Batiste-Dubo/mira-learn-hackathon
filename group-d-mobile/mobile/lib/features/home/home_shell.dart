import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme.dart';

/// Shell de navigation avec BottomNavigationBar persistante pour les 4 onglets.
class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  static const _tabs = <_TabSpec>[
    _TabSpec(label: 'Programmes', icon: Icons.book_outlined, path: '/home/programs'),
    _TabSpec(label: 'Biblio', icon: Icons.menu_book_outlined, path: '/home/library'),
    _TabSpec(label: 'Tutor', icon: Icons.auto_awesome_outlined, path: '/home/tutor'),
    _TabSpec(label: 'Profil', icon: Icons.person_outline, path: '/home/profile'),
  ];

  int get _currentIndex {
    final i = _tabs.indexWhere((t) => location.startsWith(t.path));
    return i < 0 ? 0 : i;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: MiraTheme.miraRed,
        unselectedItemColor: MiraTheme.muted,
        showUnselectedLabels: true,
        items: [
          for (final t in _tabs)
            BottomNavigationBarItem(icon: Icon(t.icon), label: t.label),
        ],
        onTap: (i) => context.go(_tabs[i].path),
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec({required this.label, required this.icon, required this.path});
  final String label;
  final IconData icon;
  final String path;
}

/// Placeholder réutilisé pour les 4 onglets — chaque groupe le remplace
/// par le vrai contenu (liste, conversation, profil…).
class HomeTabPlaceholder extends StatelessWidget {
  const HomeTabPlaceholder({
    super.key,
    required this.title,
    required this.hint,
  });

  final String title;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.construction_outlined,
                size: 48,
                color: MiraTheme.muted,
              ),
              const SizedBox(height: 16),
              Text(
                '$title — à implémenter',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                hint,
                style: const TextStyle(color: MiraTheme.muted, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
