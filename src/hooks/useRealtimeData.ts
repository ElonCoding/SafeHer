import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeData<T extends { id: string }>(
  table: string,
  setData: React.Dispatch<React.SetStateAction<T[]>>
) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setData((prev) => [payload.new as T, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setData((prev) =>
                prev.map((item) =>
                  item.id === payload.new.id ? { ...item, ...payload.new } : item
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setData((prev) => prev.filter((item) => item.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, setData]);
}
