import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUserRoles, UserRole } from '@/hooks/use-user-roles';
import { useToast } from '@/hooks/use-toast';
import { AdminOnly } from '@/components/AdminOnly';
import { Shield, UserPlus, UserMinus } from 'lucide-react';

export function AdminPanel() {
  const { toast } = useToast();
  const { assignRole, removeRole } = useUserRoles();
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await assignRole(targetUserId.trim(), selectedRole);
      toast({
        title: "Success",
        description: `Role "${selectedRole}" assigned successfully`,
      });
      setTargetUserId('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await removeRole(targetUserId.trim(), selectedRole);
      toast({
        title: "Success",
        description: `Role "${selectedRole}" removed successfully`,
      });
      setTargetUserId('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminOnly>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
              Admin Access
            </Badge>
            <span className="text-sm text-muted-foreground">
              This panel is only visible to admin users
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role Management</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user UUID"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  You can find user IDs in the Supabase Auth dashboard
                </p>
              </div>

              <div>
                <Label>Role</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={selectedRole === 'user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole('user')}
                  >
                    User
                  </Button>
                  <Button
                    variant={selectedRole === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole('admin')}
                  >
                    Admin
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAssignRole}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Role
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveRole}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove Role
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminOnly>
  );
}