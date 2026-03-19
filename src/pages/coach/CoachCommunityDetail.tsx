import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Search, Users, Plus, Loader2, MapPin, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreateStudent, formatTime, formatCurrencyFull } from "@/hooks/useSupabaseData";

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
  sport_id: string;
  time_slot_id: string | null;
}

interface SportRow { id: string; name: string; icon: string }
interface SlotRow { id: string; sport_id: string; start_time: string; end_time: string; age_group: string; batch_type: string }
interface PricingRow {
  id: string; sport_id: string; community_id: string;
  standard_1month: number; standard_3months: number; standard_6months: number;
  premium_1month: number; premium_3months: number; premium_6months: number;
}

export default function CoachCommunityDetail() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const createStudent = useCreateStudent();

  const [loading, setLoading] = useState(true);
  const [communityName, setCommunityName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sports, setSports] = useState<SportRow[]>([]);
  const [timeSlots, setTimeSlots] = useState<SlotRow[]>([]);
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [assignedSportIds, setAssignedSportIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Add student dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
    sport_id: "", time_slot_id: "", age_group: "kids", payment_plan: "1m",
    joining_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => { if (profile?.coach_id) loadData(); }, [communityId, profile]);

  const loadData = async () => {
    try {
      const { data: coachRecord } = await supabase
        .from("coaches").select("id").eq("coach_id", profile!.coach_id!).maybeSingle();
      if (!coachRecord) { navigate("/coach/dashboard"); return; }

      // Verify coach has assignments in this community
      const { data: assignments } = await supabase
        .from("coach_assignments")
        .select("sport_id")
        .eq("coach_id", coachRecord.id)
        .eq("community_id", communityId!);

      if (!assignments || assignments.length === 0) {
        toast({ title: "Unauthorized", variant: "destructive" });
        navigate("/coach/dashboard");
        return;
      }

      const sportIds = assignments.map(a => a.sport_id);
      setAssignedSportIds(sportIds);

      const [{ data: comm }, { data: sportsData }, { data: slotsData }, { data: studentsData }, { data: pricingData }] = await Promise.all([
        supabase.from("communities").select("name, short_code").eq("id", communityId!).maybeSingle(),
        supabase.from("sports").select("id, name, icon").in("id", sportIds),
        supabase.from("time_slots").select("id, sport_id, start_time, end_time, age_group, batch_type").eq("community_id", communityId!).in("sport_id", sportIds).eq("is_active", true).order("start_time"),
        supabase.from("students").select("id, student_id, name, age, parent_name, parent_whatsapp, batch_type, age_group, fee_status, fee_amount, sport_id, time_slot_id").eq("community_id", communityId!).in("sport_id", sportIds).eq("is_active", true).order("name"),
        supabase.from("sport_pricing").select("*").eq("community_id", communityId!).in("sport_id", sportIds),
      ]);

      setCommunityName(comm?.name || "");
      setShortCode(comm?.short_code || "");
      setSports((sportsData as SportRow[]) || []);
      setTimeSlots((slotsData as SlotRow[]) || []);
      setStudents((studentsData as StudentRow[]) || []);
      setPricing((pricingData as PricingRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.parent_name.toLowerCase().includes(q)
    );
  }, [students, search]);

  // Add student logic
  const availableSlots = useMemo(() => {
    if (!form.sport_id) return [];
    return timeSlots.filter(ts => ts.sport_id === form.sport_id && ts.age_group === form.age_group);
  }, [form.sport_id, form.age_group, timeSlots]);

  const selectedSlot = timeSlots.find(ts => ts.id === form.time_slot_id);
  const selectedSport = sports.find(s => s.id === form.sport_id);
  const studentPricing = form.sport_id ? pricing.find(p => p.sport_id === form.sport_id) : null;

  const getFeeForPlan = (plan: string) => {
    if (!studentPricing || !selectedSlot) return 0;
    const bt = selectedSlot.batch_type;
    const key = `${bt}_${plan === "1m" ? "1month" : plan === "3m" ? "3months" : "6months"}`;
    return Number((studentPricing as any)[key]) || 0;
  };

  const getFeeAmount = () => getFeeForPlan(form.payment_plan);

  const getStudentId = () => {
    const count = students.length + 1;
    return `${shortCode}${String(count).padStart(3, "0")}`;
  };

  const openAddStudent = () => {
    setForm({
      name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
      sport_id: sports[0]?.id ?? "", time_slot_id: "", age_group: "kids",
      payment_plan: "1m", joining_date: new Date().toISOString().slice(0, 10),
    });
    setAddOpen(true);
  };

  const handleSave = async () => {
    const feeAmount = getFeeAmount();
    await createStudent.mutateAsync({
      student_id: getStudentId(),
      name: form.name,
      age: parseInt(form.age) || 10,
      parent_name: form.parent_name,
      parent_whatsapp: form.parent_whatsapp,
      parent_phone: form.parent_phone || form.parent_whatsapp,
      community_id: communityId!,
      sport_id: form.sport_id,
      time_slot_id: form.time_slot_id,
      batch_type: selectedSlot?.batch_type || "standard",
      age_group: form.age_group,
      payment_plan: form.payment_plan,
      fee_amount: feeAmount,
      joining_date: form.joining_date,
      batch_time: selectedSlot ? `${formatTime(selectedSlot.start_time)}-${formatTime(selectedSlot.end_time)}` : "",
    });
    setAddOpen(false);
    loadData(); // Refresh
  };

  const getSportName = (sportId: string) => sports.find(s => s.id === sportId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
          <div className="flex-1">
            <p className="font-bold text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {communityName}
            </p>
            <p className="text-xs text-muted-foreground">
              {shortCode} • {students.length} students • {timeSlots.length} slots
            </p>
          </div>
          <Button size="sm" onClick={openAddStudent} className="gap-1">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          {sports.map(sport => {
            const assignment = assignedSportIds.includes(sport.id)
              ? { sportId: sport.id }
              : null;
            if (!assignment) return null;
            // Find the assignment ID for attendance navigation
            return null; // Sports are shown as tags on student cards
          })}
        </div>

        {/* Attendance quick access */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {sports.map(sport => (
            <Button
              key={sport.id}
              variant="outline"
              size="sm"
              className="gap-1 shrink-0"
              onClick={async () => {
                // Find assignment ID
                const { data: coachRecord } = await supabase
                  .from("coaches").select("id").eq("coach_id", profile!.coach_id!).maybeSingle();
                if (!coachRecord) return;
                const { data: assignment } = await supabase
                  .from("coach_assignments")
                  .select("id")
                  .eq("coach_id", coachRecord.id)
                  .eq("community_id", communityId!)
                  .eq("sport_id", sport.id)
                  .maybeSingle();
                if (assignment) navigate(`/coach/attendance/${assignment.id}`);
              }}
            >
              <CalendarIcon className="h-3 w-3" /> {sport.icon} {sport.name} Attendance
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="pl-10" />
        </div>

        {/* Students List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium">{search ? "No students found" : "No students enrolled"}</p>
            {!search && <Button variant="link" onClick={openAddStudent} className="mt-2">Add first student →</Button>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(st => {
              const sport = getSportName(st.sport_id);
              return (
                <Card
                  key={st.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => navigate(`/coach/student/${st.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{st.name}</p>
                          <code className="text-xs text-primary">{st.student_id}</code>
                          <Badge
                            variant={st.fee_status === "paid" ? "default" : st.fee_status === "overdue" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {st.fee_status === "paid" ? "✓ Paid" : st.fee_status === "overdue" ? "🔴 Overdue" : st.fee_status === "awaiting_first" ? "✨ New" : "⚠ Pending"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sport?.icon} {sport?.name} • {st.batch_type} • Age {st.age}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Parent: {st.parent_name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Rahul Kumar" /></div>
            <div><Label>Age *</Label><Input type="number" value={form.age} onChange={e => {
              const age = parseInt(e.target.value) || 0;
              setForm(p => ({ ...p, age: e.target.value, age_group: age < 18 ? "kids" : "adults", time_slot_id: "" }));
            }} placeholder="12" min={3} max={60} /></div>
            <div><Label>Parent Name *</Label><Input value={form.parent_name} onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))} placeholder="Suresh Kumar" /></div>
            <div><Label>WhatsApp Number *</Label><Input value={form.parent_whatsapp} onChange={e => setForm(p => ({ ...p, parent_whatsapp: e.target.value }))} placeholder="9876543210" maxLength={10} /></div>

            {sports.length > 1 && (
              <div>
                <Label>Sport *</Label>
                <Select value={form.sport_id} onValueChange={v => setForm(p => ({ ...p, sport_id: v, time_slot_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                  <SelectContent>{sports.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Age Group *</Label>
              <RadioGroup value={form.age_group} onValueChange={v => setForm(p => ({ ...p, age_group: v, time_slot_id: "" }))} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="ag-k" /><Label htmlFor="ag-k">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="ag-a" /><Label htmlFor="ag-a">Adults</Label></div>
              </RadioGroup>
            </div>

            <div>
              <Label>Time Slot *</Label>
              <Select value={form.time_slot_id} onValueChange={v => setForm(p => ({ ...p, time_slot_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                <SelectContent>
                  {availableSlots.map(ts => (
                    <SelectItem key={ts.id} value={ts.id}>
                      {formatTime(ts.start_time)} - {formatTime(ts.end_time)} ({ts.age_group}, {ts.batch_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Plan *</Label>
              <RadioGroup value={form.payment_plan} onValueChange={v => setForm(p => ({ ...p, payment_plan: v }))} className="space-y-2 mt-1">
                {(["1m", "3m", "6m"] as const).map(plan => {
                  const label = plan === "1m" ? "1 Month" : plan === "3m" ? "3 Months" : "6 Months";
                  const planFee = getFeeForPlan(plan);
                  return (
                    <div key={plan} className="flex items-center gap-2">
                      <RadioGroupItem value={plan} id={`pp-${plan}`} />
                      <Label htmlFor={`pp-${plan}`}>{label} — {formatCurrencyFull(planFee)}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div>
              <Label>Joining Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.joining_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.joining_date ? format(new Date(form.joining_date + "T00:00:00"), "dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.joining_date ? new Date(form.joining_date + "T00:00:00") : undefined}
                    onSelect={(date) => date && setForm((p) => ({ ...p, joining_date: format(date, "yyyy-MM-dd") }))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold">Student ID (Auto-generated)</p>
              <p className="text-primary font-mono text-lg">{getStudentId()}</p>
            </div>

            {form.name && selectedSlot && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold mb-2">SUMMARY</p>
                <p>Student: {form.name} ({getStudentId()})</p>
                <p>Sport: {selectedSport?.icon} {selectedSport?.name} ({selectedSlot.batch_type})</p>
                <p>Time: {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
                <p>Amount: {formatCurrencyFull(getFeeAmount())}</p>
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-primary">✨ NEW ENROLLMENT</p>
                  <p className="text-muted-foreground">⏳ Awaiting First Payment</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createStudent.isPending || !form.name || !form.sport_id || !form.time_slot_id}>
              {createStudent.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enrolling...</> : "Enroll Student →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
