import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, User } from 'lucide-react';

interface ProfileEditFormProps {
  onSuccess?: () => void;
}

export function ProfileEditForm({ onSuccess }: ProfileEditFormProps) {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setBio(user.bio || '');
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string, bio?: string }) => {
      const res = await apiRequest('PUT', `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      if (onSuccess) onSuccess();
      // Also update the cached user
      loginMutation.data && loginMutation.data.id && loginMutation.mutate({ 
        username: data.username, 
        password: '' // The API won't use this for updates
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiRequest('POST', `/api/users/${user?.id}/avatar`, formData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
      if (onSuccess) onSuccess();
      // Update the preview
      if (data.avatar) {
        setAvatarPreview(data.avatar);
      }
      // Also update the cached user data
      loginMutation.data && loginMutation.data.id && loginMutation.mutate({ 
        username: username, 
        password: '' // The API won't use this for updates
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload profile picture.',
        variant: 'destructive',
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);

      // Clean up the URL when done
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If username or bio has changed, update profile
      if (username !== user?.username || bio !== (user?.bio || '')) {
        await updateProfileMutation.mutateAsync({ username, bio });
      }

      // If avatar has changed, upload it
      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync(avatarFile);
      }

      // If nothing has changed, show a message
      if (username === user?.username && bio === (user?.bio || '') && !avatarFile) {
        toast({
          title: 'No changes',
          description: 'No changes were made to your profile.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <Label 
                  htmlFor="avatar" 
                  className="cursor-pointer text-sm font-medium flex items-center space-x-1 text-primary"
                >
                  <Upload className="w-4 h-4" />
                  <span>Change Picture</span>
                </Label>
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="bg-slate-800 border-slate-700 min-h-[120px]"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || (!avatarFile && username === user?.username && bio === (user?.bio || ''))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}