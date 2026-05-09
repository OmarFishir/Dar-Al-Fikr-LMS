import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { BarChart3, Star, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherGrades() {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: assignments } = trpc.assignments.myAssignments.useQuery();

  const classAssignments = assignments?.filter(
    (a) => selectedClassId === "all" || a.classId === parseInt(selectedClassId)
  );

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="overline">Grades</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">Grade Book</h1>
          </div>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-48 rounded-sm">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!classAssignments || classAssignments.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-3">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">No assignments yet</p>
            <p className="text-sm text-muted-foreground font-sans">Create assignments to start grading student work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classAssignments.map((assignment) => (
              <AssignmentGradeRow key={assignment.id} assignmentId={assignment.id} title={assignment.title} dueDate={assignment.dueDate} />
            ))}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}

function AssignmentGradeRow({ assignmentId, title, dueDate }: { assignmentId: number; title: string; dueDate: Date | null }) {
  const [expanded, setExpanded] = useState(false);
  const { data: submissions } = trpc.submissions.forAssignment.useQuery(
    { assignmentId },
    { enabled: expanded }
  );
  const utils = trpc.useUtils();
  const grade = trpc.submissions.grade.useMutation({
    onSuccess: () => utils.submissions.forAssignment.invalidate({ assignmentId }),
  });

  const [gradeValues, setGradeValues] = useState<Record<number, { grade: string; feedback: string }>>({});

  return (
    <div className="editorial-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-accent/20 transition-colors text-left"
      >
        <div className="space-y-0.5">
          <h3 className="font-serif text-base font-bold text-foreground">{title}</h3>
          {dueDate && (
            <p className="text-xs text-muted-foreground font-sans">
              Due {format(new Date(dueDate), "MMM d, yyyy")}
            </p>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="border-t border-border">
          {!submissions ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground font-sans">No submissions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {submissions.map((sub) => {
                const vals = gradeValues[sub.id] ?? { grade: sub.grade?.toString() ?? "", feedback: sub.feedback ?? "" };
                return (
                  <div key={sub.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium font-sans text-foreground">{sub.studentName}</p>
                      <p className="text-xs text-muted-foreground font-sans">
                        Submitted {format(new Date(sub.submittedAt), "MMM d 'at' h:mm a")}
                      </p>
                      {sub.text && (
                        <p className="text-xs text-muted-foreground font-sans line-clamp-2 mt-1">{sub.text}</p>
                      )}
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-sans text-foreground underline underline-offset-2">
                          View File
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sub.status === "graded" ? (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5" style={{ color: "oklch(72% 0.12 75)", fill: "oklch(72% 0.12 75)" }} />
                          <span className="font-serif text-lg font-black text-foreground">{sub.grade}</span>
                          <span className="text-xs text-muted-foreground font-sans">/100</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={vals.grade}
                            onChange={(e) => setGradeValues((prev) => ({ ...prev, [sub.id]: { ...vals, grade: e.target.value } }))}
                            placeholder="0-100"
                            className="w-16 h-8 px-2 text-sm font-sans border border-border rounded-sm bg-background text-foreground focus:outline-none focus:border-foreground/40"
                          />
                          <button
                            onClick={() => {
                              const g = parseInt(vals.grade);
                              if (isNaN(g) || g < 0 || g > 100) return;
                              grade.mutate({ submissionId: sub.id, grade: g, feedback: vals.feedback || undefined });
                            }}
                            disabled={grade.isPending}
                            className="h-8 px-3 text-xs font-sans bg-foreground text-background rounded-sm hover:bg-foreground/90 disabled:opacity-50 transition-all"
                          >
                            Grade
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
