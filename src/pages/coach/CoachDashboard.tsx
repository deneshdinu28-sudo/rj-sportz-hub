import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  LogOut, Users, MapPin, Calendar, TrendingUp, Clock,
  AlertTriangle, MessageSquare, CheckCircle, ChevronRight,
  Activity, Zap
} from "lucide-react";

interface CommunityCard {
  communityId: string;
  communityName: string;
  shortCode: string;
  address: string;
  sports: Array<{ assignmentId: string; sportId: string; sportName: string; sportIcon: string }>;
  studentCount: number;
  slotCount: number;
}

interface TodayClass {
  community: string;
  sportName: string;
  sportIcon: string;
  startTime: string;
  endTime: string;
  ageGroup: string;
  batchType: string;
  assignmentId: string;
}

interface UnpaidStudent {
  id: string;
  student_id: string;
  name: string;
  parent_name: string;
  parent_whatsapp: string;
  fee_status: string;
  fee_amount: number;
  days_overdue: number | null;
  communityName: string;
  sportName: string;
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [communities, setCommunities] = useState<CommunityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentGrowth, setStudentGrowth] = useState(0);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [unpaidStudents, setUnpaidStudents] = useState<UnpaidStudent[]>([]);

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
        supabase.from("time_slots").select("id, community_id, sport_id, start_time, end_time, age_group, batch_type, active_days").eq("is_active", true).in("community_id", communityIds),
      ]);

      let total = 0;
      let growth = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const studentCounts: Record<string, number> = {};
      const allUnpaid: UnpaidStudent[] = [];

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

        const commName = comms?.find(c => c.id === a.community_id)?.name || "";
        const sportName = sports?.find(s => s.id === a.sport_id)?.name || "";
        const { data: unpaid } = await supabase
          .from("students")
          .select("id, student_id, name, parent_name, parent_whatsapp, fee_status, fee_amount, days_overdue")
          .eq("sport_id", a.sport_id)
          .eq("community_id", a.community_id)
          .eq("is_active", true)
          .in("fee_status", ["unpaid", "overdue"]);
        if (unpaid) {
          allUnpaid.push(...unpaid.map(s => ({ ...s, communityName: commName, sportName })));
        }
      }

      setTotalStudents(total);
      setStudentGrowth(growth);
      setUnpaidStudents(allUnpaid);

      // Build community cards
      const grouped: Record<string, CommunityCard> = {};
      for (const a of assignmentsData) {
        if (!grouped[a.community_id]) {
          const comm = comms?.find((c) => c.id === a.community_id);
          if (!comm) continue;
          const communitySlots = slots?.filter(s => s.community_id === a.community_id && sportIds.includes(s.sport_id)) || [];
          grouped[a.community_id] = {
            communityId: comm.id, communityName: comm.name, shortCode: comm.short_code,
            address: comm.address, sports: [], studentCount: 0, slotCount: communitySlots.length,
          };
        }
        const sport = sports?.find((s) => s.id === a.sport_id);
        if (sport) {
          grouped[a.community_id].sports.push({
            assignmentId: a.id, sportId: a.sport_id, sportName: sport.name, sportIcon: sport.icon,
          });
        }
        const key = `${a.community_id}_${a.sport_id}`;
        grouped[a.community_id].studentCount += studentCounts[key] || 0;
      }
      setCommunities(Object.values(grouped));

      // Today's classes
      const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
      const classes: TodayClass[] = [];
      const relevantSlots = slots?.filter(s => {
        const assignment = assignmentsData.find(a => a.community_id === s.community_id && a.sport_id === s.sport_id);
        if (!assignment) return false;
        return ((s.active_days as string[]) || []).some(d => d.toLowerCase() === dayName.toLowerCase());
      }) || [];

      for (const slot of relevantSlots) {
        const comm = comms?.find(c => c.id === slot.community_id);
        const sport = sports?.find(s => s.id === slot.sport_id);
        const assignment = assignmentsData.find(a => a.community_id === slot.community_id && a.sport_id === slot.sport_id);
        if (comm && sport && assignment) {
          classes.push({
            community: comm.name, sportName: sport.name, sportIcon: sport.icon,
            startTime: slot.start_time, endTime: slot.end_time, ageGroup: slot.age_group,
            batchType: slot.batch_type, assignmentId: assignment.id,
          });
        }
      }
      classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTodayClasses(classes);

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

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🏸</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">RJ Sportz</p>
              <p className="text-[11px] text-muted-foreground">Coach Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{profile?.coach_id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5">
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-bold">
              {getGreeting()}, {profile?.first_name}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold">{communities.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Communities</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Students</p>
              {studentGrowth > 0 && (
                <p className="text-[10px] text-success flex items-center gap-0.5 mt-1">
                  <TrendingUp className="h-3 w-3" /> +{studentGrowth} this month
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold">{todayClasses.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Classes Today</p>
            </CardContent>
          </Card>

          <Card className={`border-border/50 transition-colors ${unpaidStudents.length > 0 ? "hover:border-warning/30" : "hover:border-primary/30"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${unpaidStudents.length > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                  {unpaidStudents.length > 0
                    ? <AlertTriangle className="h-4 w-4 text-warning" />
                    : <CheckCircle className="h-4 w-4 text-success" />
                  }
                </div>
              </div>
              <p className="text-2xl font-bold">{unpaidStudents.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pending Fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Classes & Communities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Today's Schedule</CardTitle>
                      <p className="text-xs text-muted-foreground">{todayClasses.length} {todayClasses.length === 1 ? "class" : "classes"} scheduled</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {todayClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Enjoy your day off! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayClasses.map((cls, idx) => {
                      const startHour = parseInt(cls.startTime.split(":")[0]);
                      const isPast = startHour < currentHour;
                      return (
                        <div
                          key={idx}
                          className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                            isPast
                              ? "border-border/30 bg-muted/20 opacity-60"
                              : "border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}
                          onClick={() => !isPast && navigate(`/coach/attendance/${cls.assignmentId}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                                {cls.sportIcon}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{cls.sportName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[11px] text-muted-foreground">{cls.community}</span>
                                  <span className="text-muted-foreground/40">•</span>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/50">{cls.batchType}</Badge>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/50">{cls.ageGroup}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-sm ${isPast ? "text-muted-foreground" : "text-primary"}`}>
                                {formatTime(cls.startTime)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{formatTime(cls.endTime)}</p>
                              {isPast ? (
                                <Badge variant="secondary" className="text-[9px] mt-1 h-4">
                                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Done
                                </Badge>
                              ) : (
                                <p className="text-[10px] text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Mark Attendance →
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Your Assignments</CardTitle>
                    <p className="text-xs text-muted-foreground">Manage students across communities</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {communities.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No Communities Assigned</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Contact admin to get assigned.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communities.map((comm) => (
                      <div
                        key={comm.communityId}
                        className="rounded-xl border border-border hover:border-primary/30 transition-all overflow-hidden"
                      >
                        <div className="p-3.5 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                📍 {comm.communityName}
                              </h3>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{comm.shortCode} • {comm.address}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> <strong className="text-foreground">{comm.studentCount}</strong></span>
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> <strong className="text-foreground">{comm.slotCount}</strong></span>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="p-2">
                          {comm.sports.map((s) => (
                            <button
                              key={s.assignmentId}
                              onClick={() => navigate(`/coach/community/${comm.communityId}`)}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">{s.sportIcon}</span>
                                <span className="text-sm font-medium">{s.sportName}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pending Payments */}
          <div className="space-y-6">
            <Card className={`border-border/50 ${unpaidStudents.length > 0 ? "border-warning/20" : "border-success/20"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${unpaidStudents.length > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                    {unpaidStudents.length > 0
                      ? <AlertTriangle className="h-4 w-4 text-warning" />
                      : <CheckCircle className="h-4 w-4 text-success" />
                    }
                  </div>
                  <div>
                    <CardTitle className="text-base">Payment Follow-ups</CardTitle>
                    <p className="text-xs text-muted-foreground">{unpaidStudents.length} pending</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {unpaidStudents.length > 0 ? (
                  <div className="space-y-2">
                    {unpaidStudents.map((st) => (
                      <div
                        key={st.id}
                        className="rounded-lg border border-border/50 p-3 hover:border-warning/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/coach/student/${st.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-sm truncate">{st.name}</p>
                              <Badge
                                variant={st.fee_status === "overdue" ? "destructive" : "secondary"}
                                className="text-[9px] h-4 px-1.5"
                              >
                                {st.fee_status === "overdue"
                                  ? `${st.days_overdue || 0}d late`
                                  : "Due"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {st.student_id} • {st.communityName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {st.sportName} • {st.parent_name}
                            </p>
                          </div>
                          <div onClick={e => e.stopPropagation()} className="shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" asChild>
                              <a
                                href={`https://wa.me/91${st.parent_whatsapp}?text=Hi ${st.parent_name}, this is ${profile?.first_name} from RJ Sportz. Following up regarding ${st.name}'s pending payment.`}
                                target="_blank"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 mx-auto text-success/30 mb-3" />
                    <p className="text-sm font-medium text-success">All Caught Up!</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">No pending payments 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
