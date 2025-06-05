import { useState } from 'react';
import { useParams } from 'wouter';
import { useUserVideos, useWatchlist } from '@/hooks/use-movies';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import ContentRow from '@/components/ContentRow';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Helmet } from 'react-helmet';

const Profile = () => {
  const params = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // If no ID is provided, use the current user's ID
  const userId = params.id ? parseInt(params.id) : currentUser?.id || null;
  
  // Fetch user videos and watchlist
  const { data: userVideos, isLoading: isUserVideosLoading } = useUserVideos(userId);
  const { data: watchlistVideos, isLoading: isWatchlistLoading } = useWatchlist(userId);
  
  // Check if this is the current user's profile
  const isCurrentUser = currentUser?.id === userId;
  
  // Get the active tab from the URL hash
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const activeTab = hash === '#watchlist' ? 'watchlist' : 'uploads';
  
  // Close the edit modal
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
  };
  
  if (!userId || !currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>Please sign in to view profiles</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{isCurrentUser ? 'My Profile' : `${currentUser.username}'s Profile`} - GorillaFlix</title>
        <meta name="description" content={`View ${isCurrentUser ? 'your' : `${currentUser.username}'s`} Gorilla Tag videos and watchlist on GorillaFlix.`} />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <div className="pt-24 px-4 md:px-12">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={currentUser.avatar || ''} alt={currentUser.username} />
              <AvatarFallback className="text-3xl">
                {currentUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{currentUser.username}</h1>
              <p className="text-muted-foreground mb-2">
                {isCurrentUser ? 'Your profile' : `${currentUser.username}'s profile`}
              </p>
              
              {currentUser.bio && (
                <div className="text-sm text-white/80 max-w-lg mb-4 italic">
                  "{currentUser.bio}"
                </div>
              )}
              
              {isCurrentUser && (
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Edit Profile</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
                    <ProfileEditForm onSuccess={handleEditSuccess} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Content Tabs */}
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="mb-8 w-full md:w-auto">
              <TabsTrigger value="uploads" className="flex-1 md:flex-none">
                Uploads
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex-1 md:flex-none">
                My List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="uploads">
              {userVideos && userVideos.length > 0 ? (
                <ContentRow 
                  title="Uploaded Videos" 
                  videos={userVideos}
                  loading={isUserVideosLoading}
                />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No Videos Uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    {isCurrentUser 
                      ? "You haven't uploaded any videos yet."
                      : `${currentUser.username} hasn't uploaded any videos yet.`
                    }
                  </p>
                  
                  {isCurrentUser && (
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                      <a href="/upload">Upload Your First Video</a>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="watchlist">
              {watchlistVideos && watchlistVideos.length > 0 ? (
                <ContentRow 
                  title="My List" 
                  videos={watchlistVideos}
                  loading={isWatchlistLoading}
                />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">Your List is Empty</h3>
                  <p className="text-muted-foreground mb-4">
                    {isCurrentUser 
                      ? "You haven't added any videos to your list yet."
                      : `${currentUser.username} hasn't added any videos to their list yet.`
                    }
                  </p>
                  
                  {isCurrentUser && (
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                      <a href="/">Browse Videos</a>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Profile;
