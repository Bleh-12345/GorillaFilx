import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUploadVideo } from '@/hooks/use-movies';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import UploadModal from '@/components/UploadModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Film, Upload as UploadIcon } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Upload = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const uploadMutation = useUploadVideo();
  
  const handleUpload = async (formData: FormData) => {
    // Protected route ensures user is logged in, but double check
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to upload videos",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Simply pass the formData to the mutation
      await uploadMutation.mutateAsync(formData);
      
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded successfully and will appear in your library",
      });
      
      // Redirect to home page after successful upload
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive"
      });
      throw error; // Rethrow to let the modal handle it
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Upload Your Gorilla Tag Movie - GorillaFlix</title>
        <meta name="description" content="Upload and share your Gorilla Tag movies with the GorillaFlix community." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <div className="pt-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Upload Your Gorilla Tag Content</h1>
              <p className="text-muted-foreground">
                Share your best Gorilla Tag moments with the community
              </p>
            </div>
            
            <div className="flex items-center justify-center p-12 border-2 border-dashed border-border rounded-lg">
              <div className="text-center">
                <Film className="h-16 w-16 mx-auto text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Ready to share your Gorilla Tag adventures?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Upload your videos in MP4, MOV, or WebM format
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </div>
            </div>
            
            <div className="mt-12 bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Guidelines</h3>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Videos should be related to Gorilla Tag gameplay or community</li>
                <li>Maximum file size: 50MB</li>
                <li>Supported formats: MP4, MOV, WebM</li>
                <li>Add a descriptive title and thumbnail for better visibility</li>
                <li>Select the appropriate category for your content</li>
                <li>Respect copyright and community guidelines</li>
              </ul>
            </div>
          </div>
        </div>
        
        <UploadModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onUpload={handleUpload}
        />
      </div>
    </>
  );
};

export default Upload;
