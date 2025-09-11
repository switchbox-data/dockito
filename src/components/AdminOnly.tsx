import { ReactNode } from 'react';
import { useUserRoles } from '@/hooks/use-user-roles';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin, loading } = useUserRoles();

  if (loading) {
    return null; // Or a loading spinner if preferred
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}