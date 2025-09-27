'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/app/types/supabase';
import { supabaseClient } from '@/lib/superbaseClient';

export type AppUser = Database['public']['Tables']['profiles']['Row'] | null;

export function useAuth() {
  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper fetch profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return profile || null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        const profile = await fetchProfile(user.id);
        if (isMounted) setUser(profile);
      } else {
        if (isMounted) setUser(null);
      }

      if (isMounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) setUser(profile);
        } else {
          if (isMounted) setUser(null);
        }
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    router.push('/auth/login');
  }, [router]);

  return { user, loading, signOut };
}
