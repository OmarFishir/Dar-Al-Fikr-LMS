import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Users, MessageSquare, Calendar, Video,
  ArrowRight, Clock, CheckCircle2, TrendingUp,
  ClipboardCheck, Sparkles, Zap, AlertCircle,
  Award, BookOpen, BarChart3,
} from "lucide-react";
import { format } from "date-fns";

const STAT_CARDS = [
  {
    label: "Meetings",
    icon: Video,
    path: "/teacher/meetings",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    path: "/teacher/messages",
    gradient: "from-orange-500 to-rose-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-500",
  },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: meetings } = trpc.zoom.myMeetings.useQuery();
  const { data: msgCount } = trpc.messages.unreadCount.useQuery();
  const { data: allAssignments } = trpc.assignments.myAssignments.useQuery();
  const { data: allSubmissions } = trpc.submissions.mySubmissions.useQuery();

  const totalClasses = classes?.length ?? 0;
  const upcomingMeetings = meetings?.filter((m) => new Date(m.scheduledAt) > new Date()) ?? [];
  const unreadMessages = msgCount ?? 0;
  
  // Calculate analytics
  const totalAssignments = allAssignments?.length ?? 0;
  const totalSubmissions = allSubmissions?.length ?? 0;
  const submissionRate = totalAssignments > 0 ? Math.round((totalSubmissions / (totalAssignments * Math.max(classes?.length ?? 1, 1))) * 100) : 0;
  const pendingGrades = allSubmissions?.filter((s: any) => !s.grade)?.length ?? 0;
  const avgGrade = allSubmissions?.length ? Math.round(allSubmissions.reduce((sum: number, s: any) => sum + (s.grade?.score ?? 0), 0) / allSubmissions.length) : 0;

  const statValues = [upcomingMeetings.length, unreadMessages, 0];

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-8 animate-fade-in-up">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 text-white">
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
                Good {getTimeOfDay()}, {user?.name?.split(" ")[0] ?? "Teacher"} 👋
              </h1>
              <p className="text-white/80 text-sm">
                You have {totalClasses} class{totalClasses !== 1 ? "es" : ""} to manage.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">SchoolHub</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, icon: Icon, path, gradient, bg, iconColor }, i) => (
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
              <p className="text-3xl font-black font-serif text-foreground">{statValues[i]}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
              {label === "Messages" && unreadMessages > 0 && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Pending Grades */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              {pendingGrades > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md">Action needed</span>}
            </div>
            <p className="text-2xl font-bold font-serif text-foreground">{pendingGrades}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Pending Grades</p>
          </div>

          {/* Total Assignments */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold font-serif text-foreground">{totalAssignments}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active Assignments</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Meetings */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-serif text-base font-bold">Upcoming Meetings</h2>
                </div>
                <button onClick={() => navigate("/teacher/meetings")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-border/50">
                {upcomingMeetings.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <Video className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                    <p className="text-xs text-muted-foreground">No upcoming meetings</p>
                  </div>
                ) : (
                  upcomingMeetings.slice(0, 3).map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(m.scheduledAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Grading Queue */}
            {pendingGrades > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h2 className="font-serif text-base font-bold text-amber-900 dark:text-amber-100">Grading Queue</h2>
                    <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-md">{pendingGrades} pending</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-amber-900 dark:text-amber-100 mb-3">You have {pendingGrades} submission{pendingGrades !== 1 ? 's' : ''} waiting to be graded.</p>
                  <button
                    onClick={() => navigate("/teacher/grades")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Grade Now
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h2 className="font-serif text-base font-bold">Quick Actions</h2>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { label: "New Weekly Plan", path: "/teacher/plans", icon: Calendar, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
                  { label: "Schedule Meeting", path: "/teacher/meetings", icon: Video, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
                  { label: "Message Students", path: "/teacher/messages", icon: MessageSquare, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" },
                  { label: "Take Attendance", path: "/teacher/attendance", icon: ClipboardCheck, color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20" },
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
