import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Bell, BookOpen, MessageSquare, Star, Calendar, Video, CheckCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ReactNode> = {
  new_assignment: <BookOpen className="w-4 h-4" strokeWidth={1.5} />,
  submission_received: <BookOpen className="w-4 h-4" strokeWidth={1.5} />,
  grade_update: <Star className="w-4 h-4" strokeWidth={1.5} />,
  new_message: <MessageSquare className="w-4 h-4" strokeWidth={1.5} />,
  new_weekly_plan: <Calendar className="w-4 h-4" strokeWidth={1.5} />,
  new_meeting: <Video className="w-4 h-4" strokeWidth={1.5} />,
};

export default function Notifications() {
  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const role = (me?.role === "teacher" || me?.role === "admin") ? "teacher" : "student";

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  const unread = notifications?.filter((n) => !n.isRead) ?? [];

  return (
    <SchoolLayout role={role as "teacher" | "student"}>
      <div className="space-y-6 animate-fade-in-up max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Notifications</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Notifications
              {unread.length > 0 && (
                <span className="ml-3 text-base font-sans font-normal text-muted-foreground">
                  {unread.length} unread
                </span>
              )}
            </h1>
          </div>
          {unread.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 rounded-sm text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">All caught up</p>
            <p className="text-sm text-muted-foreground font-sans">You have no notifications yet.</p>
          </div>
        ) : (
          <div className="editorial-card overflow-hidden divide-y divide-border/50">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) markRead.mutate({ id: notif.id });
                }}
                className={cn(
                  "w-full px-5 py-4 text-left flex items-start gap-4 hover:bg-accent/20 transition-colors",
                  !notif.isRead && "bg-foreground/3"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5",
                  !notif.isRead ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                )}>
                  {iconMap[notif.type] ?? <Bell className="w-4 h-4" strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className={cn(
                    "text-sm font-sans",
                    !notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-muted-foreground/60 font-sans">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
