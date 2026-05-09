import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Video, ExternalLink, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export default function StudentZoomMeetings() {
  const { data: meetings, isLoading } = trpc.zoom.upcoming.useQuery();

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up">
        <div className="space-y-1">
          <p className="overline">Meetings</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">Meetings</h1>
        </div>

        {isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !meetings || meetings.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-3">
            <Video className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">No meetings scheduled</p>
            <p className="text-sm text-muted-foreground font-sans">Your teacher hasn't scheduled any meetings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meeting) => {
              const isUpcoming = !isPast(new Date(meeting.scheduledAt));
              return (
                <div key={meeting.id} className={cn("editorial-card p-5 space-y-3", !isUpcoming && "opacity-60")}>
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
                  <a
                    href={meeting.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium font-sans text-foreground border border-border px-4 py-2 rounded-sm hover:border-foreground/40 hover:bg-accent/20 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isUpcoming ? "Join Meeting" : "View Link"}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
