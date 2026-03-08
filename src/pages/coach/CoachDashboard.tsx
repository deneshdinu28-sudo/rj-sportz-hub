import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Users, MapPin, Calendar, TrendingUp, Clock } from "lucide-react";

interface CommunityCard {
  communityId: string;
  communityName: string;
  shortCode: string;
  address: string;
  sports: Array<{ assignmentId: string; sportId: string; sportName: string; sportIcon: string }>;
  studentCount: number;
  slotCount: number;
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [communities, setCommunities] = useState<CommunityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentGrowth, setStudentGrowth] = useState(0);
  const [upcomingClasses, setUpcomingClasses] = useState(0);

  useEffect(() => {
    if (profile?.coach_id) loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const { data: coachRecord } = await supabase
        .from("coaches")
        .select("id")
        .eq("coach_id", profile!.coach_id!)
        .maybeSingle();

      if (!coachRecord) { setLoading(false); return; }

      const { data: assignmentsData } = await supabase
        .from("coach_assignments")
        .select("id, community_id, sport_id")
        .eq("coach_id", coachRecord.id);

      if (!assignmentsData || assignmentsData.length === 0) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      const communityIds = [...new Set(assignmentsData.map((a) => a.community_id))];
      const sportIds = [...new Set(assignmentsData.map((a) => a.sport_id))];

      const [{ data: comms }, { data: sports }, { data: slots }] = await Promise.all([
        supabase.from("communities").select("id, name, short_code, address").in("id", communityIds),
        supabase.from("sports").select("id, name, icon").in("id", sportIds),
        supabase.from("time_slots").select("id, community_id, sport_id").eq("is_active", true).in("community_id", communityIds),
      ]);

      // Count students per assignment and growth
      let total = 0;
      let growth = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      const studentCounts: Record<string, number> = {};

      for (const a of assignmentsData) {
        const key = `${a.community_id}_${a.sport_id}`;
        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("sport_id", a.sport_id)
          .eq("community_id", a.community_id)
          .eq("is_active", true);
        const c = count || 0;
        studentCounts[key] = c;
        total += c;

        const { count: newCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("sport_id", a.sport_id)
          .eq("community_id", a.community_id)
          .eq("is_active", true)
          .gte("joining_date", startOfMonth);
        growth += newCount || 0;
      }

      setTotalStudents(total);
      setStudentGrowth(growth);

      // Build community cards
      const grouped: Record<string, CommunityCard> = {};
      for (const a of assignmentsData) {
        if (!grouped[a.community_id]) {
          const comm = comms?.find((c) => c.id === a.community_id);
          if (!comm) continue;
          const communitySlots = slots?.filter(s => s.community_id === a.community_id && sportIds.includes(s.sport_id)) || [];
          grouped[a.community_id] = {
            communityId: comm.id,
            communityName: comm.name,
            shortCode: comm.short_code,
            address: comm.address,
            sports: [],
            studentCount: 0,
            slotCount: communitySlots.length,
          };
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
        const key = `${a.community_id}_${a.sport_id}`;
        grouped[a.community_id].studentCount += studentCounts[key] || 0;
      }
      setCommunities(Object.values(grouped));

      // Upcoming classes = today's day matching slots
      const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
      const todaySlots = slots?.filter(s => {
        const assignment = assignmentsData.find(a => a.community_id === s.community_id && a.sport_id === s.sport_id);
        return !!assignment;
      }) || [];
      setUpcomingClasses(todaySlots.length);

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
          <p className="text-sm text-muted-foreground">{profile?.sport_name} Coach</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{communities.length}</p>
              <p className="text-xs text-muted-foreground">Communities</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Students</p>
              {studentGrowth > 0 && (
                <p className="text-[10px] text-success flex items-center justify-center gap-0.5 mt-0.5">
                  <TrendingUp className="h-3 w-3" /> +{studentGrowth} this month
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{upcomingClasses}</p>
              <p className="text-xs text-muted-foreground">Slots Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Communities */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Your Communities</h2>

          {communities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="font-medium">No Communities Assigned</p>
                <p className="text-sm text-muted-foreground mt-1">Contact admin to get assigned to communities.</p>
              </CardContent>
            </Card>
          ) : (
            communities.map((comm) => (
              <Card
                key={comm.communityId}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/coach/community/${comm.communityId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {comm.communityName}
                      </h3>
                      <p className="text-xs text-muted-foreground ml-6">
                        {comm.shortCode} • {comm.address}
                      </p>

                      {/* Sport tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                        {comm.sports.map((s) => (
                          <span key={s.assignmentId} className="inline-flex items-center gap-1 text-xs bg-muted/50 border border-border rounded-full px-2.5 py-0.5">
                            {s.sportIcon} {s.sportName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom stats */}
                  <div className="flex gap-4 mt-3 ml-6">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{comm.studentCount}</span> students
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{comm.slotCount}</span> slots
                    </div>
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
