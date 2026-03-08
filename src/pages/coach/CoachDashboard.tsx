import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Users, MapPin, Calendar, ChevronRight, Trophy } from "lucide-react";

interface Assignment {
  community: { id: string; name: string; short_code: string; address: string };
  sports: Array<{ assignmentId: string; sportId: string; sportName: string; sportIcon: string }>;
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (profile?.coach_id) loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      // Get coach record from coaches table
      const { data: coachRecord } = await supabase
        .from("coaches")
        .select("id")
        .eq("coach_id", profile!.coach_id!)
        .maybeSingle();

      if (!coachRecord) { setLoading(false); return; }

      // Get assignments
      const { data: assignmentsData } = await supabase
        .from("coach_assignments")
        .select("id, community_id, sport_id")
        .eq("coach_id", coachRecord.id);

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Get community and sport details
      const communityIds = [...new Set(assignmentsData.map((a) => a.community_id))];
      const sportIds = [...new Set(assignmentsData.map((a) => a.sport_id))];

      const [{ data: communities }, { data: sports }] = await Promise.all([
        supabase.from("communities").select("id, name, short_code, address").in("id", communityIds),
        supabase.from("sports").select("id, name, icon").in("id", sportIds),
      ]);

      // Group by community
      const grouped: Record<string, Assignment> = {};
      for (const a of assignmentsData) {
        if (!grouped[a.community_id]) {
          const comm = communities?.find((c) => c.id === a.community_id);
          if (!comm) continue;
          grouped[a.community_id] = { community: comm, sports: [] };
        }
        const sport = sports?.find((s) => s.id === a.sport_id);
        if (sport) {
          grouped[a.community_id].sports.push({
            assignmentId: a.id,
            sportId: a.sport_id,
            sportName: sport.name,
            sportIcon: sport.icon,
          });
        }
      }
      setAssignments(Object.values(grouped));

      // Count students
      let total = 0;
      for (const a of assignmentsData) {
        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("sport_id", a.sport_id)
          .eq("community_id", a.community_id)
          .eq("is_active", true);
        total += count || 0;
      }
      setTotalStudents(total);
    } catch (err) {
      console.error("Error loading coach data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏸</span>
            <div>
              <p className="font-bold text-sm">RJ Sportz</p>
              <p className="text-xs text-muted-foreground">
                {profile?.first_name} {profile?.last_name} • <span className="text-primary font-mono">{profile?.coach_id}</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive gap-1">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.first_name}! 👋</h1>
          <p className="text-sm text-muted-foreground">{profile?.sport_name} Coach • Manage your classes and students</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Communities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Classes/Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Assignments */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Your Assignments</h2>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="font-medium">No Assignments Yet</p>
                <p className="text-sm text-muted-foreground mt-1">Contact admin to get assigned to communities.</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.community.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {assignment.community.name}
                    </h3>
                    <p className="text-xs text-muted-foreground ml-6">
                      {assignment.community.short_code} • {assignment.community.address}
                    </p>
                  </div>

                  <div className="space-y-2 ml-6">
                    {assignment.sports.map((sport) => (
                      <div key={sport.assignmentId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2">
                          <span>{sport.sportIcon}</span>
                          <span className="font-medium text-sm">{sport.sportName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => navigate(`/coach/students/${sport.assignmentId}`)}
                          >
                            <Users className="h-3 w-3" /> Students
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => navigate(`/coach/attendance/${sport.assignmentId}`)}
                          >
                            <Calendar className="h-3 w-3" /> Attendance
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
