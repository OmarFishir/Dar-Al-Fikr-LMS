import { useState } from "react";
import { useLocation } from "wouter";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Users, ChevronRight, Copy, MessageSquare, Wrench, BookOpen } from "lucide-react";
import SubjectToolbox from "@/components/subject/SubjectToolbox";

// ─── Grade color palette ─────────────────────────────────────────────────────
const GRADE_COLORS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

const BORDER_COLORS = [
  "border-l-violet-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-sky-500",
  "border-l-rose-500",
  "border-l-lime-500",
  "border-l-fuchsia-500",
  "border-l-cyan-500",
];

const MONSTER_EMOJIS = ["🐉", "🦊", "🐻", "🦁", "🐯", "🦄", "🐸", "🦋"];

type View = "grades" | "subclasses" | "students";

export default function TeacherClasses() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [view, setView] = useState<View>("grades");
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedSubClass, setSelectedSubClass] = useState<any>(null);

  const [showCreateGrade, setShowCreateGrade] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const [gradeName, setGradeName] = useState("");
  const [gradeSubject, setGradeSubject] = useState("");
  const [gradeDesc, setGradeDesc] = useState("");
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [msgText, setMsgText] = useState("");

  const { data: allClasses, isLoading } = trpc.classes.myClasses.useQuery();
  const { data: subClasses } = trpc.classes.listSubClasses.useQuery(
    { parentClassId: selectedGrade?.id ?? 0 },
    { enabled: !!selectedGrade }
  );
  const { data: students } = trpc.classes.students.useQuery(
    { classId: selectedSubClass?.id ?? 0 },
    { enabled: !!selectedSubClass }
  );

  const createGrade = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.myClasses.invalidate();
      setShowCreateGrade(false);
      setGradeName(""); setGradeSubject(""); setGradeDesc("");
      toast.success("Grade created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const createSub = trpc.classes.createSubClass.useMutation({
    onSuccess: () => {
      utils.classes.listSubClasses.invalidate();
      setShowCreateSub(false);
      setSubName(""); setSubDesc("");
      toast.success("Sub-class created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendMsg = trpc.messages.sendToClass.useMutation({
    onSuccess: () => {
      setShowMessage(false);
      setMsgText("");
      toast.success("Message sent to all students!");
    },
    onError: (e) => toast.error(e.message),
  });

  const grades = ((allClasses ?? []) as any[]).filter((c: any) => !c.parentId);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!");
  }

  function goBack() {
    if (view === "students") { setView("subclasses"); setSelectedSubClass(null); }
    else if (view === "subclasses") { setView("grades"); setSelectedGrade(null); }
  }

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 animate-fade-in-up">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            {view !== "grades" && (
              <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <button onClick={() => { setView("grades"); setSelectedGrade(null); setSelectedSubClass(null); }}
              className={`font-semibold transition-colors ${view === "grades" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              My Classes
            </button>
            {selectedGrade && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button onClick={() => { setView("subclasses"); setSelectedSubClass(null); }}
                  className={`font-semibold transition-colors ${view === "subclasses" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {selectedGrade.name}
                </button>
              </>
            )}
            {selectedSubClass && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{selectedSubClass.name}</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {view === "grades" && (
              <Button onClick={() => setShowCreateGrade(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> New Grade
              </Button>
            )}
            {view === "subclasses" && (
              <Button onClick={() => setShowCreateSub(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Sub-class
              </Button>
            )}
            {view === "students" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowMessage(true)} className="gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Message Class
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowTools(true)} className="gap-1.5">
                  <Wrench className="w-4 h-4" /> Subject Tools
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── GRADES VIEW ── */}
        {view === "grades" && (
          isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : grades.length === 0 ? (
            <div className="editorial-card p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No grades yet. Create your first grade to get started.</p>
              <Button onClick={() => setShowCreateGrade(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Create Grade</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {grades.map((grade: any, idx: number) => (
                <button
                  key={grade.id}
                  onClick={() => { setSelectedGrade(grade); setView("subclasses"); }}
                  className={`group relative rounded-2xl bg-gradient-to-br ${GRADE_COLORS[idx % GRADE_COLORS.length]} p-6 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 overflow-hidden min-h-[140px]`}
                >
                  <div className="absolute inset-0 opacity-10 flex items-center justify-center text-8xl select-none">
                    {grade.subject ? grade.subject[0].toUpperCase() : "📚"}
                  </div>
                  <div className="relative">
                    <p className="text-2xl font-serif font-bold leading-tight">{grade.name}</p>
                    {grade.subject && <p className="text-white/80 text-xs mt-1 font-medium">{grade.subject}</p>}
                    <div className="mt-4 flex items-center gap-1 text-white/70 text-xs">
                      <ChevronRight className="w-3.5 h-3.5" /><span>View sub-classes</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* ── SUBCLASSES VIEW ── */}
        {view === "subclasses" && selectedGrade && (
          !subClasses || subClasses.length === 0 ? (
            <div className="editorial-card p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">No sub-classes yet for {selectedGrade.name}.</p>
              <Button onClick={() => setShowCreateSub(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Sub-class</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(subClasses as any[]).map((sub: any, idx: number) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubClass(sub); setView("students"); }}
                  className={`group editorial-card p-5 text-left hover:scale-[1.02] transition-all duration-200 border-l-4 ${BORDER_COLORS[idx % BORDER_COLORS.length]}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-serif font-bold text-lg text-foreground">{sub.name}</p>
                      {sub.description && <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-0.5" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{sub.inviteCode}</span>
                    <button onClick={(e) => { e.stopPropagation(); copyCode(sub.inviteCode); }} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* ── STUDENTS VIEW ── */}
        {view === "students" && selectedSubClass && (
          <div className="space-y-4">
            <div className="editorial-card p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-serif font-bold text-xl text-foreground">{selectedSubClass.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invite code: <span className="font-mono font-semibold">{selectedSubClass.inviteCode}</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyCode(selectedSubClass.inviteCode)} className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/assignments`)} className="gap-1.5">Assignments</Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/quizzes`)} className="gap-1.5">Quizzes</Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/meetings`)} className="gap-1.5">Meetings</Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/plans`)} className="gap-1.5">Weekly Plans</Button>
              </div>
            </div>

            {!students || students.length === 0 ? (
              <div className="editorial-card p-10 text-center text-sm text-muted-foreground">
                No students enrolled yet. Share the invite code <span className="font-mono font-semibold">{selectedSubClass.inviteCode}</span>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(students as any[]).map((student: any) => (
                  <div key={student.id} className="editorial-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-xl shrink-0">
                      {MONSTER_EMOJIS[student.id % 8]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create Grade Dialog ── */}
      <Dialog open={showCreateGrade} onOpenChange={setShowCreateGrade}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Grade</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Grade Name *</Label>
              <Input placeholder="e.g. Grade 9" value={gradeName} onChange={(e) => setGradeName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input placeholder="e.g. Mathematics, Biology, Computer Science…" value={gradeSubject} onChange={(e) => setGradeSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional description…" value={gradeDesc} onChange={(e) => setGradeDesc(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGrade(false)}>Cancel</Button>
            <Button onClick={() => createGrade.mutate({ name: gradeName, subject: gradeSubject || undefined, description: gradeDesc || undefined })}
              disabled={!gradeName.trim() || createGrade.isPending}>
              {createGrade.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Sub-class Dialog ── */}
      <Dialog open={showCreateSub} onOpenChange={setShowCreateSub}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sub-class to {selectedGrade?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Sub-class Name *</Label>
              <Input placeholder="e.g. 9A, 9B, Section 1…" value={subName} onChange={(e) => setSubName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional description…" value={subDesc} onChange={(e) => setSubDesc(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSub(false)}>Cancel</Button>
            <Button onClick={() => createSub.mutate({ parentId: selectedGrade!.id, name: subName, description: subDesc || undefined })}
              disabled={!subName.trim() || createSub.isPending}>
              {createSub.isPending ? "Creating…" : "Add Sub-class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Message Class Dialog ── */}
      <Dialog open={showMessage} onOpenChange={setShowMessage}>
        <DialogContent>
          <DialogHeader><DialogTitle>Message {selectedSubClass?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">This message will be sent to all students in this class.</p>
            <Textarea placeholder="Type your message here…" value={msgText} onChange={(e) => setMsgText(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessage(false)}>Cancel</Button>
            <Button onClick={() => sendMsg.mutate({ classId: selectedSubClass!.id, message: msgText })}
              disabled={!msgText.trim() || sendMsg.isPending}>
              {sendMsg.isPending ? "Sending…" : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Subject Tools Dialog ── */}
      <Dialog open={showTools} onOpenChange={setShowTools}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Subject Tools — {selectedSubClass?.name}</DialogTitle></DialogHeader>
          {selectedSubClass && (
            <SubjectToolbox role="teacher" subject={selectedSubClass.subject ?? selectedGrade?.subject ?? ""} classId={selectedSubClass.id} />
          )}
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
