import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Share, Copy, Twitter, Facebook } from 'lucide-react';
import { Video } from '@shared/schema';

interface ShareButtonProps {
  video: Video;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShareButton({
  video,
  size = 'md',
  className = '',
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Generate video share URL
  const videoUrl = `${window.location.origin}/watch/${video.id}`;
  
  // Handle copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl).then(
      () => {
        toast({
          title: 'Link copied',
          description: 'Video link copied to clipboard',
          duration: 3000,
        });
      },
      (err) => {
        console.error('Failed to copy: ', err);
        toast({
          title: 'Failed to copy',
          description: 'Could not copy link to clipboard',
          variant: 'destructive',
          duration: 3000,
        });
      }
    );
  };
  
  // Share on Twitter
  const shareOnTwitter = () => {
    const tweetText = encodeURIComponent(`Check out "${video.title}" on GorillaFlix! ${videoUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };
  
  // Share on Facebook
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  
  return (
    <>
      <Button
        variant="outline"
        className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
      >
        <Share className="h-4 w-4" />
        {size !== 'sm' && <span>Share</span>}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-100">
              Share "{video.title}"
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Share this video with your friends
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Input 
                value={videoUrl} 
                readOnly 
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
                className="h-10 border-slate-700 hover:bg-slate-800"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="text-sm font-medium text-slate-400">Share on:</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={shareOnTwitter}
                className="bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={shareOnFacebook}
                className="bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/20"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setIsDialogOpen(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}