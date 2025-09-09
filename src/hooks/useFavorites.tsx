import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('docket_govid')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        toast.error('Failed to load favorites');
        return;
      }

      setFavorites(data?.map(f => f.docket_govid) || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // Add a docket to favorites
  const addFavorite = async (docketGovId: string) => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          docket_govid: docketGovId,
        });

      if (error) {
        if (error.code === '23505') { // unique constraint violation
          toast.error('This docket is already in your favorites');
        } else {
          console.error('Error adding favorite:', error);
          toast.error('Failed to add favorite');
        }
        return false;
      }

      // Don't update state here - let real-time updates handle it
      toast.success('Added to favorites');
      return true;
    } catch (err) {
      console.error('Error adding favorite:', err);
      toast.error('Failed to add favorite');
      return false;
    }
  };

  // Remove a docket from favorites
  const removeFavorite = async (docketGovId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('docket_govid', docketGovId);

      if (error) {
        console.error('Error removing favorite:', error);
        toast.error('Failed to remove favorite');
        return false;
      }

      // Don't update state here - let real-time updates handle it
      toast.success('Removed from favorites');
      return true;
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('Failed to remove favorite');
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (docketGovId: string) => {
    const isFavorited = favorites.includes(docketGovId);
    
    if (isFavorited) {
      return await removeFavorite(docketGovId);
    } else {
      return await addFavorite(docketGovId);
    }
  };

  // Check if a docket is favorited
  const isFavorited = (docketGovId: string) => {
    return favorites.includes(docketGovId);
  };

  // Load favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Listen for real-time changes to favorites
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-favorites')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time favorites change:', payload);
          
          // Use setTimeout to defer state updates and avoid React queue issues
          setTimeout(() => {
            if (payload.eventType === 'INSERT') {
              const newFavorite = payload.new as { docket_govid: string };
              setFavorites(prev => {
                if (!prev.includes(newFavorite.docket_govid)) {
                  return [...prev, newFavorite.docket_govid];
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              const removedFavorite = payload.old as { docket_govid: string };
              setFavorites(prev => prev.filter(id => id !== removedFavorite.docket_govid));
            }
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites,
  };
};