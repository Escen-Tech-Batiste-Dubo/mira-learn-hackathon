import 'package:flutter/material.dart';

/// Thème Mira simplifié pour le template hackathon.
///
/// Couleurs alignées sur `packages/mira_ui/lib/src/tokens/mira_colors.dart`
/// et `fronts/book-web/app/globals.css`.
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// Dans le monorepo, utiliser :
///   import 'package:mira_ui/mira_ui.dart';
///   theme: MiraTheme.light  // (cf. packages/mira_ui/lib/src/theme/mira_theme.dart)
/// MiraTheme expose en plus : composants (MiraButton, MiraCard), tokens
/// haptiques, animations Rive, et le design system complet.
/// ──────────────────────────────────────────────────────────────────────────
abstract final class MiraTheme {
  // ── Tokens ──────────────────────────────────────────────────────────────
  static const Color miraRed = Color(0xFFE6332A);
  static const Color warmBeige = Color(0xFFEFEAE5);
  static const Color charcoal = Color(0xFF1D1D1B);
  static const Color muted = Color(0xFF888888);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color rule = Color(0xFFE5E7EB);
  static const Color error = Color(0xFFEF4444);
  static const Color success = Color(0xFF16A34A);

  // ── ThemeData ───────────────────────────────────────────────────────────
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: warmBeige,
        colorScheme: const ColorScheme.light(
          primary: miraRed,
          onPrimary: Colors.white,
          surface: warmBeige,
          onSurface: charcoal,
          error: error,
        ),
        // Manrope (sans) + Playfair Display (serif) — à installer via
        // `flutter pub add google_fonts` puis remplacer fontFamily ci-dessous
        // par `GoogleFonts.manropeTextTheme()`. On utilise la police système
        // par défaut pour garder le template léger.
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w700,
            color: charcoal,
            height: 1.1,
          ),
          headlineMedium: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: charcoal,
          ),
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: charcoal,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            color: charcoal,
            height: 1.4,
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            color: muted,
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: warmBeige,
          foregroundColor: charcoal,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: charcoal,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: miraRed,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: miraRed,
            textStyle: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: cardBg,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: rule),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: rule),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: miraRed, width: 1.5),
          ),
        ),
        cardTheme: CardThemeData(
          color: cardBg,
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: rule),
          ),
        ),
      );
}
