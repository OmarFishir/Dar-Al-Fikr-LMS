import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, MessageSquare, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface StudentDetailPaneProps {
  classId: number;
  studentId: number;
  studentName: string;
  onClose: () => void;
}

export default function StudentDetailPane({ classId, studentId, studentName, onClose }: StudentDetailPaneProps) {
  const [commentText, setCommentText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const utils = trpc.useUtils();

  // Removed analytics - using direct metrics instead

  const { data: comments } = trpc.teacherComments.getByStudent.useQuery({
    classId,
    studentId,
  });

  const addComment = trpc.teacherComments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment added!");
      setCommentText("");
      utils.teacherComments.getByStudent.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    addComment.mutate({
      classId,
      studentId,
      comment: commentText,
      isVisibleToStudent: isVisible,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-2xl">{studentName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Student Performance Details</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">


          {/* Add Comment Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Comment
            </h3>
            <div className="space-y-3">
              <Textarea
                placeholder="Write a comment about this student's performance..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-24"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVisible(!isVisible)}
                  className="flex items-center gap-2"
                >
                  {isVisible ? (
                    <>
                      <Eye className="h-4 w-4" />
                      Visible to Student
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hidden from Student
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={addComment.isPending}
                  className="ml-auto"
                >
                  {addComment.isPending ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
          </div>

          {/* Comments History */}
          {comments && comments.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg">Comment History</h3>
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <Card key={comment.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">Teacher</p>
                          {comment.isVisibleToStudent && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Visible
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-foreground">{comment.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
