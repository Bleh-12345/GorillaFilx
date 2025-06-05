import { useState, useEffect, useRef } from 'react';
import { useVideoComments, useAddComment, useUpdateComment, useDeleteComment } from '@/hooks/use-comments';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CommentsProps {
  videoId: number;
}

export function Comments({ videoId }: CommentsProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading, error } = useVideoComments(videoId);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to comment input when editing is cancelled
  useEffect(() => {
    if (editingId === null && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [editingId]);
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to comment",
        variant: "destructive"
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await addCommentMutation.mutateAsync({ videoId, content: newComment });
      setNewComment('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditStart = (commentId: number, content: string) => {
    setEditingId(commentId);
    setEditText(content);
  };
  
  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };
  
  const handleEditSave = async (commentId: number) => {
    if (!editText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateCommentMutation.mutateAsync({ commentId, content: editText });
      setEditingId(null);
      setEditText('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Generate initials for avatar fallback
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };
  
  // Format timestamp to relative time
  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'just now';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load comments. Please try refreshing the page.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold tracking-wider text-slate-100 mb-4">Comments ({comments.length})</h3>
      
      {/* Add comment form */}
      <div className="mb-6">
        <form onSubmit={handleAddComment} className="space-y-2">
          <Textarea 
            ref={commentInputRef}
            placeholder={user ? "Add a comment..." : "Log in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || addCommentMutation.isPending}
            className="min-h-24 bg-card border-slate-700 focus:border-primary text-slate-100"
          />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!user || !newComment.trim() || addCommentMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white font-medium tracking-wide"
            >
              {addCommentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> 
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <Separator className="bg-slate-700" />
      
      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <div 
              key={comment.id} 
              className={cn(
                "rounded-md p-4 transition-colors duration-200",
                "bg-slate-800/50 hover:bg-slate-800"
              )}
            >
              <div className="flex space-x-4">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={comment.user.avatar || undefined} alt={comment.user.username} />
                  <AvatarFallback className="bg-slate-700 text-slate-100">{getInitials(comment.user.username)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-100">{comment.user.username}</div>
                      <div className="text-xs text-slate-400">
                        {formatTimestamp(comment.createdAt as unknown as string)}
                      </div>
                    </div>
                    
                    {user && user.id === comment.userId && editingId !== comment.id && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditStart(comment.id, comment.content)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-slate-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {editingId === comment.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-24 bg-slate-900 border-slate-700 text-slate-100"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditCancel}
                          disabled={updateCommentMutation.isPending}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={updateCommentMutation.isPending}
                          className="bg-primary hover:bg-primary/90 text-white font-medium"
                        >
                          {updateCommentMutation.isPending ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-slate-300 leading-relaxed">
                      {comment.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}