import { useCallback, useEffect, useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trophy, Shuffle, Users, Plus, Minus, Star, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Monster color palettes ───────────────────────────────────────────────────
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

// ─── Monster SVG shapes ───────────────────────────────────────────────────────
function MonsterRound({ c1, c2, uid }: { c1: string; c2: string; uid: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`gr-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <polygon points="26,18 22,6 32,16" fill={c1} />
      <polygon points="54,18 58,6 48,16" fill={c1} />
      <circle cx="40" cy="44" r="30" fill={`url(#gr-${uid})`} />
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

function MonsterSpiky({ c1, c2, uid }: { c1: string; c2: string; uid: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`gs-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <polygon points="40,4 36,18 44,18" fill={c1} />
      <polygon points="24,10 22,24 30,20" fill={c1} />
      <polygon points="56,10 58,24 50,20" fill={c1} />
      <rect x="14" y="20" width="52" height="44" rx="14" fill={`url(#gs-${uid})`} />
      <circle cx="30" cy="38" r="8" fill="white" />
      <circle cx="50" cy="38" r="8" fill="white" />
      <circle cx="32" cy="39" r="5" fill="#222" />
      <circle cx="52" cy="39" r="5" fill="#222" />
      <circle cx="33" cy="37" r="2" fill="white" />
      <circle cx="53" cy="37" r="2" fill="white" />
      <rect x="28" y="53" width="24" height="6" rx="3" fill="white" />
      <rect x="31" y="53" width="4" height="6" fill={c2} />
      <rect x="38" y="53" width="4" height="6" fill={c2} />
      <rect x="45" y="53" width="4" height="6" fill={c2} />
    </svg>
  );
}

function MonsterBlob({ c1, c2, uid }: { c1: string; c2: string; uid: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`gb-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <line x1="32" y1="14" x2="28" y2="4" stroke={c1} strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="3" r="3" fill={c2} />
      <line x1="48" y1="14" x2="52" y2="4" stroke={c1} strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="3" r="3" fill={c2} />
      <path d="M12 42 C12 22 28 14 40 14 C52 14 68 22 68 42 C68 62 54 72 40 72 C26 72 12 62 12 42Z" fill={`url(#gb-${uid})`} />
      <circle cx="30" cy="38" r="7" fill="white" />
      <circle cx="50" cy="38" r="7" fill="white" />
      <circle cx="31" cy="39" r="4" fill="#222" />
      <circle cx="51" cy="39" r="4" fill="#222" />
      <circle cx="32" cy="37" r="1.5" fill="white" />
      <circle cx="52" cy="37" r="1.5" fill="white" />
      <path d="M30 54 Q40 64 50 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Class monster (always shape index 0 = Round, fixed gold/purple gradient) ─
function ClassMonster() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="gr-class" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDD835" />
          <stop offset="100%" stopColor="#AB47BC" />
        </linearGradient>
      </defs>
      {/* Crown */}
      <polygon points="20,22 28,10 40,18 52,10 60,22" fill="#FDD835" />
      <circle cx="28" cy="10" r="3" fill="#FF6B6B" />
      <circle cx="40" cy="18" r="3" fill="#4ECDC4" />
      <circle cx="52" cy="10" r="3" fill="#FF6B6B" />
      <circle cx="40" cy="46" r="30" fill="url(#gr-class)" />
      <circle cx="30" cy="40" r="7" fill="white" />
      <circle cx="50" cy="40" r="7" fill="white" />
      <circle cx="32" cy="41" r="4" fill="#222" />
      <circle cx="52" cy="41" r="4" fill="#222" />
      <circle cx="33" cy="39" r="1.5" fill="white" />
      <circle cx="53" cy="39" r="1.5" fill="white" />
      <path d="M28 54 Q40 66 52 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="75" rx="8" ry="5" fill="#FDD835" />
      <ellipse cx="50" cy="75" rx="8" ry="5" fill="#FDD835" />
    </svg>
  );
}

function MonsterAvatar({ studentId, size = "md" }: { studentId: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const colorIdx = studentId % MONSTER_COLORS.length;
  const shapeIdx = studentId % 3;
  const [c1, c2] = MONSTER_COLORS[colorIdx];
  const uid = `m${studentId}`;
  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : size === "xl" ? "w-28 h-28" : "w-16 h-16";
  return (
    <div className={cn("flex-shrink-0", sizeClass)}>
      {shapeIdx === 0 && <MonsterRound c1={c1} c2={c2} uid={uid} />}
      {shapeIdx === 1 && <MonsterSpiky c1={c1} c2={c2} uid={uid} />}
      {shapeIdx === 2 && <MonsterBlob c1={c1} c2={c2} uid={uid} />}
    </div>
  );
}

// ─── Skill badges ─────────────────────────────────────────────────────────────
const SKILL_BADGES = [
  { label: "Great Work!", points: 1, emoji: "⭐", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { label: "Helping Others", points: 1, emoji: "🤝", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { label: "Participation", points: 1, emoji: "🙋", color: "bg-green-100 text-green-800 border-green-200" },
  { label: "Creativity", points: 1, emoji: "🎨", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { label: "Perfect Score", points: 3, emoji: "💯", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { label: "Leadership", points: 2, emoji: "👑", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { label: "Late Work", points: -1, emoji: "⏰", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { label: "Missing Work", points: -2, emoji: "❌", color: "bg-red-100 text-red-800 border-red-200" },
  { label: "Disruption", points: -1, emoji: "📢", color: "bg-red-100 text-red-800 border-red-200" },
];

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#FF6B6B", "#FDD835", "#4ECDC4", "#A18CD1", "#66BB6A", "#42A5F5", "#FF7043"];

function ConfettiParticle({ color, angle, distance }: { color: string; angle: number; distance: number }) {
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  return (
    <div
      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-sm pointer-events-none"
      style={{
        backgroundColor: color,
        transform: `translate(-50%, -50%)`,
        animation: `confetti-fly 0.9s ease-out forwards`,
        // @ts-ignore
        "--tx": `${x}px`,
        "--ty": `${y}px`,
      }}
    />
  );
}

function PointBurst({ value, onDone }: { value: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  const isPositive = value > 0;
  const particleCount = Math.min(Math.abs(value) * 3 + 6, 18);
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    angle: (i / particleCount) * Math.PI * 2,
    distance: 30 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      <div
        className={cn("absolute inset-0 rounded-2xl", isPositive ? "bg-emerald-400/30" : "bg-red-400/30")}
        style={{ animation: "flash-ring 0.4s ease-out forwards" }}
      />
      {isPositive && particles.map((p, i) => (
        <ConfettiParticle key={i} color={p.color} angle={p.angle} distance={p.distance} />
      ))}
      <div
        className={cn(
          "absolute -top-10 left-1/2 -translate-x-1/2 text-2xl font-black font-sans select-none",
          isPositive ? "text-emerald-500" : "text-red-500"
        )}
        style={{ animation: "float-up 1.1s ease-out forwards", textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
      >
        {isPositive ? `+${value}` : value}
      </div>
    </div>
  );
}

// ─── Award Dialog ─────────────────────────────────────────────────────────────
function AwardDialog({
  open,
  onClose,
  title,
  onAward,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onAward: (pts: number, comment: string) => void;
  isPending: boolean;
}) {
  const [points, setPoints] = useState(1);
  const [comment, setComment] = useState("");

  // Reset when opened
  useEffect(() => {
    if (open) { setPoints(1); setComment(""); }
  }, [open]);

  const handleSkill = (skill: typeof SKILL_BADGES[0]) => {
    setPoints(skill.points);
    setComment(skill.label);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Skill picker */}
          <div>
            <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Skills</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SKILL_BADGES.map((skill) => (
                <button
                  key={skill.label}
                  className={cn(
                    "text-xs px-2 py-1.5 rounded-lg border font-sans font-medium flex items-center gap-1.5 transition-all hover:opacity-80",
                    skill.color,
                    comment === skill.label && points === skill.points && "ring-2 ring-foreground scale-[1.02]"
                  )}
                  onClick={() => handleSkill(skill)}
                >
                  <span>{skill.emoji}</span>
                  <span className="flex-1 text-left truncate">{skill.label}</span>
                  <span className="font-bold shrink-0">{skill.points > 0 ? `+${skill.points}` : skill.points}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount stepper */}
          <div>
            <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custom Amount</p>
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => setPoints((p) => p - 1)}
                className="w-10 h-10 rounded-full border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className={cn(
                "w-16 text-center font-black font-sans text-3xl select-none",
                points > 0 ? "text-emerald-600" : points < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {points > 0 ? `+${points}` : points}
              </span>
              <button
                onClick={() => setPoints((p) => p + 1)}
                className="w-10 h-10 rounded-full border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wide mb-2">Comment</p>
            <Textarea
              placeholder="What did they do? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="font-sans text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="font-sans">Cancel</Button>
          <Button
            onClick={() => { onAward(points, comment); onClose(); }}
            disabled={isPending || points === 0}
            className={cn(
              "font-sans font-semibold min-w-[120px]",
              points > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {isPending ? "Saving…" : points > 0 ? `Award +${points}` : `Deduct ${points}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Student card ─────────────────────────────────────────────────────────────
function StudentCard({
  student,
  total,
  rank,
  selected,
  highlighted,
  onSelect,
  onAward,
  burst,
  onBurstDone,
}: {
  student: { id: number; name: string | null };
  total: number;
  rank: number;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
  onAward: (pts: number, comment: string) => void;
  burst: number | null;
  onBurstDone: () => void;
}) {
  const [showAward, setShowAward] = useState(false);
  const firstName = (student.name ?? "Student").split(" ")[0];

  const rankIcon =
    rank === 1 ? <Crown className="w-3.5 h-3.5 text-amber-500" /> :
    rank === 2 ? <Medal className="w-3.5 h-3.5 text-slate-400" /> :
    rank === 3 ? <Medal className="w-3.5 h-3.5 text-amber-700" /> : null;

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none bg-card",
          selected ? "border-foreground shadow-lg scale-[1.03]" : "border-border hover:border-foreground/30 hover:shadow-md",
          highlighted && "ring-4 ring-amber-400 ring-offset-2 scale-105"
        )}
        onClick={onSelect}
      >
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground flex items-center justify-center z-10 shadow">
            <span className="text-background text-[10px] font-bold leading-none">✓</span>
          </div>
        )}
        {burst !== null && <PointBurst value={burst} onDone={onBurstDone} />}

        <div className="p-3 flex flex-col items-center gap-2">
          <div
            className="relative cursor-pointer hover:scale-110 transition-transform"
            onClick={(e) => { e.stopPropagation(); setShowAward(true); }}
            title="Click to award points"
          >
            <MonsterAvatar studentId={student.id} size="lg" />
            {rankIcon && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                {rankIcon}
              </div>
            )}
          </div>

          <p className="text-xs font-semibold font-sans text-foreground text-center leading-tight">{firstName}</p>

          <div className={cn(
            "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans",
            total >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            <Star className="w-2.5 h-2.5" />
            {total}
          </div>
        </div>
      </div>

      <AwardDialog
        open={showAward}
        onClose={() => setShowAward(false)}
        title={`Award points — ${student.name ?? "Student"}`}
        onAward={(pts, comment) => { onAward(pts, comment); setBurst(pts); }}
        isPending={false}
      />
    </>
  );

  function setBurst(_pts: number) {
    // burst is managed by parent via onAward callback
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherPoints() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bursts, setBursts] = useState<Record<number, number | null>>({});
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkPoints, setBulkPoints] = useState(1);
  const [bulkComment, setBulkComment] = useState("");
  const [randomPicking, setRandomPicking] = useState(false);
  const [randomHighlight, setRandomHighlight] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showClassAward, setShowClassAward] = useState(false);

  const utils = trpc.useUtils();

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: students } = trpc.classes.students.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );
  const { data: leaderboard } = trpc.points.leaderboard.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const addPoints = trpc.points.add.useMutation({
    onSuccess: () => utils.points.leaderboard.invalidate(),
  });
  const bulkAdd = trpc.points.bulkAdd.useMutation({
    onSuccess: () => {
      utils.points.leaderboard.invalidate();
      setSelectedIds(new Set());
      setShowBulkDialog(false);
      toast.success("Points awarded!");
    },
  });

  const handleAward = useCallback((studentId: number, pts: number, comment: string) => {
    if (!selectedClassId) return;
    addPoints.mutate({ classId: selectedClassId, studentId, points: pts, comment });
    setBursts((prev) => ({ ...prev, [studentId]: pts }));
    const name = students?.find((s) => s.id === studentId)?.name?.split(" ")[0] ?? "student";
    toast.success(`${pts > 0 ? "+" : ""}${pts} for ${name}!`);
  }, [selectedClassId, addPoints, students]);

  const handleAwardAll = (pts: number, comment: string) => {
    if (!selectedClassId || !students) return;
    bulkAdd.mutate({ classId: selectedClassId, studentIds: students.map((s) => s.id), points: pts, comment });
    students.forEach((s) => setBursts((prev) => ({ ...prev, [s.id]: pts })));
    toast.success(`${pts > 0 ? "+" : ""}${pts} awarded to the whole class!`);
  };

  const handleBulkAward = () => {
    if (!selectedClassId || selectedIds.size === 0) return;
    bulkAdd.mutate({ classId: selectedClassId, studentIds: Array.from(selectedIds), points: bulkPoints, comment: bulkComment || undefined });
  };

  const handleRandomPick = () => {
    if (!students || students.length === 0) return;
    setRandomPicking(true);
    setRandomHighlight(null);
    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * students.length);
      setRandomHighlight(students[idx].id);
      count++;
      if (count >= 14) {
        clearInterval(interval);
        const final = students[Math.floor(Math.random() * students.length)];
        setRandomHighlight(final.id);
        setRandomPicking(false);
        toast.success(`🎲 ${(final.name ?? "Someone").split(" ")[0]} was randomly selected!`);
      }
    }, 75);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!students) return;
    setSelectedIds(selectedIds.size === students.length ? new Set() : new Set(students.map((s) => s.id)));
  };

  const rankMap: Record<number, number> = {};
  const totalMap: Record<number, number> = {};
  (leaderboard ?? []).forEach((e, i) => { rankMap[e.studentId] = i + 1; totalMap[e.studentId] = e.total; });

  const classTotal = (leaderboard ?? []).reduce((sum, e) => sum + e.total, 0);

  return (
    <SchoolLayout role="teacher">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Student Points</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">Award skills, track progress, celebrate achievements</p>
          </div>
          {selectedClassId && (
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors font-sans text-sm font-medium"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard
            </button>
          )}
        </div>

        {/* Class selector */}
        <div className="flex flex-wrap gap-2">
          {(classes ?? []).map((cls) => (
            <button
              key={cls.id}
              onClick={() => { setSelectedClassId(cls.id); setSelectedIds(new Set()); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-sans font-medium border transition-all",
                selectedClassId === cls.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40"
              )}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {!selectedClassId && (
          <div className="text-center py-20 text-muted-foreground font-sans">
            <Trophy className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">Select a class to manage points</p>
          </div>
        )}

        {selectedClassId && students && students.length > 0 && (
          <>
            {/* Leaderboard */}
            {showLeaderboard && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Class Leaderboard
                </h2>
                <div className="space-y-2">
                  {(leaderboard ?? []).slice(0, 10).map((entry, idx) => (
                    <div key={entry.studentId} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-accent/30">
                      <span className="w-7 text-center font-bold font-sans text-sm text-muted-foreground">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                      </span>
                      <MonsterAvatar studentId={entry.studentId} size="sm" />
                      <span className="flex-1 font-sans text-sm font-medium text-foreground">{entry.name}</span>
                      <span className={cn(
                        "font-bold font-sans text-sm px-3 py-1 rounded-full",
                        entry.total >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {entry.total >= 0 ? `+${entry.total}` : entry.total} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Class character + action bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/20 dark:to-purple-950/20 border border-amber-200 dark:border-amber-800">
              {/* Class character */}
              <div
                className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowClassAward(true)}
                title="Click to award the whole class"
              >
                <div className="w-20 h-20">
                  <ClassMonster />
                </div>
                <p className="text-xs font-sans font-bold text-foreground">Whole Class</p>
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans",
                  classTotal >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  <Star className="w-2.5 h-2.5" />
                  {classTotal} total
                </div>
              </div>

              <div className="h-12 w-px bg-border hidden sm:block" />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 flex-1">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium border border-border bg-background hover:bg-accent transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  {selectedIds.size === students.length ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <Badge variant="secondary" className="font-sans">{selectedIds.size} selected</Badge>
                    <button
                      onClick={() => setShowBulkDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      <Star className="w-3.5 h-3.5" /> Award Selected
                    </button>
                  </>
                )}
                <button
                  onClick={handleRandomPick}
                  disabled={randomPicking}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium border border-border bg-background hover:bg-accent transition-colors",
                    randomPicking && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Shuffle className={cn("w-3.5 h-3.5", randomPicking && "animate-spin")} />
                  Random Pick
                </button>
              </div>
            </div>

            {/* Monster grid — click avatar to award */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  total={totalMap[student.id] ?? 0}
                  rank={rankMap[student.id] ?? 999}
                  selected={selectedIds.has(student.id)}
                  highlighted={randomHighlight === student.id}
                  onSelect={() => toggleSelect(student.id)}
                  onAward={(pts, comment) => handleAward(student.id, pts, comment)}
                  burst={bursts[student.id] ?? null}
                  onBurstDone={() => setBursts((prev) => ({ ...prev, [student.id]: null }))}
                />
              ))}
            </div>
          </>
        )}

        {selectedClassId && (!students || students.length === 0) && (
          <div className="text-center py-16 text-muted-foreground font-sans">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No students enrolled in this class yet.</p>
          </div>
        )}
      </div>

      {/* Class award dialog */}
      <AwardDialog
        open={showClassAward}
        onClose={() => setShowClassAward(false)}
        title="Award the whole class"
        onAward={handleAwardAll}
        isPending={bulkAdd.isPending}
      />

      {/* Bulk award dialog (selected students) */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Award {selectedIds.size} Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {SKILL_BADGES.map((skill) => (
                <button
                  key={skill.label}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border font-sans font-medium flex items-center gap-2 transition-opacity hover:opacity-80",
                    skill.color,
                    bulkPoints === skill.points && bulkComment === skill.label && "ring-2 ring-foreground"
                  )}
                  onClick={() => { setBulkPoints(skill.points); setBulkComment(skill.label); }}
                >
                  <span>{skill.emoji}</span>
                  <span className="flex-1 text-left">{skill.label}</span>
                  <span className="font-bold">{skill.points > 0 ? `+${skill.points}` : skill.points}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setBulkPoints((p) => p - 1)} className="w-9 h-9 rounded-full border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <span className={cn("w-14 text-center font-black font-sans text-3xl", bulkPoints >= 0 ? "text-emerald-600" : "text-red-500")}>
                {bulkPoints > 0 ? `+${bulkPoints}` : bulkPoints}
              </span>
              <button onClick={() => setBulkPoints((p) => p + 1)} className="w-9 h-9 rounded-full border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              placeholder="Comment (optional)"
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
              className="font-sans text-sm"
              rows={2}
            />
            <Button onClick={handleBulkAward} disabled={bulkAdd.isPending} className="w-full font-sans">
              {bulkAdd.isPending ? "Awarding..." : `Award ${selectedIds.size} students`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
