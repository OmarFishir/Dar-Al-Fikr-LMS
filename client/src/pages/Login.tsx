import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { GraduationCap, ArrowRight } from "lucide-react";

// Self-contained login for the Railway build. POSTs email + name to
// /api/auth/login; the server signs the JWT cookie and redirects role-aware
// from Home.tsx based on the user's stored role.
export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? `Login failed (${resp.status})`);
      }
      // Bust the cached "me" query so Home re-checks and routes to the right dashboard.
      await utils.auth.me.invalidate();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 justify-center">
            <GraduationCap className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            <span className="font-serif text-lg font-bold tracking-tight">SchoolHub</span>
          </div>
          <h1 className="font-serif text-3xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Enter your school email and full name to continue.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 editorial-card p-6">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-name">Full name</Label>
            <Input
              id="login-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive font-sans">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : (
              <span className="inline-flex items-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <p className="text-xs text-muted-foreground font-sans text-center">
            Teachers configured in <code>TEACHER_EMAILS</code> get the teacher role automatically;
            everyone else starts as a student.
          </p>
        </form>
      </div>
    </div>
  );
}
