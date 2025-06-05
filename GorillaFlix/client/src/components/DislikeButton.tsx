import { useState, useEffect } from 'react';
import { ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface DislikeButtonProps {
  videoId: number;
  initialDislikes: number;
  initialDisliked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function DislikeButton({
  videoId,
  initialDislikes,
  initialDisliked = false,
  size = 'md',
  showCount = true,
  className = '',
}: DislikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDisliked, setIsDisliked] = useState(initialDisliked);
  const [dislikeCount, setDislikeCount] = useState(initialDislikes);
  
  // Check if user has disliked this video
  useEffect(() => {
    if (!user) {
      setIsDisliked(false);
      return;
    }
    
    const checkDislikeStatus = async () => {
      try {
        const res = await fetch(`/api/dislikes/check/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setIsDisliked(data.isDisliked);
        }
      } catch (error) {
        console.error('Error checking dislike status:', error);
      }
    };
    
    checkDislikeStatus();
  }, [videoId, user]);
  
  // Dislike mutation
  const dislikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be logged in to dislike videos');
      }
      
      const res = await apiRequest('POST', '/api/dislikes', { videoId });
      return res.json();
    },
    onSuccess: () => {
      setIsDisliked(true);
      setDislikeCount(prev => prev + 1);
      // Invalidate video queries to update dislike count everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to dislike video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Undislike mutation
  const undislikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be logged in to remove dislike');
      }
      
      const res = await apiRequest('DELETE', `/api/dislikes/${videoId}`);
      return res.json();
    },
    onSuccess: () => {
      setIsDisliked(false);
      setDislikeCount(prev => Math.max(0, prev - 1));
      // Invalidate video queries to update dislike count everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove dislike',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleDislikeClick = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to dislike videos',
        variant: 'destructive',
      });
      return;
    }
    
    if (isDisliked) {
      undislikeMutation.mutate();
    } else {
      dislikeMutation.mutate();
    }
  };
  
  // Size variations
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const buttonSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  return (
    <Button
      variant={isDisliked ? 'default' : 'outline'}
      size="sm"
      className={`gap-1.5 ${buttonSizes[size]} ${className} ${isDisliked ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' : 'hover:text-gray-600 hover:border-gray-600'}`}
      onClick={handleDislikeClick}
      disabled={dislikeMutation.isPending || undislikeMutation.isPending}
    >
      <ThumbsDown
        className={`${sizeClasses[size]} ${isDisliked ? 'fill-current' : ''}`}
      />
      {showCount && (
        <span>{dislikeCount}</span>
      )}
    </Button>
  );
}