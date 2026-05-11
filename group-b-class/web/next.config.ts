import type { NextConfig } from "next";

/**
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, ajouter `output: "standalone"` pour Docker multi-stage K8s.
 *   Ajouter aussi next-intl plugin :
 *
 *     import createNextIntlPlugin from 'next-intl/plugin';
 *     const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
 *     export default withNextIntl(nextConfig);
 *
 *   Pour i18n FR/EN/ES (et EN/IT/DE/PT pour book-web style).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
