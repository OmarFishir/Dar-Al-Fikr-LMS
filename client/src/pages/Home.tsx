import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  MessageSquare,
  Calendar,
  BarChart3,
  Video,
  Bell,
  ArrowRight,
  GraduationCap,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: me } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!loading && isAuthenticated && me) {
      if (me.role === "teacher" || me.role === "admin") {
        navigate("/teacher");
      } else if (me.role === "student") {
        navigate("/student");
      } else {
        navigate("/setup");
      }
    }
  }, [loading, isAuthenticated, me, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-sans">Loading SchoolHub…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            <span className="font-serif text-lg font-bold tracking-tight">SchoolHub</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs overline hidden md:block">Unified Educational Platform</span>
            <a href={getLoginUrl()} className="btn-editorial text-sm px-5 py-2 inline-flex items-center gap-2 border border-foreground bg-foreground text-background rounded-sm hover:bg-transparent hover:text-foreground transition-all duration-200">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Typography block */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <p className="overline">Dar Al-Fikr School · Jeddah</p>
              <div className="rule-line w-12 border-t-2 border-foreground/30 mb-4" />
            </div>
            <h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] font-black leading-[1.05] tracking-[-0.03em] text-foreground">
              Every Tool.<br />
              <em className="font-serif italic font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                One Place.
              </em>
            </h1>
            <p className="text-lg text-muted-foreground font-sans font-light max-w-lg leading-relaxed">
              SchoolHub replaces Google Classroom, Gmail, Zoom, and scattered grade sheets with a single, 
              elegantly unified platform — built for teachers and students who deserve better.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-7 py-3 bg-foreground text-background text-sm font-medium font-sans rounded-sm hover:bg-foreground/90 transition-all duration-200"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-7 py-3 border border-border text-foreground text-sm font-medium font-sans rounded-sm hover:border-foreground transition-all duration-200"
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Right: Feature grid preview */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { icon: BookOpen, label: "Assignments", desc: "Create & submit" },
              { icon: MessageSquare, label: "Messaging", desc: "Replace Gmail" },
              { icon: Calendar, label: "Weekly Plans", desc: "Organized schedules" },
              { icon: BarChart3, label: "Grades", desc: "Track progress" },
              { icon: Video, label: "Zoom", desc: "Integrated meetings" },
              { icon: Sparkles, label: "AI Assistant", desc: "Smart help" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="editorial-card p-4 space-y-2">
                <div className="w-8 h-8 rounded-sm bg-foreground/8 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-foreground/70" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-serif font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground font-sans">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="rule-line" />
      </div>

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "10+", label: "Platforms Replaced" },
            { value: "2", label: "User Roles" },
            { value: "∞", label: "Assignments Managed" },
            { value: "1", label: "Unified Hub" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="font-serif text-4xl font-black text-foreground">{value}</p>
              <p className="text-xs overline">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="rule-line" />
      </div>

      {/* ─── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16 space-y-3">
          <p className="overline">Platform Features</p>
          <h2 className="font-serif text-4xl font-bold text-foreground">
            Everything your school needs,<br />
            <em style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="font-light italic">
              finally in one place.
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Role-Based Access",
              desc: "Teachers and students each see only their relevant controls. Strict separation of administrative data and personal records.",
              tag: "Security",
            },
            {
              icon: BookOpen,
              title: "Assignment Management",
              desc: "Teachers create, attach files to, and publish assignments. Students submit documents, PDFs, and images — all stored securely.",
              tag: "Core",
            },
            {
              icon: MessageSquare,
              title: "In-Platform Messaging",
              desc: "A threaded conversation system that fully replaces Gmail for all teacher-student communication needs.",
              tag: "Communication",
            },
            {
              icon: Calendar,
              title: "Weekly Plan Board",
              desc: "Teachers publish weekly schedules directly on the platform. Students view their personalized plan from their dashboard.",
              tag: "Planning",
            },
            {
              icon: BarChart3,
              title: "Grade Management",
              desc: "Teachers input grades per assignment per student. Students see only their own grades with detailed feedback.",
              tag: "Academic",
            },
            {
              icon: Video,
              title: "Zoom Integration",
              desc: "Schedule and share Zoom links directly within the platform. Students join meetings without leaving SchoolHub.",
              tag: "Meetings",
            },
            {
              icon: Bell,
              title: "Smart Notifications",
              desc: "In-app alerts for new assignments, messages, grade updates, and weekly plans. No more missed emails.",
              tag: "Alerts",
            },
            {
              icon: FileText,
              title: "File Uploads",
              desc: "Secure cloud storage for all submissions and attachments. Supports PDFs, images, and documents.",
              tag: "Storage",
            },
            {
              icon: Sparkles,
              title: "AI Assistant",
              desc: "Helps students understand assignments and get hints. Helps teachers draft clear, engaging assignment descriptions.",
              tag: "AI",
            },
          ].map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="editorial-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-sm bg-foreground/6 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-sm bg-secondary text-muted-foreground">
                  {tag}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-xs font-sans font-semibold tracking-widest uppercase opacity-50">Get Started Today</p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-black leading-tight">
            Your school, unified.
          </h2>
          <p className="text-lg opacity-70 font-sans font-light max-w-xl mx-auto">
            Sign in with your school account and choose your role to begin.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground text-sm font-medium font-sans rounded-sm hover:bg-background/90 transition-all duration-200"
          >
            Enter SchoolHub <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="font-serif text-sm font-semibold text-muted-foreground">SchoolHub</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            Built for Dar Al-Fikr School · Jeddah, Saudi Arabia
          </p>
        </div>
      </footer>
    </div>
  );
}
