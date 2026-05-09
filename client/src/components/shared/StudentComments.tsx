import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Eye, EyeOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: number;
  content: string;
  isVisible: boolean;
  createdAt: string;
  createdBy: string;
}

interface StudentCommentsProps {
  studentId: number;
  studentName: string;
  comments: Comment[];
  onAddComment: (content: string, isVisible: boolean) => void;
  onDeleteComment: (commentId: number) => void;
  onToggleVisibility: (commentId: number, isVisible: boolean) => void;
  isLoading?: boolean;
}

export function StudentComments({
  studentId,
  studentName,
  comments,
  onAddComment,
  onDeleteComment,
  onToggleVisibility,
  isLoading = false,
}: StudentCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment, isVisible);
      setNewComment("");
      setIsVisible(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments on {studentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add comment section */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
          <Textarea
            placeholder="Add a comment about this student..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-sm",
                isVisible
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                  : "bg-muted border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {isVisible ? (
                <>
                  <Eye className="w-4 h-4" />
                  Visible to student
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hidden from student
                </>
              )}
            </button>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Add one to get started!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  comment.isVisible
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-muted/20 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground break-words">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{comment.createdBy}</span>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {comment.isVisible && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Eye className="w-3 h-3" />
                            Visible
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="p-1 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-600"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
