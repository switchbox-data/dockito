import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/use-user-roles';
import { AdminPanel } from '@/components/AdminPanel';
import { AdminOnly } from '@/components/AdminOnly';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Panel | Dockito";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || rolesLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="container py-8">
      <AdminOnly
        fallback={
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">
                  You need administrator privileges to view this page.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage user roles and administrative functions
            </p>
          </header>

          <AdminPanel />
        </div>
      </AdminOnly>
    </main>
  );
}