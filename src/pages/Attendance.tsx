import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockCommunities, mockSports, mockStudents, mockTimeSlots, formatTime } from "@/lib/mock-data";

type AttendanceStatus = "present" | "absent" | "leave";

export default function Attendance() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const filteredSports = useMemo(() => {
    if (!selectedCommunity) return [];
    return mockSports.filter((s) => s.community_id === selectedCommunity);
  }, [selectedCommunity]);

  const filteredSlots = useMemo(() => {
    if (!selectedSport || !selectedCommunity) return [];
    return mockTimeSlots.filter((ts) => ts.sport_id === selectedSport && ts.community_id === selectedCommunity);
  }, [selectedSport, selectedCommunity]);

  const slotStudents = useMemo(() => {
    if (!selectedSlot || !selectedSport) return [];
    return mockStudents.filter((s) => s.sport_id === selectedSport && s.community_id === selectedCommunity && s.is_active);
  }, [selectedSlot, selectedSport, selectedCommunity]);

  const handleLoad = () => {
    if (!selectedCommunity || !selectedSport || !selectedSlot) {
      toast({ title: "Please select all filters", variant: "destructive" });
      return;
    }
    const initial: Record<string, AttendanceStatus> = {};
    slotStudents.forEach((s) => { initial[s.id] = "present"; });
    setAttendance(initial);
    setLoaded(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    slotStudents.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = () => {
    const present = Object.values(attendance).filter((s) => s === "present").length;
    const absent = Object.values(attendance).filter((s) => s === "absent").length;
    const leave = Object.values(attendance).filter((s) => s === "leave").length;
    toast({ title: `Attendance marked for ${slotStudents.length} students!`, description: `Present: ${present} | Absent: ${absent} | Leave: ${leave}` });
    setLoaded(false);
  };

  const selectedSlotData = mockTimeSlots.find((ts) => ts.id === selectedSlot);
  const selectedSportData = mockSports.find((s) => s.id === selectedSport);
  const summary = useMemo(() => {
    const vals = Object.values(attendance);
    return {
      present: vals.filter((v) => v === "present").length,
      absent: vals.filter((v) => v === "absent").length,
      leave: vals.filter((v) => v === "leave").length,
    };
  }, [attendance]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div>
              <Label>Community</Label>
              <Select value={selectedCommunity} onValueChange={(v) => { setSelectedCommunity(v); setSelectedSport(""); setSelectedSlot(""); setLoaded(false); }}>
                <SelectTrigger><SelectValue placeholder="Select community" /></SelectTrigger>
                <SelectContent>
                  {mockCommunities.filter((c) => c.is_active).map((c) => (
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
          <Button onClick={handleLoad} className="gap-2"><Users className="h-4 w-4" /> Load Students</Button>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {loaded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Mark Attendance — {selectedDate}
              {selectedSportData && <span className="text-muted-foreground font-normal">• {selectedSportData.icon} {selectedSportData.name}</span>}
              {selectedSlotData && <span className="text-muted-foreground font-normal">• {formatTime(selectedSlotData.start_time)}-{formatTime(selectedSlotData.end_time)} ({selectedSlotData.age_group}, {selectedSlotData.batch_type})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll("present")} className="text-xs">Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll("absent")} className="text-xs">Mark All Absent</Button>
            </div>

            <p className="text-sm text-muted-foreground">{slotStudents.length} students enrolled</p>

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
                      onValueChange={(v) => setAttendance((prev) => ({ ...prev, [st.id]: v as AttendanceStatus }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="present" id={`${st.id}-p`} />
                        <Label htmlFor={`${st.id}-p`} className="text-sm text-success cursor-pointer">Present</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="absent" id={`${st.id}-a`} />
                        <Label htmlFor={`${st.id}-a`} className="text-sm text-destructive cursor-pointer">Absent</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="leave" id={`${st.id}-l`} />
                        <Label htmlFor={`${st.id}-l`} className="text-sm text-warning cursor-pointer">Leave</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex gap-4 text-sm">
                <span className="text-success font-medium">Present: {summary.present}</span>
                <span className="text-destructive font-medium">Absent: {summary.absent}</span>
                <span className="text-warning font-medium">Leave: {summary.leave}</span>
              </div>
              <Button onClick={handleSubmit} className="gap-2"><CheckCircle className="h-4 w-4" /> Submit Attendance</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
