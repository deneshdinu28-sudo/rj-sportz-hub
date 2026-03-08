import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Users, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentRow {
  id: string;
  student_id: string;
  name: string;
  age: number;
  parent_name: string;
  parent_whatsapp: string;
  batch_type: string;
  age_group: string;
  fee_status: string;
  fee_amount: number;
}

export default function CoachStudents() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [sportName, setSportName] = useState("");
  const [sportIcon, setSportIcon] = useState("");

  useEffect(() => {
    loadStudents();
  }, [assignmentId]);

  const loadStudents = async () => {
    try {
      // Get coach record
      const { data: coachRecord } = await supabase
        .from("coaches")
        .select("id")
        .eq("coach_id", profile?.coach_id || "")
        .maybeSingle();

      if (!coachRecord) {
        toast({ title: "Unauthorized", variant: "destructive" });
        navigate("/coach/dashboard");
        return;
      }

      // Verify assignment belongs to this coach
      const { data: assignment } = await supabase
        .from("coach_assignments")
        .select("community_id, sport_id")
        .eq("id", assignmentId!)
        .eq("coach_id", coachRecord.id)
        .maybeSingle();

      if (!assignment) {
        toast({ title: "Assignment not found", variant: "destructive" });
        navigate("/coach/dashboard");
        return;
      }

      // Get community and sport info
      const [{ data: comm }, { data: sport }] = await Promise.all([
        supabase.from("communities").select("name").eq("id", assignment.community_id).maybeSingle(),
        supabase.from("sports").select("name, icon").eq("id", assignment.sport_id).maybeSingle(),
      ]);
      setCommunityName(comm?.name || "");
      setSportName(sport?.name || "");
      setSportIcon(sport?.icon || "🏃");

      // Load students
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, student_id, name, age, parent_name, parent_whatsapp, batch_type, age_group, fee_status, fee_amount")
        .eq("community_id", assignment.community_id)
        .eq("sport_id", assignment.sport_id)
        .eq("is_active", true)
        .order("name");

      setStudents((studentsData as StudentRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.parent_name.toLowerCase().includes(q)
    );
  }, [students, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-bold text-sm">{sportIcon} {sportName}</p>
            <p className="text-xs text-muted-foreground">{communityName} • {filtered.length} students</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="pl-10"
          />
        </div>

        {/* Students List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium">{search ? "No students found" : "No students enrolled"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((st) => (
              <Card key={st.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{st.name}</p>
                        <code className="text-xs text-primary">{st.student_id}</code>
                        <Badge
                          variant={st.fee_status === "paid" ? "default" : st.fee_status === "overdue" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {st.fee_status === "paid" ? "✓ Paid" : st.fee_status === "overdue" ? "🔴 Overdue" : "⚠ Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Age {st.age} • {st.batch_type} • {st.age_group}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parent: {st.parent_name} • {st.parent_whatsapp}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                      <a href={`tel:+91${st.parent_whatsapp}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
