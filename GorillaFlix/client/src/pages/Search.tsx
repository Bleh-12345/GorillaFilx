import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSearchVideos } from '@/hooks/use-movies';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet';

const Search = () => {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const initialQuery = params.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [localQuery, setLocalQuery] = useState(initialQuery);
  
  // Search query from API
  const { data: searchResults, isLoading, error } = useSearchVideos(searchQuery);
  
  // Update search parameters when query changes
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const urlQuery = params.get('q') || '';
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
      setLocalQuery(urlQuery);
    }
  }, [location, searchQuery]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== searchQuery.trim()) {
      setSearchQuery(localQuery.trim());
      window.history.pushState(
        {},
        '',
        localQuery.trim() ? `/search?q=${encodeURIComponent(localQuery.trim())}` : '/search'
      );
    }
  };
  
  // Clear the search input
  const clearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
    window.history.pushState({}, '', '/search');
  };
  
  return (
    <>
      <Helmet>
        <title>{searchQuery ? `Search: ${searchQuery}` : 'Search'} - GorillaFlix</title>
        <meta name="description" content={`Search for Gorilla Tag movies on GorillaFlix${searchQuery ? ` - Results for "${searchQuery}"` : ''}`} />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <div className="pt-24 px-4 md:px-12">
          <div className="max-w-4xl mx-auto">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for Gorilla Tag movies"
                  className="pr-24"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                />
                {localQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-12 top-0 h-full"
                    onClick={clearSearch}
                  >
                    <X size={18} />
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  className="absolute right-0 top-0 h-full bg-primary hover:bg-primary/90"
                >
                  <SearchIcon size={18} />
                </Button>
              </div>
            </form>
            
            {/* Search Results */}
            <div>
              {searchQuery && (
                <h2 className="text-2xl font-bold mb-6">
                  {isLoading
                    ? 'Searching...'
                    : `Search results for "${searchQuery}"`
                  }
                </h2>
              )}
              
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array(8).fill(0).map((_, i) => (
                    <Skeleton key={i} className="w-full aspect-video rounded" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading search results. Please try again.</p>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((video) => (
                    <MovieCard key={video.id} video={video} />
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any Gorilla Tag videos matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search for Videos</h3>
                  <p className="text-muted-foreground">
                    Enter keywords to search for Gorilla Tag videos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;
