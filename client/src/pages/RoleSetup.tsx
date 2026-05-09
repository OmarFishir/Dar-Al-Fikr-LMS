import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";

export default function RoleSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Admin users already have access — send them straight to the teacher dashboard
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "teacher")) {
      navigate("/teacher");
    } else if (user && user.role === "student") {
      navigate("/student");
    }
  }, [user, navigate]);

  const setRole = trpc.auth.setRole.useMutation({
    onSuccess: async (_, vars) => {
      await utils.auth.me.invalidate();
      toast.success(`Welcome to SchoolHub as a ${vars.role}!`);
      navigate(vars.role === "teacher" ? "/teacher" : "/student");
    },
    onError: () => toast.error("Failed to set role. Please try again."),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <GraduationCap className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl font-black text-foreground">Welcome to SchoolHub</h1>
          <p className="text-muted-foreground font-sans text-base">
            Hello, <strong>{user?.name ?? "there"}</strong>. Please select your role to continue.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Teacher */}
          <button
            onClick={() => setRole.mutate({ role: "teacher" })}
            disabled={setRole.isPending}
            className="editorial-card p-8 text-left space-y-4 hover:border-foreground/40 transition-all duration-200 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-sm bg-foreground/8 flex items-center justify-center">
              <Users className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-foreground">Teacher</h2>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Create assignments, manage classes, post weekly plans, schedule meetings, and grade students.
              </p>
            </div>
            <div className="text-xs overline">Select Role →</div>
          </button>

          {/* Student */}
          <button
            onClick={() => setRole.mutate({ role: "student" })}
            disabled={setRole.isPending}
            className="editorial-card p-8 text-left space-y-4 hover:border-foreground/40 transition-all duration-200 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-sm bg-foreground/8 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-foreground">Student</h2>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                View assignments, submit work, check grades, join Zoom meetings, and message teachers.
              </p>
            </div>
            <div className="text-xs overline">Select Role →</div>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground font-sans">
          Your role can be changed later by an administrator.
        </p>
      </div>
    </div>
  );
}
