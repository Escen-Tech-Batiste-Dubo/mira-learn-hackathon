import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

/** Répertoire de ce fichier (évite que Turbopack prenne un lockfile parent, ex. `~/package-lock.json`). */
const WEB_ROOT = path.dirname(fileURLToPath(import.meta.url));

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
  turbopack: {
    root: WEB_ROOT,
  },
};

export default nextConfig;
