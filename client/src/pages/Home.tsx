import { useState, useEffect } from 'react';
import { useFeaturedVideos, usePopularVideos, useVideosByCategory } from '@/hooks/use-movies';
import { addMatchesToVideos } from '@/lib/video-utils';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import { videoCategories } from '@shared/schema';
import { Helmet } from 'react-helmet';

const Home = () => {
  // Fetch data
  const { data: featuredVideos, isLoading: isFeaturedLoading } = useFeaturedVideos();
  const { data: popularVideos, isLoading: isPopularLoading } = usePopularVideos(10);
  
  // Get two category rows
  const categoryA = videoCategories[0]; // Action
  const categoryB = videoCategories[2]; // Documentary
  
  const { data: categoryAVideos, isLoading: isCategoryALoading } = useVideosByCategory(categoryA);
  const { data: categoryBVideos, isLoading: isCategoryBLoading } = useVideosByCategory(categoryB);
  
  // Select a random featured video for the hero banner
  const [heroVideo, setHeroVideo] = useState(null);
  
  useEffect(() => {
    if (featuredVideos && featuredVideos.length > 0) {
      // Select a random featured video
      const randomIndex = Math.floor(Math.random() * featuredVideos.length);
      setHeroVideo(featuredVideos[randomIndex]);
    }
  }, [featuredVideos]);
  
  // Add match percentages to videos for display
  const enhancedPopularVideos = popularVideos ? addMatchesToVideos(popularVideos) : [];
  const enhancedCategoryAVideos = categoryAVideos ? addMatchesToVideos(categoryAVideos) : [];
  const enhancedCategoryBVideos = categoryBVideos ? addMatchesToVideos(categoryBVideos) : [];
  
  return (
    <>
      <Helmet>
        <title>GorillaFlix - Watch Gorilla Tag Movies</title>
        <meta name="description" content="Stream the best Gorilla Tag movies on GorillaFlix. Discover action, comedy, tutorials and more from the Gorilla Tag community." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <main className="pt-16">
          {/* Hero Banner */}
          <HeroBanner video={heroVideo} loading={isFeaturedLoading} />
          
          {/* Content Rows */}
          <div id="popular">
            <ContentRow 
              title="Popular on GorillaFlix" 
              videos={enhancedPopularVideos}
              loading={isPopularLoading}
            />
          </div>
          
          <div id="movies">
            <ContentRow 
              title={categoryA}
              videos={enhancedCategoryAVideos}
              loading={isCategoryALoading}
            />
            
            <ContentRow 
              title={categoryB}
              videos={enhancedCategoryBVideos}
              loading={isCategoryBLoading}
            />
          </div>
          
          {featuredVideos && featuredVideos.length > 0 && (
            <ContentRow 
              title="Featured Movies" 
              videos={addMatchesToVideos(featuredVideos)}
              loading={isFeaturedLoading}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default Home;
