import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  BarChart3,
  Video,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Users,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Star,
  Bell,
  Library,
  ClipboardCheck,
  Sun,
  Moon,
  UserCircle,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SchoolLayoutProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

export default function SchoolLayout({ children, role }: SchoolLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: msgCount } = trpc.messages.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const teacherNav: NavItem[] = [
    { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
    { label: "My Classes", path: "/teacher/classes", icon: Users },
    { label: "Quizzes", path: "/teacher/quizzes", icon: ClipboardList },
    { label: "Weekly Plans", path: "/teacher/plans", icon: Calendar },
    { label: "Meetings", path: "/teacher/meetings", icon: Video },
    { label: "Grades", path: "/teacher/grades", icon: BarChart3 },
    { label: "Materials", path: "/teacher/materials", icon: FolderOpen },
    { label: "Student Points", path: "/teacher/points", icon: Star },
    { label: "Attendance", path: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Messages", path: "/teacher/messages", icon: MessageSquare },
  ];

  const studentNav: NavItem[] = [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard },
    { label: "My Classes", path: "/student/classes", icon: Users },
    { label: "My Grades", path: "/student/grades", icon: BarChart3 },
    { label: "My Points", path: "/student/points", icon: Star },
    { label: "My Profile", path: "/student/profile", icon: UserCircle },
    { label: "Messages", path: "/student/messages", icon: MessageSquare },
  ];

  const navItems = role === "teacher" ? teacherNav : studentNav;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Role-based guard: redirect to setup if no role, or redirect to correct dashboard if wrong role
    if (user) {
      const userRole = user.role as string;
      // admin is treated as teacher — they have full access to teacher pages
      const effectiveRole = userRole === "admin" ? "teacher" : userRole;
      if (effectiveRole !== "teacher" && effectiveRole !== "student") {
        navigate("/setup");
        return;
      }
      if (role === "teacher" && effectiveRole === "student") {
        navigate("/student");
        return;
      }
      if (role === "student" && effectiveRole === "teacher") {
        navigate("/teacher");
        return;
      }
    }
  }, [loading, isAuthenticated, user, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border",
        mobile ? "w-72 h-full" : "w-64 min-h-screen sticky top-0"
      )}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            <span className="font-serif text-base font-bold tracking-tight">SchoolHub</span>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2">
          <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-sm bg-foreground/8 text-muted-foreground capitalize">
            {role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="overline px-3 mb-3">Navigation</p>
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location === path || (path !== `/${role}` && location.startsWith(path));
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-sans font-medium transition-all duration-150",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-left">{label}</span>
              {label === "Messages" && (msgCount ?? 0) > 0 && (
                <span className="w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
                  {msgCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-sm bg-foreground/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-serif font-bold text-foreground">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-sans text-foreground truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground font-sans truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 animate-slide-in-right">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border h-14 flex items-center px-6 gap-4">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Dark mode toggle */}
          <DarkModeToggle />
          {/* Notifications */}
          <NotificationBell count={notifCount ?? 0} />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-4.5 h-4.5" strokeWidth={1.5} />
      ) : (
        <Moon className="w-4.5 h-4.5" strokeWidth={1.5} />
      )}
    </button>
  );
}

function NotificationBell({ count }: { count: number }) {
  const utils = trpc.useUtils();
  const { data: notifications } = trpc.notifications.list.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.unreadCount.invalidate(),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4.5 h-4.5" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-sans font-medium">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold">Notifications</h3>
          {count > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-muted-foreground hover:text-foreground font-sans"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground font-sans">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-4 py-3 border-b border-border/50 last:border-0",
                  !n.isRead && "bg-accent/30"
                )}
              >
                <p className="text-sm font-medium font-sans text-foreground">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
