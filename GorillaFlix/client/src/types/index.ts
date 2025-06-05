import { User, Video } from "@shared/schema";

export interface VideoWithMatch extends Video {
  match?: number; // Match percentage for recommendations
}

export interface Category {
  id: string;
  name: string;
}

export interface VideoRowProps {
  title?: string;
  videos: VideoWithMatch[];
  loading?: boolean;
}

export interface HeroBannerProps {
  video: Video | null;
  loading?: boolean;
}

export interface MovieCardProps {
  video: VideoWithMatch;
  onPlay?: () => void;
  onAddToList?: () => void;
}

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}
