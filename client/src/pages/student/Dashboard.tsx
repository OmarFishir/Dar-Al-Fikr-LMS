import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  BookOpen, Video, MessageSquare, ArrowRight,
  Calendar, Star, Zap,
} from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: upcomingMeetings } = trpc.zoom.upcoming.useQuery();
  const { data: msgCount } = trpc.messages.unreadCount.useQuery();

  const unreadMessages = msgCount ?? 0;

  return (
    <SchoolLayout role="student">
      <div className="space-y-8 animate-fade-in-up">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 p-8 text-white">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
              <h1 className="text-4xl font-bold font-serif mb-2">
                Good {getTimeOfDay()}, {user?.name?.split(" ")[0] ?? "Student"} 🎓
              </h1>
              <p className="text-white/80 text-sm">
                Ready to learn today? 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "My Classes", value: classes?.length ?? 0, icon: BookOpen, path: "/student/classes", gradient: "from-teal-500 to-cyan-600", bg: "bg-teal-50 dark:bg-teal-950/30", alert: false },
            { label: "Upcoming Meetings", value: upcomingMeetings?.length ?? 0, icon: Video, path: "/student/classes", gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", alert: false },
            { label: "Messages", value: unreadMessages, icon: MessageSquare, path: "/student/messages", gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-950/30", alert: unreadMessages > 0 },
          ].map(({ label, value, icon: Icon, path, gradient, bg, alert }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`group relative overflow-hidden rounded-2xl border border-border ${bg} p-5 text-left hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <p className={`text-3xl font-black font-serif ${alert ? "text-red-500" : "text-foreground"}`}>{value}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
              {alert && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Meetings */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-teal-50 to-transparent dark:from-teal-950/20">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-teal-500" />
                <h2 className="font-serif text-lg font-bold">Upcoming Meetings</h2>
              </div>
              <button onClick={() => navigate("/student/classes")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {!upcomingMeetings || upcomingMeetings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Video className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm font-semibold text-foreground mb-1">No upcoming meetings</p>
                  <p className="text-xs text-muted-foreground">Check back soon for scheduled classes</p>
                </div>
              ) : (
                upcomingMeetings.slice(0, 5).map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-teal-100 dark:bg-teal-900/30">
                      <Calendar className="w-4 h-4 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.scheduledAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Links */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pink-500" />
                  <h2 className="font-serif text-base font-bold">Quick Links</h2>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { label: "My Classes", path: "/student/classes", icon: BookOpen, color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20" },
                  { label: "My Profile", path: "/student/profile", icon: Star, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" },
                  { label: "Messages", path: "/student/messages", icon: MessageSquare, color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20" },
                ].map(({ label, path, icon: Icon, color }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-all"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SchoolLayout>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
