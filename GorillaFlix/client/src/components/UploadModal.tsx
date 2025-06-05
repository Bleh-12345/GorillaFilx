import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadModalProps } from '@/types';
import { videoCategories } from '@shared/schema';
import { FileImage, Film, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadStep, setUploadStep] = useState<'form' | 'uploading' | 'success' | 'error'>('form');
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Handle thumbnail selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    }
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    if (!category) {
      errors.category = "Please select a category";
    }
    
    if (!thumbnailFile) {
      errors.thumbnail = "Thumbnail image is required";
    }
    
    if (!videoFile) {
      errors.video = "Video file is required";
    } else if (videoFile.size > 50 * 1024 * 1024) { // 50MB limit
      errors.video = "Video file size must be less than 50MB";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Simulate upload progress for better UX
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);
    
    return () => clearInterval(interval);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload videos",
        variant: "destructive"
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please check the form for errors",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadStep('uploading');
    const stopProgress = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('userId', user.id.toString());
      formData.append('thumbnail', thumbnailFile as File);
      formData.append('video', videoFile as File);
      formData.append('featured', 'false');
      
      // Pass the formData to the onUpload function
      await onUpload(formData);
      
      // Complete progress
      setUploadProgress(100);
      setUploadStep('success');
      
      // Reset form after a short delay to show success
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setCategory('');
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setVideoFile(null);
        setUploadProgress(0);
        setUploadStep('form');
        
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStep('error');
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive"
      });
    } finally {
      stopProgress();
      setIsUploading(false);
    }
  };
  
  // Helper to display field error message
  const FieldError = ({ field }: { field: string }) => {
    if (!validationErrors[field]) return null;
    
    return (
      <div className="text-red-500 text-sm mt-1 flex items-center">
        <AlertCircle className="h-4 w-4 mr-1" />
        {validationErrors[field]}
      </div>
    );
  };
  
  // Show different content based on upload step
  const renderContent = () => {
    switch (uploadStep) {
      case 'uploading':
        return (
          <div className="py-8 text-center">
            <Upload className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Uploading Video</h3>
            <p className="text-muted-foreground mb-4">Please wait while your video is being uploaded...</p>
            <Progress value={uploadProgress} className="w-full h-2 mb-2" />
            <p className="text-sm text-muted-foreground">{uploadProgress}% Complete</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
            <p className="text-muted-foreground">Your video has been successfully uploaded to GorillaFlix.</p>
          </div>
        );
        
      case 'error':
        return (
          <div className="py-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Failed</h3>
            <p className="text-muted-foreground mb-4">There was an error uploading your video.</p>
            <Button 
              onClick={() => setUploadStep('form')}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Try Again
            </Button>
          </div>
        );
      
      default: // form step
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title" className="flex items-center justify-between">
                Movie Title
                {validationErrors.title && <span className="text-red-500 text-xs font-normal">Required</span>}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className={`bg-background ${validationErrors.title ? 'border-red-500' : 'border-border'}`}
              />
              <FieldError field="title" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description" className="flex items-center justify-between">
                Description
                {validationErrors.description && <span className="text-red-500 text-xs font-normal">Required</span>}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your movie"
                className={`bg-background ${validationErrors.description ? 'border-red-500' : 'border-border'}`}
                rows={3}
              />
              <FieldError field="description" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="thumbnail" className="flex items-center justify-between">
                Thumbnail
                {validationErrors.thumbnail && <span className="text-red-500 text-xs font-normal">Required</span>}
              </Label>
              <div 
                className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${
                  validationErrors.thumbnail ? 'border-red-500' : 'border-border'
                }`}
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <div className="relative">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="mx-auto max-h-40 object-contain"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">Click to change thumbnail</p>
                  </div>
                ) : (
                  <>
                    <FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Drop thumbnail or browse</p>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2"
                    >
                      Browse
                    </Button>
                  </>
                )}
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <FieldError field="thumbnail" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="video" className="flex items-center justify-between">
                Video File
                {validationErrors.video && <span className="text-red-500 text-xs font-normal">Required</span>}
              </Label>
              <div 
                className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${
                  validationErrors.video ? 'border-red-500' : 'border-border'
                }`}
                onClick={() => videoInputRef.current?.click()}
              >
                {videoFile ? (
                  <div className="relative">
                    <Film className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-foreground font-medium">{videoFile.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Click to change video</p>
                  </div>
                ) : (
                  <>
                    <Film className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Drop video file or browse</p>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2"
                    >
                      Browse
                    </Button>
                  </>
                )}
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoChange}
                  accept="video/*"
                  className="hidden"
                />
              </div>
              <FieldError field="video" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="category" className="flex items-center justify-between">
                Category
                {validationErrors.category && <span className="text-red-500 text-xs font-normal">Required</span>}
              </Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className={`bg-background ${validationErrors.category ? 'border-red-500' : 'border-border'}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {videoCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field="category" />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUploading && onClose()}>
      <DialogContent className="bg-card text-card-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {uploadStep === 'form' ? 'Upload Your Gorilla Tag Movie' : 
             uploadStep === 'uploading' ? 'Uploading Video' :
             uploadStep === 'success' ? 'Upload Complete' : 'Upload Failed'}
          </DialogTitle>
          {uploadStep === 'form' && (
            <DialogDescription>
              Share your Gorilla Tag adventures with the community
            </DialogDescription>
          )}
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
