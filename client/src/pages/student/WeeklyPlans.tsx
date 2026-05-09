import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Calendar, Download, FileText, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import InAppFileViewer from "@/components/shared/InAppFileViewer";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentWeeklyPlans() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const classId = selectedClassId ?? classes?.[0]?.id;

  const { data: plans, isLoading } = trpc.weeklyPlans.list.useQuery(
    { classId: classId! },
    { enabled: !!classId }
  );

  const selectedPlan = selectedPlanId
    ? plans?.find((p) => p.id === selectedPlanId)
    : plans?.[0];

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up p-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <p className="overline">Weekly Plans</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">Weekly Plans</h1>
        </div>

        {/* Class selector */}
        {classes && classes.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {classes.map((c) => (
              <Badge
                key={c.id}
                variant={classId === c.id ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => { setSelectedClassId(c.id); setSelectedPlanId(null); }}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        )}

        {!classId ? (
          <div className="editorial-card p-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground font-sans">Join a class to see your weekly plans.</p>
          </div>
        ) : isLoading ? (
          <div className="editorial-card p-8 text-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="editorial-card p-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="font-serif text-lg font-bold text-foreground">No plans yet</p>
            <p className="text-sm text-muted-foreground font-sans mt-1">Your teacher hasn't posted a weekly plan yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan list sidebar */}
            <div className="space-y-2">
              <p className="overline text-xs">All Plans</p>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-sm border transition-all",
                    (selectedPlan?.id === plan.id)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/30 bg-card"
                  )}
                >
                  <p className="text-xs font-sans opacity-70 mb-1">
                    Week of {format(new Date(plan.weekStart), "MMM d, yyyy")}
                  </p>
                  <p className="font-serif text-sm font-bold leading-snug">{plan.title}</p>
                  {plan.fileUrl && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] opacity-60">
                      <FileText className="h-2.5 w-2.5" /> PDF attached
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Plan detail */}
            <div className="lg:col-span-2 space-y-4">
              {selectedPlan ? (
                <>
                  <div className="editorial-card p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="overline">Week of {format(new Date(selectedPlan.weekStart), "MMMM d, yyyy")}</p>
                      <h2 className="font-serif text-2xl font-bold text-foreground">{selectedPlan.title}</h2>
                    </div>
                    <div className="rule-line" />
                    <p className="text-sm text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap">
                      {selectedPlan.content}
                    </p>
                  </div>

                  {/* File Viewer */}
                  {selectedPlan.fileUrl && (
                    <InAppFileViewer
                      url={selectedPlan.fileUrl}
                      fileName={selectedPlan.fileName ?? undefined}
                      trigger={
                        <button className="w-full flex items-center gap-3 p-4 rounded-sm border border-border hover:border-foreground/30 bg-card transition-all">
                          <FileText className="h-5 w-5 text-red-400 shrink-0" />
                          <span className="flex-1 text-left text-sm font-medium truncate">{selectedPlan.fileName ?? "View Attached File"}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      }
                    />
                  )}
                </>
              ) : (
                <div className="editorial-card p-12 text-center">
                  <p className="text-muted-foreground font-sans text-sm">Select a plan to view it.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
