import { useLocation } from 'wouter';
import { MovieCardProps } from '@/types';
import { useAddToWatchlist, useRemoveFromWatchlist, useIsInWatchlist } from '@/hooks/use-movies';
import { Plus, Check, Play, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getThumbnailUrl } from '@/lib/video-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ShareButton } from '@/components/ShareButton';

const MovieCard = ({ video }: MovieCardProps) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get watchlist status
  const { data: watchlistData } = useIsInWatchlist(
    user?.id || null,
    video?.id || null
  );
  
  const isInWatchlist = watchlistData?.isInWatchlist || false;
  
  // Mutations for watchlist
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${video.id}`);
  };
  
  const handleCardClick = () => {
    navigate(`/watch/${video.id}`);
  };
  
  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to add videos to your watchlist",
        variant: "destructive"
      });
      return;
    }
    
    if (isInWatchlist) {
      removeFromWatchlist.mutate({ 
        userId: user.id, 
        videoId: video.id 
      }, {
        onSuccess: () => {
          toast({
            title: "Removed from watchlist",
            description: `${video.title} has been removed from your list`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to remove from watchlist",
            variant: "destructive"
          });
        }
      });
    } else {
      addToWatchlist.mutate({ 
        userId: user.id, 
        videoId: video.id 
      }, {
        onSuccess: () => {
          toast({
            title: "Added to watchlist",
            description: `${video.title} has been added to your list`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add to watchlist",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  return (
    <div 
      className="movie-card flex-none w-[160px] md:w-[200px] lg:w-[240px] relative rounded-md overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <img 
        src={getThumbnailUrl(video)} 
        alt={video.title} 
        className="w-full object-cover aspect-video transform group-hover:scale-110 transition-transform duration-500"
      />
      
      {/* Gradient overlay always visible */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
      
      {/* Title always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h4 className="font-bold text-sm md:text-base text-white truncate">{video.title}</h4>
      </div>
      
      {/* Hover overlay with extra details */}
      <div className="movie-info absolute inset-0 bg-black/80 p-3 flex flex-col justify-between">
        <div className="flex justify-end gap-2">
          {/* Top buttons on hover */}
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton 
              video={video} 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full bg-slate-800/80 border border-slate-600 hover:bg-primary hover:text-white"
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full bg-slate-800/80 border border-slate-600 text-white hover:bg-primary hover:text-white"
            onClick={handlePlay}
          >
            <Play size={14} />
          </Button>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-bold text-sm md:text-base">{video.title}</h4>
          
          <div className="flex items-center gap-2">
            {video.match ? (
              <span className="text-xs font-medium text-green-500">{video.match}% Match</span>
            ) : (
              <span className="text-xs font-medium text-green-500">96% Match</span>
            )}
            <span className="text-[10px] text-slate-300 px-1 border border-slate-500">{video.category}</span>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 text-xs rounded-sm bg-white text-black hover:bg-slate-200 border-none"
              onClick={handlePlay}
            >
              <Play size={12} className="mr-1" />
              Play
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full border border-slate-400 text-white hover:border-white"
              onClick={handleWatchlistToggle}
            >
              {isInWatchlist ? <Check size={14} /> : <Plus size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
