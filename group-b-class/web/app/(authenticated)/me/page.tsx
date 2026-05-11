"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";

/**
 * Page exemple — Mon profil.
 *
 * Démontre :
 *   - useAuth() pour récupérer le user
 *   - apiClient.get() pour appeler le backend avec JWT automatique
 *   - Affichage simple avec Card composant
 *
 * À adapter selon le groupe :
 *   - Group A : page candidature mentor (formulaire multi-étapes)
 *   - Group B : dashboard mentor (mes classes, mes sessions)
 *   - Group C : profil étudiant + parcours
 */
export default function MePage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Exemple d'appel API : récupérer l'état du backend
    apiClient
      .get("/v1/health")
      .then(setHealthData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mon profil</h1>

      <Card>
        <h2 className="text-xl font-semibold">Identité Supabase</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-mono">{user?.email}</dd>
          <dt className="text-gray-500">User ID</dt>
          <dd className="font-mono text-xs">{user?.id}</dd>
        </dl>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Test backend (API client)</h2>
        {error && <p className="mt-2 text-sm text-red-700">Erreur : {error}</p>}
        {healthData ? (
          <pre className="mt-4 overflow-auto rounded-md bg-gray-50 p-3 text-xs">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        ) : null}
      </Card>
    </div>
  );
}
