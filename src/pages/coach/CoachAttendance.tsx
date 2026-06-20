import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Loader2, Calendar, Edit2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/hooks/useSupabaseData";

type AttendanceStatus = "present" | "absent";

interface StudentRow {
  id: string;
  student_id: string;
  name: string;
  age: number;
  parent_name: string;
  parent_whatsapp: string;
  time_slot_id: string | null;
}

interface SlotRow {
  id: string;
  start_time: string;
  end_time: string;
  age_group: string;
  batch_type: string;
}

export default function CoachAttendance() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState("");
  const [sportId, setSportId] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [sportName, setSportName] = useState("");
  const [sportIcon, setSportIcon] = useState("");
  const [timeSlots, setTimeSlots] = useState<SlotRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const { data: coachRecord } = await supabase
        .from("coaches")
        .select("id")
        .eq("coach_id", profile?.coach_id || "")
        .maybeSingle();

      if (!coachRecord) { navigate("/coach/dashboard"); return; }

      const { data: assignment } = await supabase
        .from("coach_assignments")
        .select("community_id, sport_id")
        .eq("id", assignmentId!)
        .eq("coach_id", coachRecord.id)
        .maybeSingle();

      if (!assignment) { navigate("/coach/dashboard"); return; }

      setCommunityId(assignment.community_id);
      setSportId(assignment.sport_id);

      const [{ data: comm }, { data: sport }, { data: slots }, { data: students }] = await Promise.all([
        supabase.from("communities").select("name").eq("id", assignment.community_id).maybeSingle(),
        supabase.from("sports").select("name, icon").eq("id", assignment.sport_id).maybeSingle(),
        supabase.from("time_slots").select("id, start_time, end_time, age_group, batch_type").eq("community_id", assignment.community_id).eq("sport_id", assignment.sport_id).eq("is_active", true).order("start_time"),
        supabase.from("students").select("id, student_id, name, age, parent_name, parent_whatsapp, time_slot_id").eq("community_id", assignment.community_id).eq("sport_id", assignment.sport_id).eq("is_active", true).order("name"),
      ]);

      setCommunityName(comm?.name || "");
      setSportName(sport?.name || "");
      setSportIcon(sport?.icon || "🏃");
      setTimeSlots((slots as SlotRow[]) || []);
      setAllStudents((students as StudentRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const slotStudents = useMemo(() => {
    if (!selectedSlot) return [];
    return allStudents.filter((s) => s.time_slot_id === selectedSlot);
  }, [selectedSlot, allStudents]);

  const handleLoad = async () => {
    const studentIds = slotStudents.map((s) => s.id);
    if (studentIds.length === 0) { setLoaded(true); setExistingRecords(false); return; }

    const { data: existing } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("date", selectedDate)
      .in("student_id", studentIds);

    const map: Record<string, AttendanceStatus> = {};
    if (existing && existing.length > 0) {
      existing.forEach((a) => { map[a.student_id] = a.status as AttendanceStatus; });
      setExistingRecords(true);
    } else {
      slotStudents.forEach((s) => { map[s.id] = "present"; });
      setExistingRecords(false);
    }

    setAttendance(map);
    setOriginalAttendance({ ...map });
    setIsEditMode(false);
    setLoaded(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    slotStudents.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const records = slotStudents.map((s) => ({
        student_id: s.id,
        time_slot_id: selectedSlot,
        date: selectedDate,
        status: attendance[s.id] || "present",
      }));
      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;
      const warnings = await applySessionDeductions(records);

      const present = records.filter((r) => r.status === "present").length;
      toast({ title: `Attendance submitted! ${present}/${records.length} present` });
      for (const w of warnings) {
        toast({
          title: w.remaining === 0 ? `Plan completed — ${w.name}` : `Low sessions — ${w.name}`,
          description: w.remaining === 0 ? "Fee status set to unpaid." : `Only ${w.remaining} session(s) left.`,
          variant: w.remaining === 0 ? "destructive" : "default",
        });
      }
      setLoaded(false);

    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const changes = Object.keys(attendance).filter((id) => attendance[id] !== originalAttendance[id]);
      if (changes.length === 0) { toast({ title: "No changes" }); setIsEditMode(false); setSaving(false); return; }

      for (const studentId of changes) {
        await supabase.from("attendance").delete().eq("student_id", studentId).eq("date", selectedDate);
        await supabase.from("attendance").insert({
          student_id: studentId,
          date: selectedDate,
          status: attendance[studentId],
          time_slot_id: selectedSlot,
        });
      }

      toast({ title: `Updated ${changes.length} records` });
      setOriginalAttendance({ ...attendance });
      setIsEditMode(false);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const vals = Object.values(attendance);
    return {
      present: vals.filter((v) => v === "present").length,
      absent: vals.filter((v) => v === "absent").length,
    };
  }, [attendance]);

  // Coaches have full edit access - past dates with existing records show edit button
  const isPastDate = selectedDate < today;
  const canEdit = isPastDate && existingRecords && !isEditMode;
  const isReadOnly = false; // Coaches always have write access

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
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
            <p className="font-bold text-sm">{sportIcon} {sportName} — Attendance</p>
            <p className="text-xs text-muted-foreground">{communityName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setLoaded(false); }}
                />
              </div>
              <div>
                <Label className="text-xs">Time Slot</Label>
                <Select value={selectedSlot} onValueChange={(v) => { setSelectedSlot(v); setLoaded(false); }}>
                  <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((ts) => (
                      <SelectItem key={ts.id} value={ts.id}>
                        {formatTime(ts.start_time)}-{formatTime(ts.end_time)} ({ts.age_group}, {ts.batch_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleLoad} disabled={!selectedSlot} className="w-full gap-2">
              <Calendar className="h-4 w-4" /> Load Students
            </Button>
          </CardContent>
        </Card>

        {/* Attendance marking */}
        {loaded && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {isPastDate ? "View" : "Mark"} — {selectedDate}
                </CardTitle>
                {canEdit && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditMode(true)}>
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                )}
                {isEditMode && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setAttendance({ ...originalAttendance }); setIsEditMode(false); }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="gap-1">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPastDate && existingRecords && !isEditMode && (
                <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-muted/50 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Previously recorded. Click Edit to modify.
                </div>
              )}
              {isEditMode && (
                <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-warning/10 border border-warning/30 text-warning">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Edit mode — modify and save
                </div>
              )}

              {!(isPastDate && existingRecords && !isEditMode) && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleMarkAll("present")} className="text-xs">All Present</Button>
                  <Button variant="outline" size="sm" onClick={() => handleMarkAll("absent")} className="text-xs">All Absent</Button>
                </div>
              )}

              <p className="text-sm text-muted-foreground">{slotStudents.length} students</p>

              {slotStudents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No students in this slot</p>
              ) : (
                <div className="space-y-2">
                  {slotStudents.map((st) => (
                    <div key={st.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{st.student_id} • {st.name}</p>
                          <p className="text-xs text-muted-foreground">Parent: {st.parent_name}</p>
                        </div>
                        <RadioGroup
                          value={attendance[st.id] || "present"}
                          onValueChange={(v) => {
                            if (isReadOnly) return;
                            setAttendance((prev) => ({ ...prev, [st.id]: v as AttendanceStatus }));
                          }}
                          className="flex gap-3"
                          disabled={isReadOnly}
                        >
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="present" id={`${st.id}-p`} disabled={isReadOnly} />
                            <Label htmlFor={`${st.id}-p`} className={`text-xs ${isReadOnly ? "opacity-60" : "text-success"}`}>Present</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="absent" id={`${st.id}-a`} disabled={isReadOnly} />
                            <Label htmlFor={`${st.id}-a`} className={`text-xs ${isReadOnly ? "opacity-60" : "text-destructive"}`}>Absent</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex gap-3 text-xs font-medium">
                  <span className="text-success">Present: {summary.present}</span>
                  <span className="text-destructive">Absent: {summary.absent}</span>
                </div>
                {!existingRecords && (
                  <Button onClick={handleSubmit} disabled={saving || slotStudents.length === 0} size="sm" className="gap-1">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Submit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
