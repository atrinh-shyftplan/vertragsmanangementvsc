import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: 'admin' | 'ae';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'ae') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setProfiles(prev => 
        prev.map(profile => 
          profile.user_id === userId 
            ? { ...profile, role: newRole }
            : profile
        )
      );

      toast({
        title: "Erfolg",
        description: "Benutzerrolle wurde aktualisiert.",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Fehler",
        description: "Rolle konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail.trim() }
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Einladung wurde versendet.",
      });

      setInviteEmail('');
      setInviteDialogOpen(false);
      
      // Refresh users list after a short delay
      setTimeout(() => {
        fetchUsers();
      }, 1000);

    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Einladung konnte nicht versendet werden.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Lade Benutzer...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
        
        <AlertDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className="flex items-center gap-2" style={{ backgroundColor: '#8C5AF5', color: 'white' }}>
              <UserPlus className="h-4 w-4" />
              Benutzer einladen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Benutzer einladen</AlertDialogTitle>
              <AlertDialogDescription>
                Geben Sie die E-Mail-Adresse des Benutzers ein, den Sie einladen möchten.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    inviteUser();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={inviteUser} style={{ backgroundColor: '#8C5AF5', color: 'white' }}>
                Einladung senden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer</CardTitle>
          <CardDescription>
            Verwalten Sie Benutzer und deren Rollen im System.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rolle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    {profile.display_name || 'Nicht angegeben'}
                  </TableCell>
                  <TableCell>{profile.email || 'Nicht angegeben'}</TableCell>
                  <TableCell>{profile.phone_number || 'Nicht angegeben'}</TableCell>
                  <TableCell>
                    <Select
                      value={profile.role}
                      onValueChange={(value: 'admin' | 'ae') => 
                        updateUserRole(profile.user_id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ae">AE</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Keine Benutzer gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}