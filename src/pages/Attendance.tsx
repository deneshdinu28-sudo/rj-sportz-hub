import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, Users, Calendar as CalendarIcon, Loader2, Edit2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunities, useSports, useStudents, useTimeSlots, useCreateAttendance, useAttendanceByDate, formatTime } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AttendanceStatus = "present" | "absent";

export default function Attendance() {
  const { data: communities = [], isLoading } = useCommunities();
  const { data: allSports = [] } = useSports();
  const { data: allStudents = [] } = useStudents();
  const { data: allTimeSlots = [] } = useTimeSlots();
  const createAttendance = useCreateAttendance();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const isPastDate = selectedDate < today;

  const filteredSports = useMemo(() => {
    if (!selectedCommunity) return [];
    return allSports.filter((s) => s.community_id === selectedCommunity);
  }, [selectedCommunity, allSports]);

  const filteredSlots = useMemo(() => {
    if (!selectedSport || !selectedCommunity) return [];
    return allTimeSlots.filter((ts) => ts.sport_id === selectedSport && ts.community_id === selectedCommunity);
  }, [selectedSport, selectedCommunity, allTimeSlots]);

  const slotStudents = useMemo(() => {
    if (!selectedSlot || !selectedSport) return [];
    return allStudents.filter((s) => s.sport_id === selectedSport && s.community_id === selectedCommunity && s.is_active && s.time_slot_id === selectedSlot);
  }, [selectedSlot, selectedSport, selectedCommunity, allStudents]);

  const handleLoad = async () => {
    if (!selectedCommunity || !selectedSport || !selectedSlot) return;

    // Check for existing attendance
    const studentIds = slotStudents.map((s) => s.id);
    if (studentIds.length === 0) {
      setLoaded(true);
      setExistingRecords(false);
      return;
    }

    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", selectedDate)
      .in("student_id", studentIds);

    const attendanceMap: Record<string, AttendanceStatus> = {};
    if (existing && existing.length > 0) {
      existing.forEach((a) => {
        attendanceMap[a.student_id] = a.status as AttendanceStatus;
      });
      setExistingRecords(true);
    } else {
      slotStudents.forEach((s) => { attendanceMap[s.id] = "present"; });
      setExistingRecords(false);
    }

    setAttendance(attendanceMap);
    setOriginalAttendance({ ...attendanceMap });
    setIsEditMode(false);
    setLoaded(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (isPastDate && !isEditMode) return;
    const updated: Record<string, AttendanceStatus> = {};
    slotStudents.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    const records = slotStudents.map((s) => ({
      student_id: s.id,
      time_slot_id: selectedSlot,
      date: selectedDate,
      status: attendance[s.id] || "present",
    }));
    await createAttendance.mutateAsync(records);
    setLoaded(false);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const changes: Array<{ student_id: string; date: string; status: string; time_slot_id: string }> = [];
      for (const studentId of Object.keys(attendance)) {
        if (attendance[studentId] !== originalAttendance[studentId]) {
          changes.push({
            student_id: studentId,
            date: selectedDate,
            status: attendance[studentId],
            time_slot_id: selectedSlot,
          });
        }
      }

      if (changes.length === 0) {
        toast({ title: "No changes to save" });
        setIsEditMode(false);
        setSavingEdit(false);
        return;
      }

      for (const change of changes) {
        // Delete existing then insert (upsert workaround)
        await supabase.from("attendance").delete().eq("student_id", change.student_id).eq("date", change.date);
        await supabase.from("attendance").insert(change);
      }

      toast({ title: `Updated attendance for ${changes.length} students` });
      setOriginalAttendance({ ...attendance });
      setIsEditMode(false);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const selectedSlotData = allTimeSlots.find((ts) => ts.id === selectedSlot);
  const selectedSportData = allSports.find((s) => s.id === selectedSport);
  const summary = useMemo(() => {
    const vals = Object.values(attendance);
    return { present: vals.filter((v) => v === "present").length, absent: vals.filter((v) => v === "absent").length };
  }, [attendance]);

  const canEdit = isPastDate && !isEditMode;
  const isReadOnly = isPastDate && !isEditMode && existingRecords;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(new Date(selectedDate + "T00:00:00"), "dd MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                    onSelect={(d) => { if (d) { setSelectedDate(format(d, "yyyy-MM-dd")); setLoaded(false); } }}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Community</Label>
              <Select value={selectedCommunity} onValueChange={(v) => { setSelectedCommunity(v); setSelectedSport(""); setSelectedSlot(""); setLoaded(false); }}>
                <SelectTrigger><SelectValue placeholder="Select community" /></SelectTrigger>
                <SelectContent>
                  {communities.filter((c) => c.is_active).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sport</Label>
              <Select value={selectedSport} onValueChange={(v) => { setSelectedSport(v); setSelectedSlot(""); setLoaded(false); }}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {filteredSports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time Slot</Label>
              <Select value={selectedSlot} onValueChange={(v) => { setSelectedSlot(v); setLoaded(false); }}>
                <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {filteredSlots.map((ts) => (
                    <SelectItem key={ts.id} value={ts.id}>
                      {formatTime(ts.start_time)} - {formatTime(ts.end_time)} ({ts.age_group}, {ts.batch_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleLoad} disabled={!selectedCommunity || !selectedSport || !selectedSlot} className="gap-2"><Users className="h-4 w-4" /> Load Students</Button>
        </CardContent>
      </Card>

      {loaded && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {isPastDate ? "View" : "Mark"} Attendance — {selectedDate}
                {selectedSportData && <span className="text-muted-foreground font-normal">• {selectedSportData.icon} {selectedSportData.name}</span>}
                {selectedSlotData && <span className="text-muted-foreground font-normal">• {formatTime(selectedSlotData.start_time)}-{formatTime(selectedSlotData.end_time)}</span>}
              </CardTitle>
              {canEdit && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditMode(true)}>
                  <Edit2 className="h-3 w-3" /> Edit Past Attendance
                </Button>
              )}
              {isEditMode && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setAttendance({ ...originalAttendance }); setIsEditMode(false); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit} className="gap-1">
                    {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info banner */}
            {isPastDate && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${isEditMode ? "bg-warning/10 border border-warning/30 text-warning" : "bg-muted/50 text-muted-foreground"}`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                {isEditMode ? "Edit mode active — modify attendance and click Save" : "Viewing past attendance (read-only). Click \"Edit\" to modify."}
              </div>
            )}
            {!isPastDate && (
              <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-success/10 border border-success/30 text-success">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Marking attendance for {selectedDate}
              </div>
            )}

            {!isReadOnly && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMarkAll("present")} className="text-xs">Mark All Present</Button>
                <Button variant="outline" size="sm" onClick={() => handleMarkAll("absent")} className="text-xs">Mark All Absent</Button>
              </div>
            )}

            <p className="text-sm text-muted-foreground">{slotStudents.length} students enrolled</p>

            {slotStudents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students found in this time slot</p>
            ) : (
              <div className="space-y-3">
                {slotStudents.map((st) => (
                  <div key={st.id} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold">{st.student_id} • {st.name} <span className="text-muted-foreground text-xs">Age {st.age}</span></p>
                        <p className="text-xs text-muted-foreground">Parent: {st.parent_name} • {st.parent_whatsapp}</p>
                      </div>
                      <RadioGroup
                        value={attendance[st.id] || "present"}
                        onValueChange={(v) => {
                          if (isReadOnly) return;
                          setAttendance((prev) => ({ ...prev, [st.id]: v as AttendanceStatus }));
                        }}
                        className="flex gap-4"
                        disabled={isReadOnly}
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="present" id={`${st.id}-p`} disabled={isReadOnly} />
                          <Label htmlFor={`${st.id}-p`} className={`text-sm cursor-pointer ${isReadOnly ? "opacity-60" : "text-success"}`}>Present</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="absent" id={`${st.id}-a`} disabled={isReadOnly} />
                          <Label htmlFor={`${st.id}-a`} className={`text-sm cursor-pointer ${isReadOnly ? "opacity-60" : "text-destructive"}`}>Absent</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex gap-4 text-sm">
                <span className="text-success font-medium">Present: {summary.present}</span>
                <span className="text-destructive font-medium">Absent: {summary.absent}</span>
              </div>
              {!isPastDate && !existingRecords && (
                <Button onClick={handleSubmit} disabled={createAttendance.isPending || slotStudents.length === 0} className="gap-2">
                  {createAttendance.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Submit Attendance</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
