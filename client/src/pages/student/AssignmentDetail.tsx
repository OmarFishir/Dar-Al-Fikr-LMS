import SchoolLayout from "@/components/shared/SchoolLayout";
import FileUpload from "@/components/shared/FileUpload";
import AIAssistant from "@/components/shared/AIAssistant";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Star,
  Download,
  Send,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function StudentAssignmentDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assignmentId = parseInt(params.id ?? "0");
  const [submitText, setSubmitText] = useState("");
  const [fileData, setFileData] = useState<{ url: string; key: string; fileName: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: assignment, isLoading } = trpc.assignments.get.useQuery({ id: assignmentId });
  const { data: submission } = trpc.submissions.mySubmission.useQuery({ assignmentId });

  const submit = trpc.submissions.submit.useMutation({
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      utils.submissions.mySubmission.invalidate({ assignmentId });
      utils.submissions.mySubmissions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!submitText && !fileData) {
      toast.error("Please add text or upload a file");
      return;
    }
    submit.mutate({
      assignmentId,
      text: submitText || undefined,
      fileUrl: fileData?.url,
      fileKey: fileData?.key,
      fileName: fileData?.fileName,
    });
  };

  if (isLoading) {
    return (
      <SchoolLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </SchoolLayout>
    );
  }

  if (!assignment) {
    return (
      <SchoolLayout role="student">
        <div className="text-center py-16">
          <p className="text-muted-foreground font-sans">Assignment not found.</p>
        </div>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up max-w-3xl">
        {/* Back */}
        <button
          onClick={() => navigate("/student/assignments")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </button>

        {/* Assignment Details */}
        <div className="editorial-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="overline">Assignment</p>
            <h1 className="font-serif text-2xl font-bold text-foreground">{assignment.title}</h1>
          </div>
          <div className="rule-line" />
          {assignment.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs font-sans text-muted-foreground">
            {assignment.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due {format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            )}
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

        {/* AI Assistant */}
        <div className="space-y-2">
          <p className="text-xs overline">Need Help?</p>
          <AIAssistant
            mode="student_help"
            context={`Assignment: ${assignment.title}\n\nInstructions: ${assignment.description ?? "No description provided."}`}
            placeholder="Ask for help understanding this assignment…"
          />
        </div>

        {/* Submission Area */}
        {submission ? (
          <div className="editorial-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sage" strokeWidth={1.5} />
              <h2 className="font-serif text-lg font-bold text-foreground">Submitted</h2>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Submitted on {format(new Date(submission.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
            {submission.text && (
              <div className="bg-secondary/40 rounded-sm p-4">
                <p className="text-sm font-sans text-foreground whitespace-pre-wrap">{submission.text}</p>
              </div>
            )}
            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-sans text-foreground border border-border px-3 py-1.5 rounded-sm hover:border-foreground/30 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                {submission.fileName ?? "View Submission"}
              </a>
            )}
            {submission.status === "graded" && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" style={{ color: "oklch(72% 0.12 75)", fill: "oklch(72% 0.12 75)" }} />
                  <span className="font-serif text-xl font-black text-foreground">{submission.grade}/100</span>
                </div>
                {submission.feedback && (
                  <div className="bg-secondary/40 rounded-sm p-3">
                    <p className="text-xs overline mb-1">Teacher Feedback</p>
                    <p className="text-sm font-sans text-foreground">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="editorial-card p-6 space-y-5">
            <h2 className="font-serif text-lg font-bold text-foreground">Submit Your Work</h2>
            <div className="space-y-1.5">
              <label className="text-xs overline">Written Response</label>
              <Textarea
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
                placeholder="Type your answer or notes here…"
                rows={5}
                className="rounded-sm resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Upload File (optional)</label>
              {fileData ? (
                <FileUpload
                  onUpload={() => {}}
                  currentFile={{ url: fileData.url, name: fileData.fileName }}
                  onRemove={() => setFileData(null)}
                />
              ) : (
                <FileUpload
                  onUpload={(data) => setFileData(data)}
                  label="Upload your assignment file"
                />
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submit.isPending || (!submitText && !fileData)}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submit.isPending ? "Submitting…" : "Submit Assignment"}
            </Button>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
