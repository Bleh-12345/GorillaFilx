import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface AdminDeleteButtonProps {
  videoId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AdminDeleteButton({
  videoId,
  size = 'md',
  className = '',
}: AdminDeleteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Only Gorilla Tag Dev (admin) can see this button
  const isAdmin = user?.id === 1;

  if (!isAdmin) {
    return null;
  }

  // Delete video mutation - uses the regular delete endpoint
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/videos/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video deleted',
        description: 'The video has been permanently deleted.',
        variant: 'default',
      });
      
      // Invalidate all video queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      // Navigate back to home
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <Button
      variant="destructive"
      className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
      onClick={handleDelete}
      disabled={deleteVideoMutation.isPending}
    >
      <Trash2 className="h-4 w-4" />
      <span>{deleteVideoMutation.isPending ? 'Deleting...' : 'Delete Video'}</span>
    </Button>
  );
}