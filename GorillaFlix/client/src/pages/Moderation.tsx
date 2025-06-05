import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useAllVideos } from '@/hooks/use-movies';
import { getThumbnailUrl } from '@/lib/video-utils';
import { Video } from '@shared/schema';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Search, 
  Shield, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Helmet } from 'react-helmet';

const Moderation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: videos, isLoading, error } = useAllVideos();
  const [searchQuery, setSearchQuery] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);

  // Only Gorilla Tag Dev (user ID 1) can access this page
  const isAdmin = user?.id === 1;

  // If not admin, redirect to home (but do this in useEffect to avoid conditional return issues)
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Terminate video mutation
  const terminateVideoMutation = useMutation({
    mutationFn: async (data: { videoId: number; reason: string }) => {
      const res = await apiRequest('DELETE', `/api/moderation/videos/${data.videoId}`, { reason: data.reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video terminated',
        description: 'The video has been removed for violating community guidelines.',
        variant: 'default',
      });
      
      // Close dialog
      setIsTerminateDialogOpen(false);
      setSelectedVideoId(null);
      setSelectedVideoTitle('');
      setTerminationReason('');
      
      // Invalidate all video queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to terminate video',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTerminate = () => {
    if (!selectedVideoId) return;
    
    if (!terminationReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for terminating this video.',
        variant: 'destructive',
      });
      return;
    }
    
    terminateVideoMutation.mutate({ 
      videoId: selectedVideoId, 
      reason: terminationReason 
    });
  };

  const openTerminateDialog = (videoId: number, videoTitle: string) => {
    setSelectedVideoId(videoId);
    setSelectedVideoTitle(videoTitle);
    setTerminationReason('');
    setIsTerminateDialogOpen(true);
  };

  // Filter videos based on search query
  const filteredVideos = videos && Array.isArray(videos) ? videos.filter((video: Video) => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  return (
    <>
      <Helmet>
        <title>Content Moderation - GorillaFlix</title>
        <meta name="description" content="Moderate content to maintain community guidelines on GorillaFlix" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-red-500 mr-2" />
              <h1 className="text-2xl font-bold text-slate-100">Content Moderation</h1>
            </div>
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
              />
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-8">
                  Failed to load videos. Please try refreshing the page.
                </div>
              ) : (
                <Table>
                  <TableCaption>All videos available on GorillaFlix</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Video</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-center">Likes</TableHead>
                      <TableHead className="text-center">Dislikes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                          {searchQuery ? 'No videos match your search criteria' : 'No videos found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVideos.map((video) => (
                        <TableRow key={video.id} className="hover:bg-slate-800">
                          <TableCell>
                            <div className="h-16 w-28 relative rounded overflow-hidden">
                              <img 
                                src={getThumbnailUrl(video)} 
                                alt={video.title} 
                                className="object-cover h-full w-full"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div className="text-slate-100 truncate max-w-sm">{video.title}</div>
                              <div className="text-xs text-slate-400">ID: {video.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{video.category}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Eye className="h-4 w-4 mr-1 text-slate-400" />
                              {video.views.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <ThumbsUp className="h-4 w-4 mr-1 text-slate-400" />
                              {video.likes || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <ThumbsDown className="h-4 w-4 mr-1 text-slate-400" />
                              {video.dislikes || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 hover:bg-slate-800"
                                onClick={() => navigate(`/watch/${video.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-700 text-red-500 hover:bg-red-900/20"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${video.title}"? This action cannot be undone.`)) {
                                    const deleteVideo = async () => {
                                      try {
                                        await apiRequest('DELETE', `/api/videos/${video.id}`);
                                        toast({
                                          title: 'Video deleted',
                                          description: 'The video has been removed successfully.',
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
                                      } catch (error) {
                                        toast({
                                          title: 'Failed to delete video',
                                          description: 'An error occurred while deleting the video.',
                                          variant: 'destructive',
                                        });
                                      }
                                    };
                                    deleteVideo();
                                  }
                                }}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openTerminateDialog(video.id, video.title)}
                              >
                                Terminate
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-800 p-4">
              <div className="text-sm text-slate-400">
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Terminate Video Dialog */}
      <Dialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Terminate Video
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This action will permanently remove "{selectedVideoTitle}" for community guidelines violation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium text-slate-200 mb-2 block">
              Reason for termination:
            </label>
            <Textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Explain why this video violates community guidelines..."
              className="min-h-24 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTerminateDialogOpen(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminate}
              disabled={terminateVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {terminateVideoMutation.isPending ? 'Terminating...' : 'Terminate Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Moderation;