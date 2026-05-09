import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  User,
  CheckCircle2,
  Clock,
  Download,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AssignmentDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assignmentId = parseInt(params.id ?? "0");
  const [gradingSubmission, setGradingSubmission] = useState<{
    id: number;
    studentName: string;
  } | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: "", feedback: "" });

  const utils = trpc.useUtils();
  const { data: assignment, isLoading: loadingAssignment } = trpc.assignments.get.useQuery({ id: assignmentId });
  const { data: submissions, isLoading: loadingSubs } = trpc.submissions.forAssignment.useQuery({ assignmentId });

  const gradeSubmission = trpc.submissions.grade.useMutation({
    onSuccess: () => {
      toast.success("Grade submitted successfully");
      utils.submissions.forAssignment.invalidate({ assignmentId });
      setGradingSubmission(null);
      setGradeForm({ grade: "", feedback: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  if (loadingAssignment) {
    return (
      <SchoolLayout role="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </SchoolLayout>
    );
  }

  if (!assignment) {
    return (
      <SchoolLayout role="teacher">
        <div className="text-center py-16">
          <p className="text-muted-foreground font-sans">Assignment not found.</p>
        </div>
      </SchoolLayout>
    );
  }

  const gradedCount = submissions?.filter((s) => s.status === "graded").length ?? 0;
  const totalCount = submissions?.length ?? 0;

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        {/* Back */}
        <button
          onClick={() => navigate("/teacher/assignments")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </button>

        {/* Assignment Header */}
        <div className="editorial-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="overline">Assignment</p>
            <h1 className="font-serif text-2xl font-bold text-foreground">{assignment.title}</h1>
          </div>
          <div className="rule-line" />
          {assignment.description && (
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">{assignment.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs font-sans text-muted-foreground">
            {assignment.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due {format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {gradedCount}/{totalCount} graded
            </span>
          </div>
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-sans text-foreground border border-border px-3 py-1.5 rounded-sm hover:border-foreground/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {assignment.fileName ?? "Download Attachment"}
            </a>
          )}
        </div>

        {/* Submissions */}
        <div className="editorial-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold">
              Submissions ({totalCount})
            </h2>
          </div>
          {loadingSubs ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground font-sans">No submissions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {submissions.map((sub) => (
                <div key={sub.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-sm bg-foreground/6 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-sans text-foreground">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground font-sans">
                      Submitted {format(new Date(sub.submittedAt), "MMM d, h:mm a")}
                    </p>
                    {sub.text && (
                      <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2 italic">
                        "{sub.text}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Download submission"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {sub.status === "graded" ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-gold fill-current" style={{ color: "oklch(72% 0.12 75)" }} />
                        <span className="text-sm font-serif font-bold text-foreground">{sub.grade}/100</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setGradingSubmission({ id: sub.id, studentName: sub.studentName });
                          setGradeForm({ grade: "", feedback: "" });
                        }}
                        className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs h-7 px-3"
                      >
                        Grade
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold">
              Grade Submission — {gradingSubmission?.studentName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs overline">Score (0–100) *</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeForm.grade}
                onChange={(e) => setGradeForm((f) => ({ ...f, grade: e.target.value }))}
                placeholder="e.g. 85"
                className="rounded-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Feedback (optional)</label>
              <Textarea
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                placeholder="Write feedback for the student…"
                rows={3}
                className="rounded-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!gradeForm.grade) {
                    toast.error("Please enter a grade");
                    return;
                  }
                  gradeSubmission.mutate({
                    submissionId: gradingSubmission!.id,
                    grade: parseFloat(gradeForm.grade),
                    feedback: gradeForm.feedback,
                  });
                }}
                disabled={gradeSubmission.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {gradeSubmission.isPending ? "Saving…" : "Submit Grade"}
              </Button>
              <Button variant="outline" onClick={() => setGradingSubmission(null)} className="rounded-sm">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
