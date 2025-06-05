import { useRef } from 'react';
import { VideoRowProps } from '@/types';
import MovieCard from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ContentRow = ({ title, videos, loading = false }: VideoRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { current } = rowRef;
      const scrollAmount = direction === 'left' 
        ? -current.clientWidth * 0.75 
        : current.clientWidth * 0.75;
      
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-6 md:mt-12 px-4 md:px-12">
      {title && <h3 className="text-lg md:text-xl font-medium mb-2">{title}</h3>}
      
      <div className="relative group">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={24} />
        </Button>
        
        {/* Content row */}
        <div 
          ref={rowRef}
          className="row-container scrollbar-hide"
        >
          {loading ? (
            // Loading skeletons
            Array(6).fill(0).map((_, index) => (
              <div 
                key={`skeleton-${index}`}
                className="flex-none w-[160px] md:w-[200px] lg:w-[240px] relative rounded overflow-hidden"
              >
                <Skeleton className="w-full aspect-video" />
              </div>
            ))
          ) : (
            // Movie cards
            videos.map((video) => (
              <MovieCard key={video.id} video={video} />
            ))
          )}
        </div>
        
        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight size={24} />
        </Button>
      </div>
    </section>
  );
};

export default ContentRow;
