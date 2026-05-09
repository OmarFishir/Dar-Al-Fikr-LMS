import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import SchoolLayout from "@/components/shared/SchoolLayout";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Star,
  Trophy,
  Video,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import SubjectToolbox from "@/components/subject/SubjectToolbox";

// ─── Monster color palettes (same as teacher Points page) ────────────────────
const MONSTER_COLORS: [string, string][] = [
  ["#FF6B6B", "#FF8E53"],
  ["#4ECDC4", "#44A08D"],
  ["#A18CD1", "#FBC2EB"],
  ["#FDD835", "#F9A825"],
  ["#66BB6A", "#43A047"],
  ["#42A5F5", "#1E88E5"],
  ["#FF7043", "#E64A19"],
  ["#AB47BC", "#8E24AA"],
];

function MonsterMini({ studentId }: { studentId: number }) {
  const idx = studentId % MONSTER_COLORS.length;
  const [c1, c2] = MONSTER_COLORS[idx];
  const uid = `mini-${studentId}`;
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`gm-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <polygon points="26,18 22,6 32,16" fill={c1} />
      <polygon points="54,18 58,6 48,16" fill={c1} />
      <circle cx="40" cy="44" r="30" fill={`url(#gm-${uid})`} />
      <circle cx="30" cy="38" r="7" fill="white" />
      <circle cx="50" cy="38" r="7" fill="white" />
      <circle cx="32" cy="39" r="4" fill="#222" />
      <circle cx="52" cy="39" r="4" fill="#222" />
      <circle cx="33" cy="37" r="1.5" fill="white" />
      <circle cx="53" cy="37" r="1.5" fill="white" />
      <path d="M28 52 Q40 62 52 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="73" rx="8" ry="5" fill={c1} />
      <ellipse cx="50" cy="73" rx="8" ry="5" fill={c1} />
    </svg>
  );
}

interface ClassDetailProps {
  classId: string;
  subClassId?: string;
}

export default function ClassDetail({ classId, subClassId }: ClassDetailProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("quizzes");

  const numericClassId = parseInt(classId, 10);
  const numericSubClassId = subClassId ? parseInt(subClassId, 10) : null;
  const activeClassId = numericSubClassId ?? numericClassId;

  // Fetch parent class info
  const { data: parentClass } = trpc.classes.get.useQuery(
    { id: numericClassId },
    { enabled: !!numericClassId }
  );

  // Fetch sub-classes of the parent
  const { data: subClasses } = trpc.classes.listSubClasses.useQuery(
    { parentClassId: numericClassId },
    { enabled: !!numericClassId }
  );

  // Fetch active class info (sub-class if selected, otherwise parent)
  const { data: activeClass } = trpc.classes.get.useQuery(
    { id: activeClassId },
    { enabled: !!activeClassId }
  );

  // Content queries — all filtered by the active class
  const { data: quizzes } = trpc.quizzes.forClass.useQuery(
    { classId: activeClassId },
    { enabled: !!activeClassId }
  );
  const { data: materials } = trpc.materials.list.useQuery(
    { classId: activeClassId },
    { enabled: !!activeClassId }
  );
  const { data: meetings } = trpc.zoom.list.useQuery(
    { classId: activeClassId },
    { enabled: !!activeClassId }
  );
  const { data: weeklyPlans } = trpc.weeklyPlans.list.useQuery(
    { classId: activeClassId },
    { enabled: !!activeClassId }
  );
  // Points leaderboard for this class
  const { data: leaderboard } = trpc.points.leaderboard.useQuery(
    { classId: activeClassId },
    { enabled: !!activeClassId && activeTab === "points" }
  );

  // If no sub-class selected yet and there are sub-classes, show sub-class picker
  const showSubClassPicker = !numericSubClassId && subClasses && subClasses.length > 0;

  // Current user's rank and total in leaderboard
  const myEntry = leaderboard?.find((e) => e.studentId === user?.id);
  const myRank = myEntry ? (leaderboard?.indexOf(myEntry) ?? -1) + 1 : null;

  return (
    <SchoolLayout role="student">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/student/classes")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Classes
          </button>
          {parentClass && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => navigate(`/student/classes/${classId}`)}
                className="hover:text-foreground transition-colors"
              >
                {(parentClass as any).name}
              </button>
            </>
          )}
          {numericSubClassId && activeClass && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{(activeClass as any).name}</span>
            </>
          )}
        </div>

        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {numericSubClassId
              ? (activeClass as any)?.name ?? "Loading..."
              : (parentClass as any)?.name ?? "Loading..."}
          </h1>
          <p className="text-muted-foreground mt-1">
            {numericSubClassId
              ? (activeClass as any)?.description
              : (parentClass as any)?.description}
          </p>
        </div>

        {/* Sub-class picker — shown when viewing parent class that has sub-classes */}
        {showSubClassPicker && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Select your class section</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(subClasses as any[]).map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => navigate(`/student/classes/${classId}/sub/${sub.id}`)}
                  className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{sub.name}</span>
                  {sub.description && (
                    <span className="text-xs text-muted-foreground mt-1">{sub.description}</span>
                  )}
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
              {/* Also allow viewing parent class content directly */}
              <button
                onClick={() => navigate(`/student/classes/${classId}/sub/0`)}
                className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="font-semibold text-muted-foreground">All Sections</span>
                <span className="text-xs text-muted-foreground mt-1">View general content</span>
              </button>
            </div>
          </div>
        )}

        {/* Content tabs — shown when a sub-class is selected OR parent has no sub-classes */}
        {(!showSubClassPicker || numericSubClassId !== null) && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 w-full">

              <TabsTrigger value="quizzes" className="flex items-center gap-1 text-xs px-1">
                <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Quizzes</span>
                <span className="sm:hidden">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1 text-xs px-1">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Materials</span>
                <span className="sm:hidden">Books</span>
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-1 text-xs px-1">
                <Video className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Meetings</span>
                <span className="sm:hidden">Meet</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-1 text-xs px-1">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Plans</span>
                <span className="sm:hidden">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-1 text-xs px-1">
                <span className="text-sm">🛠️</span>
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>

              <TabsTrigger value="points" className="flex items-center gap-1 text-xs px-1">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Points</span>
                <span className="sm:hidden">Pts</span>
              </TabsTrigger>
            </TabsList>

            {/* QUIZZES TAB */}
            <TabsContent value="quizzes" className="space-y-3 mt-4">
              {!quizzes || (quizzes as any[]).length === 0 ? (
                <EmptyState icon={<Trophy className="w-8 h-8" />} message="No quizzes yet" />
              ) : (
                (quizzes as any[]).map((q: any) => (
                  <Card
                    key={q.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/student/quizzes`)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{q.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.questionCount ?? 0} questions
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={q.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {q.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* MATERIALS TAB */}
            <TabsContent value="materials" className="space-y-3 mt-4">
              {!materials || (materials as any[]).length === 0 ? (
                <EmptyState icon={<BookOpen className="w-8 h-8" />} message="No materials uploaded yet" />
              ) : (
                (materials as any[]).map((m: any) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.category}</p>
                        </div>
                      </div>
                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* MEETINGS TAB */}
            <TabsContent value="meetings" className="space-y-3 mt-4">
              {!meetings || (meetings as any[]).length === 0 ? (
                <EmptyState icon={<Video className="w-8 h-8" />} message="No meetings scheduled" />
              ) : (
                (meetings as any[]).map((m: any) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Video className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.scheduledAt
                              ? new Date(m.scheduledAt).toLocaleString()
                              : "Time TBD"}
                          </p>
                        </div>
                      </div>
                      {m.zoomLink && (
                        <a href={m.zoomLink} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
                            <Video className="w-3.5 h-3.5" />
                            Join
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* WEEKLY PLANS TAB */}
            <TabsContent value="plans" className="space-y-3 mt-4">
              {!weeklyPlans || (weeklyPlans as any[]).length === 0 ? (
                <EmptyState icon={<Calendar className="w-8 h-8" />} message="No weekly plans yet" />
              ) : (
                (weeklyPlans as any[]).map((p: any) => (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Week of {new Date(p.weekStart).toLocaleDateString()}</span>
                        {p.fileUrl && (
                          <a href={p.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5" />
                              View PDF
                            </Button>
                          </a>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {p.content && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                      </CardContent>
                    )}
                    {p.fileUrl && p.fileUrl.endsWith(".pdf") && (
                      <CardContent className="pt-0">
                        <iframe
                          src={p.fileUrl}
                          className="w-full h-96 rounded-lg border"
                          title="Weekly Plan PDF"
                        />
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            {/* POINTS TAB */}
            <TabsContent value="points" className="space-y-4 mt-4">
              {/* My points summary */}
              {myEntry && (
                <Card className="border-2 border-amber-200 bg-amber-50/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-14 h-14 flex-shrink-0">
                      <MonsterMini studentId={user?.id ?? 0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">Your Points</p>
                      <p className="text-xs text-muted-foreground">Rank #{myRank} in this class</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black font-sans text-amber-600">{myEntry.total}</p>
                      <p className="text-xs text-muted-foreground">total pts</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard */}
              <div>
                <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Class Leaderboard
                </h3>
                {!leaderboard || leaderboard.length === 0 ? (
                  <EmptyState icon={<Zap className="w-8 h-8" />} message="No points awarded yet" />
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, idx) => {
                      const isMe = entry.studentId === user?.id;
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                      return (
                        <div
                          key={entry.studentId}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isMe
                              ? "border-amber-300 bg-amber-50 shadow-sm"
                              : "border-border bg-card"
                          }`}
                        >
                          <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                            {medal ?? `#${idx + 1}`}
                          </span>
                          <div className="w-10 h-10 flex-shrink-0">
                            <MonsterMini studentId={entry.studentId} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isMe ? "text-amber-700" : "text-foreground"}`}>
                              {entry.name}
                              {isMe && <span className="ml-1.5 text-xs font-normal text-amber-500">(you)</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-black font-sans ${isMe ? "text-amber-600" : "text-foreground"}`}>
                              {entry.total}
                            </p>
                            <p className="text-[10px] text-muted-foreground">pts</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
            {/* TOOLS TAB */}
            <TabsContent value="tools" className="mt-4">
              <SubjectToolbox
                subject={(activeClass as any)?.subject ?? (parentClass as any)?.subject ?? "General"}
                classId={activeClassId ?? numericClassId}
                role="student"
              />
            </TabsContent>

          </Tabs>
        )}
      </div>
    </SchoolLayout>
  );
}



function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <div className="opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
