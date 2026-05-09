import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { BarChart3, Star, Clock, CheckCircle2, ClipboardList, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function StudentGrades() {
  const [tab, setTab] = useState<"assignments" | "quizzes">("assignments");
  const { data: submissions, isLoading: loadingSubs } = trpc.submissions.mySubmissions.useQuery();
  const { data: quizAttempts, isLoading: loadingQuizzes } = trpc.quizzes.myAttempts.useQuery();

  const graded = submissions?.filter((s) => s.status === "graded") ?? [];
  const pending = submissions?.filter((s) => s.status !== "graded") ?? [];
  const assignmentAvg = graded.length > 0
    ? Math.round(graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length)
    : null;

  const gradedQuizzes = (quizAttempts ?? []).filter((a: any) => a.score !== null && a.score !== undefined);
  const quizAvg = gradedQuizzes.length > 0
    ? Math.round(gradedQuizzes.reduce((sum: number, a: any) => sum + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / gradedQuizzes.length)
    : null;

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up p-6 max-w-4xl mx-auto">
        <div className="space-y-1">
          <p className="overline">Performance</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">My Grades</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="editorial-card p-5 text-center space-y-1">
            <p className="overline">Assignment Avg</p>
            <p className="font-serif text-4xl font-black text-foreground">{assignmentAvg ?? "—"}</p>
            <p className="text-xs text-muted-foreground font-sans">out of 100</p>
          </div>
          <div className="editorial-card p-5 text-center space-y-1">
            <p className="overline">Quiz Avg</p>
            <p className="font-serif text-4xl font-black text-foreground">{quizAvg !== null ? `${quizAvg}%` : "—"}</p>
            <p className="text-xs text-muted-foreground font-sans">percentage</p>
          </div>
          <div className="editorial-card p-5 text-center space-y-1">
            <p className="overline">Graded</p>
            <p className="font-serif text-4xl font-black text-foreground">{graded.length}</p>
            <p className="text-xs text-muted-foreground font-sans">assignments</p>
          </div>
          <div className="editorial-card p-5 text-center space-y-1">
            <p className="overline">Quizzes Done</p>
            <p className="font-serif text-4xl font-black text-foreground">{quizAttempts?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground font-sans">completed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          <button
            onClick={() => setTab("assignments")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "assignments" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" /> Assignments
            <Badge variant="secondary" className="ml-1">{submissions?.length ?? 0}</Badge>
          </button>
          <button
            onClick={() => setTab("quizzes")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "quizzes" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-4 w-4" /> Quizzes
            <Badge variant="secondary" className="ml-1">{quizAttempts?.length ?? 0}</Badge>
          </button>
        </div>

        {/* Assignment Grades */}
        {tab === "assignments" && (
          loadingSubs ? (
            <div className="editorial-card p-8 text-center">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="editorial-card p-12 text-center space-y-3">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
              <p className="font-serif text-lg font-bold text-foreground">No grades yet</p>
              <p className="text-sm text-muted-foreground font-sans">Submit assignments to receive grades from your teachers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="editorial-card p-5 flex items-start gap-4">
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-serif text-base font-bold text-foreground">
                      Assignment #{sub.assignmentId}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted {format(new Date(sub.submittedAt), "MMM d, yyyy")}
                    </p>
                    {sub.feedback && (
                      <div className="mt-2 bg-secondary/40 rounded-sm p-3">
                        <p className="text-xs overline mb-1">Teacher Feedback</p>
                        <p className="text-sm font-sans text-foreground">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {sub.status === "graded" ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Star className="w-4 h-4" style={{ color: "oklch(72% 0.12 75)", fill: "oklch(72% 0.12 75)" }} />
                          <span className="font-serif text-2xl font-black text-foreground">{sub.grade}</span>
                          <span className="text-sm text-muted-foreground font-sans">/100</span>
                        </div>
                        <div className={cn(
                          "text-xs font-sans px-2 py-0.5 rounded-sm text-center",
                          (sub.grade ?? 0) >= 90 ? "bg-green-100 text-green-700" :
                          (sub.grade ?? 0) >= 70 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {(sub.grade ?? 0) >= 90 ? "Excellent" : (sub.grade ?? 0) >= 70 ? "Good" : "Needs Work"}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                        <span className="text-xs font-sans">Submitted</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Quiz Grades */}
        {tab === "quizzes" && (
          loadingQuizzes ? (
            <div className="editorial-card p-8 text-center">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            </div>
          ) : !quizAttempts || quizAttempts.length === 0 ? (
            <div className="editorial-card p-12 text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
              <p className="font-serif text-lg font-bold text-foreground">No quiz attempts yet</p>
              <p className="text-sm text-muted-foreground font-sans">Complete quizzes to see your scores here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map((attempt: any) => {
                const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
                return (
                  <div key={attempt.id} className="editorial-card p-5 flex items-start gap-4">
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-serif text-base font-bold text-foreground">
                        {attempt.quizTitle ?? `Quiz #${attempt.quizId}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted {format(new Date(attempt.submittedAt), "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {attempt.status === "graded" ? "Auto-graded" : "Pending review"}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {attempt.score !== null && attempt.score !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-serif text-2xl font-black text-foreground">{attempt.score}</span>
                            <span className="text-sm text-muted-foreground font-sans">/{attempt.maxScore}</span>
                          </div>
                          {pct !== null && (
                            <div className={cn(
                              "text-xs font-sans px-2 py-0.5 rounded-sm text-center",
                              pct >= 90 ? "bg-green-100 text-green-700" :
                              pct >= 70 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {pct}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                          <span className="text-xs font-sans">Submitted</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </SchoolLayout>
  );
}
