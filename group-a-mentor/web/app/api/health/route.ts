import { NextResponse } from "next/server";

/**
 * Health check API route Next.js — pour K8s liveness/readiness en V1 prod.
 *
 * MIGRATION HINT (post-hackathon) :
 *   Conservé tel quel. Pattern aligné avec `book-web/app/api/health/route.ts`.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
