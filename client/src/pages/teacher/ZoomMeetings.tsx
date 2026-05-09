import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Video, Plus, ExternalLink, Clock, Sparkles } from "lucide-react";
import { format, isPast } from "date-fns";
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
import { cn } from "@/lib/utils";

export default function ZoomMeetings() {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    title: "",
    scheduledAt: "",
    duration: "60",
    description: "",
  });

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: meetings, isLoading } = trpc.zoom.myMeetings.useQuery();

  const createMeeting = trpc.zoom.create.useMutation({
    onSuccess: () => {
      toast.success("Meeting scheduled! Jitsi Meet link generated automatically.");
      utils.zoom.myMeetings.invalidate();
      setShowCreate(false);
      setForm({ classId: "", title: "", scheduledAt: "", duration: "60", description: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const upcoming = meetings?.filter((m) => !isPast(new Date(m.scheduledAt))) ?? [];
  const past = meetings?.filter((m) => isPast(new Date(m.scheduledAt))) ?? [];

  type Meeting = NonNullable<typeof meetings>[number];
  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const isUpcoming = !isPast(new Date(meeting.scheduledAt));
    return (
      <div className={cn("editorial-card p-5 space-y-3", !isUpcoming && "opacity-60")}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="font-serif text-base font-bold text-foreground">{meeting.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(meeting.scheduledAt), "EEEE, MMMM d 'at' h:mm a")}
              {meeting.duration && ` · ${meeting.duration} min`}
            </p>
          </div>
          <span className={cn(
            "text-xs font-sans px-2 py-0.5 rounded-sm",
            isUpcoming ? "bg-foreground/8 text-foreground" : "bg-secondary text-muted-foreground"
          )}>
            {isUpcoming ? "Upcoming" : "Past"}
          </span>
        </div>
        {meeting.description && (
          <p className="text-xs text-muted-foreground font-sans">{meeting.description}</p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans bg-secondary/50 px-3 py-1.5 rounded-sm flex-1 min-w-0">
            <Sparkles className="w-3 h-3 flex-shrink-0 text-blue-500" />
            <span className="truncate">{meeting.zoomLink}</span>
          </div>
          <a
            href={meeting.zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium font-sans text-background bg-foreground px-4 py-2 rounded-sm hover:bg-foreground/90 transition-all flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {isUpcoming ? "Join" : "Open"}
          </a>
        </div>
      </div>
    );
  };

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Meetings</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">Meetings</h1>
            <p className="text-sm text-muted-foreground font-sans">Meeting links are generated automatically — no setup required.</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>

        {isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !meetings || meetings.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-4">
            <Video className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">No meetings yet</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Schedule a meeting and a Jitsi Meet link will be generated automatically. No sign-in required.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-sm">
              <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <p className="overline">Upcoming</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="overline">Past Meetings</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {past.map((m) => <MeetingCard key={m.id} meeting={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">Schedule a Meeting</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-xs font-sans text-blue-600 bg-blue-50 border border-blue-200 rounded-sm px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            A Jitsi Meet link will be generated automatically — no sign-in required for anyone.
          </div>
          <div className="space-y-4 pt-1">
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
              <label className="text-xs overline">Meeting Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 6 Live Review"
                className="rounded-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs overline">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs overline">Duration (min)</label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="60"
                  className="rounded-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Description (optional)</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What will be covered in this session?"
                rows={2}
                className="rounded-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!form.classId || !form.title || !form.scheduledAt) {
                    toast.error("Please fill in class, title, and date/time");
                    return;
                  }
                  createMeeting.mutate({
                    classId: parseInt(form.classId),
                    title: form.title,
                    scheduledAt: form.scheduledAt,
                    duration: form.duration ? parseInt(form.duration) : undefined,
                    description: form.description || undefined,
                  });
                }}
                disabled={createMeeting.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {createMeeting.isPending ? "Generating link…" : "Schedule & Generate Link"}
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
