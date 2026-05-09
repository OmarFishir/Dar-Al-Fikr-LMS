import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RoleSetup from "./pages/RoleSetup";
import TeacherDashboard from "./pages/teacher/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Messages from "./pages/Messages";
import WeeklyPlans from "./pages/teacher/WeeklyPlans";
import StudentWeeklyPlans from "./pages/student/WeeklyPlans";
import ZoomMeetings from "./pages/teacher/ZoomMeetings";
import StudentZoomMeetings from "./pages/student/ZoomMeetings";
import Classes from "./pages/teacher/Classes";
import StudentClasses from "./pages/student/Classes";
import Grades from "./pages/teacher/Grades";
import StudentGrades from "./pages/student/Grades";
import TeacherQuizzes from "./pages/teacher/Quizzes";
import StudentQuizzes from "./pages/student/Quizzes";
import Materials from "./pages/Materials";
import TeacherPoints from "./pages/teacher/Points";
import StudentPoints from "./pages/student/Points";
import ClassDetail from "./pages/student/ClassDetail";


import TeacherAttendance from "./pages/teacher/Attendance";
import StudentProfile from "./pages/student/Profile";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/setup" component={RoleSetup} />

      {/* Teacher routes */}
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/teacher/classes" component={Classes} />
      <Route path="/teacher/plans" component={WeeklyPlans} />
      <Route path="/teacher/meetings" component={ZoomMeetings} />
      <Route path="/teacher/grades" component={Grades} />
      <Route path="/teacher/messages" component={Messages} />
      <Route path="/teacher/quizzes" component={TeacherQuizzes} />
      <Route path="/teacher/materials" component={Materials} />
      <Route path="/teacher/points" component={TeacherPoints} />

      <Route path="/teacher/attendance" component={TeacherAttendance} />

      {/* Student routes */}
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/classes" component={StudentClasses} />
      <Route path="/student/classes/:classId" component={({ params }: any) => <ClassDetail classId={params.classId} />} />
      <Route path="/student/classes/:classId/sub/:subClassId" component={({ params }: any) => <ClassDetail classId={params.classId} subClassId={params.subClassId} />} />
      <Route path="/student/plans" component={StudentWeeklyPlans} />
      <Route path="/student/meetings" component={StudentZoomMeetings} />
      <Route path="/student/grades" component={StudentGrades} />
      <Route path="/student/messages" component={Messages} />
      <Route path="/student/quizzes" component={StudentQuizzes} />
      <Route path="/student/materials" component={Materials} />
      <Route path="/student/points" component={StudentPoints} />

      <Route path="/student/profile" component={StudentProfile} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
