"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * Hook React pour récupérer le user Supabase courant + écouter les changements
 * d'auth state.
 *
 * Usage :
 *   const { user, loading } = useAuth();
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, ce hook devient `useHlmrClient()` qui expose le client
 *   SDK avec auth déjà câblée. Le user est récupéré via `sdk.users.me.get()`
 *   ou un context provider global.
 */
export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupération initiale de la session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Écoute des changements (login / logout / refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
