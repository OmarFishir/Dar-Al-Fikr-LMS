import SchoolLayout from "@/components/shared/SchoolLayout";
import FileUpload from "@/components/shared/FileUpload";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Calendar, Plus, Download, Edit, Trash2, Eye } from "lucide-react";
import InAppFileViewer from "@/components/shared/InAppFileViewer";
import { format, startOfWeek } from "date-fns";
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

export default function WeeklyPlans() {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    title: "",
    content: "",
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd"),
    fileUrl: "",
    fileKey: "",
    fileName: "",
  });

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: plans, isLoading } = trpc.weeklyPlans.myPlans.useQuery();

  const createPlan = trpc.weeklyPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Weekly plan published!");
      utils.weeklyPlans.myPlans.invalidate();
      setShowCreate(false);
      setForm({ classId: "", title: "", content: "", weekStart: format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd"), fileUrl: "", fileKey: "", fileName: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.classId || !form.title || !form.fileUrl) {
      toast.error("Class, title, and PDF file are required");
      return;
    }
    const weekStart = new Date(form.weekStart);
    const weekNumber = Math.ceil((weekStart.getDate() + new Date(weekStart.getFullYear(), weekStart.getMonth(), 1).getDay()) / 7);
    createPlan.mutate({
      classId: parseInt(form.classId),
      title: form.title,
      content: form.content || undefined,
      weekNumber,
      weekStart: form.weekStart,
      fileUrl: form.fileUrl || undefined,
      fileKey: form.fileKey || undefined,
      fileName: form.fileName || undefined,
    });
  };

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Weekly Plans</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">Weekly Plans</h1>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
          >
            <Plus className="w-4 h-4" /> New Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-4">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">No weekly plans yet</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">Create your first weekly plan to share with students.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="editorial-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="overline">Week of {format(new Date(plan.weekStart), "MMM d, yyyy")}</p>
                    <h3 className="font-serif text-lg font-bold text-foreground">{plan.title}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-sm bg-foreground/6 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="rule-line" />
                <p className="text-sm text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {plan.content}
                </p>
                {plan.fileUrl && (
                  <InAppFileViewer
                    url={plan.fileUrl}
                    fileName={plan.fileName ?? undefined}
                    trigger={
                      <button className="inline-flex items-center gap-2 text-xs font-sans text-foreground border border-border px-3 py-1.5 rounded-sm hover:border-foreground/30 transition-colors">
                        <Eye className="w-3 h-3" />
                        {plan.fileName ?? "View File"}
                      </button>
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">New Weekly Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs overline">Class *</label>
              <Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Week 12 — Algebra & Geometry"
                className="rounded-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Week Starting *</label>
              <Input
                type="date"
                value={form.weekStart}
                onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))}
                className="rounded-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Plan Content *</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Describe what students will learn and do this week…"
                rows={6}
                className="rounded-sm resize-none"
              />
            </div>
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
                  label="Attach a PDF or document"
                />
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={createPlan.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {createPlan.isPending ? "Publishing…" : "Publish Plan"}
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
