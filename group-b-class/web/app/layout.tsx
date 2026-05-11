import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

/**
 * Root layout — wrapper minimal.
 *
 * Polices Mira chargées via next/font/google (Manrope sans-serif + Playfair Display
 * pour les titres décoratifs, aligné book-web).
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, ce layout inclut en plus :
 *     - NextIntlClientProvider (i18n FR/EN/ES) via next-intl
 *     - SDK Provider (HlmrClient singleton)
 *     - Theme tokens via `@hlmr-travel/ui-public/globals.css`
 *     - Microsoft Clarity / analytics
 *     - Sentry browser SDK
 */
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mira Learn — Hackathon",
  description: "Plateforme d'apprentissage Hello Mira",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${playfair.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
