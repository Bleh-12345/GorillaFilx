import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface LikeButtonProps {
  videoId: number;
  initialLikes: number;
  initialLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  videoId,
  initialLikes,
  initialLiked = false,
  size = 'md',
  showCount = true,
  className = '',
}: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  
  // Check if user has liked this video
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }
    
    const checkLikeStatus = async () => {
      try {
        const res = await fetch(`/api/likes/check/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [videoId, user]);
  
  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be logged in to like videos');
      }
      
      const res = await apiRequest('POST', '/api/likes', { videoId });
      return res.json();
    },
    onSuccess: () => {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      // Invalidate video queries to update like count everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to like video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be logged in to unlike videos');
      }
      
      const res = await apiRequest('DELETE', `/api/likes/${videoId}`);
      return res.json();
    },
    onSuccess: () => {
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      // Invalidate video queries to update like count everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to unlike video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like videos',
        variant: 'destructive',
      });
      return;
    }
    
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
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
      variant={isLiked ? 'default' : 'outline'}
      size="sm"
      className={`gap-1.5 ${buttonSizes[size]} ${className} ${isLiked ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'hover:text-red-600 hover:border-red-600'}`}
      onClick={handleLikeClick}
      disabled={likeMutation.isPending || unlikeMutation.isPending}
    >
      <Heart
        className={`${sizeClasses[size]} ${isLiked ? 'fill-current' : ''}`}
      />
      {showCount && (
        <span>{likeCount}</span>
      )}
    </Button>
  );
}