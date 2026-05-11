import 'package:flutter/material.dart';

import '../../app/theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MiraTheme.warmBeige,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Mira',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.w700,
                color: MiraTheme.miraRed,
                letterSpacing: -1.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Learn',
              style: TextStyle(
                fontSize: 18,
                color: MiraTheme.charcoal.withValues(alpha: 0.7),
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              color: MiraTheme.miraRed,
              strokeWidth: 2,
            ),
          ],
        ),
      ),
    );
  }
}
