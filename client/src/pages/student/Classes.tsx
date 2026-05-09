import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Users, Plus, BookOpen, ChevronRight, FileText, Trophy, Video, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

const SUBJECT_COLORS: Record<string, string> = {
  math: "from-blue-500 to-cyan-400",
  science: "from-green-500 to-emerald-400",
  english: "from-purple-500 to-violet-400",
  arabic: "from-orange-500 to-amber-400",
  history: "from-red-500 to-rose-400",
  geography: "from-teal-500 to-green-400",
  "social studies": "from-yellow-500 to-amber-400",
  physics: "from-indigo-500 to-blue-400",
  chemistry: "from-pink-500 to-fuchsia-400",
  biology: "from-lime-500 to-green-400",
  ict: "from-sky-500 to-blue-400",
  art: "from-fuchsia-500 to-pink-400",
};

function getGradient(subject?: string | null) {
  if (!subject) return "from-slate-500 to-slate-400";
  const key = subject.toLowerCase();
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "from-violet-500 to-purple-400";
}

export default function StudentClasses() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const { data: classes, isLoading } = trpc.classes.myClasses.useQuery();
  // Show only sub-classes (classes with a parentId)
  const subClasses = classes?.filter((c) => (c as any).parentId) ?? [];
  const joinClass = trpc.classes.join.useMutation({
    onSuccess: (cls) => {
      toast.success(`Joined "${cls.name}"!`);
      utils.classes.myClasses.invalidate();
      setShowJoin(false);
      setInviteCode("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <SchoolLayout role="student">
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Classes</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Classes</h1>
            <p className="text-sm text-muted-foreground">Click a class to view assignments, quizzes, materials, and more.</p>
          </div>
          <Button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
          >
            <Plus className="w-4 h-4" /> Join Class
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : subClasses.length === 0 ? (
          <div className="editorial-card p-12 text-center space-y-4">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">No classes yet</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">You haven't joined any classes yet. Ask your teacher for an invite code.</p>
            </div>
            <Button onClick={() => setShowJoin(true)} variant="outline" className="rounded-sm">
              <Plus className="w-4 h-4 mr-2" /> Join a Class
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subClasses.map((cls) => {
              const gradient = getGradient((cls as any).subject);
              return (
                <button
                  key={cls.id}
                  onClick={() => navigate(`/student/classes/${cls.id}`)}
                  className="group text-left rounded-2xl overflow-hidden border-2 border-transparent hover:border-foreground/10 shadow-sm hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className={`bg-gradient-to-r ${gradient} px-5 py-5`}>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {(cls as any).subject && (
                      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/80">{(cls as any).subject}</p>
                    )}
                    <h3 className="font-serif text-xl font-bold text-white mt-0.5 leading-tight">{cls.name}</h3>
                  </div>
                  <div className="bg-card px-5 py-4 space-y-3">
                    {cls.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{cls.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {[{icon: FileText, label: "Assignments"},{icon: Trophy, label: "Quizzes"},{icon: Video, label: "Meetings"},{icon: Star, label: "Points"}].map(({icon: Icon, label}) => (
                        <span key={label} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <Icon className="w-2.5 h-2.5" />{label}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold">Join a Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground font-sans">Enter the invite code provided by your teacher.</p>
            <div className="space-y-1.5">
              <label className="text-xs overline">Invite Code *</label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12345"
                className="rounded-sm font-mono tracking-widest text-center text-lg"
                maxLength={8}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!inviteCode) { toast.error("Enter an invite code"); return; }
                  joinClass.mutate({ inviteCode });
                }}
                disabled={joinClass.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {joinClass.isPending ? "Joining…" : "Join Class"}
              </Button>
              <Button variant="outline" onClick={() => setShowJoin(false)} className="rounded-sm">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
