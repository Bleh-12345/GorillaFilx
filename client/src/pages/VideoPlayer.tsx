import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useVideo, useAllVideos } from '@/hooks/use-movies';
import { getRelatedVideos, getThumbnailUrl, getVideoUrl } from '@/lib/video-utils';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import ContentRow from '@/components/ContentRow';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, Maximize, MessageSquare, Captions } from 'lucide-react';
import { addMatchesToVideos } from '@/lib/video-utils';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { LikeButton } from '@/components/LikeButton';
import { DislikeButton } from '@/components/DislikeButton';
import { Comments } from '@/components/Comments';
import { ModerateButton } from '@/components/ModerateButton';
import { AdminDeleteButton } from '@/components/AdminDeleteButton';
import { ShareButton } from '@/components/ShareButton';

const VideoPlayer = () => {
  const params = useParams<{ id: string }>();
  const videoId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch the current video
  const { data: video, isLoading, error } = useVideo(videoId);
  
  // Fetch all videos for recommendations
  const { data: allVideos } = useAllVideos();
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Hide controls timer
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, controlsVisible]);
  
  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('ended', handleEnded);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Auto-play when video loads
  useEffect(() => {
    if (video && videoRef.current) {
      // A small delay to ensure the video is loaded
      const timer = setTimeout(() => {
        videoRef.current?.play().catch(err => {
          console.error('Failed to auto-play:', err);
          toast({
            title: "Auto-play blocked",
            description: "Click play to start the video",
            variant: "default"
          });
        });
        setIsPlaying(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [video, toast]);
  
  // Get related videos
  const relatedVideos = (allVideos && video && Array.isArray(allVideos))
    ? addMatchesToVideos(getRelatedVideos(video, allVideos))
    : [];
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Failed to play:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
    setControlsVisible(true);
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    setControlsVisible(true);
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
    setControlsVisible(true);
  };
  
  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.error('Failed to replay:', err);
      });
      setIsPlaying(true);
    }
    setControlsVisible(true);
  };
  
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    } else {
      playerRef.current.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    }
    setControlsVisible(true);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mt-16 relative w-full h-screen bg-black">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !video) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mt-16 flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Video not found</h2>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{video.title} - GorillaFlix</title>
        <meta name="description" content={video.description || 'Watch this Gorilla Tag video on GorillaFlix'} />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <div className="mt-16 relative w-full h-screen bg-black" ref={playerRef}>
          {/* Video element */}
          <video
            ref={videoRef}
            src={getVideoUrl(video)}
            className="w-full h-full object-contain"
            poster={getThumbnailUrl(video)}
            onClick={togglePlay}
            onMouseMove={() => setControlsVisible(true)}
          />
          
          {/* Top controls with Netflix-style gradient */}
          <div 
            className={`absolute top-0 left-0 w-full p-4 flex justify-between items-center transition-opacity duration-300 header-gradient h-24 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10" 
              onClick={handleBack}
            >
              <ArrowLeft size={24} />
            </Button>
            <h3 className="text-white text-xl font-bold tracking-wider">{video.title}</h3>
            <div></div>
          </div>
          
          {/* Center play/pause button */}
          {!isPlaying && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Button 
                size="icon" 
                className="h-16 w-16 rounded-full bg-white/20 text-white" 
                onClick={togglePlay}
              >
                <Play size={32} />
              </Button>
            </div>
          )}
          
          {/* Bottom controls with Netflix-style gradient */}
          <div 
            className={`absolute bottom-0 left-0 w-full p-4 transition-opacity duration-300 netflix-gradient h-32 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress bar */}
            <div className="w-full bg-gray-600 h-1 rounded-full mb-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute w-full h-1 opacity-0 cursor-pointer"
                style={{ bottom: '26px' }}
              />
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              ></div>
            </div>
            
            {/* Control buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white" 
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white" 
                  onClick={handleReplay}
                >
                  <RotateCcw size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white" 
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                >
                  <Captions size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                >
                  <MessageSquare size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white" 
                  onClick={toggleFullscreen}
                >
                  <Maximize size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video details and related videos - Netflix style */}
        <div className="p-4 md:p-12 bg-background">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h1 className="text-2xl md:text-4xl font-bold tracking-wider text-slate-100">{video.title}</h1>
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <LikeButton 
                    videoId={video.id} 
                    initialLikes={video.likes || 0} 
                    size="md" 
                    showCount={true}
                  />
                  <DislikeButton 
                    videoId={video.id} 
                    initialDislikes={video.dislikes || 0} 
                    size="md" 
                    showCount={true}
                  />
                  <ModerateButton
                    videoId={video.id}
                    videoTitle={video.title}
                    size="md"
                    className="ml-2"
                  />
                  <ShareButton
                    video={video}
                    size="md"
                    className="ml-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-3">
                <p className="text-slate-300 text-lg leading-relaxed mb-4">{video.description}</p>
                <div className="flex flex-wrap gap-4 items-center mt-6">
                  <div className="text-sm bg-slate-800 py-1 px-3 rounded-md">
                    <span className="text-slate-400">Category: </span>
                    <span className="font-medium text-slate-100">{video.category}</span>
                  </div>
                  <div className="text-sm bg-slate-800 py-1 px-3 rounded-md">
                    <span className="text-slate-400">Views: </span>
                    <span className="font-medium text-slate-100">{video.views.toLocaleString()}</span>
                  </div>
                  <AdminDeleteButton videoId={video.id} size="sm" className="mt-2" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Comments section */}
          <div className="mt-12 mb-12 p-6 bg-slate-900/60 rounded-lg shadow-lg border border-slate-800">
            {videoId && <Comments videoId={videoId} />}
          </div>

          {/* Related videos - Netflix style */}
          {relatedVideos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-wider text-slate-100 mb-6">More Like This</h2>
              <ContentRow videos={relatedVideos} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoPlayer;
