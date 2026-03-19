import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageSquare, Plus, ChevronDown, ChevronUp, Search, Edit2, Users, Trophy, IndianRupee, AlertTriangle, Clock, Loader2, MapPin, User, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceTab from "@/components/AttendanceTab";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  useCommunity, useSports, useStudents, useSportPricing, useTimeSlots, useGlobalSports,
  useCreateSport, useCreateTimeSlot, useCreateStudent, useUpdateCommunity, useUpdateSportPricing,
  useCreateCoachAssignment, formatCurrencyFull, formatCurrency, formatTime,
} from "@/hooks/useSupabaseData";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: community, isLoading: loadingComm } = useCommunity(id);
  const { data: commSports = [], isLoading: loadingSports } = useSports(id);
  const { data: commStudents = [] } = useStudents(id);
  const { data: commPricing = [] } = useSportPricing(id);
  const { data: commTimeSlots = [] } = useTimeSlots(id);
  const { data: globalSports = [] } = useGlobalSports();

  const createSport = useCreateSport();
  const createTimeSlot = useCreateTimeSlot();
  const createStudent = useCreateStudent();
  const updateCommunity = useUpdateCommunity();
  const updateSportPricing = useUpdateSportPricing();
  const createCoachAssignment = useCreateCoachAssignment();

  const [search, setSearch] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addSportOpen, setAddSportOpen] = useState(false);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [editCommunityOpen, setEditCommunityOpen] = useState(false);
  const [slotSportId, setSlotSportId] = useState("");

  const [studentForm, setStudentForm] = useState({
    name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
    sport_id: "", time_slot_id: "", age_group: "kids", payment_plan: "1m",
    joining_date: new Date().toISOString().slice(0, 10),
  });

  const [sportForm, setSportForm] = useState({
    sportName: "", sportIcon: "", coach_id: "", coach_name: "", coach_phone: "",
    standard_1month: "3000", standard_3months: "8500", standard_6months: "16000",
    premium_1month: "4500", premium_3months: "12500", premium_6months: "24000",
  });

  const [availableCoaches, setAvailableCoaches] = useState<Array<{ id: string; coach_id: string; name: string; phone: string | null; sport_name: string }>>([]);

  const [slotForm, setSlotForm] = useState({
    start_time: "16:00", end_time: "17:00", age_group: "kids", batch_type: "standard",
    max_students: "30", active_days: ["Monday", "Wednesday", "Friday"] as string[],
  });

  const [editForm, setEditForm] = useState({
    name: "", short_code: "", address: "", contact_person: "", contact_phone: "",
  });
  const [editPricingForms, setEditPricingForms] = useState<Record<string, {
    standard_1month: string; standard_3months: string; standard_6months: string;
    premium_1month: string; premium_3months: string; premium_6months: string;
  }>>({});

  const selectedSport = commSports.find((s) => s.id === studentForm.sport_id);
  const studentSlots = useMemo(() => {
    if (!studentForm.sport_id) return [];
    return commTimeSlots.filter((ts) => ts.sport_id === studentForm.sport_id && ts.age_group === studentForm.age_group);
  }, [studentForm.sport_id, studentForm.age_group, commTimeSlots]);

  const selectedSlot = commTimeSlots.find((ts) => ts.id === studentForm.time_slot_id);
  const studentPricing = selectedSport ? commPricing.find((sp) => sp.sport_id === selectedSport.id) : null;

  const stats = useMemo(() => {
    const paid = commStudents.filter((s) => s.fee_status === "paid").length;
    const pending = commStudents.filter((s) => s.fee_status !== "paid").length;
    const revenue = commStudents.filter((s) => s.fee_status === "paid").reduce((sum, s) => sum + Number(s.fee_amount), 0);
    return { students: commStudents.length, sports: commSports.length, revenue, pending };
  }, [commStudents, commSports]);

  const isLoading = loadingComm || loadingSports;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!community) return <div className="p-6 text-muted-foreground">Community not found. <Button variant="link" onClick={() => navigate("/communities")}>Go back</Button></div>;

  const toggleSport = (sportId: string) => {
    setExpandedSports((prev) => {
      const next = new Set(prev);
      next.has(sportId) ? next.delete(sportId) : next.add(sportId);
      return next;
    });
  };

  const getFilteredStudents = (sportId: string) => {
    let studs = commStudents.filter((s) => s.sport_id === sportId);
    if (search) {
      const q = search.toLowerCase();
      studs = studs.filter((s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.parent_name.toLowerCase().includes(q));
    }
    if (feeFilter !== "all") studs = studs.filter((s) => s.fee_status === feeFilter);
    return studs;
  };

  const getFeeAmount = () => {
    if (!studentPricing || !selectedSlot) return 0;
    const bt = selectedSlot.batch_type;
    const plan = studentForm.payment_plan;
    const key = `${bt}_${plan === "1m" ? "1month" : plan === "3m" ? "3months" : "6months"}`;
    return Number((studentPricing as any)[key]) || 0;
  };

  const getStudentId = () => {
    const count = commStudents.length + 1;
    return `${community.short_code}${String(count).padStart(3, "0")}`;
  };

  const openAddStudent = (sportId?: string) => {
    setStudentForm({
      name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
      sport_id: sportId ?? commSports[0]?.id ?? "", time_slot_id: "", age_group: "kids",
      payment_plan: "1m", joining_date: new Date().toISOString().slice(0, 10),
    });
    setAddStudentOpen(true);
  };

  const handleSaveStudent = async () => {
    const feeAmount = getFeeAmount();
    await createStudent.mutateAsync({
      student_id: getStudentId(),
      name: studentForm.name,
      age: parseInt(studentForm.age) || 10,
      parent_name: studentForm.parent_name,
      parent_whatsapp: studentForm.parent_whatsapp,
      parent_phone: studentForm.parent_phone,
      community_id: id!,
      sport_id: studentForm.sport_id,
      time_slot_id: studentForm.time_slot_id,
      batch_type: selectedSlot?.batch_type || "standard",
      age_group: studentForm.age_group,
      payment_plan: studentForm.payment_plan,
      fee_amount: feeAmount,
      joining_date: studentForm.joining_date,
      batch_time: selectedSlot ? `${formatTime(selectedSlot.start_time)}-${formatTime(selectedSlot.end_time)}` : "",
    });
    setAddStudentOpen(false);
  };

  const handleSaveSport = async () => {
    // If custom sport, check if it exists in global_sports and add if not
    const existingGlobal = globalSports.find((g) => g.name === sportForm.sportName);
    if (!existingGlobal && sportForm.sportName) {
      // Add to global_sports
      await supabase.from("global_sports").insert({
        name: sportForm.sportName,
        icon: sportForm.sportIcon || "🏃",
        is_default: false,
      });
      // Add shortcode
      const shortcode = sportForm.sportName.substring(0, 3).toUpperCase();
      await supabase.from("sport_shortcodes").upsert({
        sport_name: sportForm.sportName,
        shortcode,
      }, { onConflict: "sport_name" });
    }

    const sport = await createSport.mutateAsync({
      name: sportForm.sportName,
      icon: sportForm.sportIcon,
      community_id: id!,
      coach_name: sportForm.coach_name,
      coach_phone: sportForm.coach_phone,
      standard_1month: Number(sportForm.standard_1month),
      standard_3months: Number(sportForm.standard_3months),
      standard_6months: Number(sportForm.standard_6months),
      premium_1month: Number(sportForm.premium_1month),
      premium_3months: Number(sportForm.premium_3months),
      premium_6months: Number(sportForm.premium_6months),
    });
    
    // Create coach assignment if coach was selected
    if (sportForm.coach_id && sport?.id) {
      await createCoachAssignment.mutateAsync({
        coach_id: sportForm.coach_id,
        community_id: id!,
        sport_id: sport.id,
      });
    }
    
    setAddSportOpen(false);
  };

  const handleSaveSlot = async () => {
    await createTimeSlot.mutateAsync({
      community_id: id!,
      sport_id: slotSportId,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      age_group: slotForm.age_group,
      batch_type: slotForm.batch_type,
      active_days: slotForm.active_days,
      max_students: parseInt(slotForm.max_students) || 30,
    });
    setAddSlotOpen(false);
  };

  const openEditCommunity = () => {
    setEditForm({
      name: community.name,
      short_code: community.short_code,
      address: community.address,
      contact_person: community.contact_person,
      contact_phone: community.contact_phone,
    });
    const pricingMap: typeof editPricingForms = {};
    commPricing.forEach((p) => {
      pricingMap[p.id] = {
        standard_1month: String(p.standard_1month),
        standard_3months: String(p.standard_3months),
        standard_6months: String(p.standard_6months),
        premium_1month: String(p.premium_1month),
        premium_3months: String(p.premium_3months),
        premium_6months: String(p.premium_6months),
      };
    });
    setEditPricingForms(pricingMap);
    setEditCommunityOpen(true);
  };

  const handleUpdateCommunity = async () => {
    await updateCommunity.mutateAsync({
      id: id!,
      name: editForm.name,
      short_code: editForm.short_code,
      address: editForm.address,
      contact_person: editForm.contact_person,
      contact_phone: editForm.contact_phone,
    });
    // Update pricing for each sport
    for (const [pricingId, values] of Object.entries(editPricingForms)) {
      await updateSportPricing.mutateAsync({
        id: pricingId,
        community_id: id!,
        standard_1month: Number(values.standard_1month),
        standard_3months: Number(values.standard_3months),
        standard_6months: Number(values.standard_6months),
        premium_1month: Number(values.premium_1month),
        premium_3months: Number(values.premium_3months),
        premium_6months: Number(values.premium_6months),
      });
    }
    setEditCommunityOpen(false);
  };

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/communities")} className="mb-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{community.name} <span className="text-muted-foreground">({community.short_code})</span></h1>
            <Button variant="ghost" size="icon" onClick={openEditCommunity} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Edit Community">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Left sidebar + Right content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* LEFT SIDEBAR - Community Info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{community.address || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="text-sm">{community.contact_person || "Not set"}</p>
                </div>
              </div>
              {community.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:+91${community.contact_phone}`} className="text-sm text-primary hover:underline">📞 {community.contact_phone}</a>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold">{stats.students}</p>
                  <p className="text-[10px] text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold">{stats.sports}</p>
                  <p className="text-[10px] text-muted-foreground">Sports</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.revenue)}</p>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-warning">{stats.pending} students</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT CONTENT */}
        <div className="space-y-4">
          <Tabs defaultValue="sports">
            <TabsList>
              <TabsTrigger value="sports">Sports & Students</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="sports" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={feeFilter} onValueChange={setFeeFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Fee" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
            </Select>
            <Button onClick={() => openAddStudent()} className="gap-1"><Plus className="h-4 w-4" /> Add Student</Button>
            <Button variant="outline" onClick={() => {
              setSportForm({ sportName: "", sportIcon: "", coach_id: "", coach_name: "", coach_phone: "", standard_1month: "3000", standard_3months: "8500", standard_6months: "16000", premium_1month: "4500", premium_3months: "12500", premium_6months: "24000" });
              setAvailableCoaches([]);
              setAddSportOpen(true);
            }} className="gap-1"><Plus className="h-4 w-4" /> Add Sport</Button>
          </div>

          {/* Sports with Time Slots */}
          {commSports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3" />
              <p className="font-medium">No sports added yet</p>
              <p className="text-sm mt-1">Add a sport to start creating batches and enrolling students</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commSports.map((sport) => {
                const sportStudents = getFilteredStudents(sport.id);
                const expanded = expandedSports.has(sport.id);
                const paid = sportStudents.filter((s) => s.fee_status === "paid").length;
                const pending = sportStudents.length - paid;
                const revenue = sportStudents.filter((s) => s.fee_status === "paid").reduce((sum, s) => sum + Number(s.fee_amount), 0);
                const sportSlots = commTimeSlots.filter((ts) => ts.sport_id === sport.id);
                const pricing = commPricing.find((sp) => sp.sport_id === sport.id);

                return (
                  <Card key={sport.id} className="overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-start justify-between" onClick={() => toggleSport(sport.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{sport.icon}</span>
                          <h3 className="font-bold text-lg">{sport.name}</h3>
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <p className="text-sm text-muted-foreground">Coach: {sport.coach_name} • {sport.coach_phone}</p>
                        {pricing && !expanded && (
                          <p className="text-sm text-muted-foreground mt-1">Standard: {formatCurrencyFull(Number(pricing.standard_1month))}/mo | Premium: {formatCurrencyFull(Number(pricing.premium_1month))}/mo</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">👥 {sportStudents.length} • 💰 {formatCurrency(revenue)}</p>
                        <p className="text-muted-foreground">{paid} paid, {pending} pending</p>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-border">
                        {pricing && (
                          <div className="px-4 pt-3 pb-2 text-sm text-muted-foreground">
                            <p>Standard: {formatCurrencyFull(Number(pricing.standard_1month))}/1M | {formatCurrencyFull(Number(pricing.standard_3months))}/3M | {formatCurrencyFull(Number(pricing.standard_6months))}/6M</p>
                            <p>Premium: {formatCurrencyFull(Number(pricing.premium_1month))}/1M | {formatCurrencyFull(Number(pricing.premium_3months))}/3M | {formatCurrencyFull(Number(pricing.premium_6months))}/6M</p>
                          </div>
                        )}

                        <div className="px-4 py-2 flex items-center justify-between">
                          <p className="text-sm font-semibold">TIME SLOTS & BATCHES</p>
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setSlotSportId(sport.id); setSlotForm({ start_time: "16:00", end_time: "17:00", age_group: "kids", batch_type: "standard", max_students: "30", active_days: ["Monday", "Wednesday", "Friday"] }); setAddSlotOpen(true); }}>
                            <Plus className="h-3 w-3" /> Create Time Slot
                          </Button>
                        </div>

                        {sportSlots.length === 0 && <p className="px-4 pb-3 text-sm text-muted-foreground italic">No batches yet. Create time slots above.</p>}

                        {sportSlots.map((slot) => {
                          const slotStudents = sportStudents.filter((s) => s.time_slot_id === slot.id);
                          return (
                            <div key={slot.id} className="border-t border-border/50 px-4 py-3">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                                  <Badge variant="secondary" className="text-xs">{slot.age_group === "kids" ? "👶 Kids" : "🧑 Adults"}</Badge>
                                  <Badge variant={slot.batch_type === "premium" ? "default" : "secondary"} className="text-xs">{slot.batch_type === "premium" ? "⭐ Premium" : "Standard"}</Badge>
                                  {slot.active_days && <span className="text-xs text-muted-foreground">{(slot.active_days as string[]).join(", ")}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{slot.current_students}/{slot.max_students} students</span>
                                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => openAddStudent(sport.id)}><Plus className="h-3 w-3" /> Add Student</Button>
                                </div>
                              </div>

                              {slotStudents.length > 0 && (
                                <div className="rounded-lg border border-border overflow-auto max-h-[250px] scrollbar-hide">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                      <tr className="text-left text-xs text-muted-foreground">
                                        <th className="p-2">ID</th><th className="p-2">Name</th>
                                        <th className="p-2 hidden sm:table-cell">Parent</th>
                                        <th className="p-2">Fee</th><th className="p-2">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {slotStudents.map((st) => (
                                        <tr key={st.id} onClick={() => navigate(`/students/${st.id}`)} className="border-t border-border/30 cursor-pointer hover:bg-muted/30 transition-colors">
                                          <td className="p-2 font-mono text-xs text-muted-foreground">{st.student_id}</td>
                                          <td className="p-2 font-medium">{st.name}</td>
                                          <td className="p-2 hidden sm:table-cell text-muted-foreground">{st.parent_name}</td>
                                          <td className="p-2 text-xs">{formatCurrencyFull(Number(st.fee_amount))}</td>
                                          <td className="p-2"><Badge variant={st.fee_status === "paid" ? "default" : st.fee_status === "overdue" ? "destructive" : "secondary"} className="text-xs">{st.fee_status === "paid" ? "✅" : st.fee_status === "overdue" ? "🔴" : st.fee_status === "awaiting_first" ? "✨" : "⚠️"} {st.fee_status}</Badge></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <AttendanceTab communityId={id!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Community Modal */}
      <Dialog open={editCommunityOpen} onOpenChange={setEditCommunityOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Edit Community — {community.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Community Name *</Label><Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Short Code *</Label><Input value={editForm.short_code} onChange={(e) => setEditForm((p) => ({ ...p, short_code: e.target.value.toUpperCase().slice(0, 10) }))} /></div>
            <div><Label>Address *</Label><Input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} /></div>
            <div><Label>Contact Person</Label><Input value={editForm.contact_person} onChange={(e) => setEditForm((p) => ({ ...p, contact_person: e.target.value }))} /></div>
            <div><Label>Contact Phone</Label><Input value={editForm.contact_phone} onChange={(e) => setEditForm((p) => ({ ...p, contact_phone: e.target.value }))} /></div>

            {/* Sport Pricing */}
            {commPricing.length > 0 && (
              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="font-bold">Sports Pricing</h3>
                {commPricing.map((pricing) => {
                  const sport = commSports.find((s) => s.id === pricing.sport_id);
                  const form = editPricingForms[pricing.id];
                  if (!form) return null;
                  return (
                    <div key={pricing.id} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
                      <h4 className="font-semibold">{sport?.icon} {sport?.name}</h4>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Standard Batch</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">1M</Label><Input type="number" value={form.standard_1month} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], standard_1month: e.target.value } }))} /></div>
                          <div><Label className="text-xs">3M</Label><Input type="number" value={form.standard_3months} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], standard_3months: e.target.value } }))} /></div>
                          <div><Label className="text-xs">6M</Label><Input type="number" value={form.standard_6months} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], standard_6months: e.target.value } }))} /></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Premium Batch</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">1M</Label><Input type="number" value={form.premium_1month} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], premium_1month: e.target.value } }))} /></div>
                          <div><Label className="text-xs">3M</Label><Input type="number" value={form.premium_3months} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], premium_3months: e.target.value } }))} /></div>
                          <div><Label className="text-xs">6M</Label><Input type="number" value={form.premium_6months} onChange={(e) => setEditPricingForms((p) => ({ ...p, [pricing.id]: { ...p[pricing.id], premium_6months: e.target.value } }))} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCommunityOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCommunity} disabled={updateCommunity.isPending}>
              {updateCommunity.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : "Update Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student Name *</Label><Input value={studentForm.name} onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))} placeholder="Rahul Kumar" /></div>
            <div><Label>Age *</Label><Input type="number" value={studentForm.age} onChange={(e) => {
              const age = parseInt(e.target.value) || 0;
              setStudentForm((p) => ({ ...p, age: e.target.value, age_group: age < 18 ? "kids" : "adults", time_slot_id: "" }));
            }} placeholder="12" min={3} max={60} /></div>
            <div><Label>Parent Name *</Label><Input value={studentForm.parent_name} onChange={(e) => setStudentForm((p) => ({ ...p, parent_name: e.target.value }))} placeholder="Suresh Kumar" /></div>
            <div><Label>WhatsApp Number *</Label><Input value={studentForm.parent_whatsapp} onChange={(e) => setStudentForm((p) => ({ ...p, parent_whatsapp: e.target.value }))} placeholder="9876543210" maxLength={10} /></div>
            <div><Label>Sport *</Label>
              <Select value={studentForm.sport_id} onValueChange={(v) => setStudentForm((p) => ({ ...p, sport_id: v, time_slot_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>{commSports.map((s) => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age Group *</Label>
              <RadioGroup value={studentForm.age_group} onValueChange={(v) => setStudentForm((p) => ({ ...p, age_group: v, time_slot_id: "" }))} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="ag-kids" /><Label htmlFor="ag-kids">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="ag-adults" /><Label htmlFor="ag-adults">Adults</Label></div>
              </RadioGroup>
            </div>
            <div><Label>Time Slot *</Label>
              <Select value={studentForm.time_slot_id} onValueChange={(v) => setStudentForm((p) => ({ ...p, time_slot_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                <SelectContent>
                  {studentSlots.map((ts) => (
                    <SelectItem key={ts.id} value={ts.id}>
                      {formatTime(ts.start_time)} - {formatTime(ts.end_time)} ({ts.age_group}, {ts.batch_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Plan *</Label>
              <RadioGroup value={studentForm.payment_plan} onValueChange={(v) => setStudentForm((p) => ({ ...p, payment_plan: v }))} className="space-y-2 mt-1">
                {(["1m", "3m", "6m"] as const).map((plan) => {
                  const label = plan === "1m" ? "1 Month" : plan === "3m" ? "3 Months" : "6 Months";
                  const getPlanFee = () => {
                    if (!studentPricing || !selectedSlot) return 0;
                    const bt = selectedSlot.batch_type;
                    const key = `${bt}_${plan === "1m" ? "1month" : plan === "3m" ? "3months" : "6months"}`;
                    return Number((studentPricing as any)[key]) || 0;
                  };
                  return (
                    <div key={plan} className="flex items-center gap-2">
                      <RadioGroupItem value={plan} id={`pp-${plan}`} />
                      <Label htmlFor={`pp-${plan}`}>{label} — {formatCurrencyFull(getPlanFee())}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
            <div>
              <Label>Joining Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !studentForm.joining_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {studentForm.joining_date ? format(new Date(studentForm.joining_date + "T00:00:00"), "dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={studentForm.joining_date ? new Date(studentForm.joining_date + "T00:00:00") : undefined}
                    onSelect={(date) => date && setStudentForm((p) => ({ ...p, joining_date: format(date, "yyyy-MM-dd") }))}
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

            {studentForm.name && selectedSlot && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold mb-2">SUMMARY</p>
                <p>Student: {studentForm.name} ({getStudentId()})</p>
                <p>Sport: {selectedSport?.icon} {selectedSport?.name} ({selectedSlot.batch_type})</p>
                <p>Time: {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)} ({selectedSlot.age_group})</p>
                <p>Amount: {formatCurrencyFull(getFeeAmount())}</p>
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-primary">✨ NEW ENROLLMENT</p>
                  <p className="text-muted-foreground">⏳ Awaiting First Payment</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} disabled={createStudent.isPending || !studentForm.name || !studentForm.sport_id || !studentForm.time_slot_id}>
              {createStudent.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enrolling...</> : "Enroll Student →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sport Modal */}
      <Dialog open={addSportOpen} onOpenChange={setAddSportOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add Sport to {community.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Sport *</Label>
              <Select value={sportForm.sportName} onValueChange={async (v) => {
                if (v === "__custom__") {
                  setSportForm((p) => ({ ...p, sportName: "", sportIcon: "🏃", coach_id: "", coach_name: "", coach_phone: "" }));
                  setAvailableCoaches([]);
                  return;
                }
                const gs = globalSports.find((g) => g.name === v);
                if (gs) {
                  setSportForm((p) => ({ ...p, sportName: gs.name, sportIcon: gs.icon || "🏃", coach_id: "", coach_name: "", coach_phone: "" }));
                  const { data: coaches } = await supabase
                    .from("coaches")
                    .select("id, coach_id, name, phone, sport_name")
                    .eq("sport_name", gs.name)
                    .eq("is_active", true)
                    .order("name");
                  setAvailableCoaches(coaches || []);
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {globalSports.filter((gs) => !commSports.some((cs) => cs.name === gs.name)).map((gs) => (
                    <SelectItem key={gs.id} value={gs.name}>{gs.icon} {gs.name}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">➕ Add Custom Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Sport Fields */}
            {sportForm.sportName === "" && sportForm.sportIcon === "🏃" && (
              <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-sm font-semibold text-primary">Create New Sport</p>
                <div>
                  <Label className="text-xs">Sport Name *</Label>
                  <Input
                    value={sportForm.sportName}
                    onChange={async (e) => {
                      const name = e.target.value;
                      setSportForm((p) => ({ ...p, sportName: name }));
                      if (name.length > 2) {
                        const { data: coaches } = await supabase
                          .from("coaches")
                          .select("id, coach_id, name, phone, sport_name")
                          .eq("sport_name", name)
                          .eq("is_active", true)
                          .order("name");
                        setAvailableCoaches(coaches || []);
                      }
                    }}
                    placeholder="e.g., Boxing, Gymnastics"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sport Icon (Emoji) *</Label>
                  <Input
                    value={sportForm.sportIcon}
                    onChange={(e) => setSportForm((p) => ({ ...p, sportIcon: e.target.value }))}
                    placeholder="🥊"
                    maxLength={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground">💡 This sport will be added to the global list and available for all communities.</p>
              </div>
            )}
            
            {/* Coach Dropdown */}
            {sportForm.sportName && (
              <div>
                <Label>Assign Coach *</Label>
                <Select value={sportForm.coach_id} onValueChange={(v) => {
                  const coach = availableCoaches.find(c => c.id === v);
                  if (coach) {
                    setSportForm(p => ({ ...p, coach_id: coach.id, coach_name: coach.name, coach_phone: coach.phone || "" }));
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select coach" /></SelectTrigger>
                  <SelectContent>
                    {availableCoaches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.coach_id}) {c.phone ? `— ${c.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableCoaches.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No coaches available for {sportForm.sportName}. Add a coach first from the Coaches page.</p>
                )}
              </div>
            )}

            {/* Selected Coach Info */}
            {sportForm.coach_id && sportForm.coach_name && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Selected Coach</p>
                <p className="font-medium">{sportForm.coach_name}</p>
                {sportForm.coach_phone && <p className="text-sm text-muted-foreground">📞 {sportForm.coach_phone}</p>}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-3">STANDARD BATCH PRICING</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={sportForm.standard_1month} onChange={(e) => setSportForm((p) => ({ ...p, standard_1month: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={sportForm.standard_3months} onChange={(e) => setSportForm((p) => ({ ...p, standard_3months: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={sportForm.standard_6months} onChange={(e) => setSportForm((p) => ({ ...p, standard_6months: e.target.value }))} /></div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-3">PREMIUM BATCH PRICING</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={sportForm.premium_1month} onChange={(e) => setSportForm((p) => ({ ...p, premium_1month: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={sportForm.premium_3months} onChange={(e) => setSportForm((p) => ({ ...p, premium_3months: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={sportForm.premium_6months} onChange={(e) => setSportForm((p) => ({ ...p, premium_6months: e.target.value }))} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSportOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSport} disabled={createSport.isPending || !sportForm.sportName}>
              {createSport.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding...</> : "Add Sport →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Time Slot Modal */}
      <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Time Slot — {commSports.find((s) => s.id === slotSportId)?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time *</Label><Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm((p) => ({ ...p, start_time: e.target.value }))} /></div>
              <div><Label>End Time *</Label><Input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm((p) => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Age Group *</Label>
              <RadioGroup value={slotForm.age_group} onValueChange={(v) => setSlotForm((p) => ({ ...p, age_group: v }))} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="sl-kids" /><Label htmlFor="sl-kids">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="sl-adults" /><Label htmlFor="sl-adults">Adults</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Batch Type *</Label>
              <RadioGroup value={slotForm.batch_type} onValueChange={(v) => setSlotForm((p) => ({ ...p, batch_type: v }))} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="standard" id="sl-std" /><Label htmlFor="sl-std">Standard</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="sl-prm" /><Label htmlFor="sl-prm">Premium</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Active Days *</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {allDays.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={slotForm.active_days.includes(d)} onCheckedChange={(checked) => setSlotForm((p) => ({ ...p, active_days: checked ? [...p.active_days, d] : p.active_days.filter((x) => x !== d) }))} />
                    {d.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Max Students</Label><Input type="number" value={slotForm.max_students} onChange={(e) => setSlotForm((p) => ({ ...p, max_students: e.target.value }))} placeholder="30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSlot} disabled={createTimeSlot.isPending}>
              {createTimeSlot.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Time Slot →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
