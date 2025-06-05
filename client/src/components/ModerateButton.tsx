import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Shield } from 'lucide-react';
import { useLocation } from 'wouter';

interface ModerateButtonProps {
  videoId: number;
  videoTitle: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ModerateButton({
  videoId,
  videoTitle,
  size = 'md',
  className = '',
}: ModerateButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  // Only Gorilla Tag Dev (admin) can see the moderation button
  const isAdmin = user?.id === 1;

  if (!isAdmin) {
    return null;
  }

  // Video termination mutation
  const terminateVideoMutation = useMutation({
    mutationFn: async (data: { videoId: number; reason: string }) => {
      const res = await apiRequest('DELETE', `/api/moderation/videos/${data.videoId}`, { reason: data.reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video terminated',
        description: 'The video has been removed for violating community guidelines.',
        variant: 'default',
      });
      
      // Invalidate all video queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      // Close dialog and navigate back to home
      setIsDialogOpen(false);
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to terminate video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTerminate = () => {
    if (!terminationReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for terminating this video.',
        variant: 'destructive',
      });
      return;
    }
    
    terminateVideoMutation.mutate({ 
      videoId, 
      reason: terminationReason 
    });
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <>
      <Button
        variant="destructive"
        className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
        onClick={() => setIsDialogOpen(true)}
      >
        <Shield className="h-4 w-4" />
        <span>Moderate</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Terminate Video
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This action will permanently remove "{videoTitle}" for community guidelines violation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium text-slate-200 mb-2 block">
              Reason for termination:
            </label>
            <Textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Explain why this video violates community guidelines..."
              className="min-h-24 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminate}
              disabled={terminateVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {terminateVideoMutation.isPending ? 'Terminating...' : 'Terminate Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}