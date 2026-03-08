import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { CoachGuard } from "@/components/CoachGuard";
import Login from "./pages/Login";
import CoachSignup from "./pages/CoachSignup";
import Dashboard from "./pages/Dashboard";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import StudentDetail from "./pages/StudentDetail";
import Payments from "./pages/Payments";
import Attendance from "./pages/Attendance";
import Coaches from "./pages/Coaches";
import Settings from "./pages/Settings";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachStudents from "./pages/coach/CoachStudents";
import CoachAttendance from "./pages/coach/CoachAttendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/coach/signup" element={<CoachSignup />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Admin Routes (protected by AppLayout) */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/communities/:id" element={<CommunityDetail />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/coaches" element={<Coaches />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Coach Routes (protected by CoachGuard) */}
            <Route element={<CoachGuard />}>
              <Route path="/coach/dashboard" element={<CoachDashboard />} />
              <Route path="/coach/students/:assignmentId" element={<CoachStudents />} />
              <Route path="/coach/attendance/:assignmentId" element={<CoachAttendance />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
