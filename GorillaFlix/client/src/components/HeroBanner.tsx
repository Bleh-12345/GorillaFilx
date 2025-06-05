import { useState } from 'react';
import { useLocation } from 'wouter';
import { HeroBannerProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Play } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/video-utils';

const HeroBanner = ({ video, loading = false }: HeroBannerProps) => {
  const [, navigate] = useLocation();
  
  if (loading) {
    return (
      <div className="relative h-[80vh] w-full">
        <Skeleton className="absolute inset-0" />
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-1/2 z-10">
          <Skeleton className="h-12 w-3/4 mb-3" />
          <Skeleton className="h-20 w-full mb-4" />
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  const handlePlay = () => {
    navigate(`/watch/${video.id}`);
  };

  const handleMoreInfo = () => {
    // Could be expanded to show a modal with more details
    navigate(`/watch/${video.id}`);
  };

  return (
    <section className="relative h-[85vh] w-full">
      <div className="relative h-full">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-105"
          style={{ 
            backgroundImage: `url('${getThumbnailUrl(video)}')`,
            backgroundPosition: 'center 20%'
          }}
        >
          {/* Subtle animation on load */}
          <div className="absolute inset-0 animate-[kenburns_30s_ease-in-out_infinite_alternate]"></div>
        </div>
        
        {/* Netflix-style gradient overlays */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-background via-background/95 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-background/70 to-transparent" />
        <div className="absolute inset-0 bg-black/20" /> {/* Overall dark tint */}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3 lg:w-1/2 z-10">
          {/* Netflix category tag */}
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-primary/90 text-white">
              {video.category}
            </span>
          </div>
          
          {/* Title with Netflix-like text shadow */}
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-white drop-shadow-lg">
            {video.title}
          </h2>
          
          {/* Video metadata */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-green-500 font-medium">97% Match</span>
            <span className="text-slate-300">{new Date().getFullYear()}</span>
            <span className="text-white px-1 py-0.5 border border-white/30 text-xs">HD</span>
          </div>
          
          {/* Description */}
          <p className="text-lg mb-6 text-slate-300 leading-relaxed line-clamp-3 w-5/6">
            {video.description}
          </p>
          
          {/* Netflix-style buttons */}
          <div className="flex space-x-3">
            <Button 
              className="bg-white hover:bg-white/90 text-black font-semibold rounded-sm px-6 py-3 text-lg" 
              onClick={handlePlay}
            >
              <Play size={20} className="mr-2 ml-0" strokeWidth={3} />
              Play
            </Button>
            <Button 
              variant="secondary" 
              className="bg-slate-700/80 hover:bg-slate-700 text-white rounded-sm px-6 py-3 text-lg"
              onClick={handleMoreInfo}
            >
              <Info size={20} className="mr-2 ml-0" />
              More Info
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
