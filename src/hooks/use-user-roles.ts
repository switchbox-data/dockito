import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'user';

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_user_roles', { _user_id: user.id });

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
          setIsAdmin(false);
        } else {
          const userRoles = data || [];
          setRoles(userRoles);
          setIsAdmin(userRoles.includes('admin'));
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const assignRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) {
      throw new Error('Only admins can assign roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      throw error;
    }

    // Refresh roles if we're updating the current user
    if (userId === user?.id) {
      const { data } = await supabase
        .rpc('get_user_roles', { _user_id: user.id });
      
      if (data) {
        setRoles(data);
        setIsAdmin(data.includes('admin'));
      }
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) {
      throw new Error('Only admins can remove roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      throw error;
    }

    // Refresh roles if we're updating the current user
    if (userId === user?.id) {
      const { data } = await supabase
        .rpc('get_user_roles', { _user_id: user.id });
      
      if (data) {
        setRoles(data);
        setIsAdmin(data.includes('admin'));
      }
    }
  };

  return {
    roles,
    isAdmin,
    loading,
    assignRole,
    removeRole,
  };
}