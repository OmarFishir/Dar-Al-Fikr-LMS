import SchoolLayout from "@/components/shared/SchoolLayout";
import FileUpload from "@/components/shared/FileUpload";
import AIAssistant from "@/components/shared/AIAssistant";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  Plus,
  FileText,
  ChevronRight,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Assignments() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    title: "",
    description: "",
    dueDate: "",
    fileUrl: "",
    fileKey: "",
    fileName: "",
  });

  const utils = trpc.useUtils();
  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: assignments, isLoading } = trpc.assignments.myAssignments.useQuery();

  const createAssignment = trpc.assignments.create.useMutation({
    onSuccess: () => {
      toast.success("Assignment created successfully");
      utils.assignments.myAssignments.invalidate();
      setShowCreate(false);
      setForm({ classId: "", title: "", description: "", dueDate: "", fileUrl: "", fileKey: "", fileName: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAssignment = trpc.assignments.delete.useMutation({
    onSuccess: () => {
      toast.success("Assignment deleted");
      utils.assignments.myAssignments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.classId || !form.title) {
      toast.error("Class and title are required");
      return;
    }
    createAssignment.mutate({
      classId: parseInt(form.classId),
      title: form.title,
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
      fileUrl: form.fileUrl || undefined,
      fileKey: form.fileKey || undefined,
      fileName: form.fileName || undefined,
    });
  };

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Assignments</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">Manage Assignments</h1>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-4">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">No assignments yet</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">Create your first assignment to get started.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Assignment
            </Button>
          </div>
        ) : (
          <div className="editorial-card divide-y divide-border/50">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-sm bg-foreground/6 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-sans text-foreground">{a.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {a.dueDate && (
                      <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {format(new Date(a.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                    {a.published ? (
                      <span className="text-xs text-sage font-sans flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-sans">Draft</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/teacher/assignments/${a.id}`)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="View submissions"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this assignment?")) {
                        deleteAssignment.mutate({ id: a.id });
                      }
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs overline">Class *</label>
              <Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.subject ? `— ${c.subject}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs overline">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 5 Review Questions"
                className="rounded-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs overline">Description</label>
              </div>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Instructions for students…"
                rows={4}
                className="rounded-sm resize-none"
              />
              <AIAssistant
                mode="teacher_draft"
                context={form.title ? `Assignment title: ${form.title}` : undefined}
                placeholder="Ask AI to help draft instructions…"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs overline">Due Date</label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="rounded-sm"
              />
            </div>

            {/* File Attachment */}
            <div className="space-y-1.5">
              <label className="text-xs overline">Attachment (optional)</label>
              {form.fileUrl ? (
                <FileUpload
                  onUpload={() => {}}
                  currentFile={{ url: form.fileUrl, name: form.fileName }}
                  onRemove={() => setForm((f) => ({ ...f, fileUrl: "", fileKey: "", fileName: "" }))}
                />
              ) : (
                <FileUpload
                  onUpload={({ url, key, fileName }) =>
                    setForm((f) => ({ ...f, fileUrl: url, fileKey: key, fileName }))
                  }
                  label="Attach assignment file"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={createAssignment.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {createAssignment.isPending ? "Creating…" : "Publish Assignment"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-sm">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
