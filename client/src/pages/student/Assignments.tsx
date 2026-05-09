import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { BookOpen, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { format, isPast } from "date-fns";

export default function StudentAssignments() {
  const [, navigate] = useLocation();
  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: submissions } = trpc.submissions.mySubmissions.useQuery();

  // Get assignments for first class (simplified — in production, aggregate all classes)
  const firstClassId = classes?.[0]?.id;
  const { data: assignments, isLoading } = trpc.assignments.list.useQuery(
    { classId: firstClassId! },
    { enabled: !!firstClassId }
  );

  const submittedMap = new Map(submissions?.map((s) => [s.assignmentId, s]) ?? []);

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up">
        <div className="space-y-1">
          <p className="overline">Assignments</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">My Assignments</h1>
        </div>

        {!firstClassId ? (
          <div className="editorial-card p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">No classes yet</p>
            <p className="text-sm text-muted-foreground font-sans">Join a class to see your assignments.</p>
            <button
              onClick={() => navigate("/student/classes")}
              className="text-sm font-medium font-sans text-foreground underline underline-offset-2"
            >
              Join a class →
            </button>
          </div>
        ) : isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">No assignments yet</p>
            <p className="text-sm text-muted-foreground font-sans">Your teacher hasn't posted any assignments yet.</p>
          </div>
        ) : (
          <div className="editorial-card divide-y divide-border/50">
            {assignments.map((a) => {
              const submission = submittedMap.get(a.id);
              const isOverdue = a.dueDate && isPast(new Date(a.dueDate)) && !submission;
              return (
                <div
                  key={a.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-accent/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/student/assignments/${a.id}`)}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    submission?.status === "graded"
                      ? "bg-sage"
                      : submission
                      ? "bg-muted-foreground/50"
                      : isOverdue
                      ? "bg-destructive"
                      : "bg-foreground/30"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-sans text-foreground">{a.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {a.dueDate && (
                        <span className={`text-xs font-sans flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          {isOverdue ? "Overdue — " : "Due "}
                          {format(new Date(a.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {submission?.status === "graded" ? (
                      <span className="text-sm font-serif font-bold text-foreground">{submission.grade}/100</span>
                    ) : submission ? (
                      <span className="text-xs font-sans text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    ) : isOverdue ? (
                      <span className="text-xs font-sans text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    ) : (
                      <span className="text-xs font-sans font-medium text-foreground">Submit →</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
