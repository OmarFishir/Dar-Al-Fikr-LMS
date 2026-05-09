import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, BookOpen, CheckCircle, Award, TrendingUp, Star } from "lucide-react";
import { getEarnedBadges, getNextBadge, getNextBadgeProgress, BADGES } from "@/lib/badges";

const MONSTER_COLORS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

const MONSTER_EMOJIS = ["🐉", "🦊", "🐻", "🦁", "🐯", "🦄", "🐸", "🦋"];

function getMonsterIndex(userId: number) {
  return userId % 8;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: submissions } = trpc.submissions.mySubmissions.useQuery();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const monsterIdx = getMonsterIndex(user?.id ?? 0);
  const monsterColor = MONSTER_COLORS[monsterIdx];
  const monsterEmoji = MONSTER_EMOJIS[monsterIdx];

  const allSubmissions = (submissions ?? []) as any[];
  const allClasses = (classes ?? []) as any[];
  const gradedSubmissions = allSubmissions.filter((s: any) => s.grade !== null && s.grade !== undefined);

  const avgGrade =
    gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum: number, s: any) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length)
      : null;

  // Get points for selected class
  const firstClassId = allClasses[0]?.id ?? null;
  const activeClassId = selectedClassId ?? firstClassId;

  const { data: leaderboard } = trpc.points.leaderboard.useQuery(
    { classId: activeClassId! },
    { enabled: !!activeClassId }
  );

  const myPoints = (leaderboard as any[])?.find((e: any) => e.studentId === user?.id)?.total ?? 0;
  const myRank = (leaderboard as any[])?.findIndex((e: any) => e.studentId === user?.id) ?? -1;

  // Badges from points
  const earnedBadges = getEarnedBadges(myPoints);
  const nextBadge = getNextBadge(myPoints);
  const nextBadgeProgress = getNextBadgeProgress(myPoints);

  return (
    <SchoolLayout role="student">
      <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
        {/* Hero card */}
        <div className={`rounded-2xl bg-gradient-to-br ${monsterColor} p-8 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-4xl select-none"
                style={{ left: `${(i * 137.5) % 100}%`, top: `${(i * 97.3) % 100}%`, opacity: 0.3, transform: `rotate(${i * 23}deg)` }}
              >
                {monsterEmoji}
              </div>
            ))}
          </div>
          <div className="relative flex items-center gap-6 flex-wrap">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl shadow-lg border border-white/30">
              {monsterEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-serif font-bold">{user?.name ?? "Student"}</h1>
              <p className="text-white/80 text-sm mt-1">{user?.email}</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full border border-white/30">
                  ⭐ {myPoints} pts
                </span>
                {myRank >= 0 && (
                  <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    🏅 Rank #{myRank + 1}
                  </span>
                )}
                {earnedBadges.slice(-2).map((b) => (
                  <span key={b.id} className="text-sm bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    {b.emoji} {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="editorial-card">
            <CardContent className="p-5 text-center space-y-1">
              <BarChart3 className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="text-2xl font-bold text-foreground">{avgGrade !== null ? `${avgGrade}%` : "—"}</p>
              <p className="text-xs text-muted-foreground">Avg Grade</p>
            </CardContent>
          </Card>
          <Card className="editorial-card">
            <CardContent className="p-5 text-center space-y-1">
              <BookOpen className="w-6 h-6 text-violet-400 mx-auto" />
              <p className="text-2xl font-bold text-foreground">{allClasses.length}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card className="editorial-card">
            <CardContent className="p-5 text-center space-y-1">
              <Star className="w-6 h-6 text-amber-400 mx-auto" />
              <p className="text-2xl font-bold text-foreground">{myPoints}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
          <Card className="editorial-card">
            <CardContent className="p-5 text-center space-y-1">
              <Award className="w-6 h-6 text-rose-400 mx-auto" />
              <p className="text-2xl font-bold text-foreground">{earnedBadges.length}</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Next badge progress */}
        {nextBadge && (
          <Card className="editorial-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">Next Badge: {nextBadge.emoji} {nextBadge.name}</p>
                  <p className="text-xs text-muted-foreground">{nextBadge.description} — need {nextBadge.threshold} pts</p>
                </div>
                <span className="text-2xl">{nextBadge.emoji}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${nextBadgeProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{nextBadgeProgress}% there</p>
            </CardContent>
          </Card>
        )}

        {/* All badges */}
        <div className="space-y-3">
          <h2 className="font-serif text-xl font-bold">Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {BADGES.map((badge) => {
              const earned = myPoints >= badge.threshold;
              return (
                <div
                  key={badge.id}
                  className={`editorial-card p-4 text-center transition-all ${earned ? "" : "opacity-40 grayscale"}`}
                >
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <p className="font-semibold text-xs text-foreground">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {earned ? (
                    <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">Earned ✓</span>
                  ) : (
                    <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{badge.threshold} pts needed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Classes */}
        <div className="space-y-3">
          <h2 className="font-serif text-xl font-bold">My Classes</h2>
          {allClasses.length === 0 ? (
            <div className="editorial-card p-8 text-center text-sm text-muted-foreground">
              You haven't joined any classes yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allClasses.map((cls: any) => (
                <div key={cls.id} className="editorial-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">📖</div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{cls.name}</p>
                    {cls.subject && <p className="text-xs text-muted-foreground">{cls.subject}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent grades */}
        {gradedSubmissions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-bold">Recent Grades</h2>
            <div className="space-y-2">
              {gradedSubmissions.slice(0, 5).map((s: any) => (
                <div key={s.id} className="editorial-card p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${
                    (s.grade ?? 0) >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                    (s.grade ?? 0) >= 70 ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {s.grade ?? "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">Assignment #{s.assignmentId}</p>
                    <p className="text-xs text-muted-foreground">{s.feedback ?? ""}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
