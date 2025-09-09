import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSidebarNotification } from '@/contexts/SidebarNotificationContext';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  addFavorite: (docketGovId: string) => Promise<boolean>;
  removeFavorite: (docketGovId: string) => Promise<boolean>;
  toggleFavorite: (docketGovId: string) => Promise<boolean>;
  isFavorited: (docketGovId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  let user = null;
  
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    console.error('FavoritesProvider: Error accessing AuthContext:', error);
  }
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get notification context (with fallback)
  let showNotification = (docketGovId: string) => {};
  try {
    const notificationContext = useSidebarNotification();
    showNotification = notificationContext.showNotification;
  } catch (error) {
    // Fallback - notification context might not be available
  }

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

      const newFavorites = data?.map(f => f.docket_govid) || [];
      console.log('FavoritesContext: Fetched favorites:', newFavorites);
      setFavorites(newFavorites);
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

      // Optimistic UI update for instant feedback; realtime will reconcile
      console.log('FavoritesContext: Adding favorite optimistically', docketGovId);
      setFavorites(prev => {
        const newFavorites = prev.includes(docketGovId) ? prev : [...prev, docketGovId];
        console.log('FavoritesContext: New favorites after add:', newFavorites);
        return newFavorites;
      });
      
      // Show sidebar notification
      showNotification(docketGovId);
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

      // Optimistic UI update for instant feedback; realtime will reconcile
      console.log('FavoritesContext: Removing favorite optimistically', docketGovId);
      setFavorites(prev => {
        const newFavorites = prev.filter(id => id !== docketGovId);
        console.log('FavoritesContext: New favorites after remove:', newFavorites);
        return newFavorites;
      });
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
          console.log('FavoritesContext: Real-time favorites change:', payload);
          
          // Use setTimeout to defer state updates and avoid React queue issues
          setTimeout(() => {
            if (payload.eventType === 'INSERT') {
              const newFavorite = payload.new as { docket_govid: string };
              setFavorites(prev => {
                if (!prev.includes(newFavorite.docket_govid)) {
                  const updated = [...prev, newFavorite.docket_govid];
                  console.log('FavoritesContext: Real-time add:', updated);
                  return updated;
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              const removedFavorite = payload.old as { docket_govid: string };
              setFavorites(prev => {
                const updated = prev.filter(id => id !== removedFavorite.docket_govid);
                console.log('FavoritesContext: Real-time remove:', updated);
                return updated;
              });
            }
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorited,
        refetch: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    // Instead of throwing immediately, let's provide a fallback
    console.error('useFavorites called outside of FavoritesProvider');
    return {
      favorites: [],
      loading: false,
      addFavorite: async () => false,
      removeFavorite: async () => false,
      toggleFavorite: async () => false,
      isFavorited: () => false,
      refetch: async () => {},
    };
  }
  return context;
};